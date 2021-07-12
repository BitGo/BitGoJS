import { ConflictingCoinFeaturesError, DisallowedCoinFeatureError, MissingRequiredCoinFeatureError } from './errors';
import { BaseNetwork } from './networks';

export enum CoinKind {
  CRYPTO = 'crypto',
  FIAT = 'fiat',
}

/**
 * The coin family links related variants of a single coin together.
 *
 * Typically, each coin will have a testnet and mainnet variant,
 * and these will both have the same coin family.
 *
 * For example, the coins `btc` and `tbtc` both belong to the same family, `btc`.
 */
export enum CoinFamily {
  ALGO = 'algo',
  BCH = 'bch',
  BCHA = 'bcha',
  BSV = 'bsv',
  BTC = 'btc',
  BTG = 'btg',
  CELO = 'celo',
  CSPR = 'cspr',
  DASH = 'dash',
  ETH = 'eth',
  ETH2 = 'eth2',
  ETC = 'etc',
  EOS = 'eos',
  HBAR = 'hbar',
  LTC = 'ltc',
  OFC = 'ofc',
  RMG = 'rmg',
  RBTC = 'rbtc',
  STX = 'stx',
  SUSD = 'susd',
  TRX = 'trx',
  XLM = 'xlm',
  XRP = 'xrp',
  XTZ = 'xtz',
  ZEC = 'zec',
}

/**
 * Coin features are yes or no questions about what a coin requires or is capable of.
 *
 * This allows coin-agnostic handling of coin-specific features. This is designed
 * to replace checking the coin name against a whitelist of supported coins
 * before executing some coin-specific logic, and instead allows one to check if a
 * coin supports the coin-specific feature that the logic implements.
 */
export enum CoinFeature {
  /*
   * The valueless transfer feature indicates that it is valid to send a transaction which moves zero units of the coin.
   *
   * An example is Ethereum, which uses zero value transactions to trigger contract calls.
   */
  VALUELESS_TRANSFER = 'valueless-transfer',
  /*
   * Transaction data means there can be arbitrary data encoded in a transaction.
   *
   * Ethereum contract call data is an example.
   */
  TRANSACTION_DATA = 'transaction-data',
  /*
   * Some coins have a higher precision range than IEEE 754 doubles, which are used to represent numbers in javascript.
   *
   * For these coins, we must use an arbitrary precision arithmetic library, and this feature indicates this requirement.
   */
  REQUIRES_BIG_NUMBER = 'requires-big-number',
  /*
   * RMG requires all wallets to have a backup key held by a BitGo approved Key Recovery Service (KRS)
   */
  REQUIRES_KRS_BACKUP_KEY = 'requires-krs-backup-key',
  /*
   * For customers which are not on a postpaid contract, we add an extra output to transactions which pays BitGo a fee.
   *
   * This fee is known as the "pay-as-you-go fee", or just "paygo" for short.
   *
   * Some coins are unable to create transactions with more than one output, so paygo outputs are not possible for these coins.
   */
  PAYGO = 'paygo',
  /*
   * Does this coin align with the unspent model?
   *
   * These are typically Bitcoin and forks of it, such as Litecoin and Bitcoin Cash.
   */
  UNSPENT_MODEL = 'unspent-model',
  /*
   * Does this coin align with the account model?
   *
   * Examples of this coin type are Ethereum, XRP, and Stellar
   */
  ACCOUNT_MODEL = 'account-model',
  /*
   * Does this coin support child-pays-for-parent transactions?
   *
   * These are special types of transactions which can accelerate the confirmation time
   * of another transaction which is stuck in the mempool due to low fees.
   *
   * This is only possible for coins which follow the unspent model (UTXO coins).
   */
  CHILD_PAYS_FOR_PARENT = 'cpfp',
  /*
   * Does this coin support pay-to-script-hash wrapped segregated witness transactions.
   *
   * These are upgraded transaction types which can only apply to UTXO coins such as Bitcoin.
   */
  WRAPPED_SEGWIT = 'wrapped-segwit',
  /*
   * Does this coin support segregated witness transactions natively? (eg, not wrapped in a P2SH indirection layer)
   *
   * These are upgraded transaction types which can only apply to UTXO coins such as Bitcoin.
   */
  NATIVE_SEGWIT = 'native-segwit',
  /*
   * Does this coin support tokens? These are distinct assets from the underlying coin, but run on the same network.
   *
   * For example, Ethereum's ERC 20 token standard means that it supports tokens, so it shall have this feature.
   */
  SUPPORTS_TOKENS = 'supports-tokens',
  /*
   * Are fees for transactions of this coin paid for by the Enterprise (eg, Enterprise gas tank)?
   */
  ENTERPRISE_PAYS_FEES = 'enterprise-pays-fees',
  /*
   * This coin requires that accounts keep a minimum balance as reserve
   */
  REQUIRES_RESERVE = 'requires-reserve',
}

