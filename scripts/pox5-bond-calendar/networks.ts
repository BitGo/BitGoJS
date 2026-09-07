export interface Anchor {
  height: number;
  isoDate: string;
}

export type AnchorProvider = 'blockstream' | 'hiro';

export interface NetworkConfig {
  coin: string;
  burnChain: string;
  stacksOnly: boolean;
  activationBurnHeight: number | null;
  rewardCycleBlocks: number | null;
  preparePhaseBlocks: number | null;
  avgBlockSeconds: number | null;
  anchor: Anchor | null;
  liveProvider: AnchorProvider | null;
  liveBaseUrl: string | null;
  sources: string[];
}

// SIP-045 section 3.1.2 "Bonding Periods and Timing" (Bitcoin-block units):
// bonding period 25,200 blocks (~6 months); reward distribution every 1,050 blocks
// (~1 week, 24 per period); signer cycle 2,100 blocks (~14 days); a new bonding
// period opens every 4,200 blocks; the L1 timelock expires 1,050 blocks before the
// bonding period ends (renewal window).
export const SIP045_BONDING_PERIOD_BLOCKS = 25_200;
export const SIP045_DISTRIBUTION_INTERVAL_BLOCKS = 1_050;
export const SIP045_SIGNER_CYCLE_BLOCKS = 2_100;
export const SIP045_PERIOD_SPACING_BLOCKS = 4_200;
export const SIP045_RELOCK_WINDOW_BLOCKS = 1_050;

// stacks-core stackslib/src/core/mod.rs: POX_REWARD_CYCLE_LENGTH = 2100, POX_PREPARE_WINDOW_LENGTH = 100.
const MAINNET_REWARD_CYCLE_BLOCKS = 2_100;
const MAINNET_PREPARE_BLOCKS = 100;
// stacks-core stackslib/src/burnchains/mod.rs nakamoto_testnet_default(): reward cycle 900, prepare 100.
const NAKAMOTO_TESTNET_REWARD_CYCLE_BLOCKS = 900;
const NAKAMOTO_TESTNET_PREPARE_BLOCKS = 100;
// stacks-core stackslib/src/burnchains/mod.rs signet_default(): "PoX defaults for the isolated
// local Signet integration network" — reward cycle 10, prepare 3. Applied to every network whose
// burn chain is a Bitcoin signet, because PoxConstants are selected by (chain, network) in
// stacks-core stackslib/src/burnchains/burnchain.rs ("bitcoin", "signet") => signet_default().
const SIGNET_REWARD_CYCLE_BLOCKS = 10;
const SIGNET_PREPARE_BLOCKS = 3;

const HIRO_TESTNET_BASE_URL = 'https://api.testnet.hiro.so';
const BLOCKSTREAM_MAINNET_BASE_URL = 'https://blockstream.info';

