import { BitGoAPI } from '@bitgo/sdk-api';
import { register as registerBtcCoins } from '@bitgo/sdk-coin-btc';
import type { IWallet } from '@bitgo/sdk-core';

export const bitGoEnvironments = ['test', 'staging'] as const;
export const bitGoCoins = ['tbtcstx', 'tbtcstxprivate1'] as const;
export const bitGoWalletCreationCoins = ['tbtcstx', 'tbtcstxprivate1', 'tbtcstxsignet'] as const;
export const bitGoWalletTypes = ['hot', 'custodial'] as const;

export type BitGoEnvironment = (typeof bitGoEnvironments)[number];
export type BitGoCoinName = (typeof bitGoCoins)[number];
export type BitGoWalletCreationCoinName = (typeof bitGoWalletCreationCoins)[number];
export type BitGoWalletType = (typeof bitGoWalletTypes)[number];

export interface BitGoWalletSummary {
  id: string;
  label: string;
  coin: string;
  type: string;
  multisigType: string;
  balanceSats: string;
  isStakingWallet: boolean;
  pairedWalletId?: string;
}

export interface CreateBitGoWalletOptions {
  label: string;
  walletPassphrase?: string;
  walletType?: BitGoWalletType;
  enterprise?: string;
}

const tokenEnvironmentVariables: Record<BitGoEnvironment, string> = {
  test: 'BITGO_TOKEN_TEST',
  staging: 'BITGO_TOKEN_STAGING',
};
const maxMoneySats = 2_100_000_000_000_000n;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function scalar(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') return undefined;
  const text = String(value);
  return /^[0-9]+$/.test(text) ? BigInt(text).toString() : text;
}

function requiredString(value: unknown, name: string, maxLength = 256): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new Error(`${name} must be a non-empty string of at most ${maxLength} characters`);
  }
  return value;
}

export function parseBitGoEnvironment(value: unknown): BitGoEnvironment {
  if (typeof value === 'string' && (bitGoEnvironments as readonly string[]).includes(value)) {
    return value as BitGoEnvironment;
  }
  throw new Error('BitGo environment must be test or staging');
}

export function parseBitGoCoin(value: unknown): BitGoCoinName {
  if (typeof value === 'string' && (bitGoCoins as readonly string[]).includes(value)) {
    return value as BitGoCoinName;
  }
  throw new Error('BitGo coin must be tbtcstx or tbtcstxprivate1');
}

export function parseBitGoWalletCreationCoin(value: unknown): BitGoWalletCreationCoinName {
  if (typeof value === 'string' && (bitGoWalletCreationCoins as readonly string[]).includes(value)) {
    return value as BitGoWalletCreationCoinName;
  }
  throw new Error('BitGo wallet-creation coin must be tbtcstx, tbtcstxprivate1, or tbtcstxsignet');
}

export function parseBitGoWalletType(value: unknown): BitGoWalletType {
  if (value === undefined || value === 'hot') return 'hot';
  if (value === 'custodial') return 'custodial';
  throw new Error('POX5_WP_SIGN_WALLET_TYPE must be hot or custodial');
}

export function parsePositiveSats(value: unknown, name: string): string {
  const stringValue = typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : value;
  if (typeof stringValue !== 'string' || !/^[1-9][0-9]*$/.test(stringValue)) {
    throw new Error(`${name} must be a positive integer number of satoshis`);
  }
  const amount = BigInt(stringValue);
  if (amount > maxMoneySats) throw new Error(`${name} exceeds the maximum Bitcoin supply`);
  return amount.toString();
}