/**
 * Some coins are representations of another underlying asset class. An example
 * is Wrapped Bitcoin, which represents Bitcoin on the Ethereum blockchain.
 *
 * For these coins, the `UnderlyingAsset` provides a link to the actual
 * asset for which the coin is a unit of account.
 */
export enum UnderlyingAsset {
  ALGO = 'algo',
  BCH = 'bch',
  BCHA = 'bcha',
  BSV = 'bsv',
  BTC = 'btc',
  BTG = 'btg',
  DASH = 'dash',
  CELO = 'celo', // Celo main coin
  CSPR = 'cspr',
  USD = 'usd',
  ETH = 'eth',
  ETH2 = 'eth2',
  ETC = 'etc',
  EOS = 'eos',
  HBAR = 'hbar', // Hedera main coin
  LTC = 'ltc',
  RBTC = 'rbtc', // RSK main coin
  STX = 'stx',
  TRX = 'trx',
  XRP = 'xrp',
  XLM = 'xlm',
  XTZ = 'xtz',
  ZEC = 'zec',

  // ERC 20 tokens
  '1INCH' = '1inch',
  '1UP' = '1up',
  AAVE = 'aave',
  ABT = 'abt',
  ACE = 'ace',
  ACXT = 'acxt',
  AE = 'ae',
  AERGO = 'aergo',
  AERGO1 = 'aergo1',
  AGWD = 'agwd',
  AION = 'aion',
  ALPHA = 'alpha',
  AMN = 'amn',
  AMO = 'amo',
  AMP = 'amp',
  AMON = 'amon',
  AMPX = 'ampx',
  ANA = 'ana',
  ANT = 'ant',
  ANTV2 = 'antv2',
  AOA = 'aoa',
  APPC = 'appc',
  AQT = 'aqt',
  ARCT = 'arct',
  AST = 'ast',
  ATRI = 'atri',
  AUDIO = 'audio',
  AUDX = 'audx',
  AUST = 'aust',
  AXPR = 'axpr',
  AXS = 'axs',
  BADGER = 'badger',
  BAL = 'bal',
  BAND = 'band',
  BASIC = 'basic',
  BAT = 'bat',
  BAX = 'bax',
  BBX = 'bbx',
  BCAP = 'bcap',
  BCC = 'bcc',
  BCIO = 'bcio',
  BEPRO = 'bepro',
  BID = 'bid',
  BIDL = 'bidl',
  BIRD = 'bird',
  BNK = 'bnk',
  BNL = 'bnl',
  BNT = 'bnt',
  BNTY = 'bnty',
  BOX = 'box',
  BRD = 'brd',
  BRZ = 'brz',
  BST = 'bst',
  BSX = 'bsx',
  BTT = 'btt',
  BTU = 'btu',
  BUSD = 'busd',
  BUY = 'buy',
  BZZ = 'bzz',
  C8P = 'c8p',
  CACXT = 'cacxt',
  CADX = 'cadx',
  CAG = 'cag',
  CBAT = 'cbat',
  CBC = 'cbc',
  CBRL = 'cbrl',
  CCT = 'cct',
  CDAG = 'cdag',
  CDAI = 'cdai',
  CDT = 'cdt',
  CEL = 'cel',
  CFX = 'cfx',
  CETH = 'ceth',
  CHFX = 'chfx',
  CHSB = 'chsb',
  CHZ = 'chz',
  CIX100 = 'cix100',
  CLIQ = 'cliq',
  CLN = 'cln',
  CLT = 'clt',
  CNYX = 'cnyx',
  COMP = 'comp',
  COVER = 'cover',
  CPAY = 'cpay',
  CPLT = 'cplt',
  CQT = 'cqt',
  CQX = 'cqx',
  CRDT = 'crdt',
  CRE = 'cre',
  CREAM = 'cream',
  CREP = 'crep',
  CRO = 'cro',
  CRV = 'crv',
  CRPT = 'crpt',
  CRPT1 = 'crpt1',
  CSLV = 'cslv',
  CSP = 'csp',
  CUSD = 'cusd',
  CUSDC = 'cusdc',
  CWBTC = 'cwbtc',
  CVC = 'cvc',
  CZRX = 'czrx',
  DACXI = 'dacxi',
  DAI = 'dai',
  DATA = 'data',
  DEC = 'dec',
  DENT = 'dent',
  DEP = 'dep',
  DFD = 'dfd',
  DFI = 'dfi',
  DGCL = 'dgcl',
  DGD = 'dgd',
  DGX = 'dgx',
  DIGG = 'digg',
  DMT = 'dmt',
  DPI = 'dpi',
  DRPU = 'drpu',
  DRV = 'drv',
  DX1U = 'dx1u',
  DXGT = 'dxgt',
  DXPT = 'dxpt',
  DXST = 'dxst',
  DYN = 'dyn',
  EASY = 'easy',
  ECHT = 'echt',
  EDISON = 'edison',
  EDN = 'edn',
  EDR = 'edr',
  EFI = 'efi',
  EGL = 'egl',
  EGLD = 'egld',
  ELF = 'elf',
  EMX = 'emx',
  ENG = 'eng',
  ENJ = 'enj',
  EQO = 'eqo',
  ETHOS = 'ethos',
  ETV = 'etv',
  EURS = 'eurs',
  EURT = 'eurt',
  EURX = 'eurx',
  EUX = 'eux',
  EVX = 'evx',
  EXE = 'exe',
  FEI = 'fei',
  FET = 'fet',
  FET1 = 'fet1',
  FF1 = 'ff1',
  FFT = 'fft',
  FMF = 'fmf',
  FORTH = 'forth',
  FTM = 'ftm',
  FTT = 'ftt',
  FUN = 'fun',
  FWB = 'fwb',
  FXRT = 'fxrt',
  GALA = 'gala',
  GBPX = 'gbpx',
  GDT = 'gdt',
  GEC = 'gec',
  GEN = 'gen',
  GHUB = 'ghub',
  GLDX = 'gldx',
  GLM = 'glm',
  GNO = 'gno',
  GNT = 'gnt',
  GOLD = 'gold',
  GOT = 'got',
  GRT = 'grt',
  GTO = 'gto',
  GUSD = 'gusd',
  GXC = 'gxc',
  GYEN = 'gyen',
  HCN = 'hcn',
  HDO = 'hdo',
  HEDG = 'hedg',
  HKDX = 'hkdx',
  HLC = 'hlc',
  HMT = 'hmt',
  HOLD = 'hold',
  HOT = 'hot',
  HQT = 'hqt',
  HST = 'hst',
  HT = 'ht',
  HUM = 'hum',
  HXRO = 'hxro',
  HYB = 'hyb',
  HYDRO = 'hydro',
  I8 = 'i8',
  IDEX = 'idex',
  IDRC = 'idrc',
  IDRT = 'idrt',
  IMX = 'imx',
  INCX = 'incx',
  IND = 'ind',
  INF = 'inf',
  INJ = 'inj',
  INST = 'inst',
  INX = 'inx',
  ISF = 'isf',
  ISR = 'isr',
  IVO = 'ivo',
  IVY = 'ivy',
  JBC = 'jbc',
  JFIN = 'jfin',
  JPYX = 'jpyx',
  KEEP = 'keep',
  KEY = 'key',
  KIN = 'kin',
  KNC = 'knc',
  KNC2 = 'knc2',
  KOIN = 'koin',
  KOZ = 'koz',
  KP3R = 'kp3r',
  KZE = 'kze',
  LAYER = 'layer',
  LBA = 'lba',
  LEND = 'lend',
  LEO = 'leo',
  LGO = 'lgo',
  LINK = 'link',
  LION = 'lion',
  LNC = 'lnc',
  LOOM = 'loom',
  LOOM1 = 'loom1',
  LRC = 'lrc',
  LYN = 'lyn',
  MAPS = 'maps',
  MATIC = 'matic',
  MCDAI = 'mcdai',
  MCO = 'mco',
  MCX = 'mcx',
  MDX = 'mdx',
  MEDX = 'medx',
  MEME = 'meme',
  MET = 'met',
  META = 'meta',
  MFG = 'mfg',
  MFPH = 'mfph',
  MFT = 'mft',
  MILKV2 = 'milkv2',
  MIR = 'mir',
  MITH = 'mith',
  MIX = 'mix',
  MKR = 'mkr',
  MNS = 'mns',
  MOC = 'moc',
  MPAY = 'mpay',
  MTCN = 'mtcn',
  MTL = 'mtl',
  MUSD = 'musd',
  MVL = 'mvl',
  NAS = 'nas',
  NEU = 'neu',
  NEXO = 'nexo',
  NGNT = 'ngnt',
  NIAX = 'niax',
  NMR = 'nmr',
  NU = 'nu',
  NZDX = 'nzdx',
  OCEAN = 'ocean',
  OCEANV2 = 'oceanv2',
  OGN = 'ogn',
  OM = 'om',
  OMG = 'omg',
  ONL = 'onl',
  OPT = 'opt',
  ORAI = 'orai',
  ORBS = 'orbs',
  OXT = 'oxt',
  OXY = 'oxy',
  PAR = 'par',
  PASS = 'pass',
  PAU = 'pau',
  PAX = 'pax',
  PAXG = 'paxg',
  PAY = 'pay',
  PBCH = 'pbch',
  PDATA = 'pdata',
  PBTC = 'pbtc',
  PEG = 'peg',
  PETH = 'peth',
  PHNX = 'phnx',
  PIE = 'pie',
  PLC = 'plc',
  PFCT = 'pfct',
  PLANET = 'planet',
  PLNX = 'plnx',
  PLX = 'plx',
  PMA = 'pma',
  POLY = 'poly',
  POWR = 'powr',
  PPT = 'ppt',
  PRDX = 'prdx',
  PRO = 'pro',
  PRTS = 'prts',
  PUNDIX = 'pundix',
  PUSD = 'pusd',
  QASH = 'qash',
  QCAD = 'qcad',
  QDT = 'qdt',
  QRL = 'qrl',
  QSP = 'qsp',
  QVT = 'qvt',
  RBY = 'rby',
  RDN = 'rdn',
  REB = 'reb',
  REBL = 'rebl',
  REP = 'rep',
  REPV2 = 'repv2',
  RFR = 'rfr',
  RGT = 'rgt',
  RIF = 'rif',
  RINGX = 'ringx',
  RLC = 'rlc',
  RLY = 'rly',
  RONC = 'ronc',
  ROOBEE = 'roobee',
  RUBX = 'rubx',
  SALT = 'salt',
  SAND = 'sand',
  SASHIMI = 'sashimi',
  SGA = 'sga',
  SGDX = 'sgdx',
  SGR = 'sgr',
  SHK = 'shk',
  SHOPX = 'shopx',
  SHR = 'shr',
  SIH = 'sih',
  SILV = 'silv',
  SKALE = 'skale',
  SLOT = 'slot',
  SLVX = 'slvx',
  SNC = 'snc',
  SNOV = 'snov',
  SNT = 'snt',
  SNX = 'snx',
  SOC = 'soc',
  SPO = 'spo',
  SOLVE = 'solve',
  SRNT = 'srnt',
  STC = 'stc',
  STKAAVE = 'stkaave',
  STORE = 'store',
  STORJ = 'storj',
  STORM = 'storm',
  STZEN = 'stzen',
  SUSHI = 'sushi',
  SXP = 'sxp',
  TAUD = 'taud',
  TBTC1 = 'tbtc1',
  TCAD = 'tcad',
  TCO = 'tco',
  TEL = 'tel',
  TEN = 'ten',
  TENX = 'tenx',
  TERC = 'terc',
  TERC20 = 'terc20',
  TGBP = 'tgbp',
  THKD = 'thkd',
  TIOX = 'tiox',
  TKNT = 'tknt',
  TKX = 'tkx',
  TNT = 'tnt',
  TOK = 'tok',
  TRIBE = 'tribe',
  TRST = 'trst',
  TRU = 'tru',
  TRYB = 'tryb',
  TRYX = 'tryx',
  TUSD = 'tusd',
  TXL = 'txl',
  UAIR = 'uair',
  UCO = 'uco',
  UKG = 'ukg',
  UMA = 'uma',
  UNI = 'uni',
  UP = 'up',
  UPBTC = 'upbtc',
  UPP = 'upp',
  UPT = 'upt',
  UPUSD = 'upusd',
  UQC = 'uqc',
  URHD = 'urhd',
  USDC = 'usdc',
  USDT = 'usdt',
  USDX = 'usdx',
  USG = 'usg',
  USPX = 'uspx',
  UST = 'ust',
  USX = 'usx',
  UTK = 'utk',
  UTK1 = 'utk1',
  VALOR = 'valor',
  VDX = 'vdx',
  VRGX = 'vrgx',
  VXC = 'vxc',
  WAFL = 'wafl',
  WAX = 'wax',
  WABI = 'wabi',
  WBTC = 'wbtc',
  WCFG = 'wcfg',
  WET = 'wet',
  WETH = 'weth',
  WHALE = 'whale',
  WHT = 'wht',
  WNXM = 'wnxm',
  WPX = 'wpx',
  WTC = 'wtc',
  WXRP = 'wxrp',
  WXT = 'wxt',
  XBGOLD = 'xbgold',
  XCD = 'xcd',
  XEX = 'xex',
  XRL = 'xrl',
  XSGD = 'xsgd',
  XTP = 'xtp',
  YFDAI = 'yfdai',
  YFI = 'yfi',
  YFII = 'yfii',
  YLD = 'yld',
  YNG = 'yng',
  YSEY = 'ysey',
  ZARX = 'zarx',
  ZCO = 'zco',
  ZIL = 'zil',
  ZIX = 'zix',
  ZLW = 'zlw',
  ZMT = 'zmt',
  ZOOM = 'zoom',
  ZRX = 'zrx',
  ZUSD = 'zusd',
  'xlm:BST-GADDFE4R72YUP2AOEL67OHZN3GJQYPC3VE734N2XFMEGRR2L32CZ3XYZ' = 'xlm:BST-GADDFE4R72YUP2AOEL67OHZN3GJQYPC3VE734N2XFMEGRR2L32CZ3XYZ',
  'xlm:VELO-GDM4RQUQQUVSKQA7S6EM7XBZP3FCGH4Q7CL6TABQ7B2BEJ5ERARM2M5M' = 'xlm:VELO-GDM4RQUQQUVSKQA7S6EM7XBZP3FCGH4Q7CL6TABQ7B2BEJ5ERARM2M5M',
  'xlm:SLT-GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DYHDOI244V47XKQ4GP' = 'xlm:SLT-GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DYHDOI244V47XKQ4GP',
  'xlm:USD-GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX' = 'xlm:USD-GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX',
  'xlm:ETH-GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5' = 'xlm:ETH-GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5',
  'xlm:WXT-GASBLVHS5FOABSDNW5SPPH3QRJYXY5JHA2AOA2QHH2FJLZBRXSG4SWXT' = 'xlm:WXT-GASBLVHS5FOABSDNW5SPPH3QRJYXY5JHA2AOA2QHH2FJLZBRXSG4SWXT',
  'xlm:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' = 'xlm:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  'xlm:SIX-GDMS6EECOH6MBMCP3FYRYEVRBIV3TQGLOFQIPVAITBRJUMTI6V7A2X6Z' = 'xlm:SIX-GDMS6EECOH6MBMCP3FYRYEVRBIV3TQGLOFQIPVAITBRJUMTI6V7A2X6Z',
  'xlm:BRLT-GCHQ3F2BF5P74DMDNOOGHT5DUCKC773AW5DTOFINC26W4KGYFPYDPRSO' = 'xlm:BRLT-GCHQ3F2BF5P74DMDNOOGHT5DUCKC773AW5DTOFINC26W4KGYFPYDPRSO',
  'xlm:ARST-GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG' = 'xlm:ARST-GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG',

