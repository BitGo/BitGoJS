import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { parseNonNegativeInteger, parsePositiveSats } from './bitgo-api';
import { type BondContext, openAllowlistedBonds, scanBondWindow } from './bond-discovery';
import { HIRO_SIGNET_CHECKPOINT_HASH, HIRO_SIGNET_CONFIRMATION_TIMEOUT_MS } from './funding';
import { Coin, MatrixPrerequisite } from './live-matrix';
import { createStacksNetwork, loadStacksBitcoinStaking } from './stacks-js';

export const liveNetworks: Record<Coin, { stacksUrl: string; btcApi: string; chainId: number }> = {
  tbtcstx: {
    stacksUrl: 'https://api.testnet.hiro.so',
    btcApi: 'https://mempool.bitcoin.regtest.hiro.so/api',
    chainId: 0x80000000,
  },
  tbtcstxprivate1: {
    stacksUrl: 'https://api.private-1.hiro.so',
    btcApi: 'https://mempool.bitcoin.private-1.hiro.so/api',
    chainId: 0x100,
  },
  tbtcstxsignet: {
    stacksUrl: 'https://api.staking-testnet.hiro.so',
    btcApi: 'https://mempool.bitcoin.staking-testnet.hiro.so/api',
    chainId: 1280,
  },
};

function endpoint(value: string, expected: string, name: string): string {
  const actual = new URL(value);
  const approved = new URL(expected);
  if (
    actual.protocol !== 'https:' ||
    actual.origin !== approved.origin ||
    !actual.pathname.startsWith(approved.pathname)
  ) {
    throw new Error(`${name} must use the approved network-matched HTTPS endpoint`);
  }
  return actual.toString().replace(/\/$/, '');
}

export function liveEndpoints(coin: Coin, env: NodeJS.ProcessEnv = process.env): { stacksUrl: string; btcApi: string } {
  const suffix = coin.toUpperCase();
  const defaults = liveNetworks[coin];
  return {
    stacksUrl: endpoint(env[`POX5_LIVE_STACKS_URL_${suffix}`] ?? defaults.stacksUrl, defaults.stacksUrl, 'Stacks URL'),
    btcApi: endpoint(env[`POX5_LIVE_BTC_API_${suffix}`] ?? defaults.btcApi, defaults.btcApi, 'Bitcoin API'),
  };
}

// Default for POX5_LIVE_TIMEOUT_MS when unset. The staking signet has produced ~120 s
// blocks since the 2026-10 chain reset (measured 2026-10-15); that pace holds only until
// the first 2016-block difficulty adjustment, so the default covers both it and the
// ~600 s steady state.
export function defaultPollingTimeoutMs(coin: Coin): number {
  return coin === 'tbtcstxsignet' ? HIRO_SIGNET_CONFIRMATION_TIMEOUT_MS : 1_200_000;
}

