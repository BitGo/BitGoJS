import { createHash } from 'node:crypto';

import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import type { IWallet } from '@bitgo/sdk-core';

import { descriptorDetails, networkForCoin } from './bitgo-api-helpers';
import {
  getPox5WalletSpecific,
  outpointFromUnspent,
  parseNonNegativeInteger,
  parsePositiveSats,
  responseUnspents,
  summarizeUnspent,
} from './bitgo-api';
import { derivePox5FakeStakeMaterials } from './fake-stake';
import { HiroSignetFundingAdapter } from './funding';
import { requestHiroBtcFaucet } from './hiro-btc-faucet';
import { Cell, Checkpoint, Evidence, Handlers, MatrixPrerequisite, Report, Row } from './live-matrix';
import {
  assertProtocolUnlock,
  confirmNetworkTx,
  defaultPollingTimeoutMs,
  liveEndpoints,
  resolveProtocolBond,
  verifiedLiveTip,
} from './live-matrix-network';
import { pairedRecovery, pairedStake, type PairedBaseArgs } from './live-matrix-paired';
import {
  dedicatedLabel,
  dedicatedMainWallet,
  ensureEnterpriseApproverMembership,
  ensureCustodialApproverWalletAccess,
  indexedDeposit,
  liveApprover,
  liveContext,
  liveRecoverySeed,
  LiveContext,
} from './live-matrix-provision';
import { resolveStandaloneDescriptorWallet, standaloneRecovery, standaloneStake } from './live-matrix-standalone';

type ConfirmedInput = { outpoint: string; amountSats: string; confirmations: number };

function positiveNumber(value: string | undefined, name: string): number {
  const parsed = parsePositiveSats(value, name);
  const number = Number(parsed);
  if (!Number.isSafeInteger(number)) throw new Error(`${name} must fit in a safe integer`);
  return number;
}

function limits(env: NodeJS.ProcessEnv): {
  amountSats: number;
  maxAmountSats: number;
  maxFeeSats: number;
  timeoutMs: number;
} {
  const amountSats = positiveNumber(env.POX5_LIVE_STAKE_SATS, 'Stake amount');
  const maxAmountSats = positiveNumber(env.POX5_LIVE_MAX_STAKE_SATS, 'Stake cap');
  const maxFeeSats = positiveNumber(env.POX5_LIVE_MAX_FEE_SATS, 'Fee cap');
  const timeoutMs = positiveNumber(env.POX5_LIVE_TIMEOUT_MS, 'Polling timeout');
  if (amountSats > maxAmountSats || maxFeeSats >= amountSats || timeoutMs > 86_400_000) {
    throw new Error('Live stake amount, fee or timeout exceeds the configured safety cap');
  }
  return { amountSats, maxAmountSats, maxFeeSats, timeoutMs };
}

async function verifiedAddress(wallet: IWallet, cell: Cell): Promise<string> {
  const { address } = await wallet.createAddress();
  if (typeof address !== 'string' || address.length > 100 || !/^[a-zA-Z0-9]+$/.test(address)) {
    throw new Error('BitGo returned an invalid deposit address');
  }
  const coin = wallet.baseCoin;
  if (!(coin instanceof AbstractUtxoCoin) || coin.getChain() !== cell.coin) {
    throw new Error('BitGo returned an address for a different UTXO network');
  }
  coin.addressCodec.fromExtendedAddressFormatToScript(address);
  return address;
}

export type FundingCandidate = { outpoint: string; amountSats: number; confirmations: number };

/** Smallest confirmed unspent that covers the minimum; ties break by outpoint for a stable choice. */
export function selectSmallestSufficientUnspent(
  candidates: readonly FundingCandidate[],
  minimum: number
): string | undefined {
  const eligible = candidates
    .filter(
      (candidate) =>
        candidate.confirmations >= 1 && Number.isSafeInteger(candidate.amountSats) && candidate.amountSats >= minimum
    )
    .sort((a, b) => a.amountSats - b.amountSats || a.outpoint.localeCompare(b.outpoint));
  return eligible[0]?.outpoint;
}