  // Kovan-only ERC20 tokens
  TEST = 'test',
  SCHZ = 'schz',
  CAT = 'cat',

  // Stellar testnet tokens
  'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L' = 'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
  'txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L' = 'txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',

  // Algorand tokens
  'talgo:16026728' = 'talgo:16026728',
  'talgo:16026732' = 'talgo:16026732',
  'talgo:16026733' = 'talgo:16026733',
}

/**
 * This is the curve BitGo signs against with the user, backup and BitGo key.
 */
export enum KeyCurve {
  Secp256k1 = 'secp256k1',
  Ed25519 = 'ed25519',
  BLS = 'bls',
}

export interface BaseCoinConstructorOptions {
  fullName: string; // full, human readable name of this coin. Eg, "Bitcoin Cash" for bch
  name: string; // unique identifier for this coin, usually the lowercase ticker or symbol. Eg, "btc" for bitcoin
  prefix?: string;
  suffix?: string;
  kind: CoinKind;
  isToken: boolean;
  features: CoinFeature[];
  decimalPlaces: number;
  asset: UnderlyingAsset;
  network: BaseNetwork;
  primaryKeyCurve: KeyCurve;
}

export abstract class BaseCoin {
  /*
    Display properties
   */
  public readonly fullName: string;
  public readonly name: string;
  public readonly prefix?: string;
  public readonly suffix?: string;
  /*
    Classification properties
   */
  public readonly kind: CoinKind;
  public readonly family: CoinFamily;
  public readonly isToken: boolean;
  /*
    Coin Features. These are yes or no questions about what the coin supports and does not support.
   */
  public readonly features: CoinFeature[];
  /*
    Coin Network. This is a list of properties which are relevant to the underlying network on which this coin exists.
   */
  public readonly network: BaseNetwork;
  /*
    Conversion properties
   */
  public readonly decimalPlaces: number;
  public readonly asset: UnderlyingAsset;

