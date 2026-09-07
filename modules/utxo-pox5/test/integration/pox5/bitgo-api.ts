import { randomUUID } from 'node:crypto';

import { BitGoAPI } from '@bitgo/sdk-api';
import { register as registerBtcCoins } from '@bitgo/sdk-coin-btc';
import type { IWallet, Pox5StakeOptions, StakingRequest, StakingTransaction } from '@bitgo/sdk-core';
import { hasPsbtMagic, Psbt } from '@bitgo/wasm-utxo';

export const bitGoEnvironments = ['test', 'staging'] as const;
export const bitGoCoins = ['tbtcstx', 'tbtcstxprivate1'] as const;
export const bitGoWalletTypes = ['hot', 'custodial'] as const;

export type BitGoEnvironment = (typeof bitGoEnvironments)[number];
export type BitGoCoinName = (typeof bitGoCoins)[number];
export type BitGoWalletType = (typeof bitGoWalletTypes)[number];
type OperationKind = 'deposit' | 'withdrawal';

interface TransactionOutputReview {
  address: string;
  amountSats: string;
  outputType: 'external' | 'change' | 'custom-change';
}

interface TransactionReview {
  amountSats: string;
  feeSats: string;
  outputs: TransactionOutputReview[];
  locktime?: number;
  unlockHeight?: number;
  currentBlockHeight?: number;
}

