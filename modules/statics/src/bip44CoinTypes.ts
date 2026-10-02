import type { CoinFamily } from './base';

/**
 * BIP44 coin types are assigned per coin family: a coin family covers a mainnet chain, its testnet
 * mirror (`btc`/`tbtc`) and every token on it, which all share one coin type by design. Safe child
 * key uniqueness comes from per-(slot, coinType) account allocation, never from coin type uniqueness.
 */
type CoinFamilyName = `${CoinFamily}`;

/**
 * Families with no BIP44 coin type: OFC and fiat are not BIP44-derivable, and `dydx` and `eth2` have no
 * key-holding coins yet. A new family must be added to the table below or to this list, so skipping
 * the decision is a compile error.
 */
type CoinFamilyWithoutCoinType = 'ofc' | 'fiat' | 'dydx' | 'eth2';

/**
 * BitGo's BIP44 coin type per coin family, used as `m/44'/<coinType>'/<slot>'/<account>'`.
 * The values are BitGo's own: some deliberately match SLIP-44 (btc 0, eth 60, ...), but the registry
 * is not binding. Values are unique per family and paths are immutable once keys exist, so never
 * change one. A new coin family takes the next free value above the highest (0x70000000 and up).
 */
export const BIP44_COIN_TYPES: Record<Exclude<CoinFamilyName, CoinFamilyWithoutCoinType>, number> = {
  btc: 0,
  ltc: 2,
  doge: 3,
  dash: 5,
  eth: 60,
  etc: 61,
  atom: 118,
  zec: 133,
  rbtc: 137,
  xrp: 144,
  bch: 145,
  xlm: 148,
  btg: 156,
  eos: 194,
  trx: 195,
  icp: 223,
  bsv: 236,
  algo: 283,
  dot: 354,
  near: 397,
  kavacosmos: 459,
  sol: 501,
  hash: 505,
  cspr: 506,
  flow: 539,
  xdc: 550,
  bld: 564,
  ctc: 583,
  polyx: 595,
  ton: 607,
  apt: 637,
  oas: 685,
  baby: 736,
  sui: 784,
  vet: 818,
  bcha: 899,
  thor: 931,
  polygon: 966,
  lnbtc: 998,
  tao: 1005,
  fantom: 1007,
  coredao: 1116,
  islm: 1348,
  xtz: 1729,
  ada: 1815,
  hyperliquid: 2457,
  hbar: 3030,
  phrs: 3172,
  irys: 3282,
  iota: 4218,
  somi: 5031,
  stx: 5757,
  canton: 6767,
  zeta: 7000,
  bera: 8008,
  kaia: 8217,
  starknet: 9004,
  avaxc: 9005,
  sonic: 10007,
  celo: 52752,
  kaspa: 111111,
  scrolleth: 534352,
  osmo: 10000118,
  sei: 19000118,
  dydxcosmos: 22000118,
  injective: 22000119,
  mon: 268435779,
  abstracteth: 0x70000000,
  apechain: 0x70000001,
  arbeth: 0x70000002,
  arcusdc: 0x70000003,
  asi: 0x70000004,
  avaxp: 0x70000005,
  baseeth: 0x70000006,
  bobaeth: 0x70000007,
  bsc: 0x70000008,
  chiliz: 0x70000009,
  codexeth: 0x7000000a,
  coreum: 0x7000000b,
  cotieth: 0x7000000c,
  cronos: 0x7000000d,
  dogeos: 0x7000000e,
  ethw: 0x7000000f,
  fetchai: 0x70000010,
  flr: 0x70000011,
  flrp: 0x70000012,
  fluenteth: 0x70000013,
  gasevm: 0x70000014,
  h: 0x70000015,
  hbarevm: 0x70000016,
  hemieth: 0x70000017,
  hoodeth: 0x70000018,
  hppeth: 0x70000019,
  hypeevm: 0x7000001a,
  initia: 0x7000001b,
  inketh: 0x7000001c,
  ip: 0x7000001d,
  jovayeth: 0x7000001e,
  katanaeth: 0x7000001f,
  kavaevm: 0x70000020,
  lineaeth: 0x70000021,
  mantle: 0x70000022,
  mantra: 0x70000023,
  megaeth: 0x70000024,
  morph: 0x70000025,
  morpheth: 0x70000026,
  og: 0x70000027,
  okbxlayer: 0x70000028,
  opbnb: 0x70000029,
  opeth: 0x7000002a,
  pearl: 0x7000002b,
  plume: 0x7000002c,
  prividiumeth: 0x7000002d,
  seievm: 0x7000002e,
  sgb: 0x7000002f,
  soneium: 0x70000030,
  stt: 0x70000031,
  susd: 0x70000032,
  tempo: 0x70000033,
  tia: 0x70000034,
  unieth: 0x70000035,
  usdt0: 0x70000036,
  wemix: 0x70000037,
  world: 0x70000038,
  xpl: 0x70000039,
  xtzevm: 0x7000003a,
  zketh: 0x7000003b,
  zksyncera: 0x7000003c,
};

/**
 * The BIP44 coin type of a coin family, or undefined if the family has none (OFC and fiat).
 */
export function getBip44CoinType(family: CoinFamily): number | undefined {
  const coinTypes: Partial<Record<CoinFamilyName, number>> = BIP44_COIN_TYPES;
  return coinTypes[family];
}