export async function verifiedLiveTip(coin: Coin, btcApi: string, fetcher: typeof fetch = fetch): Promise<number> {
  endpoint(btcApi, liveNetworks[coin].btcApi, 'Bitcoin API');
  if (coin === 'tbtcstxsignet') {
    const checkpoint = await fetcher(`${btcApi}/block-height/100`, { signal: AbortSignal.timeout(15_000) });
    if (!checkpoint.ok || (await checkpoint.text()).trim().toLowerCase() !== HIRO_SIGNET_CHECKPOINT_HASH) {
      throw new Error('Selected explorer is not on the independent Hiro staking signet chain');
    }
  }
  const response = await fetcher(`${btcApi}/blocks/tip/height`, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error('BTC tip endpoint unavailable');
  const text = (await response.text()).trim();
  const height = parseNonNegativeInteger(text, 'BTC tip');
  if (height === 0) throw new Error('BTC tip is implausible');
  return height;
}

export async function confirmNetworkTx(
  coin: Coin,
  txid: string,
  btcApi: string,
  timeoutMs: number,
  fetcher: typeof fetch = fetch
): Promise<{ network: 'bitcoin-regtest' | 'bitcoin-signet'; confirmations: number; blockHeight: number }> {
  endpoint(btcApi, liveNetworks[coin].btcApi, 'Bitcoin API');
  if (!/^[0-9a-f]{64}$/i.test(txid) || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 86_400_000) {
    throw new Error('Invalid transaction ID or confirmation timeout');
  }
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetcher(`${btcApi}/tx/${txid}`, { signal: AbortSignal.timeout(15_000) });
    if (response.ok) {
      const value: unknown = await response.json();
      if (!value || typeof value !== 'object' || !('txid' in value) || value.txid !== txid || !('status' in value)) {
        throw new Error('Bitcoin transaction response did not match the requested txid');
      }
      const status = value.status;
      if (!status || typeof status !== 'object' || !('confirmed' in status) || typeof status.confirmed !== 'boolean') {
        throw new Error('Bitcoin transaction response has no valid confirmation state');
      }
      if (status.confirmed) {
        if (
          !('block_height' in status) ||
          typeof status.block_height !== 'number' ||
          !Number.isSafeInteger(status.block_height) ||
          !('block_hash' in status) ||
          typeof status.block_hash !== 'string' ||
          !/^[0-9a-f]{64}$/i.test(status.block_hash)
        ) {
          throw new Error('Bitcoin confirmation has no valid block height and hash');
        }
        const canonical = await fetcher(`${btcApi}/block-height/${status.block_height}`, {
          signal: AbortSignal.timeout(15_000),
        });
        if (!canonical.ok || (await canonical.text()).trim().toLowerCase() !== status.block_hash.toLowerCase()) {
          throw new Error('Bitcoin transaction is not in the canonical network block');
        }
        const tip = await verifiedLiveTip(coin, btcApi, fetcher);
        if (tip < status.block_height) throw new Error('Bitcoin chain tip predates transaction block');
        return {
          network: coin === 'tbtcstxsignet' ? 'bitcoin-signet' : 'bitcoin-regtest',
          confirmations: tip - status.block_height + 1,
          blockHeight: status.block_height,
        };
      }
    } else if (response.status !== 404) {
      throw new Error('Bitcoin transaction endpoint unavailable');
    }
    await sleep(Math.min(15_000, Math.max(1, deadline - Date.now())));
  }
  throw new Error('Timed out waiting for network-matched transaction confirmation');
}

export function assertProtocolUnlock(tip: number, unlockHeight: number, maxLockBlocks: number): void {
  if (
    !Number.isSafeInteger(tip) ||
    !Number.isSafeInteger(unlockHeight) ||
    !Number.isSafeInteger(maxLockBlocks) ||
    tip <= 0 ||
    unlockHeight <= tip ||
    unlockHeight >= 500_000_000 ||
    maxLockBlocks <= 0 ||
    unlockHeight - tip > maxLockBlocks
  ) {
    throw new Error('Protocol unlock height or future lock duration failed safety bounds');
  }
}

export function liveStakingAdapter(env: NodeJS.ProcessEnv): ReturnType<typeof loadStacksBitcoinStaking> {
  const root = env.STACKS_JS_ROOT;
  const module =
    env.POX5_STACKS_BITCOIN_STAKING_MODULE ??
    (root ? resolve(root, 'packages/bitcoin-staking/dist/index.js') : '@stacks/bitcoin-staking');
  return loadStacksBitcoinStaking({ stacksJs: { root, module, commit: '' } });
}

/**
 * Used only when no bond index is configured. Picks the single open bond the staker
 * is allowlisted for; any other result is NOT_READY so the operator must choose.
 * The selected bond is re-verified by resolveProtocolBond before use.
 */