interface PendingStakingOperation {
  environment: BitGoEnvironment;
  coin: BitGoCoinName;
  walletId: string;
  kind: OperationKind;
  amountSats: string;
  requestId: string;
  transaction: StakingTransaction;
  transactionTemplate: string;
  pairedWalletId: string;
  review: TransactionReview;
  expiresAt: number;
}

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
const maxPendingOperations = 20;
const pendingOperationTtlMs = 15 * 60 * 1000;
const pendingOperations = new Map<string, PendingStakingOperation>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function optionalPositiveIntegerString(value: unknown, name: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${name} must be a positive integer`);
  return String(parsed);
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

export async function listBitGoWallets(bitgo: BitGoAPI, coinName: BitGoCoinName): Promise<BitGoWalletSummary[]> {
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
  coinName: BitGoCoinName,
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

function assertFixedScriptWallet(wallet: IWallet): void {
  if (wallet.multisigType() !== 'onchain' || getPox5WalletSpecific(wallet)?.isStakingWallet === true) {
    throw new Error('Select the fixed-script on-chain wallet, not a paired staking wallet');
  }
}

function prunePendingOperations(): void {
  const now = Date.now();
  for (const [id, operation] of pendingOperations) {
    if (operation.expiresAt <= now) pendingOperations.delete(id);
  }
  while (pendingOperations.size >= maxPendingOperations) {
    const oldestId = pendingOperations.keys().next().value;
    if (oldestId === undefined) return;
    pendingOperations.delete(oldestId);
  }
}

function scalar(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') return undefined;
  const text = String(value);
  return /^[0-9]+$/.test(text) ? BigInt(text).toString() : text;
}

function isBlockHeightProvider(value: unknown): value is { getLatestBlockHeight(): Promise<number> } {
  return isRecord(value) && typeof value.getLatestBlockHeight === 'function';
}

function psbtFromHex(txHex: string): Psbt {
  const bytes = Buffer.from(txHex, 'hex');
  if (!hasPsbtMagic(bytes)) throw new Error('BitGo did not return a PSBT-formatted transaction');
  return Psbt.deserialize(bytes);
}

async function transactionReview(
  wallet: IWallet,
  transaction: unknown,
  amountSats: string
): Promise<TransactionReview> {
  if (!isRecord(transaction)) throw new Error('BitGo did not return a transaction prebuild');
  if (typeof transaction.txHex !== 'string') throw new Error('BitGo did not return an inspectable transaction hex');
  const explanation: unknown = await wallet.baseCoin.explainTransaction(transaction, wallet);
  if (!isRecord(explanation) || !Array.isArray(explanation.outputs) || explanation.outputs.length === 0) {
    throw new Error('BitGo did not return inspectable transaction outputs');
  }
  const summarizeOutputs = (
    values: unknown,
    outputType: TransactionOutputReview['outputType']
  ): TransactionOutputReview[] => {
    if (!Array.isArray(values)) return [];
    return values.map((value) => {
      if (!isRecord(value) || typeof value.address !== 'string' || value.address.length === 0) {
        throw new Error('Transaction contains an output without a displayable address');
      }
      const amount = scalar(value.amount);
      if (amount === undefined) throw new Error('Transaction contains an output without an inspectable amount');
      return { address: value.address, amountSats: amount, outputType };
    });
  };
  const outputs = [
    ...summarizeOutputs(explanation.outputs, 'external'),
    ...summarizeOutputs(explanation.changeOutputs, 'change'),
    ...summarizeOutputs(explanation.customChangeOutputs, 'custom-change'),
  ];
  const feeSats = scalar(explanation.fee);
  if (feeSats === undefined) throw new Error('BitGo did not return an inspectable transaction fee');
  const locktime = psbtFromHex(transaction.txHex).lockTime();
  outputs.sort((left, right) =>
    `${left.outputType}:${left.address}:${left.amountSats}`.localeCompare(
      `${right.outputType}:${right.address}:${right.amountSats}`
    )
  );
  return { amountSats, feeSats, outputs, ...(locktime > 0 ? { locktime } : {}) };
}

function sameReview(left: TransactionReview, right: TransactionReview): boolean {
  return (
    left.amountSats === right.amountSats &&
    left.feeSats === right.feeSats &&
    left.locktime === right.locktime &&
    JSON.stringify(left.outputs) === JSON.stringify(right.outputs)
  );
}

async function assertMatureRecovery(wallet: IWallet, review: TransactionReview): Promise<void> {
  const unlockHeight = review.locktime;
  if (unlockHeight === undefined || unlockHeight >= 500_000_000) {
    throw new Error('PoX-5 recovery transaction has no block-height timelock');
  }
  if (!isBlockHeightProvider(wallet.baseCoin)) {
    throw new Error('BitGo coin does not expose its current block height');
  }
  const currentBlockHeight = await wallet.baseCoin.getLatestBlockHeight();
  if (!Number.isSafeInteger(currentBlockHeight) || currentBlockHeight < 0) {
    throw new Error('BitGo returned an invalid current block height');
  }
  if (currentBlockHeight < unlockHeight) {
    throw new Error(
      `PoX-5 timelock is not mature: current height ${currentBlockHeight}, unlock height ${unlockHeight}`
    );
  }
  review.unlockHeight = unlockHeight;
  review.currentBlockHeight = currentBlockHeight;
}

function readTransactionHex(signed: unknown): string {
  if (!isRecord(signed)) throw new Error('BitGo did not return a signed transaction');
  if (typeof signed.txHex === 'string') return signed.txHex;
  const halfSigned = signed.halfSigned;
  if (isRecord(halfSigned) && typeof halfSigned.txHex === 'string') return halfSigned.txHex;
  throw new Error('BitGo did not return an inspectable signed UTXO transaction');
}

export function normalizeUnsignedTransactionHex(txHex: string): string {
  return Buffer.from(psbtFromHex(txHex).getUnsignedTx()).toString('hex');
}

function readyTransaction(request: StakingRequest, kind: OperationKind): StakingTransaction {
  const transactions = request.transactions.filter((transaction) => transaction.status === 'READY');
  if (transactions.length !== 1) {
    throw new Error(
      `Staking request ${request.id} has ${transactions.length} transactions ready to sign; expected exactly one`
    );
  }
  const transaction = transactions[0];
  if (kind === 'withdrawal' && transaction.transactionType.toLowerCase() !== 'undelegate_withdraw') {
    throw new Error('The PoX-5 withdrawal request did not produce an unlock recovery transaction');
  }
  return transaction;
}

async function prepareStakingOperation(
  bitgo: BitGoAPI,
  environment: BitGoEnvironment,
  coinName: BitGoCoinName,
  wallet: IWallet,
  request: StakingRequest,
  kind: OperationKind,
  amountSats: string
): Promise<Record<string, unknown>> {
  const stakingWallet = wallet.toStakingWallet();
  const latestRequest = await stakingWallet.getStakingRequest(request.id);
  const transaction = readyTransaction(latestRequest, kind);
  const prebuild = await stakingWallet.build(transaction);
  if (!('txHex' in prebuild.result) || typeof prebuild.result.txHex !== 'string') {
    throw new Error('Expected a fixed-script transaction prebuild, not a transaction request');
  }
  const coin = bitgo.coin(coinName);
  const transactionTemplate = normalizeUnsignedTransactionHex(prebuild.result.txHex);
  const refreshedWallet = await coin.wallets().get({ id: wallet.id() });
  const pox5 = getPox5WalletSpecific(refreshedWallet);
  const pairedWalletId = pox5?.pairedWalletId;
  if (typeof pairedWalletId !== 'string') {
    throw new Error('PoX-5 prebuild did not link a paired staking wallet; refusing to continue');
  }
  let reviewWallet = wallet;
  if (kind === 'withdrawal') {
    const buildParams = prebuild.transaction.buildParams;
    const senderWalletId = isRecord(buildParams) ? buildParams.senderWalletId : undefined;
    if (senderWalletId !== pairedWalletId) {
      throw new Error('PoX-5 withdrawal was not built by the linked paired staking wallet');
    }
    reviewWallet = await coin.wallets().get({ id: pairedWalletId });
  }
  const review = await transactionReview(reviewWallet, prebuild.result, amountSats);
  if (kind === 'withdrawal') await assertMatureRecovery(reviewWallet, review);

  prunePendingOperations();
  const operationId = randomUUID();
  pendingOperations.set(operationId, {
    environment,
    coin: coinName,
    walletId: wallet.id(),
    kind,
    amountSats,
    requestId: request.id,
    transaction: prebuild.transaction,
    transactionTemplate,
    pairedWalletId,
    review,
    expiresAt: Date.now() + pendingOperationTtlMs,
  });

  return {
    operationId,
    kind,
    requestId: request.id,
    transactionId: transaction.id,
    transactionType: transaction.transactionType,
    walletId: wallet.id(),
    pairedWalletId,
    review,
    expiresInSeconds: Math.floor(pendingOperationTtlMs / 1000),
  };
}

async function status(environment: BitGoEnvironment): Promise<Record<string, unknown>> {
  const token = tokenFor(environment);
  const tokenVariable = tokenEnvironmentVariables[environment];
  if (!token) return { environment, configured: false, authenticated: false, tokenVariable };
  const bitgo = createBitGoApiClient(environment, token);
  await bitgo.get(bitgo.url('/user/me')).result();
  return { environment, configured: true, authenticated: true };
}

async function createWallet(
  bitgo: BitGoAPI,
  coinName: BitGoCoinName,
  body: Record<string, unknown>
): Promise<BitGoWalletSummary> {
  const enterprise =
    body.enterprise === undefined ? undefined : requiredString(body.enterprise, 'Enterprise ID', 128).trim();
  return await createBitGoWallet(bitgo, coinName, {
    label: requiredString(body.label, 'Wallet label', 80).trim(),
    walletPassphrase: requiredString(body.walletPassphrase, 'Wallet passphrase', 256),
    ...(enterprise ? { enterprise } : {}),
  });
}

async function listDelegations(
  bitgo: BitGoAPI,
  coinName: BitGoCoinName,
  walletId: string
): Promise<Record<string, unknown>> {
  const wallet = await bitgo.coin(coinName).wallets().get({ id: walletId });
  assertFixedScriptWallet(wallet);
  const results = await wallet.toStakingWallet().delegations({ page: 0, pageSize: 100 });
  return {
    walletId,
    delegations: results.delegations.map((delegation) => ({
      id: delegation.id,
      status: delegation.status,
      amountSats: String(delegation.delegated),
      delegationAddress: delegation.delegationAddress,
      withdrawalAddress: delegation.withdrawalAddress,
    })),
    page: results.page,
    totalPages: results.totalPages,
  };
}

async function prepareDeposit(
  bitgo: BitGoAPI,
  environment: BitGoEnvironment,
  coinName: BitGoCoinName,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const walletId = requiredString(body.walletId, 'Wallet ID', 128);
  const amountSats = parsePositiveSats(body.amountSats, 'Deposit amount');
  const bondIndex = parseNonNegativeInteger(body.bondIndex, 'Bond index');
  const signerManager = requiredString(body.signerManager, 'Signer manager', 256).trim();
  if (signerManager.length === 0) throw new Error('Signer manager must not be blank');
  const numCycles = optionalPositiveIntegerString(body.numCycles, 'Number of cycles');
  const startBurnHt = optionalPositiveIntegerString(body.startBurnHt, 'Start burn height');
  const options: Pox5StakeOptions = {
    subType: 'pox5-bond',
    amount: amountSats,
    bondIndex,
    signerManager,
    ...(numCycles ? { numCycles } : {}),
    ...(startBurnHt ? { startBurnHt } : {}),
  };
  const wallet = await bitgo.coin(coinName).wallets().get({ id: walletId });
  assertFixedScriptWallet(wallet);
  const request = await wallet.toStakingWallet().stake(options);
  return prepareStakingOperation(bitgo, environment, coinName, wallet, request, 'deposit', amountSats);
}

async function prepareWithdrawal(
  bitgo: BitGoAPI,
  environment: BitGoEnvironment,
  coinName: BitGoCoinName,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const walletId = requiredString(body.walletId, 'Wallet ID', 128);
  const delegationId = requiredString(body.delegationId, 'Delegation ID', 256);
  const amountSats = parsePositiveSats(body.amountSats, 'Withdrawal amount');
  const wallet = await bitgo.coin(coinName).wallets().get({ id: walletId });
  assertFixedScriptWallet(wallet);
  const request = await wallet.toStakingWallet().unstake({
    subType: 'pox5-bond',
    amount: amountSats,
    delegationId,
  });
  return prepareStakingOperation(bitgo, environment, coinName, wallet, request, 'withdrawal', amountSats);
}

async function sendStakingOperation(
  bitgo: BitGoAPI,
  body: Record<string, unknown>,
  environment: BitGoEnvironment,
  coinName: BitGoCoinName,
  kind: OperationKind
): Promise<Record<string, unknown>> {
  const operationId = requiredString(body.operationId, 'Operation ID', 64);
  const passphrase = requiredString(body.walletPassphrase, 'Wallet passphrase', 256);
  prunePendingOperations();
  const operation = pendingOperations.get(operationId);
  if (!operation || operation.kind !== kind)
    throw new Error('Prepared transaction expired or not found; prepare it again');
  if (operation.environment !== environment || operation.coin !== coinName) {
    throw new Error('Prepared transaction belongs to a different BitGo environment or coin');
  }

  const coin = bitgo.coin(operation.coin);
  const wallet = await coin.wallets().get({ id: operation.walletId });
  const stakingWallet = wallet.toStakingWallet();
  const signed = await stakingWallet.buildAndSign({ walletPassphrase: passphrase }, operation.transaction);
  const txHex = readTransactionHex(signed.signed);
  const transactionTemplate = normalizeUnsignedTransactionHex(txHex);
  const reviewWallet =
    operation.kind === 'withdrawal' ? await coin.wallets().get({ id: operation.pairedWalletId }) : wallet;
  const freshReview = await transactionReview(reviewWallet, { txHex }, operation.amountSats);
  if (operation.transactionTemplate !== transactionTemplate || !sameReview(operation.review, freshReview)) {
    pendingOperations.delete(operationId);
    throw new Error(
      'Transaction changed after preview; nothing was submitted. Prepare it again and review the new transaction'
    );
  }
  if (kind === 'withdrawal') await assertMatureRecovery(reviewWallet, freshReview);

  let sent;
  try {
    sent = await stakingWallet.send(signed);
  } catch (error) {
    pendingOperations.delete(operationId);
    throw new Error(
      `Submission result is uncertain for staking request ${operation.requestId}; refresh its status before retrying: ${
        error instanceof Error ? error.message : 'BitGo API request failed'
      }`
    );
  }
  pendingOperations.delete(operationId);
  return {
    requestId: operation.requestId,
    transactionId: sent.id,
    transactionType: sent.transactionType,
    status: sent.status,
    walletId: operation.walletId,
    pairedWalletId: operation.pairedWalletId,
  };
}

export async function handleBitGoApiRequest(path: string, input: unknown): Promise<unknown> {
  if (!isRecord(input)) throw new Error('Request body must be an object');
  const environment = parseBitGoEnvironment(input.environment);
  const tokenVariable = tokenEnvironmentVariables[environment];
  const accessToken = tokenFor(environment);
  const passphrase = typeof input.walletPassphrase === 'string' ? input.walletPassphrase : '';
  const secrets = [accessToken ?? '', passphrase];

  try {
    if (path === '/api/bitgo/status') return await status(environment);
    if (!accessToken) throw new Error(`${tokenVariable} is not set in the dashboard process environment`);
    const coinName = parseBitGoCoin(input.coin);
    const bitgo = createBitGoApiClient(environment, accessToken);
    if (path === '/api/bitgo/wallets') return { wallets: await listBitGoWallets(bitgo, coinName) };
    if (path === '/api/bitgo/wallets/create') {
      return { wallet: await createWallet(bitgo, coinName, input) };
    }
    if (path === '/api/bitgo/delegations') {
      return await listDelegations(bitgo, coinName, requiredString(input.walletId, 'Wallet ID', 128));
    }
    if (path === '/api/bitgo/deposits/prepare') {
      return await prepareDeposit(bitgo, environment, coinName, input);
    }
    if (path === '/api/bitgo/withdrawals/prepare') {
      return await prepareWithdrawal(bitgo, environment, coinName, input);
    }
    if (path === '/api/bitgo/deposits/send') {
      return await sendStakingOperation(bitgo, input, environment, coinName, 'deposit');
    }
    if (path === '/api/bitgo/withdrawals/send') {
      return await sendStakingOperation(bitgo, input, environment, coinName, 'withdrawal');
    }
    throw new Error('Unknown BitGo API operation');
  } catch (error) {
    throw new Error(redactBitGoError(error, secrets));
  }
}