export const NETWORKS: Record<string, NetworkConfig> = {
  btc: {
    coin: 'btc',
    burnChain: 'bitcoin-mainnet',
    stacksOnly: false,
    // stacks-core stacks-common/src/types/mod.rs:193 BITCOIN_MAINNET_STACKS_40_BURN_HEIGHT = 960230
    // (Epoch 4.0 / pox-5 activation); also stated in Linear WAL-2149.
    activationBurnHeight: 960_230,
    rewardCycleBlocks: MAINNET_REWARD_CYCLE_BLOCKS,
    preparePhaseBlocks: MAINNET_PREPARE_BLOCKS,
    avgBlockSeconds: 600,
    anchor: {
      // Verified via blockstream.info/api/block-height/960230 on 2026-10-14.
      height: 960_230,
      isoDate: '2026-07-30T08:32:18Z',
    },
    liveProvider: 'blockstream',
    liveBaseUrl: BLOCKSTREAM_MAINNET_BASE_URL,
    sources: [
      'SIP-045 section 3.1.2 (bond timing)',
      'stacks-core stacks-common/src/types/mod.rs BITCOIN_MAINNET_STACKS_40_BURN_HEIGHT',
      'stacks-core stackslib/src/core/mod.rs POX_REWARD_CYCLE_LENGTH / POX_PREPARE_WINDOW_LENGTH',
      'Linear WAL-2149 (pox-5 activated at burn height 960230)',
      'blockstream.info block 960230 timestamp (verified 2026-10-14)',
    ],
  },
  tbtcstx: {
    coin: 'tbtcstx',
    burnChain: 'stacks-public-testnet',
    stacksOnly: false,
    // Linear SI-1143 public testnet report: "Epoch40/PoX-5 active since burn height 2702"
    // on api.testnet.hiro.so.
    activationBurnHeight: 2_702,
    rewardCycleBlocks: NAKAMOTO_TESTNET_REWARD_CYCLE_BLOCKS,
    preparePhaseBlocks: NAKAMOTO_TESTNET_PREPARE_BLOCKS,
    // Hiro /extended/v1/info/network_block_times: testnet target_block_time = 120.
    avgBlockSeconds: 120,
    anchor: {
      // Hiro api.testnet.hiro.so /extended/v1/block/by_burn_block_height/27300 (fetched 2026-10-14).
      height: 27_300,
      isoDate: '2026-10-14T12:03:27Z',
    },
    liveProvider: 'hiro',
    liveBaseUrl: HIRO_TESTNET_BASE_URL,
    sources: [
      'SIP-045 section 3.1.2 (bond timing)',
      'stacks-core stackslib/src/burnchains/mod.rs nakamoto_testnet_default()',
      'Linear SI-1143 (testnet pox-5 activation height 2702)',
      'Hiro api.testnet.hiro.so network_block_times + burn block 27300 (fetched 2026-10-14)',
    ],
  },
  tstx: {
    coin: 'tstx',
    burnChain: 'stacks-public-testnet',
    stacksOnly: true,
    activationBurnHeight: 2_702,
    rewardCycleBlocks: NAKAMOTO_TESTNET_REWARD_CYCLE_BLOCKS,
    preparePhaseBlocks: NAKAMOTO_TESTNET_PREPARE_BLOCKS,
    avgBlockSeconds: 120,
    anchor: {
      height: 27_300,
      isoDate: '2026-10-14T12:03:27Z',
    },
    liveProvider: 'hiro',
    liveBaseUrl: HIRO_TESTNET_BASE_URL,
    sources: [
      'SIP-045 section 3.1.2 (bond timing)',
      'stacks-core stackslib/src/burnchains/mod.rs nakamoto_testnet_default()',
      'Linear SI-1143 (testnet pox-5 activation height 2702)',
      'Hiro api.testnet.hiro.so network_block_times + burn block 27300 (fetched 2026-10-14)',
    ],
  },
  tbtcstxsignet: {
    coin: 'tbtcstxsignet',
    burnChain: 'bitgo-private-signet',
    stacksOnly: false,
    // BitGo private signet chains are spun up fresh and patched for PoX-5, so the tool
    // assumes pox-5 is active from chain start; override with --activation if the chain
    // activated later. No published anchor: provide --anchor or --live.
    activationBurnHeight: 0,
    rewardCycleBlocks: SIGNET_REWARD_CYCLE_BLOCKS,
    preparePhaseBlocks: SIGNET_PREPARE_BLOCKS,
    // Observed 2026-10-15 on the post-reset staking signet: a steady 120s mining cadence
    // (15 consecutive blocks exactly 120s apart; 39-block average 120.0s). Valid only
    // until the first 2016-block difficulty adjustment (around height 2016), after which
    // Bitcoin retargeting should pull the cadence toward the 600 s nominal target (the
    // pre-reset chain averaged ~600 s). Far-future dates drift accordingly; still
    // override via --anchor/--live for real planning.
    avgBlockSeconds: 120,
    anchor: null,
    liveProvider: null,
    liveBaseUrl: null,
    sources: [
      'SIP-045 section 3.1.2 (bond timing)',
      'stacks-core stackslib/src/burnchains/burnchain.rs ("bitcoin","signet") => signet_default()',
      'stacks-core stackslib/src/burnchains/mod.rs signet_default() (reward 10 / prepare 3)',
    ],
  },
  tbtcbgsig: {
    coin: 'tbtcbgsig',
    burnChain: 'bitgo-private-signet',
    stacksOnly: false,
    // BitGo private signet (bitcoinBitGoSignet), the only coin the wallet-platform PoX-5
    // integration targets (packages/wallet-platform/app/base/utxo/staking/pox5/README.md).
    // Assumed pox-5-active from chain start; override with --activation if it activated
    // later. No published anchor: provide --anchor or --live.
    activationBurnHeight: 0,
    rewardCycleBlocks: SIGNET_REWARD_CYCLE_BLOCKS,
    preparePhaseBlocks: SIGNET_PREPARE_BLOCKS,
    avgBlockSeconds: 600,
    anchor: null,
    liveProvider: null,
    liveBaseUrl: null,
    sources: [
      'SIP-045 section 3.1.2 (bond timing)',
      'stacks-core stackslib/src/burnchains/burnchain.rs ("bitcoin","signet") => signet_default()',
      'stacks-core stackslib/src/burnchains/mod.rs signet_default() (reward 10 / prepare 3)',
      'bitgo-microservices wallet-platform app/base/utxo/staking/pox5/README.md',
    ],
  },
  tstxsignet: {
    coin: 'tstxsignet',
    burnChain: 'stacks-foundation-private-signet',
    // Stacks Foundation "staking-testnet": a PoX-5 testnet on a private Bitcoin signet,
    // Stacks chain ID 1280 (bitgo-workspace modules/statics/src/networks.ts StxSignet).
    stacksOnly: true,
    // Assumed pox-5-active from chain start; override with --activation if it activated later.
    activationBurnHeight: 0,
    rewardCycleBlocks: SIGNET_REWARD_CYCLE_BLOCKS,
    preparePhaseBlocks: SIGNET_PREPARE_BLOCKS,
    avgBlockSeconds: 600,
    anchor: null,
    liveProvider: null,
    liveBaseUrl: null,
    sources: [
      'SIP-045 section 3.1.2 (bond timing)',
      'stacks-core stackslib/src/burnchains/burnchain.rs ("bitcoin","signet") => signet_default()',
      'stacks-core stackslib/src/burnchains/mod.rs signet_default() (reward 10 / prepare 3)',
      'bitgo-workspace modules/statics/src/networks.ts StxSignet (chain ID 1280)',
    ],
  },
};

export const NETWORK_NAMES = Object.keys(NETWORKS);

export function getNetwork(coin: string): NetworkConfig {
  const net = NETWORKS[coin];
  if (!net) {
    throw new Error(`unknown network "${coin}"; valid networks: ${NETWORK_NAMES.join(', ')}`);
  }
  return net;
}