  /**
   * The primary elliptic curve BitGo signs and generates keys against.
   */
  public readonly primaryKeyCurve: KeyCurve;

  /**
   * Set of features which are required by a coin subclass
   * @return {Set<CoinFeature>}
   */
  protected abstract requiredFeatures(): Set<CoinFeature>;

  /**
   * Set of features which are not valid and are disallowed by a coin subclass
   * @return {Set<CoinFeature>}
   */
  protected abstract disallowedFeatures(): Set<CoinFeature>;

  /**
   * Ensures that the base coin constructor was passed a valid set of options.
   *
   * This includes checking that:
   * - All coin features of the new instance are allowed by the coin class
   * - No features required by the coin class are missing from the new instance
   * @param {BaseCoinConstructorOptions} options
   * @throws {DisallowedCoinFeatureError} if any of the coin features are not allowed for the coin class
   * @throws {MissingRequiredCoinFeatureError} if any features required by the coin class are missing
   */
  private validateOptions(options: BaseCoinConstructorOptions) {
    const requiredFeatures = this.requiredFeatures();
    const disallowedFeatures = this.disallowedFeatures();

    const intersectionFeatures = Array.from(requiredFeatures).filter(feat => disallowedFeatures.has(feat));

    if (intersectionFeatures.length > 0) {
      throw new ConflictingCoinFeaturesError(options.name, intersectionFeatures);
    }

    for (const feature of options.features) {
      if (disallowedFeatures.has(feature)) {
        throw new DisallowedCoinFeatureError(options.name, feature);
      }

      if (requiredFeatures.has(feature)) {
        requiredFeatures.delete(feature);
      }
    }

    if (requiredFeatures.size > 0) {
      // some required features were missing
      throw new MissingRequiredCoinFeatureError(options.name, Array.from(requiredFeatures));
    }
  }

  protected constructor(options: BaseCoinConstructorOptions) {
    this.validateOptions(options);

    this.fullName = options.fullName;
    this.name = options.name;
    this.prefix = options.prefix;
    this.suffix = options.suffix;
    this.kind = options.kind;
    this.family = options.network.family;
    this.isToken = options.isToken;
    this.features = options.features;
    this.decimalPlaces = options.decimalPlaces;
    this.asset = options.asset;
    this.network = options.network;
    this.primaryKeyCurve = options.primaryKeyCurve;
  }
}
