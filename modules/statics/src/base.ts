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
  ADA = 'ada',
  ALGO = 'algo',
  AVAXC = 'avaxc',
  AVAXP = 'avaxp',
  BCH = 'bch',
  BCHA = 'bcha',
  BSV = 'bsv',
  BTC = 'btc',
  BTG = 'btg',
  CELO = 'celo',
  CSPR = 'cspr',
  DASH = 'dash',
  DOGE = 'doge',
  DOT = 'dot',
  ETH = 'eth',
  ETH2 = 'eth2',
  ETC = 'etc',
  EOS = 'eos',
  FIAT = 'fiat',
  HBAR = 'hbar',
  LTC = 'ltc',
  POLYGON = 'polygon',
  NEAR = 'near',
  OFC = 'ofc',
  RBTC = 'rbtc',
  SOL = 'sol',
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
  /*
   * This coin supports custodial wallet types
   */
  CUSTODY = 'custody',

  /*
  This coin uses TSS for key creation and signing
   */
  TSS = 'tss',
}

/**
 * Some coins are representations of another underlying asset class. An example
 * is Wrapped Bitcoin, which represents Bitcoin on the Ethereum blockchain.
 *
 * For these coins, the `UnderlyingAsset` provides a link to the actual
 * asset for which the coin is a unit of account.
 */
export enum UnderlyingAsset {
  ADA = 'ada',
  ALGO = 'algo',
  APE = 'ape',
  API3 = 'api3',
  AVAXC = 'avaxc',
  AVAXP = 'avaxp',
  AXL = 'AXL',
  BCH = 'bch',
  BCHA = 'bcha',
  BSV = 'bsv',
  BTC = 'btc',
  BTG = 'btg',
  DASH = 'dash',
  DOT = 'dot',
  CELO = 'celo', // Celo main coin
  CSPR = 'cspr',
  ETH = 'eth',
  ETH2 = 'eth2',
  ETC = 'etc',
  EOS = 'eos',
  ERD = 'erd',
  EUR = 'eur',
  EUROC = 'euroc',
  GTETH = 'gteth',
  HBAR = 'hbar', // Hedera main coin
  LTC = 'ltc',
  NEAR = 'near',
  POLYGON = 'polygon',
  RBTC = 'rbtc', // RSK main coin
  SOL = 'sol',
  STX = 'stx',
  TRX = 'trx',
  USD = 'usd',
  XLM = 'xlm',
  XRP = 'xrp',
  XTZ = 'xtz',
  ZEC = 'zec',

