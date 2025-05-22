import 'should';
import {
  BaseNetwork,
  BaseUnit,
  CoinFamily,
  CoinFeature,
  CoinMap,
  coins,
  Erc20Coin,
  EthereumNetwork,
  Networks,
  NetworkType,
  UnderlyingAsset,
  UtxoCoin,
  SuiCoin,
  HederaToken,
  EosCoin,
  SolCoin,
  XrpCoin,
  tokens,
  getFormattedTokens,
  createTokenMapUsingConfigDetails,
  createTokenMapUsingTrimmedConfigDetails,
  createToken,
} from '../../src';
import { utxo } from '../../src/utxo';
import { expectedColdFeatures } from './fixtures/expectedColdFeatures';
import {
  amsTokenConfig,
  amsTokenConfigWithCustomToken,
  incorrectAmsTokenConfig,
  reducedAmsTokenConfig,
  amsTokenWithUnsupportedNetwork,
} from './resources/amsTokenConfig';

interface DuplicateCoinObject {
  name: string;
  network: BaseNetwork;
}

const custodyFeatures: Record<string, { features: CoinFeature[] }> = {
  algo: {
    features: [
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  arbeth: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'arbeth:usdcv2': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  avaxc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  avaxp: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  btc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_EUROPE_APS,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.CUSTODY_BITGO_SISTER_TRUST_ONE,
      CoinFeature.CUSTODY_BITGO_KOREA,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  bch: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.BULK_TRANSACTION,
    ],
  },
  btg: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  cspr: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  coreum: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ada: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.BULK_TRANSACTION] },
  doge: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.BULK_TRANSACTION,
    ],
  },
  dot: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  eos: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  eth: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  etc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
    ],
  },
  hbar: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ltc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.BULK_TRANSACTION,
    ],
  },
  dash: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.BULK_TRANSACTION] },
  matic: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  near: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  weth: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  eigen: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'reth-rocket': { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ach: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  bal: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  bico: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  btt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  bnt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  bond: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  borg: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  cel: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  celr: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  clv: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  cng: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  cream: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  cro: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  cvc: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  cxt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  dent: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  egld: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  elf: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ftt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  glm: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  gno: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  hot: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ht: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  keep: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  kin: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  leo: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  mdx: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  mir: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  nmr: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  nu: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ocean: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ogn: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  omni: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  oxt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  poly: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  qnt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  snt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tel: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  wld: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  yfii: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  yld: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  zil: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  sxp: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  bera: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.CUSTODY_BITGO_GERMANY] },
  tbera: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.CUSTODY_BITGO_GERMANY] },
  'sol:tai': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:pengu': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'bera:bgt': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.CUSTODY_BITGO_GERMANY] },
  'bera:honey': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.CUSTODY_BITGO_GERMANY] },
  injective: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  opeth: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'opeth:op': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  polygon: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.BULK_TRANSACTION,
    ],
  },
  pol: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  xrp: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  rbtc: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  sei: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  sol: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.BULK_TRANSACTION],
  },
  stx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  sui: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ton: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  xlm: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  trx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  usdt: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  usdc: {
    features: [
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  shib: {
    features: [
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  injv2: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  zeta: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tzeta: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  moca: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  wbtc: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tkx: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  mana: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ape: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  blur: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  boba: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  dai: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ens: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  floki: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  gods: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ldo: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  lmwr: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  mpl: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ondo: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  pepe: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.CUSTODY_BITGO_GERMANY] },
  trac: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  truf: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  vega: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  wecan: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ctx: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  xchng: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  mog: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  rndr: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  skale: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  slp: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  smt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  strk: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  rad: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  dgld: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  eurcv: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  euroc: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  mnt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  pyusd: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'eth:spx': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'eth:sky': { features: [CoinFeature.CUSTODY_BITGO_GERMANY] },
  'sol:pyth': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:bonk': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:jup': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:wif': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:render': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.CUSTODY_BITGO_GERMANY] },
  'sol:wen': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:nos': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:spx': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:trump': {
    features: [
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  'sol:melania': {
    features: [
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  'sol:ustry': {
    features: [
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  'sol:eurob': {
    features: [
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  'sol:tesouro': {
    features: [
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  'sol:cetes': {
    features: [
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  'sol:gilts': {
    features: [
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  'sol:muskit': {
    features: [
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  'xlm:ZUSD-GDF6VOEGRWLOZ64PQQGKD2IYWA22RLT37GJKS2EJXZHT2VLAGWLC5TOB': {
    features: [CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  'xlm:VEUR-GDXLSLCOPPHTWOQXLLKSVN4VN3G67WD2ENU7UMVAROEYVJLSPSEWXIZN': {
    features: [CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  'xlm:VCHF-GDXLSLCOPPHTWOQXLLKSVN4VN3G67WD2ENU7UMVAROEYVJLSPSEWXIZN': {
    features: [CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  'xlm:GYEN-GDF6VOEGRWLOZ64PQQGKD2IYWA22RLT37GJKS2EJXZHT2VLAGWLC5TOB': {
    features: [CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  'xlm:AUDD-GDC7X2MXTYSAKUUGAIQ7J7RPEIM7GXSAIWFYWWH4GLNFECQVJJLB2EEU': {
    features: [CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  'arbeth:arb': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:usdc': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'xlm:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN': {
    features: [CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  'polygon:usdc': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:usdt': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'polygon:usdt': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  'sol:goat': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  syrup: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  trufv2: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  vext: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  rly: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  atom: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  dfi: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  grt: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  link: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  sand: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  uni: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tia: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  bsc: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.BULK_TRANSACTION] },
  '1inch': { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  aave: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  alpha: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  amp: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ant: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  audio: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  axs: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  band: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  bat: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  chz: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  comp: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  crv: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ctsi: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  cvx: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  dydx: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  enj: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  fet: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ftm: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  gala: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  imx: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  imxv2: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  inj: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  knc: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  lrc: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  mkr: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  nexo: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  perp: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  snx: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  storj: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  sushi: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  uma: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  yfi: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  zrx: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  omg: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },

  // Test Coins
  talgo: {
    features: [
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  tarbeth: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tavaxc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  tavaxp: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT],
  },
  tbtc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_EUROPE_APS,
      CoinFeature.CUSTODY_BITGO_SISTER_TRUST_ONE,
      CoinFeature.CUSTODY_BITGO_KOREA,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.STAKING,
    ],
  },
  tbtcsig: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_EUROPE_APS,
      CoinFeature.CUSTODY_BITGO_SISTER_TRUST_ONE,
      CoinFeature.CUSTODY_BITGO_KOREA,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  tbtc4: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SISTER_TRUST_ONE,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.STAKING,
    ],
  },
  tbtcbgsig: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_EUROPE_APS,
      CoinFeature.CUSTODY_BITGO_SISTER_TRUST_ONE,
      CoinFeature.CUSTODY_BITGO_KOREA,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
    ],
  },
  tbch: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.BULK_TRANSACTION,
    ],
  },
  tbtg: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tcspr: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  tcoreum: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tada: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.BULK_TRANSACTION] },
  tdoge: {
    features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.BULK_TRANSACTION],
  },
  tdot: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  teos: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  gteth: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  hteth: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.BULK_TRANSACTION,
    ],
  },
  tetc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  thbar: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tltc: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.BULK_TRANSACTION,
    ],
  },
  tmatic: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  tnear: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tweth: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  tinjective: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND] },
  topeth: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tpolygon: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  txrp: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
    ],
  },
  trbtc: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tsei: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tsol: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.BULK_TRANSACTION,
    ],
  },
  tstx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tsui: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  txlm: {
    features: [
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  ttrx: { features: [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  ttia: { features: [CoinFeature.CUSTODY_BITGO_SWITZERLAND, CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tatom: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tton: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT] },
  tbsc: { features: [CoinFeature.CUSTODY_BITGO_FRANKFURT, CoinFeature.BULK_TRANSACTION] },
};

const coinsWithExcludedFeatures: Record<string, { features: CoinFeature[] }> = {
  'eth:deuro': {
    features: [
      CoinFeature.ACCOUNT_MODEL,
      CoinFeature.REQUIRES_BIG_NUMBER,
      CoinFeature.VALUELESS_TRANSFER,
      CoinFeature.TRANSACTION_DATA,
      CoinFeature.CUSTODY,
      CoinFeature.CUSTODY_BITGO_TRUST,
      CoinFeature.CUSTODY_BITGO_KOREA,
      CoinFeature.CUSTODY_BITGO_EUROPE_APS,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  'eth:usdf': {
    features: [
      CoinFeature.ACCOUNT_MODEL,
      CoinFeature.REQUIRES_BIG_NUMBER,
      CoinFeature.VALUELESS_TRANSFER,
      CoinFeature.TRANSACTION_DATA,
      CoinFeature.CUSTODY,
      CoinFeature.CUSTODY_BITGO_TRUST,
      CoinFeature.CUSTODY_BITGO_KOREA,
      CoinFeature.CUSTODY_BITGO_EUROPE_APS,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  'eth:gaia': {
    features: [
      CoinFeature.ACCOUNT_MODEL,
      CoinFeature.REQUIRES_BIG_NUMBER,
      CoinFeature.VALUELESS_TRANSFER,
      CoinFeature.TRANSACTION_DATA,
      CoinFeature.CUSTODY,
      CoinFeature.CUSTODY_BITGO_TRUST,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.CUSTODY_BITGO_KOREA,
      CoinFeature.CUSTODY_BITGO_EUROPE_APS,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  'eth:dragonx': {
    features: [
      CoinFeature.ACCOUNT_MODEL,
      CoinFeature.REQUIRES_BIG_NUMBER,
      CoinFeature.VALUELESS_TRANSFER,
      CoinFeature.TRANSACTION_DATA,
      CoinFeature.CUSTODY,
      CoinFeature.CUSTODY_BITGO_TRUST,
      CoinFeature.CUSTODY_BITGO_KOREA,
      CoinFeature.CUSTODY_BITGO_EUROPE_APS,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
  'avaxc:nxpc': {
    features: [
      CoinFeature.ACCOUNT_MODEL,
      CoinFeature.REQUIRES_BIG_NUMBER,
      CoinFeature.VALUELESS_TRANSFER,
      CoinFeature.TRANSACTION_DATA,
      CoinFeature.CUSTODY,
      CoinFeature.CUSTODY_BITGO_TRUST,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.CUSTODY_BITGO_KOREA,
      CoinFeature.CUSTODY_BITGO_EUROPE_APS,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
    ],
  },
};

describe('CoinMap', function () {
  const btc = utxo(
    '5c1691c5-c9cc-49ed-abe0-c433dab2edaa',
    'btc',
    'Bitcoin',
    Networks.main.bitcoin,
    UnderlyingAsset.BTC,
    BaseUnit.BTC,
    [...UtxoCoin.DEFAULT_FEATURES]
  );

  it('should fail to map a coin with duplicated name', () => {
    (() => CoinMap.fromCoins([btc, btc])).should.throw(`coin '${btc.name}' is already defined`);
  });

  it('should fail to map a coin with duplicated id', () => {
    const btc2 = { ...btc, name: 'btc2' };
    (() => CoinMap.fromCoins([btc, btc2])).should.throw(`coin with id '${btc.id}' is already defined`);
  });

  it('should have iterator', function () {
    [...coins].length.should.be.greaterThan(100);
  });

  it('should report if it contains coin', () => {
    coins.forEach((coin) => {
      coins.has(coin.name).should.be.true();
    });
  });

  it('should report if it does not contain coin', () => {
    coins.has('zzzz:TBD:232332').should.be.false();
  });

  it('should fail if asset ids are not unique', () => {
    const assetIds = new Set();
    coins.forEach((coin) => {
      assetIds.has(coin.id).should.be.false();
      assetIds.add(coin.id);
    });
  });

  it('should get coin by id', () => {
    const btc = coins.get('btc');
    const btcById = coins.get(btc.id);
    btcById.should.deepEqual(btc);
  });

  it('should get coin by address', () => {
    const weth = coins.get('weth');
    const wethByAddress = coins.get(`${weth.family}:${(weth as Erc20Coin).contractAddress}`);
    wethByAddress.should.deepEqual(weth);
    const tweth = coins.get('tweth');
    const twethByAddress = coins.get(`${tweth.family}:${(tweth as Erc20Coin).contractAddress}`);
    twethByAddress.should.deepEqual(tweth);
  });

  it('should find coin by id', () => {
    coins.has(btc.id).should.be.true();
  });

  it('should find coin by NFT collection ID', () => {
    const nftCollectionStatics = coins.get('tapt:0xbbc561fbfa5d105efd8dfb06ae3e7e5be46331165b99d518f094c701e40603b5');
    nftCollectionStatics.name.should.eql('tapt:nftcollection1');
  });

  it('should add single coin/token into the coin map', () => {
    const coinMap = CoinMap.fromCoins([]);
    const coin = coins.get('btc');
    const token = coins.get('usdc');
    coinMap.addCoin(coin);
    coinMap.has(coin.name).should.be.true();
    coinMap.addCoin(token);
    coinMap.has(token.name).should.be.true();
  });
});

coins.forEach((coin, coinName) => {
  describe(`Coin ${coinName}`, function () {
    const featureList = custodyFeatures[coin.name];

    it('has expected name', function () {
      coin.name.should.eql(coinName);
    });

    it('should have id', function () {
      coin.id.should.be.not.empty();
    });

    if (!coin.isToken && coin.family !== CoinFamily.FIAT) {
      if (coin.family !== CoinFamily.THOR) {
        it(`has expected network type`, function () {
          coin.network.type.should.eql(coin.name === coin.family ? NetworkType.MAINNET : NetworkType.TESTNET);
        });
      }
    }

    it('expect base unit', function () {
      coin.baseUnit.should.be.not.empty();
    });

    if (coinsWithExcludedFeatures.hasOwnProperty(coin.name)) {
      const features = coinsWithExcludedFeatures[coin.name].features;
      features.forEach((feature: CoinFeature) => {
        it(`should return true for ${feature} ${coin.family} coin feature`, () => {
          coin.features.includes(feature).should.eql(true);
        });
      });
    } else if (featureList) {
      featureList.features.forEach((feature: CoinFeature) => {
        it(`should return true for ${feature} ${coin.family} coin feature`, () => {
          coin.features.includes(feature).should.eql(true);
        });
      });

      it(`should return true for CUSTODY_BITGO_TRUST ${coin.family} coin feature`, () => {
        coin.features.includes(CoinFeature.CUSTODY_BITGO_TRUST).should.eql(true);
      });

      it(`should return true for CUSTODY_BITGO_MENA_FZE ${coin.family} coin feature`, () => {
        coin.features.includes(CoinFeature.CUSTODY_BITGO_MENA_FZE).should.eql(true);
      });
      it(`should return true for CUSTODY_BITGO_CUSTODY_MENA_FZE ${coin.family} coin feature`, () => {
        coin.features.includes(CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE).should.eql(true);
      });
    } else if (coin.family === CoinFamily.XTZ || coin.features.includes(CoinFeature.GENERIC_TOKEN)) {
      it(`should return false for all custody ${coin.family} coin feature`, () => {
        coin.features.includes(CoinFeature.CUSTODY).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_TRUST).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_MENA_FZE).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_NEW_YORK).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_GERMANY).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_SWITZERLAND).should.eql(false);
      });
    } else {
      it('should return true for CUSTODY and CUSTODY_BITGO_TRUST coin feature', () => {
        const coinSupportsCustody = coin.family !== CoinFamily.LNBTC && coin.family !== CoinFamily.CELO;
        coin.features.includes(CoinFeature.CUSTODY).should.eql(coinSupportsCustody);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_TRUST).should.eql(coinSupportsCustody);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_MENA_FZE).should.eql(coinSupportsCustody);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE).should.eql(coinSupportsCustody);
      });

      it('should return false for all non-SD coin feature', () => {
        coin.features.includes(CoinFeature.CUSTODY_BITGO_NEW_YORK).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_GERMANY).should.eql(false);
        coin.features.includes(CoinFeature.CUSTODY_BITGO_SWITZERLAND).should.eql(false);
      });
    }
  });
});

describe('ERC20 Coins', () => {
  it('should have no duplicate contract addresses', () => {
    coins
      .filter((coin) => coin instanceof Erc20Coin)
      .reduce((acc: { [index: string]: DuplicateCoinObject }, token) => {
        const address = (token as Readonly<Erc20Coin>).contractAddress.toString();

        // If not ETH, should never have duplicates
        if (acc[address] && token.network.family !== CoinFamily.ETH) {
          throw new Error(
            `ERC20 tokens '${acc[address].name}' and '${token.name}' have identical contract address '${address}'`
          );
        }

        // If ETH, must check if chainId is different for the tokens before concluding they are duplicates
        if (acc[address] && token.network.family === CoinFamily.ETH) {
          const network = token.network as EthereumNetwork;
          const accEntry = acc[address].network as EthereumNetwork;
          if (network.chainId === accEntry.chainId) {
            throw new Error(
              `ERC20 tokens '${acc[address]}' and '${token.name}' have identical contract address '${address}'`
            );
          }
        }
        acc[address] = { name: token.name, network: token.network };
        return acc;
      }, {});
  });
});

describe('Token contract address field defaults', () => {
  describe('Sui tokens', function () {
    it('have `contractAddress` === `PackageId::Module::Symbol`', () => {
      coins
        .filter((coin) => coin.family === CoinFamily.SUI && coin instanceof SuiCoin)
        .forEach((coin) => {
          const suiToken = coin as SuiCoin;
          suiToken.contractAddress.should.eql(`${suiToken.packageId}::${suiToken.module}::${suiToken.symbol}`);
        });
    });
  });
  describe('Hedera tokens', function () {
    it('have `contractAddress` === `tokenId`', () => {
      coins
        .filter((coin) => coin.family === CoinFamily.HBAR && coin instanceof HederaToken)
        .forEach((coin) => {
          const hederaToken = coin as HederaToken;
          hederaToken.contractAddress.should.eql(hederaToken.tokenId);
        });
    });
  });
  describe('EOS tokens', function () {
    it('have `contractAddress` === `contractName`', () => {
      coins
        .filter((coin) => coin.family === CoinFamily.EOS && coin instanceof EosCoin)
        .forEach((coin) => {
          const eosToken = coin as EosCoin;
          eosToken.contractAddress.should.eql(eosToken.contractName);
        });
    });
  });
  describe('Sol tokens', function () {
    it('have `contractAddress` === `tokenAddress`', () => {
      coins
        .filter((coin) => coin.family === CoinFamily.SOL && coin instanceof SolCoin)
        .forEach((coin) => {
          const solToken = coin as SolCoin;
          solToken.contractAddress.should.eql(solToken.tokenAddress);
        });
    });
  });
  describe('XRP tokens', function () {
    it('have `contractAddress` === `issuerAddress::currencyCode`', () => {
      coins
        .filter((coin) => coin.family === CoinFamily.XRP && coin instanceof XrpCoin)
        .forEach((coin) => {
          const xrpToken = coin as XrpCoin;
          xrpToken.contractAddress.should.eql(`${xrpToken.issuerAddress}::${xrpToken.currencyCode}`);
        });
    });
  });
  it('have issuerAddress and currencyCode formed from contractAddress', () => {
    coins
      .filter((coin) => coin.family === CoinFamily.XRP && coin instanceof XrpCoin)
      .forEach((coin) => {
        const xrpToken = coin as XrpCoin;
        xrpToken.contractAddress.split('::')[0].should.not.be.empty();
        xrpToken.contractAddress.split('::')[1].should.not.be.empty();
        xrpToken.issuerAddress.should.eql(xrpToken.contractAddress.split('::')[0]);
        xrpToken.currencyCode.should.eql(xrpToken.contractAddress.split('::')[1]);
      });
  });
});

describe('Cold Wallet Features', () => {
  it('Coins that support both multisig & tss cold should have expected flags', () => {
    const both = coins
      .filter(
        (coin) =>
          !coin.isToken &&
          coin.features.includes(CoinFeature.MULTISIG_COLD) &&
          coin.features.includes(CoinFeature.TSS_COLD)
      )
      .map((coin) => coin.name)
      .sort();
    both.should.deepEqual(expectedColdFeatures.both.sort());
  });
  it('Coins that support just multisig cold should have expected flags', () => {
    const justMultiSig = coins
      .filter(
        (coin) =>
          !coin.isToken &&
          coin.features.includes(CoinFeature.MULTISIG_COLD) &&
          !coin.features.includes(CoinFeature.TSS_COLD)
      )
      .map((coin) => coin.name)
      .sort();
    justMultiSig.should.deepEqual(expectedColdFeatures.justMultiSig.sort());
  });
  it('Coins that support just tss cold should have expected flags', () => {
    const justTSS = coins
      .filter(
        (coin) =>
          !coin.isToken &&
          !coin.features.includes(CoinFeature.MULTISIG_COLD) &&
          coin.features.includes(CoinFeature.TSS_COLD)
      )
      .map((coin) => coin.name)
      .sort();
    justTSS.should.deepEqual(expectedColdFeatures.justTSS.sort());
  });
  it('Coins that dont support cold wallets at all should not have either flag', () => {
    const neither = coins
      .filter(
        (coin) =>
          !coin.isToken &&
          !coin.features.includes(CoinFeature.MULTISIG_COLD) &&
          !coin.features.includes(CoinFeature.TSS_COLD)
      )
      .map((coin) => coin.name)
      .sort();
    neither.should.deepEqual(expectedColdFeatures.neither.sort());
  });
});

describe('Distributed Custody Features', () => {
  it('btc and tbtc should have distributed custody feature', () => {
    const targetCoins = ['tbtc', 'btc'];
    targetCoins.forEach((coinName) => {
      const coin = coins.get(coinName);
      coin.features.includes(CoinFeature.DISTRIBUTED_CUSTODY).should.eql(true);
    });
  });
});

describe('Bulk Transaction Features', () => {
  it('Tokens supports Bulk Withdrawal', () => {
    coins.forEach((coin) => {
      if (coin.name.startsWith('sol:')) {
        coin.features.includes(CoinFeature.BULK_TRANSACTION).should.eql(true);
      }
      if (coin.name.startsWith('polygon:')) {
        coin.features.includes(CoinFeature.BULK_TRANSACTION).should.eql(true);
      }
    });
  });
});

describe('ERC20 Bulk Transaction Feature', () => {
  it('should have ERC20_BULK_TRANSACTION feature for appropriate coins', () => {
    const erc20BulkTransactionCoins = ['eth', 'hteth', 'opeth', 'topeth', 'arbeth', 'tarbeth', 'polygon', 'tpolygon'];
    erc20BulkTransactionCoins.forEach((coinName) => {
      const coin = coins.get(coinName);
      coin.features.includes(CoinFeature.ERC20_BULK_TRANSACTION).should.eql(true);
    });
  });

  it('should not have ERC20_BULK_TRANSACTION feature for BSC', () => {
    const coin = coins.get('bsc');
    coin.features.includes(CoinFeature.ERC20_BULK_TRANSACTION).should.eql(false);
  });
});

describe('Eip1559 coins', () => {
  const eip1559Coins = [
    'avaxc',
    'tavaxc',
    'eth',
    'teth',
    'gteth',
    'hteth',
    'hteth:bgerchv2',
    'celo',
    'tcelo',
    'arbeth',
    'tarbeth',
    'opeth',
    'topeth',
    'polygon',
    'tpolygon',
    'zketh',
    'tzketh',
    'bera',
    'tbera',
    'oas',
    'toas',
    'coredao',
    'tcoredao',
  ];
  it('should have EIP1559 feature', () => {
    eip1559Coins.forEach((coinName) => {
      const coin = coins.get(coinName);
      coin.features.includes(CoinFeature.EIP1559).should.eql(true);
    });
  });
});

describe('create token map using config details', () => {
  it('should create a valid token map from AmsTokenConfig', () => {
    const tokenMap = createTokenMapUsingConfigDetails(amsTokenConfig);
    Object.keys(amsTokenConfig).forEach((tokenName) => {
      const token = tokenMap.get(tokenName);
      const tokenFromStaticCoinMap = coins.get(tokenName);
      const { network: tokenNetwork, ...tokenRest } = token;
      const { network: staticNetwork, ...staticRest } = tokenFromStaticCoinMap;
      tokenRest.should.deepEqual(staticRest);
      JSON.stringify(tokenNetwork).should.eql(JSON.stringify(staticNetwork));
    });
  });
  it('should give precedence to static coin map over ams coin map', () => {
    const tokenMap = createTokenMapUsingConfigDetails(incorrectAmsTokenConfig);
    const tokenName = 'thbar:usdc';
    const token = tokenMap.get(tokenName);
    token.decimalPlaces.should.eql(coins.get(tokenName).decimalPlaces);
    token.baseUnit.should.eql(coins.get(tokenName).baseUnit);
    token.decimalPlaces.should.not.eql(incorrectAmsTokenConfig[tokenName][0].decimalPlaces);
    token.baseUnit.should.not.eql(incorrectAmsTokenConfig[tokenName][0].baseUnit);
  });
  it('should create a coin map and get formatted tokens from it', () => {
    const coinMap = createTokenMapUsingConfigDetails(amsTokenConfigWithCustomToken);
    const formattedTokens = getFormattedTokens(coinMap);
    formattedTokens.bitcoin.should.deepEqual(tokens.bitcoin);
    formattedTokens.testnet.eth.should.not.deepEqual(tokens.testnet.eth);
    formattedTokens.testnet.eth.tokens.some((token) => token.type === 'hteth:faketoken').should.eql(true);
    formattedTokens.testnet.ofc.tokens.some((token) => token.type === 'ofcterc2').should.eql(true);
  });
  it('should not create an base coin object in coin map for token with unsupported network', () => {
    const tokenMap = createTokenMapUsingTrimmedConfigDetails(amsTokenWithUnsupportedNetwork);
    tokenMap.has('hteth:faketoken').should.eql(false);
  });
  it('should create a coin map using reduced token config details', () => {
    const coinMap1 = createTokenMapUsingTrimmedConfigDetails(reducedAmsTokenConfig);
    const amsToken1 = coinMap1.get('hteth:faketoken');
    const amsOfcToken1 = coinMap1.get('ofcterc2');
    const coinMap2 = createTokenMapUsingConfigDetails(amsTokenConfigWithCustomToken);
    const amsToken2 = coinMap2.get('hteth:faketoken');
    const amsOfcToken2 = coinMap2.get('ofcterc2');
    const { network: tokenNetwork1, ...tokenRest1 } = amsToken1;
    const { network: tokenNetwork2, ...tokenRest2 } = amsToken2;
    const { network: tokenNetwork3, ...tokenRest3 } = amsOfcToken1;
    const { network: tokenNetwork4, ...tokenRest4 } = amsOfcToken2;
    tokenRest1.should.deepEqual(tokenRest2);
    tokenRest3.should.deepEqual(tokenRest4);
    JSON.stringify(tokenNetwork1).should.eql(JSON.stringify(tokenNetwork2));
    JSON.stringify(tokenNetwork3).should.eql(JSON.stringify(tokenNetwork4));
  });
  it('should be able to add single ams token into coin map', () => {
    const coinMap = CoinMap.fromCoins([]);
    const staticsCoin = createToken(amsTokenConfigWithCustomToken['hteth:faketoken'][0]);
    if (staticsCoin) {
      coinMap.addCoin(staticsCoin);
    }
    coinMap.has('hteth:faketoken').should.be.true();
  });
});
