import { ConflictingCoinFeaturesError, DisallowedCoinFeatureError, MissingRequiredCoinFeatureError } from './errors';
import { BaseNetwork } from './networks';

export const enum CoinKind {
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
export const enum CoinFamily {
  ALGO = 'algo',
  BCH = 'bch',
  BSV = 'bsv',
  BTC = 'btc',
  BTG = 'btg',
  DASH = 'dash',
  ETH = 'eth',
  EOS = 'eos',
  LTC = 'ltc',
  OFC = 'ofc',
  RMG = 'rmg',
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
export const enum CoinFeature {
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
}

/**
 * Some coins are representations of another underlying asset class. An example
 * is Wrapped Bitcoin, which represents Bitcoin on the Ethereum blockchain.
 *
 * For these coins, the `UnderlyingAsset` provides a link to the actual
 * asset for which the coin is a unit of account.
 */
export const enum UnderlyingAsset {
  ALGO = 'algo',
  BCH = 'bch',
  BSV = 'bsv',
  BTC = 'btc',
  BTG = 'btg',
  DASH = 'dash',
  USD = 'usd',
  ETH = 'eth',
  EOS = 'eos',
  LTC = 'ltc',
  TRX = 'trx',
  XRP = 'xrp',
  XLM = 'xlm',
  XTZ = 'xtz',
  ZEC = 'zec',

  // ERC 20 tokens
  '1UP' = '1up',
  AE = 'ae',
  AERGO = 'aergo',
  AGWD = 'agwd',
  AION = 'aion',
  AMN = 'amn',
  AMO = 'amo',
  AMON = 'amon',
  AMPX = 'ampx',
  ANA = 'ana',
  ANT = 'ant',
  AOA = 'aoa',
  APPC = 'appc',
  ARCT = 'arct',
  AST = 'ast',
  AUDX = 'audx',
  AXPR = 'axpr',
  BAND = 'band',
  BASIC = 'basic',
  BAT = 'bat',
  BAX = 'bax',
  BBX = 'bbx',
  BCAP = 'bcap',
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
  BTT = 'btt',
  BTU = 'btu',
  BUSD = 'busd',
  BUY = 'buy',
  CADX = 'cadx',
  CAG = 'cag',
  CBAT = 'cbat',
  CBC = 'cbc',
  CCT = 'cct',
  CDAG = 'cdag',
  CDAI = 'cdai',
  CDT = 'cdt',
  CEL = 'cel',
  CETH = 'ceth',
  CGLD = 'cgld',
  CHFX = 'chfx',
  CHSB = 'chsb',
  CIX100 = 'cix100',
  CLN = 'cln',
  CNYX = 'cnyx',
  COMP = 'comp',
  CPAY = 'cpay',
  CPLT = 'cplt',
  CQX = 'cqx',
  CRE = 'cre',
  CREP = 'crep',
  CRO = 'cro',
  CRPT = 'crpt',
  CSLV = 'cslv',
  CSP = 'csp',
  CUSDC = 'cusdc',
  CWBTC = 'cwbtc',
  CVC = 'cvc',
  CZRX = 'czrx',
  DAI = 'dai',
  DATA = 'data',
  DENT = 'dent',
  DGD = 'dgd',
  DGX = 'dgx',
  DMT = 'dmt',
  DRPU = 'drpu',
  DRV = 'drv',
  DYN = 'dyn',
  ECHT = 'echt',
  EDN = 'edn',
  EDR = 'edr',
  EGL = 'egl',
  ELF = 'elf',
  EMX = 'emx',
  ENG = 'eng',
  ENJ = 'enj',
  ERC = 'erc',
  ETHOS = 'ethos',
  ETV = 'etv',
  EURS = 'eurs',
  EURX = 'eurx',
  EUX = 'eux',
  EXE = 'exe',
  FET = 'fet',
  FF1 = 'ff1',
  FMF = 'fmf',
  FTM = 'ftm',
  FTT = 'ftt',
  FUN = 'fun',
  FXRT = 'fxrt',
  GBPX = 'gbpx',
  GEN = 'gen',
  GLDX = 'gldx',
  GNO = 'gno',
  GNT = 'gnt',
  GOLD = 'gold',
  GOT = 'got',
  GTO = 'gto',
  GUSD = 'gusd',
  GXC = 'gxc',
  HEDG = 'hedg',
  HKDX = 'hkdx',
  HLC = 'hlc',
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
  IDRT = 'idrt',
  INCX = 'incx',
  IND = 'ind',
  INX = 'inx',
  ISR = 'isr',
  IVY = 'ivy',
  JBC = 'jbc',
  JPYX = 'jpyx',
  KEY = 'key',
  KIN = 'kin',
  KNC = 'knc',
  KOZ = 'koz',
  KZE = 'kze',
  LBA = 'lba',
  LEO = 'leo',
  LGO = 'lgo',
  LINK = 'link',
  LION = 'lion',
  LNC = 'lnc',
  LOOM = 'loom',
  LRC = 'lrc',
  MATIC = 'matic',
  MCDAI = 'mcdai',
  MCO = 'mco',
  MCX = 'mcx',
  MDX = 'mdx',
  MEDX = 'medx',
  MET = 'met',
  META = 'meta',
  MFG = 'mfg',
  MFPH = 'mfph',
  MFT = 'mft',
  MITH = 'mith',
  MIX = 'mix',
  MKR = 'mkr',
  MOC = 'moc',
  MPAY = 'mpay',
  MTCN = 'mtcn',
  MTL = 'mtl',
  MVL = 'mvl',
  NAS = 'nas',
  NEU = 'neu',
  NEXO = 'nexo',
  NGNT = 'ngnt',
  NMR = 'nmr',
  NPXS = 'npxs',
  NZDX = 'nzdx',
  OMG = 'omg',
  ONL = 'onl',
  OPT = 'opt',
  ORBS = 'orbs',
  OXT = 'oxt',
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
  PLC = 'plc',
  PFCT = 'pfct',
  PLNX = 'plnx',
  PLX = 'plx',
  PMA = 'pma',
  POLY = 'poly',
  POWR = 'powr',
  PPT = 'ppt',
  PRDX = 'prdx',
  PRO = 'pro',
  PRTS = 'prts',
  PUSD = 'pusd',
  QASH = 'qash',
  QCAD = 'qcad',
  QRL = 'qrl',
  QSP = 'qsp',
  QVT = 'qvt',
  RBY = 'rby',
  RDN = 'rdn',
  REB = 'reb',
  REBL = 'rebl',
  REP = 'rep',
  RFR = 'rfr',
  RINGX = 'ringx',
  RLC = 'rlc',
  RONC = 'ronc',
  ROOBEE = 'roobee',
  RUBX = 'rubx',
  SALT = 'salt',
  SGA = 'sga',
  SGDX = 'sgdx',
  SHK = 'shk',
  SHR = 'shr',
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
  STORJ = 'storj',
  STORM = 'storm',
  SXP = 'sxp',
  TAUD = 'taud',
  TCAD = 'tcad',
  TCO = 'tco',
  TEN = 'ten',
  TENX = 'tenx',
  TERC20 = 'terc20',
  TGBP = 'tgbp',
  THKD = 'thkd',
  TIOX = 'tiox',
  TKX = 'tkx',
  TNT = 'tnt',
  TRST = 'trst',
  TRYB = 'tryb',
  TRYX = 'tryx',
  TUSD = 'tusd',
  UKG = 'ukg',
  UP = 'up',
  UPBTC = 'upbtc',
  UPP = 'upp',
  UPT = 'upt',
  UPUSD = 'upusd',
  UQC = 'uqc',
  USDC = 'usdc',
  USDT = 'usdt',
  USDX = 'usdx',
  USPX = 'uspx',
  USX = 'usx',
  UTK = 'utk',
  VALOR = 'valor',
  VDX = 'vdx',
  VRGX = 'vrgx',
  WAFL = 'wafl',
  WAX = 'wax',
  WABI = 'wabi',
  WBTC = 'wbtc',
  WET = 'wet',
  WHT = 'wht',
  WPX = 'wpx',
  WTC = 'wtc',
  WXRP = 'wxrp',
  XCD = 'xcd',
  XRL = 'xrl',
  XTP = 'xtp',
  YNG = 'yng',
  YSEY = 'ysey',
  ZARX = 'zarx',
  ZCO = 'zco',
  ZIL = 'zil',
  ZIX = 'zix',
  ZMT = 'zmt',
  ZOOM = 'zoom',
  ZRX = 'zrx',
  'xlm:BST-GADDFE4R72YUP2AOEL67OHZN3GJQYPC3VE734N2XFMEGRR2L32CZ3XYZ' = 'xlm:BST-GADDFE4R72YUP2AOEL67OHZN3GJQYPC3VE734N2XFMEGRR2L32CZ3XYZ',
  'xlm:VELO-GC7GMEKN2P5LKGOVW55WGHMVQRPPRPHIRFMIC75Z6WPYPYR7B3Z3WEKH' = 'xlm:VELO-GC7GMEKN2P5LKGOVW55WGHMVQRPPRPHIRFMIC75Z6WPYPYR7B3Z3WEKH',
  'xlm:SLT-GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DYHDOI244V47XKQ4GP' = 'xlm:SLT-GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DYHDOI244V47XKQ4GP',
  'xlm:USD-GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX' = 'xlm:USD-GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX',
  'xlm:ETH-GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5' = 'xlm:ETH-GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5',
  'xlm:WXT-GASBLVHS5FOABSDNW5SPPH3QRJYXY5JHA2AOA2QHH2FJLZBRXSG4SWXT' = 'xlm:WXT-GASBLVHS5FOABSDNW5SPPH3QRJYXY5JHA2AOA2QHH2FJLZBRXSG4SWXT',

  // Kovan-only ERC20 tokens
  TEST = 'test',
  SCHZ = 'schz',
  CAT = 'cat',

  // Stellar testnet tokens
  'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L' = 'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
  'txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L' = 'txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
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
  }
}