export function parseNonNegativeInteger(value: unknown, name: string): number {
  const text = typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : value;
  if (typeof text !== 'string' || !/^(0|[1-9][0-9]*)$/.test(text)) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${name} must be a non-negative integer`);
  return parsed;
}

export function redactBitGoError(error: unknown, secrets: string[]): string {
  let message = error instanceof Error ? error.message : 'BitGo API request failed';
  for (const secret of secrets) {
    if (secret.length > 0) message = message.split(secret).join('[redacted]');
  }

  const details: string[] = [];
  if (isRecord(error)) {
    if (typeof error.status === 'number') details.push(`HTTP ${error.status}`);
    if (typeof error.requestId === 'string') details.push(`requestId ${error.requestId}`);
    if (isRecord(error.result)) {
      const detail = [error.result.error, error.result.code, error.result.message].find(
        (value): value is string => typeof value === 'string' && value !== message
      );
      if (detail) {
        let redactedDetail = detail;
        for (const secret of secrets) {
          if (secret.length > 0) redactedDetail = redactedDetail.split(secret).join('[redacted]');
        }
        details.push(`detail ${redactedDetail}`);
      }
    }
  }

  return `${message}${details.length > 0 ? ` (${details.join('; ')})` : ''}`.slice(0, 800);
}

export function redactBitGoErrorStack(error: unknown, secrets: string[]): string | undefined {
  if (!(error instanceof Error) || typeof error.stack !== 'string') return undefined;
  return secrets.reduce(
    (stack, secret) => (secret.length > 0 ? stack.split(secret).join('[redacted]') : stack),
    error.stack
  );
}

function tokenFor(environment: BitGoEnvironment): string | undefined {
  return process.env[tokenEnvironmentVariables[environment]];
}

export function getBitGoApiToken(environment: BitGoEnvironment): string {
  const token = tokenFor(environment);
  if (!token) throw new Error(`${tokenEnvironmentVariables[environment]} is not set in the process environment`);
  return token;
}

export function createBitGoApiClient(environment: BitGoEnvironment, accessToken: string): BitGoAPI {
  const bitgo = new BitGoAPI({ env: environment, accessToken });
  registerBtcCoins(bitgo);
  return bitgo;
}

export function walletCoinSpecifics(wallet: IWallet): Record<string, unknown>[] {
  const json: unknown = wallet.toJSON();
  const candidates: unknown[] = [wallet.coinSpecific()];
  if (isRecord(json)) candidates.push(json.coinSpecific, json.activeCoinSpecific);
  return candidates.filter(isRecord);
}

export function getPox5WalletSpecific(wallet: IWallet): Record<string, unknown> | undefined {
  for (const coinSpecific of walletCoinSpecifics(wallet)) {
    const staking = coinSpecific.staking;
    if (!isRecord(staking)) continue;
    if (isRecord(staking.pox5)) return staking.pox5;
  }
  return undefined;
}

export function summarizeBitGoWallet(wallet: IWallet): BitGoWalletSummary {
  const pox5 = getPox5WalletSpecific(wallet);
  const pairedWalletId = pox5?.pairedWalletId;
  return {
    id: wallet.id(),
    label: wallet.label(),
    coin: wallet.coin(),
    type: wallet.type(),
    multisigType: wallet.multisigType(),
    balanceSats: wallet.balanceString(),
    isStakingWallet: pox5?.isStakingWallet === true,
    ...(typeof pairedWalletId === 'string' ? { pairedWalletId } : {}),
  };
}

export function isFixedScriptMainWallet(wallet: BitGoWalletSummary, walletType: BitGoWalletType = 'hot'): boolean {
  return wallet.type === walletType && wallet.multisigType === 'onchain' && !wallet.isStakingWallet;
}

export function responseUnspents(value: unknown): Record<string, unknown>[] {
  const values = isRecord(value) && Array.isArray(value.unspents) ? value.unspents : value;
  return Array.isArray(values) ? values.filter(isRecord) : [];
}

export function outpointFromUnspent(unspent: Record<string, unknown>): string | undefined {
  if (typeof unspent.id === 'string' && /^[0-9a-f]{64}:[0-9]+$/i.test(unspent.id)) {
    return unspent.id.toLowerCase();
  }
  const txid = unspent.tx_hash ?? unspent.txHash ?? unspent.txid;
  const voutValue = unspent.tx_output_n ?? unspent.n ?? unspent.vout;
  const vout = typeof voutValue === 'string' && /^[0-9]+$/.test(voutValue) ? Number(voutValue) : voutValue;
  if (typeof txid !== 'string' || typeof vout !== 'number' || !Number.isSafeInteger(vout) || vout < 0) return undefined;
  return `${txid.toLowerCase()}:${vout}`;
}

export function summarizeUnspent(unspent: Record<string, unknown>): Record<string, unknown> {
  const outpoint = outpointFromUnspent(unspent);
  const amount = scalar(unspent.value ?? unspent.amount ?? unspent.valueString);
  return {
    ...(outpoint ? { outpoint } : {}),
    ...(amount ? { amountSats: amount } : {}),
    ...(typeof unspent.address === 'string' ? { address: unspent.address } : {}),
    ...(typeof unspent.confirmations === 'number' ? { confirmations: unspent.confirmations } : {}),
  };
}

export async function listBitGoWallets(
  bitgo: BitGoAPI,
  coinName: BitGoWalletCreationCoinName
): Promise<BitGoWalletSummary[]> {
  const result = await bitgo.coin(coinName).wallets().list({ limit: 100 });
  return result.wallets.map(summarizeBitGoWallet);
}

export function selectBitGoEnterpriseId(enterpriseIds: string[], requestedId?: string): string {
  const requested = requestedId?.trim();
  if (requested) return requested;
  if (enterpriseIds.length === 1) return enterpriseIds[0];
  if (enterpriseIds.length === 0) {
    throw new Error('Wallet creation requires an enterprise ID, but no accessible enterprises were found');
  }
  throw new Error(
    `Wallet creation requires an enterprise ID; ${enterpriseIds.length} accessible enterprises were found, so specify one explicitly`
  );
}

export async function createBitGoWallet(
  bitgo: BitGoAPI,
  coinName: BitGoWalletCreationCoinName,
  options: CreateBitGoWalletOptions
): Promise<BitGoWalletSummary> {
  const label = requiredString(options.label, 'Wallet label', 80).trim();
  if (label.length === 0) throw new Error('Wallet label must not be blank');
  const walletType = options.walletType ?? 'hot';
  const passphrase = options.walletPassphrase
    ? requiredString(options.walletPassphrase, 'Wallet passphrase', 256)
    : undefined;
  if (walletType === 'hot' && !passphrase) throw new Error('Wallet passphrase is required for hot wallets');
  if (passphrase && passphrase.length < 8) throw new Error('Wallet passphrase must be at least 8 characters');
  const enterpriseIds = options.enterprise?.trim()
    ? []
    : (await bitgo.coin(coinName).enterprises().list()).map((enterprise) => enterprise.id);
  const enterprise = selectBitGoEnterpriseId(enterpriseIds, options.enterprise);
  const result = await bitgo
    .coin(coinName)
    .wallets()
    .generateWallet({
      type: walletType,
      multisigType: 'onchain',
      label,
      ...(walletType === 'hot' ? { passphrase } : {}),
      enterprise,
    });
  return summarizeBitGoWallet(result.wallet);
}