async function discoverLiveBondIndex(ctx: BondContext, env: NodeJS.ProcessEnv): Promise<number> {
  const stakerAddress = env.POX5_STACKS_STAKER_ADDRESS;
  const stakeSats = env.POX5_LIVE_STAKE_SATS;
  if (stakerAddress === undefined || stakeSats === undefined) {
    throw new MatrixPrerequisite(
      'NOT_READY',
      'No bond index configured; bond discovery needs POX5_STACKS_STAKER_ADDRESS and POX5_LIVE_STAKE_SATS'
    );
  }
  const amountSats = BigInt(parsePositiveSats(stakeSats, 'Stake amount'));
  const radius = parseNonNegativeInteger(env.POX5_BOND_SCAN_RADIUS ?? '8', 'Bond scan radius');
  const window = await scanBondWindow(ctx, { stakerAddress, amountSats, radius });
  const open = openAllowlistedBonds(window);
  const [first, second] = open;
  if (first !== undefined && second === undefined) return first;
  if (second !== undefined) {
    throw new MatrixPrerequisite(
      'NOT_READY',
      `Multiple open allowlisted bonds (${open.join(', ')}); set POX5_LIVE_BOND_INDEX_<COIN> to choose one`
    );
  }
  const allowlisted = window.candidates
    .filter((candidate) => candidate.allowlisted)
    .map((candidate) => `${candidate.bondIndex}:${candidate.status}`);
  if (allowlisted.length > 0) {
    throw new MatrixPrerequisite(
      'NOT_READY',
      `Staker is allowlisted but no bond is open (${allowlisted.join(', ')}); wait for the next registration window`
    );
  }
  throw new MatrixPrerequisite('NOT_READY', 'No PoX-5 bond in the scan window allowlists the staker for this amount');
}

export async function resolveProtocolBond(
  coin: Coin,
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch = fetch
): Promise<{
  unlockHeight: number;
  observedHeight: number;
  bondIndex: number;
  bondSource: 'configured' | 'discovered';
}> {
  const boundedFetch: typeof fetch = (input, init) =>
    fetcher(input, {
      ...init,
      signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
    });
  const { stacksUrl, btcApi } = liveEndpoints(coin, env);
  const bondValue = env[`POX5_LIVE_BOND_INDEX_${coin.toUpperCase()}`];
  const [infoResponse, poxResponse, observedHeight] = await Promise.all([
    boundedFetch(`${stacksUrl}/v2/info`),
    boundedFetch(`${stacksUrl}/v2/pox`),
    verifiedLiveTip(coin, btcApi, boundedFetch),
  ]);
  if (!infoResponse.ok || !poxResponse.ok) throw new Error('Stacks network or PoX endpoint unavailable');
  const info: unknown = await infoResponse.json();
  const pox: unknown = await poxResponse.json();
  if (
    !info ||
    typeof info !== 'object' ||
    !('network_id' in info) ||
    info.network_id !== liveNetworks[coin].chainId ||
    !('burn_block_height' in info) ||
    typeof info.burn_block_height !== 'number' ||
    !pox ||
    typeof pox !== 'object' ||
    !('reward_cycle_id' in pox)
  ) {
    throw new Error('Stacks chain identity or PoX response did not match selected network');
  }
  if (Math.abs(info.burn_block_height - observedHeight) > 6) {
    throw new MatrixPrerequisite('UNSUPPORTED', 'Stacks burnchain tip does not match the selected Bitcoin network');
  }

  const staking = liveStakingAdapter(env);
  const network = createStacksNetwork({
    stacks: { chainId: liveNetworks[coin].chainId, nodeUrl: stacksUrl },
  });
  const client = { baseUrl: stacksUrl, fetch: boundedFetch };
  const bondIndex =
    bondValue === undefined
      ? await discoverLiveBondIndex({ staking, network, client }, env)
      : parseNonNegativeInteger(bondValue, 'Bond index');
  const bond = await staking.fetchBond({ bondIndex, network, client });
  if (bond === undefined) throw new MatrixPrerequisite('NOT_READY', 'Configured PoX-5 bond is absent');
  if ((await staking.fetchBondStatus({ bondIndex, network, client })) !== 'open') {
    throw new MatrixPrerequisite('NOT_READY', 'Configured PoX-5 bond is not open');
  }
  const rawHeight = await staking.fetchBondL1UnlockHeight({ bondIndex, network, client });
  const unlockHeight = Number(rawHeight);
  const maxLockBlocks = parseNonNegativeInteger(env.POX5_LIVE_MAX_LOCK_BLOCKS, 'Maximum lock duration');
  assertProtocolUnlock(observedHeight, unlockHeight, maxLockBlocks);
  return { unlockHeight, observedHeight, bondIndex, bondSource: bondValue === undefined ? 'discovered' : 'configured' };
}