async function listFundingCandidates(wallet: IWallet, minimum: number): Promise<FundingCandidate[]> {
  const unspents = responseUnspents(await wallet.unspents({ limit: 100, minConfirms: 1, minValue: String(minimum) }));
  return unspents.flatMap((unspent) => {
    const outpoint = outpointFromUnspent(unspent);
    const summary = summarizeUnspent(unspent);
    const amountSats = typeof summary.amountSats === 'string' ? Number(summary.amountSats) : NaN;
    const confirmations = typeof summary.confirmations === 'number' ? summary.confirmations : 1;
    return outpoint === undefined ? [] : [{ outpoint, amountSats, confirmations }];
  });
}

/**
 * Chooses the funding outpoint for a stake or standalone run, in order: an explicitly
 * pinned outpoint (must be usable), an existing confirmed wallet unspent that covers
 * the minimum, and only then a new faucet deposit.
 */
async function fundingOutpoint(
  pinned: string | undefined,
  wallet: IWallet,
  minimum: number,
  checkpoint: Checkpoint,
  fund: () => Promise<Evidence>
): Promise<string> {
  if (pinned) {
    await checkpoint({ fundingSource: 'PINNED' });
    return pinned;
  }
  const existing = selectSmallestSufficientUnspent(await listFundingCandidates(wallet, minimum), minimum);
  if (existing) {
    await checkpoint({ fundingSource: 'EXISTING', outpoint: existing });
    return existing;
  }
  const deposit = await fund();
  if (!deposit.outpoint) throw new Error('Confirmed dedicated deposit has no outpoint');
  await checkpoint({ fundingSource: 'FAUCET' });
  return deposit.outpoint;
}

export async function confirmedInput(
  wallet: IWallet,
  minimum: number,
  selectedOutpoint: string
): Promise<ConfirmedInput | undefined> {
  if (!/^[0-9a-f]{64}:(0|[1-9][0-9]*)$/i.test(selectedOutpoint)) {
    throw new Error('Dedicated fixture outpoint is invalid');
  }
  const candidates = responseUnspents(await wallet.unspents({ limit: 100, minConfirms: 1, minValue: String(minimum) }));
  const inputs = candidates.flatMap((unspent) => {
    const outpoint = outpointFromUnspent(unspent);
    const summary = summarizeUnspent(unspent);
    const amountSats = typeof summary.amountSats === 'string' ? Number(summary.amountSats) : NaN;
    const confirmations = typeof summary.confirmations === 'number' ? summary.confirmations : 1;
    return outpoint?.toLowerCase() === selectedOutpoint.toLowerCase() &&
      Number.isSafeInteger(amountSats) &&
      amountSats >= minimum &&
      confirmations >= 1
      ? [{ outpoint, amountSats: String(amountSats), confirmations }]
      : [];
  });
  if (inputs.length > 1) throw new Error('Dedicated fixture outpoint is not unique');
  return inputs[0];
}

export async function fundLiveWallet(
  cell: Cell,
  wallet: IWallet,
  env: NodeJS.ProcessEnv,
  checkpoint: Checkpoint
): Promise<Evidence> {
  const timeoutMs = positiveNumber(
    env.POX5_LIVE_TIMEOUT_MS ?? String(defaultPollingTimeoutMs(cell.coin)),
    'Polling timeout'
  );
  if (timeoutMs > 86_400_000) throw new Error('Polling timeout exceeds 24 hours');
  const maxFaucetSats = positiveNumber(env.POX5_LIVE_MAX_FAUCET_SATS ?? '100000000', 'Faucet deposit cap');
  const { btcApi } = liveEndpoints(cell.coin, env);
  const address = await verifiedAddress(wallet, cell);
  await checkpoint({ address, walletId: wallet.id() });
  console.log(`${cell.environment}/${cell.coin}: requesting BTC from its matching Hiro faucet`);
  const signet =
    cell.coin === 'tbtcstxsignet'
      ? new HiroSignetFundingAdapter({ mempoolApi: btcApi, confirmationTimeoutMs: timeoutMs })
      : undefined;
  const txid = signet ? await signet.requestFaucet(address) : await requestHiroBtcFaucet(cell.coin, address);
  await checkpoint({ txid });
  console.log(`${cell.environment}/${cell.coin}: faucet returned ${txid}; waiting for network confirmation`);
  if (signet) await signet.waitForConfirmed(txid);
  const confirmation = await confirmNetworkTx(cell.coin, txid, btcApi, timeoutMs);
  const indexed = await indexedDeposit(wallet, txid, address, timeoutMs);
  if (indexed.amountSats > maxFaucetSats) throw new Error('Faucet deposit exceeded configured satoshi cap');
  return {
    walletId: wallet.id(),
    address,
    txid,
    outpoint: indexed.outpoint,
    amountSats: indexed.amountSats,
    confirmations: Math.min(indexed.confirmations, confirmation.confirmations),
    observedHeight: confirmation.blockHeight,
  };
}