  // ERC 20 tokens
  '1INCH' = '1inch',
  '1UP' = '1up',
  AAVE = 'aave',
  ABT = 'abt',
  ACE = 'ace',
  ACXT = 'acxt',
  ACH = 'ach',
  AE = 'ae',
  AERGO = 'aergo',
  AERGO1 = 'aergo1',
  AGWD = 'agwd',
  AION = 'aion',
  ALI = 'ali',
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
  ARCX = 'arcx',
  AST = 'ast',
  ATRI = 'atri',
  AUDIO = 'audio',
  AUDX = 'audx',
  AUST = 'aust',
  AXPR = 'axpr',
  AXS = 'axs',
  AXSV2 = 'axsv2',
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
  BED = 'bed',
  BEPRO = 'bepro',
  BICO = 'bico',
  BID = 'bid',
  BIDL = 'bidl',
  BIRD = 'bird',
  BIT = 'bit',
  BNK = 'bnk',
  BNL = 'bnl',
  BNT = 'bnt',
  BNTY = 'bnty',
  BOND = 'bond',
  BLOCKS = 'blocks',
  BOX = 'box',
  BOBA = 'boba',
  BRD = 'brd',
  BRZ = 'brz',
  BST = 'bst',
  BSX = 'bsx',
  BTRST = 'btrst',
  BTT = 'btt',
  BTU = 'btu',
  BURP = 'burp',
  BUSD = 'busd',
  BUY = 'buy',
  BXX = 'bxx',
  BXXV1 = 'bxxv1',
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
  CELR = 'celr',
  CETH = 'ceth',
  CHFX = 'chfx',
  CHSB = 'chsb',
  CHZ = 'chz',
  CIX100 = 'cix100',
  CLIQ = 'cliq',
  CLN = 'cln',
  CLT = 'clt',
  CLV = 'clv',
  CNG = 'cng',
  CNYX = 'cnyx',
  COMP = 'comp',
  COTI = 'coti',
  COVER = 'cover',
  CPAY = 'cpay',
  CPLT = 'cplt',
  CQT = 'cqt',
  CQX = 'cqx',
  CRA = 'cra',
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
  CTSI = 'ctsi',
  CUSD = 'cusd',
  CUSDC = 'cusdc',
  CWBTC = 'cwbtc',
  CVC = 'cvc',
  CVX = 'cvx',
  CZRX = 'czrx',
  DACXI = 'dacxi',
  DAI = 'dai',
  DAO = 'dao',
  DATA = 'data',
  DATAV2 = 'datav2',
  DATAECON = 'dataecon',
  DEC = 'dec',
  DENT = 'dent',
  DEP = 'dep',
  DEXA = 'dexa',
  DFD = 'dfd',
  DFI = 'dfi',
  DGCL = 'dgcl',
  DGD = 'dgd',
  DGX = 'dgx',
  DIGG = 'digg',
  DMT = 'dmt',
  DODO = 'dodo',
  DOGE = 'doge',
  DPI = 'dpi',
  DRPU = 'drpu',
  DRV = 'drv',
  DUC = 'duc',
  DX1U = 'dx1u',
  DXGT = 'dxgt',
  DXPT = 'dxpt',
  DXST = 'dxst',
  DYDX = 'dydx',
  DYN = 'dyn',
  EASY = 'easy',
  EBTCQ = 'ebtcq',
  ECHT = 'echt',
  EDISON = 'edison',
  EDN = 'edn',
  EDR = 'edr',
  EFI = 'efi',
  EGL = 'egl',
  EGLD = 'egld',
  EGOLD = 'egold',
  ELF = 'elf',
  EMX = 'emx',
  ENG = 'eng',
  ENJ = 'enj',
  ENS = 'ens',
  EQO = 'eqo',
  ETA = 'eta',
  ETHOS = 'ethos',
  ETV = 'etv',
  EURS = 'eurs',
  EURST = 'eurst',
  EURT = 'eurt',
  EURX = 'eurx',
  EUX = 'eux',
  EVX = 'evx',
  EXE = 'exe',
  FEI = 'fei',
  FET = 'fet',
  FET1 = 'fet1',
  FDT = 'fdt',
  FF1 = 'ff1',
  FFT = 'fft',
  FIRE = 'fire',
  FIXED = 'fixed',
  FLY = 'fly',
  FMF = 'fmf',
  FORTH = 'forth',
  FRONT = 'front',
  FTM = 'ftm',
  FTT = 'ftt',
  FUN = 'fun',
  FWB = 'fwb',
  FXRT = 'fxrt',
  FXS = 'fxs',
  GAL = 'gal',
  GALA = 'gala',
  GAMMA = 'gamma',
  GBPX = 'gbpx',
  GDT = 'gdt',
  GEC = 'gec',
  GEN = 'gen',
  GHUB = 'ghub',
  GIGDROP = 'gigdrop',
  GLDX = 'gldx',
  GLM = 'glm',
  GMT = 'gmt',
  GNO = 'gno',
  GNT = 'gnt',
  GODS = 'gods',
  GOG = 'gog',
  GOLD = 'gold',
  GOT = 'got',
  GRT = 'grt',
  GTAAVE18DP = 'gtaave18dp',
  GTBAT18DP = 'gtbat18dp',
  GTCOMP18DP = 'gtcomp18dp',
  GTGRT18DP = 'gtgrt18dp',
  GTLINK18DP = 'gtlink18dp',
  GTMKR18DP = 'gtmkr18dp',
  GTSNX18DP = 'gtsnx18dp',
  GTUNI18DP = 'gtuni18dp',
  GTUSDT6DP = 'gtusdt6dp',
  GTYFI18DP = 'gtyfi18dp',
  GTWBTC8DP = 'gtwbtc8dp',
  GTO = 'gto',
  GTERC2DP = 'gterc2dp',
  GTERC6DP = 'gterc6dp',
  GTERC18DP = 'gterc18dp',
  GUSD = 'gusd',
  GUSDT = 'gusdt',
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
  HUSD = 'husd',
  HXRO = 'hxro',
  HYB = 'hyb',
  HYDRO = 'hydro',
  I8 = 'i8',
  ICETH = 'iceth',
  IDEX = 'idex',
  IDRC = 'idrc',
  IDRT = 'idrt',
  IMX = 'imx',
  IMXV2 = 'imxv2',
  INCX = 'incx',
  IND = 'ind',
  INDEX = 'index',
  INF = 'inf',
  INJ = 'inj',
  INJV2 = 'injv2',
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
  KIRO = 'kiro',
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
  LOOKS = 'looks',
  LOOM = 'loom',
  LOOM1 = 'loom1',
  LRC = 'lrc',
  LRCV2 = 'lrcv2',
  LYN = 'lyn',
  MANA = 'mana',
  MAPS = 'maps',
  MATIC = 'matic',
  MCAU = 'mcau',
  MCDAI = 'mcdai',
  MCO = 'mco',
  MCO2 = 'mco2',
  MCS = 'mcs',
  MCX = 'mcx',
  MDFC = 'mdfc',
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
  MIZN = 'mizn',
  MKR = 'mkr',
  MNS = 'mns',
  MNDE = 'mnde',
  MOC = 'moc',
  MOF = 'mof',
  MPAY = 'mpay',
  MPL = 'mpl',
  MTCN = 'mtcn',
  MTL = 'mtl',
  MUSD = 'musd',
  MVL = 'mvl',
  MVI = 'mvi',
  NAS = 'nas',
  NCT = 'nct',
  NDX = 'ndx',
  NEU = 'neu',
  NEXO = 'nexo',
  NFTX = 'nftx',
  NGNT = 'ngnt',
  NIAX = 'niax',
  NMR = 'nmr',
  NPXS = 'npxs',
  NS2DRP = 'ns2drp',
  NU = 'nu',
  NYM = 'nym',
  NZDX = 'nzdx',
  OCEAN = 'ocean',
  OCEANV2 = 'oceanv2',
  OGN = 'ogn',
  OM = 'om',
  OKB = 'okb',
  OMG = 'omg',
  ONL = 'onl',
  OPT = 'opt',
  ORAI = 'orai',
  ORBS = 'orbs',
  ORCA = 'orca',
  OXT = 'oxt',
  OXY = 'oxy',
  OHM = 'ohm',
  SD = 'sd',
  SOHM = 'sohm',
  GOHM = 'gohm',
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
  PERP = 'perp',
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
  PRINTS = 'prints',
  PRO = 'pro',
  PRTS = 'prts',
  PSTAKE = 'pstake',
  PUNDIX = 'pundix',
  PUSD = 'pusd',
  PXP = 'pxp',
  PYR = 'pyr',
  QASH = 'qash',
  QCAD = 'qcad',
  QUICK = 'quick',
  QDT = 'qdt',
  QKC = 'qkc',
  QNT = 'qnt',
  QRDO = 'qrdo',
  QRL = 'qrl',
  QSP = 'qsp',
  QVT = 'qvt',
  RAD = 'rad',
  RCOIN = 'rcoin',
  RARE = 'rare',
  RARI = 'rari',
  RAY = 'ray',
  RBY = 'rby',
  RDN = 'rdn',
  REB = 'reb',
  REBL = 'rebl',
  REEF = 'reef',
  REP = 'rep',
  REPV2 = 'repv2',
  RFR = 'rfr',
  RFUEL = 'rfuel',
  RGT = 'rgt',
  RIF = 'rif',
  RINGX = 'ringx',
  RLC = 'rlc',
  RLY = 'rly',
  RNDR = 'rndr',
  ROOK = 'rook',
  RON = 'ron',
  RONC = 'ronc',
  ROOBEE = 'roobee',
  RSR = 'rsr',
  RUBX = 'rubx',
  RUEDATK = 'ruedatk',
  SALT = 'salt',
  SAND = 'sand',
  SASHIMI = 'sashimi',
  SGA = 'sga',
  SGDX = 'sgdx',
  SGR = 'sgr',
  SHK = 'shk',
  SHOPX = 'shopx',
  SHIB = 'shib',
  SHR = 'shr',
  SIH = 'sih',
  SILV = 'silv',
  SIPHER = 'sipher',
  SIS = 'sis',
  SKALE = 'skale',
  SLAB = 'slab',
  SLND = 'slnd',
  SLOT = 'slot',
  SLP = 'slp',
  SLVX = 'slvx',
  SNC = 'snc',
  SNOV = 'snov',
  SNT = 'snt',
  SNX = 'snx',
  SOC = 'soc',
  SPELL = 'spell',
  SPO = 'spo',
  SOLVE = 'solve',
  SRNT = 'srnt',
  SRM = 'srm',
  STBU = 'stbu',
  STC = 'stc',
  STCV2 = 'stcv2',
  STKAAVE = 'stkaave',
  STORE = 'store',
  STORJ = 'storj',
  STMX = 'stmx',
  STORM = 'storm',
  STZEN = 'stzen',
  SUPER = 'super',
  SUSHI = 'sushi',
  SQUIG = 'squig',
  SXP = 'sxp',
  THRESHOLD = 'threshold',
  TAUD = 'taud',
  TBTC1 = 'tbtc1',
  TCAD = 'tcad',
  TCO = 'tco',
  TEL = 'tel',
  TEN = 'ten',
  TENX = 'tenx',
  TERC = 'terc',
  TEUROC = 'teuroc',
  TERC2DP = 'terc2dp',
  TERC6DP = 'terc6dp',
  TERC18DP = 'terc18DP',
  TERC20 = 'terc20',
  TERC2DP1 = 'terc2dp1',
  TERC2DP2 = 'terc2dp2',
  TERC2DP3 = 'terc2dp3',
  TERC2DP4 = 'terc2dp4',
  TERC2DP5 = 'terc2dp5',
  TERC6DP1 = 'terc6dp1',
  TERC6DP2 = 'terc6dp2',
  TERC6DP3 = 'terc6dp3',
  TERC6DP4 = 'terc6dp4',
  TERC6DP5 = 'terc6dp5',
  TERC18DP1 = 'terc18dp1',
  TERC18DP2 = 'terc18dp2',
  TERC18DP3 = 'terc18dp3',
  TERC18DP4 = 'terc18dp4',
  TERC18DP5 = 'terc18dp5',
  TERC18DP6 = 'terc18dp6',
  TERC18DP7 = 'terc18dp7',
  TERC18DP8 = 'terc18dp8',
  TERC18DP9 = 'terc18dp9',
  TERC18DP10 = 'terc18dp10',
  TERC18DP11 = 'terc18dp11',
  TERC18DP12 = 'terc18dp12',
  TERC18DP13 = 'terc18dp13',
  TERC18DP14 = 'terc18dp14',
  TERC18DP15 = 'terc18dp15',
  TGBP = 'tgbp',
  THKD = 'thkd',
  TIOX = 'tiox',
  TKNT = 'tknt',
  TKX = 'tkx',
  TLAB = 'tlab',
  TNT = 'tnt',
  TOK = 'tok',
  TRAC = 'trac',
  TRAXX = 'traxx',
  TRIBE = 'tribe',
  TRL = 'trl',
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
  UMEE = 'umee',
  UNB = 'unb',
  UNI = 'uni',
  UP = 'up',
  UPBTC = 'upbtc',
  UPP = 'upp',
  UPT = 'upt',
  UPUSD = 'upusd',
  UQC = 'uqc',
  URHD = 'urhd',
  USDC = 'usdc',
  // Also available on EOS
  USDT = 'usdt',
  USDX = 'usdx',
  USG = 'usg',
  USPX = 'uspx',
  USTC = 'ustc',
  USX = 'usx',
  UTK = 'utk',
  UTK1 = 'utk1',
  VALOR = 'valor',
  VDX = 'vdx',
  VEGA = 'vega',
  VISR = 'visr',
  VRGX = 'vrgx',
  VXC = 'vxc',
  VSP = 'vsp',
  WAFL = 'wafl',
  WAX = 'wax',
  WABI = 'wabi',
  WTK = 'wtk',
  WBTC = 'wbtc',
  WCFG = 'wcfg',
  WEC = 'wec',
  WET = 'wet',
  WETH = 'weth',
  WHALE = 'whale',
  WHT = 'wht',
  WILD = 'wild',
  WNXM = 'wnxm',
  WLUNA = 'wluna',
  WLXT = 'wlxt',
  WSTETH = 'wsteth',
  WPX = 'wpx',
  WTC = 'wtc',
  WXRP = 'wxrp',
  WXRPV0 = 'wxrpv0',
  WXT = 'wxt',
  XAUD = 'xaud',
  XBGOLD = 'xbgold',
  XCD = 'xcd',
  XEX = 'xex',
  XRL = 'xrl',
  XSGD = 'xsgd',
  XSUSHI = 'xsushi',
  XTP = 'xtp',
  YFDAI = 'yfdai',
  YFI = 'yfi',
  YFII = 'yfii',
  YGG = 'ygg',
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
  'xlm:AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA' = 'xlm:AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',

