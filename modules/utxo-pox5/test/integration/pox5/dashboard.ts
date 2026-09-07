import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { BitcoinCoreAdapter } from './bitcoin';
import { loadPox5LocalConfig, type Pox5LocalConfig } from './config';
import { startCompose, stopCompose } from './compose';
import { HiroRegtestFundingAdapter } from './funding';
import { formatError, JsonRpcClient } from './rpc';
import { runL1EarlyExitScenario, runL1RegisterScenario } from './scenario';
import { createStacksNetwork, loadStacksBitcoinStaking } from './stacks-js';
import { StacksNodeAdapter } from './stacks';
import { deriveStacksAccount, type DerivedStacksAccount } from './wallet';
import { handleBitGoApiRequest } from './bitgo-api';

const host = '127.0.0.1';
const port = Number(process.env.POX5_DASHBOARD_PORT ?? '4175');
const publicRoot = join(__dirname, 'dashboard-public');
const networks = ['tbtcstx', 'tbtcstxprivate1'] as const;
const maxLogEntries = 500;

type Network = (typeof networks)[number];
type FullnodeMode = 'direct' | 'indexer';
type AccountPreset = 'private1-account5';
type LogLevel = 'debug' | 'info' | 'error';
type LogEntry = { id: number; timestamp: string; level: LogLevel; requestId?: string; message: string; stack?: string };
type Action = 'up' | 'down' | 'faucet' | 'stake' | 'early-exit' | 'late-exit';
type RequestBody = {
  network?: Network;
  fullnodeMode?: FullnodeMode;
  seedPhrase?: string;
  amountSats?: number;
  signerManager?: string;
  bondIndex?: number;
  accountPreset?: AccountPreset;
};

const ACCOUNT_PRESETS: Record<AccountPreset, { network: Network; address: string; privateKey: string }> = {
  // Public disposable fixture from stacks.js-pox5/tests/regtest/regtest.ts.
  'private1-account5': {
    network: 'tbtcstxprivate1',
    address: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
    privateKey: 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01',
  },
};

const logEntries: LogEntry[] = [];
let nextLogId = 1;

function appendLog(level: LogLevel, message: string, requestId?: string, stack?: string): void {
  logEntries.push({ id: nextLogId++, timestamp: new Date().toISOString(), level, requestId, message, stack });
  if (logEntries.length > maxLogEntries) logEntries.splice(0, logEntries.length - maxLogEntries);
}

function requestLogger(requestId: string): (message: string) => void {
  return (message) => appendLog('debug', message, requestId);
}

function isNetwork(value: unknown): value is Network {
  return typeof value === 'string' && (networks as readonly string[]).includes(value);
}

function isFullnodeMode(value: unknown): value is FullnodeMode {
  return value === 'direct' || value === 'indexer';
}

function isAccountPreset(value: unknown): value is AccountPreset {
  return value === 'private1-account5';
}

async function readJson(request: IncomingMessage): Promise<RequestBody> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 8_192) throw new Error('Request body is too large');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Request body must be an object');
  return value as RequestBody;
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(value));
}