function getCreationWalletId(cell: Cell, report: Readonly<Report>): string {
  const created = report.rows.find(
    (row) =>
      row.environment === cell.environment &&
      row.coin === cell.coin &&
      row.walletType === cell.walletType &&
      row.operation === 'walletCreation'
  );
  if (created?.status !== 'PASS' || created.evidence.provisioning !== 'CREATED' || !created.evidence.walletId) {
    throw new MatrixPrerequisite('BLOCKED', 'Fresh wallet creation did not complete for this cell');
  }
  return created.evidence.walletId;
}

export function createLiveHandlers(env: NodeJS.ProcessEnv): Handlers {
  const contexts = new Map<Cell['environment'], Promise<LiveContext>>();
  function contextFor(cell: Cell): Promise<LiveContext> {
    let context = contexts.get(cell.environment);
    if (!context) {
      context = liveContext(cell.environment, cell.coin, env);
      contexts.set(cell.environment, context);
    }
    return context;
  }

  async function confirm(
    cell: Cell,
    txid: string
  ): Promise<{ network: 'bitcoin-regtest' | 'bitcoin-signet'; confirmations: number; blockHeight: number }> {
    const { btcApi } = liveEndpoints(cell.coin, env);
    return confirmNetworkTx(cell.coin, txid, btcApi, limits(env).timeoutMs);
  }

  async function fund(cell: Cell, wallet: IWallet, checkpoint: Checkpoint): Promise<Evidence> {
    return fundLiveWallet(cell, wallet, env, checkpoint);
  }

  async function fixture(
    cell: Cell,
    purpose: 'stake' | 'standalone',
    checkpoint: Checkpoint,
    allowCreate: boolean
  ): Promise<{ context: LiveContext; wallet: IWallet }> {
    const context = await contextFor(cell);
    const { wallet } = await dedicatedMainWallet(
      cell,
      context,
      dedicatedLabel(cell, purpose),
      false,
      checkpoint,
      allowCreate
    );
    return { context, wallet };
  }

  function fixtureSetting(cell: Cell, key: string): string | undefined {
    return env[
      `POX5_LIVE_${key}_${cell.environment.toUpperCase()}_${cell.coin.toUpperCase()}_${cell.walletType.toUpperCase()}`
    ];
  }

  function descriptorIndex(cell: Cell, purpose: string): number {
    const value = fixtureSetting(cell, purpose);
    if (value === undefined && purpose === 'PAIRED_DESCRIPTOR_INDEX') return 0;
    if (value === undefined) throw new MatrixPrerequisite('NOT_READY', 'Fixture descriptor index is not configured');
    return parseNonNegativeInteger(value, 'Fixture descriptor index');
  }

  function materials(cell: Cell, walletPassphrase: string | undefined) {
    const secret = liveRecoverySeed(cell.environment, walletPassphrase, env);
    return derivePox5FakeStakeMaterials(secret, cell.environment, cell.coin, networkForCoin(cell.coin));
  }

  function standaloneBase(
    cell: Cell,
    context: LiveContext,
    wallet: IWallet,
    descriptorWalletId: string,
    checkpoint: Checkpoint,
    maxAmountSats: number
  ) {
    if (!context.walletPassphrase)
      throw new MatrixPrerequisite('BLOCKED', 'Standalone hot passphrase is not configured');
    const recovery = materials(cell, context.walletPassphrase);
    const feeRate = positiveNumber(env.POX5_LIVE_FEE_RATE, 'Fee rate');
    if (feeRate > 10_000) throw new Error('Fee rate exceeds the live safety cap');
    return {
      bitgo: context.bitgo,
      mainWallet: wallet,
      coinName: cell.coin,
      network: networkForCoin(cell.coin),
      walletType: cell.walletType,
      walletPassphrase: context.walletPassphrase,
      enterpriseId: context.enterprise,
      mainWalletId: wallet.id(),
      mainWalletLabel: dedicatedLabel(cell, 'standalone'),
      descriptorWalletId,
      descriptorWalletLabel: `${dedicatedLabel(cell, 'standalone')}-descriptor`,
      stakerCommitment: createHash('sha256').update(recovery.principalPreimage).digest(),
      earlyExitKey: Buffer.from(recovery.earlyExitKey.publicKey),
      maxAmountSats: String(maxAmountSats),
      maxFeeSats: String(limits(env).maxFeeSats),
      feeRate,
      confirmTransaction: async (txid: string) => confirm(cell, txid),
      checkpoint,
    };
  }

  function pairedArgs(
    cell: Cell,
    row: Readonly<Row>,
    checkpoint: Checkpoint,
    context: LiveContext,
    wallet: IWallet
  ): PairedBaseArgs {
    if (!row.requestId) throw new Error('Durable request ID is missing');
    const { btcApi } = liveEndpoints(cell.coin, env);
    return {
      cell,
      env,
      bitgo: context.bitgo,
      mainWallet: wallet,
      mainWalletId: wallet.id(),
      enterpriseId: context.enterprise,
      actorId: context.userId,
      requestId: row.requestId,
      maxFeeSats: String(limits(env).maxFeeSats),
      readiness: async () => (await verifiedLiveTip(cell.coin, btcApi)) > 0,
      getTip: async () => verifiedLiveTip(cell.coin, btcApi),
      confirm: async (txid) => ({ txid, ...(await confirm(cell, txid)) }),
      indexed: async (walletId, txid, address) => {
        const indexedWallet = await context.bitgo.coin(cell.coin).wallets().get({ id: walletId });
        if (indexedWallet.coin() !== cell.coin || indexedWallet.toJSON().enterprise !== context.enterprise) {
          throw new Error('Indexed wallet is outside the selected cell enterprise');
        }
        const output = await indexedDeposit(indexedWallet, txid, address, limits(env).timeoutMs);
        return { ...output, address, amountSats: String(output.amountSats) };
      },
      checkpoint,
    };
  }

  return {
    async walletCreation(cell, _row, checkpoint, report) {
      const context = await contextFor(cell);
      const label = dedicatedLabel(cell, 'create', report.runId);
      const { wallet } = await dedicatedMainWallet(cell, context, label, true, checkpoint);
      return { walletId: wallet.id(), provisioning: 'CREATED', label };
    },
    async faucetFunding(cell, _row, checkpoint, report) {
      const context = await contextFor(cell);
      const id = getCreationWalletId(cell, report);
      const wallet = await context.bitgo.coin(cell.coin).wallets().get({ id });
      if (wallet.toJSON().enterprise !== context.enterprise || wallet.coin() !== cell.coin) {
        throw new Error('New wallet ownership changed before faucet funding');
      }
      return fund(cell, wallet, checkpoint);
    },
    async pairedStake(cell, row, checkpoint) {
      const cap = limits(env);
      const context = await contextFor(cell);
      const bond = await resolveProtocolBond(cell.coin, env);
      const recovery = materials(cell, context.walletPassphrase);
      const index = descriptorIndex(cell, 'PAIRED_DESCRIPTOR_INDEX');
      const approver = cell.walletType === 'custodial' ? await liveApprover(cell.environment, context, env) : undefined;
      const { wallet } = await fixture(cell, 'stake', checkpoint, true);
      const minimum = cap.amountSats + cap.maxFeeSats;
      const selected = await fundingOutpoint(
        fixtureSetting(cell, 'PAIRED_INPUT_OUTPOINT'),
        wallet,
        minimum,
        checkpoint,
        () => fund(cell, wallet, checkpoint)
      );
      const input = await confirmedInput(wallet, minimum, selected);
      if (!input)
        throw new MatrixPrerequisite('NOT_READY', 'Dedicated staking wallet lacks a confirmed spendable input');
      await checkpoint({ outpoint: input.outpoint, amountSats: cap.amountSats });
      await checkpoint({
        observedHeight: bond.observedHeight,
        unlockHeight: bond.unlockHeight,
        bondIndex: bond.bondIndex,
        bondSource: bond.bondSource === 'configured' ? 'CONFIGURED' : 'DISCOVERED',
      });
      if (approver && env[`POX5_LIVE_APPROVER_BITGO_ADMIN_${cell.environment.toUpperCase()}`] !== 'true') {
        await ensureEnterpriseApproverMembership(cell, context, approver, checkpoint);
        await ensureCustodialApproverWalletAccess(cell, wallet, context.userId, approver, checkpoint);
      }
      return pairedStake({
        ...pairedArgs(cell, row, checkpoint, context, wallet),
        input,
        amountSats: String(cap.amountSats),
        maxStakeSats: String(cap.maxAmountSats),
        protocolMinimumUnlockHeight: bond.unlockHeight,
        unlockHeight: bond.unlockHeight,
        descriptorIndex: index,
        principalPreimage: recovery.principalPreimage,
        earlyExitKey: recovery.earlyExitKey.publicKey,
        walletPassphrase: context.walletPassphrase,
        ...(approver
          ? {
              approver: { bitgo: approver.bitgo, actorId: approver.userId, otp: approver.otp },
              checkpointApproval: async (approval: { id: string; txid?: string }) =>
                checkpoint({ pendingApprovalId: approval.id, ...(approval.txid ? { txid: approval.txid } : {}) }),
            }
          : {}),
      });
    },
    async pairedPostCltvRecovery(cell, row, checkpoint) {
      const { context, wallet } = await fixture(cell, 'stake', checkpoint, false);
      const approver = cell.walletType === 'custodial' ? await liveApprover(cell.environment, context, env) : undefined;
      if (approver && env[`POX5_LIVE_APPROVER_BITGO_ADMIN_${cell.environment.toUpperCase()}`] !== 'true') {
        await ensureEnterpriseApproverMembership(cell, context, approver, checkpoint);
        await ensureCustodialApproverWalletAccess(cell, wallet, context.userId, approver, checkpoint);
      }
      const pairedWalletId = getPox5WalletSpecific(wallet)?.pairedWalletId;
      if (typeof pairedWalletId !== 'string') {
        throw new MatrixPrerequisite('NOT_READY', 'Dedicated main wallet has no paired staking wallet');
      }
      const outpoint = fixtureSetting(cell, 'PAIRED_RECOVERY_OUTPOINT');
      if (!outpoint) throw new MatrixPrerequisite('NOT_READY', 'No pre-existing paired lockup outpoint is configured');
      const pairedWallet = await context.bitgo.coin(cell.coin).wallets().get({ id: pairedWalletId });
      const unspents = responseUnspents(await pairedWallet.unspents({ limit: 100, minConfirms: 1 }));
      const matching = unspents.filter((unspent) => outpointFromUnspent(unspent) === outpoint);
      if (matching.length !== 1)
        throw new MatrixPrerequisite('NOT_READY', 'Configured paired lockup is not uniquely confirmed');
      const summary = summarizeUnspent(matching[0]);
      const indexedConfirmations = typeof summary.confirmations === 'number' ? summary.confirmations : 1;
      if (typeof summary.amountSats !== 'string' || indexedConfirmations < 1) {
        throw new MatrixPrerequisite('NOT_READY', 'Configured paired lockup lacks indexed amount or confirmations');
      }
      const lockupAddress = summary.address;
      if (typeof lockupAddress !== 'string') {
        throw new MatrixPrerequisite('NOT_READY', 'Confirmed paired lockup has no indexed descriptor address');
      }
      const addressDetails: unknown = await pairedWallet.getAddress({ address: lockupAddress });
      if (
        !addressDetails ||
        typeof addressDetails !== 'object' ||
        !('index' in addressDetails) ||
        !('coinSpecific' in addressDetails) ||
        !addressDetails.coinSpecific ||
        typeof addressDetails.coinSpecific !== 'object' ||
        !('descriptorName' in addressDetails.coinSpecific)
      ) {
        throw new Error('Paired lockup address lookup differs from its indexed descriptor metadata');
      }
      const index = typeof matching[0].index === 'number' ? matching[0].index : addressDetails.index;
      if (typeof index !== 'number' || !Number.isSafeInteger(index) || index < 0 || index >= 0x80000000) {
        throw new MatrixPrerequisite('NOT_READY', 'Confirmed paired lockup has no valid descriptor index');
      }
      if (
        addressDetails.index !== index ||
        (typeof matching[0].index === 'number' && matching[0].index !== addressDetails.index) ||
        (typeof matching[0].descriptorName === 'string' &&
          addressDetails.coinSpecific.descriptorName !== matching[0].descriptorName)
      ) {
        throw new Error('Paired lockup address lookup differs from its indexed descriptor metadata');
      }
      if (typeof addressDetails.coinSpecific.descriptorName !== 'string') {
        throw new MatrixPrerequisite('NOT_READY', 'Paired lockup address has no descriptor name');
      }
      const configuredIndex = fixtureSetting(cell, 'PAIRED_RECOVERY_DESCRIPTOR_INDEX');
      if (
        configuredIndex !== undefined &&
        parseNonNegativeInteger(configuredIndex, 'Recovery descriptor index') !== index
      ) {
        throw new Error('Configured recovery descriptor index differs from the indexed lockup');
      }
      // The paired wallet carries one descriptor per unlock height, so a wallet reused
      // across bonds has several. Without a pinned unlock height the wallet must have
      // exactly one descriptor; with one pinned, it must match exactly one descriptor.
      const configuredUnlockHeight = fixtureSetting(cell, 'PAIRED_RECOVERY_UNLOCK_HEIGHT');
      const unlockHeight =
        configuredUnlockHeight !== undefined
          ? parseNonNegativeInteger(configuredUnlockHeight, 'Recovery unlock height')
          : undefined;
      const unlocks = descriptorDetails(pairedWallet).map((item) => item.unlockHeight);
      const candidates = unlockHeight !== undefined ? unlocks.filter((height) => height === unlockHeight) : unlocks;
      if (candidates.length !== 1) throw new MatrixPrerequisite('NOT_READY', 'Paired lockup descriptor is not unique');
      const tip = await verifiedLiveTip(cell.coin, liveEndpoints(cell.coin, env).btcApi);
      if (tip < candidates[0])
        throw new MatrixPrerequisite('NOT_READY', 'Pre-existing lockup has not reached its descriptor CLTV height');
      const recoveryAddress = await verifiedAddress(wallet, cell);
      await checkpoint({ address: recoveryAddress, pairedWalletId, outpoint, unlockHeight: candidates[0] });
      const maxRecoverySats = positiveNumber(env.POX5_LIVE_MAX_RECOVERY_SATS, 'Recovery cap');
      return pairedRecovery({
        ...pairedArgs(cell, row, checkpoint, context, wallet),
        pairedWalletId,
        fixture: {
          outpoint,
          amountSats: summary.amountSats,
          confirmations: indexedConfirmations,
          descriptorIndex: index,
          unlockHeight: candidates[0],
        },
        recoveryAddress,
        maxRecoverySats: String(maxRecoverySats),
        walletPassphrase: context.walletPassphrase,
        ...(approver
          ? {
              approver: { bitgo: approver.bitgo, actorId: approver.userId, otp: approver.otp },
              checkpointApproval: async (approval: { id: string; txid?: string }) =>
                checkpoint({ pendingApprovalId: approval.id, ...(approval.txid ? { txid: approval.txid } : {}) }),
            }
          : {}),
      });
    },
    async standaloneStake(cell, _row, checkpoint) {
      if (cell.walletType === 'custodial') {
        throw new MatrixPrerequisite(
          'UNSUPPORTED',
          'Standalone descriptor signing is not supported for custodial wallets'
        );
      }
      const cap = limits(env);
      const maxFaucetSats = positiveNumber(env.POX5_LIVE_MAX_FAUCET_SATS, 'Faucet deposit cap');
      await contextFor(cell);
      const bond = await resolveProtocolBond(cell.coin, env);
      const { context, wallet } = await fixture(cell, 'standalone', checkpoint, true);
      const minimum = cap.amountSats + cap.maxFeeSats;
      const selected = await fundingOutpoint(
        fixtureSetting(cell, 'STANDALONE_INPUT_OUTPOINT'),
        wallet,
        minimum,
        checkpoint,
        () => fund(cell, wallet, checkpoint)
      );
      const input = await confirmedInput(wallet, minimum, selected);
      if (!input) throw new MatrixPrerequisite('NOT_READY', 'Standalone wallet lacks a confirmed spendable input');
      const base = standaloneBase(cell, context, wallet, '', checkpoint, maxFaucetSats);
      const resolved = await resolveStandaloneDescriptorWallet({
        bitgo: context.bitgo,
        mainWallet: wallet,
        coinName: cell.coin,
        network: base.network,
        walletType: cell.walletType,
        walletPassphrase: base.walletPassphrase,
        enterpriseId: context.enterprise,
        mainWalletId: wallet.id(),
        mainWalletLabel: base.mainWalletLabel,
        descriptorWalletId: fixtureSetting(cell, 'STANDALONE_DESCRIPTOR_WALLET_ID'),
        descriptorWalletLabel: base.descriptorWalletLabel,
        stakerCommitment: base.stakerCommitment,
        earlyExitKey: base.earlyExitKey,
        protocolMinimumUnlockHeight: bond.unlockHeight,
        unlockHeight: bond.unlockHeight,
        checkpoint,
        checkpointDescriptorIntent: async (intent) =>
          checkpoint({
            descriptorLabel: intent.label,
            walletId: intent.mainWalletId,
            unlockHeight: intent.unlockHeight,
          }),
      });
      assertProtocolUnlock(
        bond.observedHeight,
        resolved.unlockHeight,
        positiveNumber(env.POX5_LIVE_MAX_LOCK_BLOCKS, 'Lock duration cap')
      );
      await checkpoint({
        outpoint: input.outpoint,
        descriptorWalletId: resolved.descriptorWalletId,
        unlockHeight: resolved.unlockHeight,
      });
      return standaloneStake({
        ...base,
        descriptorWalletId: resolved.descriptorWalletId,
        inputOutpoint: input.outpoint,
        amountSats: String(cap.amountSats),
        unlockHeight: resolved.unlockHeight,
      });
    },
    async standalonePostCltvRecovery(cell, _row, checkpoint) {
      if (cell.walletType === 'custodial') {
        throw new MatrixPrerequisite(
          'UNSUPPORTED',
          'Standalone descriptor signing is not supported for custodial wallets'
        );
      }
      const descriptorWalletId = fixtureSetting(cell, 'STANDALONE_DESCRIPTOR_WALLET_ID');
      const outpoint = fixtureSetting(cell, 'STANDALONE_RECOVERY_OUTPOINT');
      const height = fixtureSetting(cell, 'STANDALONE_RECOVERY_UNLOCK_HEIGHT');
      if (!descriptorWalletId || !outpoint || height === undefined) {
        throw new MatrixPrerequisite('NOT_READY', 'Pre-existing standalone descriptor lockup is not configured');
      }
      const unlockHeight = parseNonNegativeInteger(height, 'Recovery unlock height');
      const tip = await verifiedLiveTip(cell.coin, liveEndpoints(cell.coin, env).btcApi);
      if (unlockHeight > tip)
        throw new MatrixPrerequisite('NOT_READY', 'Pre-existing descriptor lockup is not yet mature');
      const { context, wallet } = await fixture(cell, 'standalone', checkpoint, false);
      const maxRecoverySats = positiveNumber(env.POX5_LIVE_MAX_RECOVERY_SATS, 'Recovery cap');
      const base = standaloneBase(cell, context, wallet, descriptorWalletId, checkpoint, maxRecoverySats);
      await checkpoint({ descriptorWalletId, outpoint, unlockHeight, observedHeight: tip });
      return standaloneRecovery({ ...base, outpoint, unlockHeight });
    },
  };
}