  // Algorand mainnet tokens
  'algo:USDC-31566704' = 'algo:USDC-31566704',
  'algo:USDt-312769' = 'algo:USDt-312769',
  'algo:MCAU-6547014' = 'algo:MCAU-6547014',
  'algo:VCAD-438505559' = 'algo:VCAD-438505559',

  // Kovan-only ERC20 tokens
  TEST = 'test',
  SCHZ = 'schz',
  CAT = 'cat',

  // Stellar testnet tokens
  'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L' = 'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
  'txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L' = 'txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',

  // Algorand testnet tokens
  'talgo:USON-16026728' = 'talgo:USON-16026728',
  'talgo:SPRW-16026732' = 'talgo:SPRW-16026732',
  'talgo:KAL-16026733' = 'talgo:KAL-16026733',
  'talgo:USDC-10458941' = 'talgo:USDC-10458941',
  'talgo:USDt-180447' = 'talgo:USDt-180447',

  // EOS tokens
  CHEX = 'chex',
  IQ = 'iq',
  EOS_BOX = 'eos:box',

  // Avax Token ERC-20
  'avaxc:qi' = 'avaxc:qi',
  'avaxc:xava' = 'avaxc:xava',
  'avaxc:klo' = 'avaxc:klo',
  'avaxc:joe' = 'avaxc:joe',
  'avaxc:png' = 'avaxc:png',
  'avaxc:usdt' = 'avaxc:usdt',
  'avaxc:usdc' = 'avaxc:usdc',
  'avaxc:link' = 'avaxc:link',

  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
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
  alias?: string; // alternative name usually used during name migrations
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
    Property to help during migration of token names.
    Helps to find a coin/token with a different name than the current one
   */
  public readonly alias?: string;
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

    const intersectionFeatures = Array.from(requiredFeatures).filter((feat) => disallowedFeatures.has(feat));

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
    this.alias = options.alias;
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