function assertBitGoRequestOrigin(request: IncomingMessage): void {
  const origin = request.headers.origin;
  if (origin === undefined) return;
  if (origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`) {
    throw new Error('Cross-origin BitGo API requests are not allowed');
  }
}

function configFor(network: Network, fullnodeMode: FullnodeMode): Pox5LocalConfig {
  return loadPox5LocalConfig({ ...process.env, POX5_NETWORK: network, POX5_FULLNODE_MODE: fullnodeMode });
}

function configWithAccount(config: Pox5LocalConfig, account: DerivedStacksAccount): Pox5LocalConfig {
  return {
    ...config,
    accounts: { ...config.accounts, stakerAddress: account.address, stakerPrivateKey: account.privateKey },
  };
}

function bitcoinFor(config: Pox5LocalConfig, logger?: (message: string) => void): BitcoinCoreAdapter {
  const { rpcUrl, rpcUser, rpcPassword, timeoutMs } = config.bitcoin;
  return new BitcoinCoreAdapter(
    new JsonRpcClient(rpcUrl, rpcUser, rpcPassword, timeoutMs, logger),
    new JsonRpcClient(`${rpcUrl}/wallet/main`, rpcUser, rpcPassword, timeoutMs, logger)
  );
}

function settled(result: PromiseSettledResult<unknown>): unknown {
  return result.status === 'fulfilled' ? result.value : { error: formatError(result.reason) };
}

function validateRequest(
  body: RequestBody
): asserts body is RequestBody & { network: Network; fullnodeMode: FullnodeMode } {
  if (!isNetwork(body.network)) throw new Error('Choose tbtcstx or tbtcstxprivate1');
  if (!isFullnodeMode(body.fullnodeMode)) throw new Error('Choose direct fullnode or indexer-utxo Compose mode');
  if (body.accountPreset !== undefined && !isAccountPreset(body.accountPreset))
    throw new Error('Unknown account preset');
}

function accountFor(config: Pox5LocalConfig, seedPhrase?: string, accountPreset?: AccountPreset): DerivedStacksAccount {
  if (accountPreset !== undefined) {
    const preset = ACCOUNT_PRESETS[accountPreset];
    if (preset.network !== config.profile) throw new Error(`${accountPreset} is only available on ${preset.network}`);
    return { ...preset, derivationPath: 'public fixture', mnemonicTranslated: false };
  }
  if (seedPhrase !== undefined && seedPhrase.trim().length > 0) return deriveStacksAccount(seedPhrase);
  if (config.accounts.stakerAddress === undefined || config.accounts.stakerPrivateKey === undefined) {
    throw new Error('Enter a seed phrase or configure POX5_STACKS_STAKER_ADDRESS and POX5_STACKS_PRIVATE_KEY');
  }
  return {
    address: config.accounts.stakerAddress,
    privateKey: config.accounts.stakerPrivateKey,
    derivationPath: 'environment',
    mnemonicTranslated: false,
  };
}

function configWithProtocolOverrides(config: Pox5LocalConfig, body: RequestBody): Pox5LocalConfig {
  const signerManager = body.signerManager?.trim();
  let bondIndex = config.stacks.bondIndex;
  if (body.bondIndex !== undefined) {
    if (!Number.isSafeInteger(body.bondIndex) || body.bondIndex < 0)
      throw new Error('Bond index must be a non-negative integer');
    bondIndex = body.bondIndex;
  }
  return {
    ...config,
    stacks: {
      ...config.stacks,
      bondIndex,
      signerManager:
        signerManager === undefined || signerManager.length === 0 ? config.stacks.signerManager : signerManager,
    },
  };
}

async function btcWallet(body: RequestBody, logger?: (message: string) => void): Promise<Record<string, unknown>> {
  validateRequest(body);
  const config = configFor(body.network, body.fullnodeMode);
  const bitcoin = bitcoinFor(config, logger);
  const label = `pox5-${config.profile}-dashboard`;
  const [address, balance, transactions] = await Promise.all([
    bitcoin.getWalletAddress(label),
    bitcoin.getWalletBalance(),
    bitcoin.getWalletTransactions(),
  ]);
  return { network: body.network, fullnodeMode: body.fullnodeMode, address, balance, transactions };
}

async function stxWallet(body: RequestBody, logger?: (message: string) => void): Promise<Record<string, unknown>> {
  validateRequest(body);
  const config = configFor(body.network, body.fullnodeMode);
  const account = accountFor(config, body.seedPhrase, body.accountPreset);
  const stacks = new StacksNodeAdapter(config.stacks.nodeUrl, config.stacks.apiUrl, config.stacks.timeoutMs, logger);
  const [accountInfo, transactions] = await Promise.all([
    stacks.getAccount(account.address),
    stacks.getAddressTransactions(account.address),
  ]);
  return {
    network: body.network,
    address: account.address,
    mnemonicTranslated: account.mnemonicTranslated,
    account: accountInfo,
    transactions,
  };
}

async function stakedFunds(body: RequestBody, logger?: (message: string) => void): Promise<Record<string, unknown>> {
  validateRequest(body);
  const value = await status(body.network, body.fullnodeMode, body.seedPhrase, body.accountPreset, logger);
  return {
    network: value.network,
    address: value.stakerAddress,
    mnemonicTranslated: value.mnemonicTranslated,
    stakes: value.stakes,
  };
}

async function status(
  network: Network,
  fullnodeMode: FullnodeMode,
  seedPhrase?: string,
  accountPreset?: AccountPreset,
  logger?: (message: string) => void
): Promise<Record<string, unknown>> {
  const config = configFor(network, fullnodeMode);
  const bitcoin = bitcoinFor(config, logger);
  const stacks = new StacksNodeAdapter(config.stacks.nodeUrl, config.stacks.apiUrl, config.stacks.timeoutMs, logger);
  const [bitcoinStatus, walletStatus, stacksStatus] = await Promise.allSettled([
    bitcoin.getBlockchainInfo(),
    bitcoin.getWalletBalance(),
    stacks.getNodeInfo(),
  ]);
  let stakes: unknown = [];
  let stakerAddress = config.accounts.stakerAddress;
  let derivationError: string | undefined;
  let mnemonicTranslated = false;
  if (accountPreset !== undefined || (seedPhrase !== undefined && seedPhrase.trim().length > 0)) {
    try {
      const account = accountFor(config, seedPhrase, accountPreset);
      stakerAddress = account.address;
      mnemonicTranslated = account.mnemonicTranslated;
    } catch (error) {
      stakerAddress = undefined;
      derivationError = formatError(error);
    }
  }
  if (derivationError !== undefined) {
    stakes = { error: derivationError };
  } else if (stakerAddress !== undefined) {
    try {
      const network = createStacksNetwork(config);
      const membership = await loadStacksBitcoinStaking(config).fetchBondMembership({
        address: stakerAddress,
        network,
        client: network.client,
      });
      stakes = membership === undefined ? [] : [membership];
    } catch (error) {
      stakes = { error: formatError(error) };
    }
  }
  return {
    network,
    fullnodeMode,
    endpoints: { bitcoinRpc: config.bitcoin.rpcUrl, stacks: config.stacks.nodeUrl },
    bitcoin: settled(bitcoinStatus),
    wallet: settled(walletStatus),
    stacks: settled(stacksStatus),
    stakerAddress: stakerAddress ?? null,
    mnemonicTranslated,
    stakes,
  };
}

async function action(
  name: Action,
  body: RequestBody,
  logger?: (message: string) => void
): Promise<Record<string, unknown>> {
  validateRequest(body);
  // The development phrase is request-scoped; never persist, log, or return it.
  let config = configWithProtocolOverrides(configFor(body.network, body.fullnodeMode), body);
  if (name === 'stake' || name === 'early-exit') {
    const hasPhrase = body.seedPhrase !== undefined && body.seedPhrase.trim().length > 0;
    if (body.accountPreset !== undefined || hasPhrase) {
      config = configWithAccount(config, accountFor(config, body.seedPhrase, body.accountPreset));
    }
  }
  if (name === 'up') {
    await startCompose(config);
    return { message: `${config.coinName} fullnode started on localhost` };
  }
  if (name === 'down') {
    await stopCompose(config, false);
    return { message: `${config.coinName} fullnode stopped` };
  }
  if (name === 'faucet') {
    const bitcoin = bitcoinFor(config);
    const address = await bitcoin.getNewAddress(`pox5-${config.profile}-dashboard`);
    const txid = await new HiroRegtestFundingAdapter(config).requestFaucet(address);
    return { message: 'Faucet request accepted. Wait for confirmation before staking.', address, txid };
  }
  if (name === 'stake') {
    if (body.amountSats !== undefined) process.env.POX5_AMOUNT_SATS = String(body.amountSats);
    await runL1RegisterScenario(config, logger);
    return { message: 'Stake registration submitted. Refresh status to observe membership.' };
  }
  if (name === 'early-exit') {
    await runL1EarlyExitScenario(config, logger);
    return { message: 'Early exit announced. The Bitcoin reclaim still requires the bond cosigner.' };
  }
  throw new Error(
    'Late exit needs a confirmed lock UTXO plus the required Bitcoin staker signatures. This dashboard does not retain private keys or construct that spend.'
  );
}

async function serveStatic(response: ServerResponse, pathname: string): Promise<void> {
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!['index.html', 'app.js', 'styles.css', 'favicon.svg'].includes(file))
    return sendJson(response, 404, { error: 'Not found' });
  const content = await readFile(join(publicRoot, file));
  const type = file.endsWith('.html')
    ? 'text/html'
    : file.endsWith('.css')
    ? 'text/css'
    : file.endsWith('.svg')
    ? 'image/svg+xml'
    : 'text/javascript';
  response.writeHead(200, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' });
  response.end(content);
}

createServer(async (request, response) => {
  const requestId = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const logger = requestLogger(requestId);
  const isLogRequest = request.url?.startsWith('/api/logs') === true;
  if (!isLogRequest) {
    appendLog('info', `${request.method ?? 'UNKNOWN'} ${request.url ?? '/'}`, requestId);
    response.on('finish', () =>
      appendLog(
        response.statusCode >= 400 ? 'error' : 'info',
        `${response.statusCode} ${request.method ?? 'UNKNOWN'} ${request.url ?? '/'}`,
        requestId
      )
    );
  }
  try {
    const url = new URL(request.url ?? '/', `http://${host}:${port}`);
    if (request.method === 'POST' && url.pathname === '/api/status') {
      const body = await readJson(request);
      validateRequest(body);
      sendJson(
        response,
        200,
        await status(body.network, body.fullnodeMode, body.seedPhrase, body.accountPreset, logger)
      );
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/btc-wallet') {
      sendJson(response, 200, await btcWallet(await readJson(request), logger));
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/stx-wallet') {
      sendJson(response, 200, await stxWallet(await readJson(request), logger));
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/staked-funds') {
      sendJson(response, 200, await stakedFunds(await readJson(request), logger));
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/logs') {
      const after = Number(url.searchParams.get('after') ?? '0');
      sendJson(response, 200, { entries: logEntries.filter((entry) => entry.id > after) });
      return;
    }
    if (url.pathname.startsWith('/api/bitgo/')) {
      if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      try {
        assertBitGoRequestOrigin(request);
        const result = await handleBitGoApiRequest(url.pathname, await readJson(request));
        sendJson(response, 200, result);
      } catch (error) {
        const message = formatError(error);
        appendLog('error', `BitGo API operation failed: ${message}`, requestId);
        sendJson(response, 400, { error: message });
      }
      return;
    }
    if (request.method === 'POST' && url.pathname.startsWith('/api/actions/')) {
      const name = url.pathname.slice('/api/actions/'.length);
      if (!['up', 'down', 'faucet', 'stake', 'early-exit', 'late-exit'].includes(name)) {
        sendJson(response, 404, { error: 'Not found' });
        return;
      }
      logger(`action: ${name} started`);
      sendJson(response, 200, await action(name as Action, await readJson(request), logger));
      logger(`action: ${name} completed`);
      return;
    }
    if (request.method === 'GET') return await serveStatic(response, url.pathname);
    sendJson(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    appendLog('error', formatError(error), requestId, error instanceof Error ? error.stack : undefined);
    sendJson(response, 400, { error: formatError(error) });
  }
}).listen(port, host, () => console.log(`PoX-5 dashboard listening on http://${host}:${port}`));
