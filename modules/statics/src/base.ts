import {
  ConflictingCoinFeaturesError,
  DisallowedCoinFeatureError,
  InvalidIdError,
  MissingRequiredCoinFeatureError,
} from './errors';
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
  ARBETH = 'arbeth',
  ATOM = 'atom',
  AVAXC = 'avaxc',
  AVAXP = 'avaxp',
  BCH = 'bch',
  BCHA = 'bcha',
  BERA = 'bera',
  BLD = 'bld', // Agoric
  BSC = 'bsc',
  BSV = 'bsv',
  BTC = 'btc',
  BTG = 'btg',
  CELO = 'celo',
  COREUM = 'coreum',
  CSPR = 'cspr',
  DASH = 'dash',
  DOGE = 'doge',
  DOT = 'dot',
  ETH = 'eth',
  ETH2 = 'eth2',
  ETHW = 'ethw',
  ETC = 'etc',
  EOS = 'eos',
  FIAT = 'fiat',
  HASH = 'hash', // Provenance
  HBAR = 'hbar',
  INJECTIVE = 'injective',
  ISLM = 'islm',
  KAVA = 'kava',
  LTC = 'ltc',
  POLYGON = 'polygon',
  NEAR = 'near',
  OFC = 'ofc',
  OPETH = 'opeth',
  OSMO = 'osmo',
  RBTC = 'rbtc',
  SEI = 'sei',
  SOL = 'sol',
  SUI = 'sui',
  STX = 'stx',
  SUSD = 'susd',
  TIA = 'tia', // Celestia
  TON = 'ton',
  TRX = 'trx',
  XLM = 'xlm',
  XRP = 'xrp',
  XTZ = 'xtz',
  ZEC = 'zec',
  ZETA = 'zeta',
  ZKETH = 'zketh',
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
   * This coin supports creating wallets on different networks with the same keys. Only works for TSS account-base coins
   */
  EVM_WALLET = 'evm-wallet',
  /*
   * This coin supports creating an EVM transaction using Metamask Institutional (MMI).
   */
  METAMASK_INSTITUTIONAL = 'metamask-institutional',
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
  /**
   * @deprecated This property is no longer valid. Please select the following custody option based on the BitGo org:
   * * CUSTODY_BITGO_TRUST
   * * CUSTODY_BITGO_NEW_YORK
   * * CUSTODY_BITGO_GERMANY
   * * CUSTODY_BITGO_SWITZERLAND
   */
  CUSTODY = 'custody',
  /*
  This coin uses TSS for key creation and signing
   */
  TSS = 'tss',
  /*
   * This coin supports staking
   */
  STAKING = 'staking',
  /**
   * This coin is deprecated
   */
  DEPRECATED = 'deprecated',
  /**
   * This coin is a dummy object meant to be a placeholder for an unsupported token
   */
  GENERIC_TOKEN = 'genericToken',
  /*
   * This coin supports custody in BitGo Trust SD entities
   */
  CUSTODY_BITGO_TRUST = 'custody-bitgo-trust',
  /*
   * This coin supports custody in BitGo New York entities
   */
  CUSTODY_BITGO_NEW_YORK = 'custody-bitgo-new-york',
  /*
   * This coin supports custody in BitGo Germany entities
   */
  CUSTODY_BITGO_GERMANY = 'custody-bitgo-germany',
  /*
   * This coin supports custody in BitGo Switzerland entities
   */
  CUSTODY_BITGO_SWITZERLAND = 'custody-bitgo-switzerland',
  /*
   * This coin supports custody in BitGo Switzerland entities
   */
  CUSTODY_BITGO_FRANKFURT = 'custody-bitgo-frankfurt',
  /*
   * This coin supports custody in BitGo Singapore entities
   */
  CUSTODY_BITGO_SINGAPORE = 'custody-bitgo-singapore',
  /*
   * This coin supports custody in BitGo Sister Trust 1 entities
   */
  CUSTODY_BITGO_SISTER_TRUST_ONE = 'custody-bitgo-sister-trust-one',
  /*
   * This coin has transactions that expire after a certain amount of time.
   */
  EXPIRING_TRANSACTIONS = 'expiring-transactions',
  /**
   * This coin supports cold wallets that use a multisig signing protocol
   */
  MULTISIG_COLD = 'multisig-cold',
  /**
   * This coin supports cold wallets that use a TSS signing protocol
   */
  TSS_COLD = 'tss-cold',

  /**
   * This coin uses sha256 hash function for ECDSA TSS signatures
   */
  SHA256_WITH_ECDSA_TSS = 'sha256-with-ecdsa-tss',

  /**
   * This coin is cosmos like coin
   */
  COSMOS_LIKE_COINS = 'cosmos_like_coins',

  /**
   * This coin supports the ability to rebuild transactions on custody signing
   */
  REBUILD_ON_CUSTODY_SIGNING = 'rebuild-on-custody-signing',

  /**
   * This coin supports higher limit for tx request rebuild, which is 10 by default
   */
  INCREASED_TX_REQUEST_REBUILD_LIMIT = 'increased-tx-request-rebuild-limit',

  /**
   * This coin supports bulk transaction creation
   */
  BULK_TRANSACTION = 'bulk-transaction',

  /**
   * This coin supports distributed custody wallets
   */
  DISTRIBUTED_CUSTODY = 'distributed-custody',

  /**
   * This coin supports bulk staking transaction creation
   */
  BULK_STAKING_TRANSACTION = 'bulk-staking-transaction',
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
  ARBETH = 'arbeth',
  ATOM = 'atom',
  AVAXC = 'avaxc',
  AVAXP = 'avaxp',
  AXL = 'AXL',
  AXLV2 = 'axlv2',
  BCH = 'bch',
  BCHA = 'bcha',
  BERA = 'bera',
  BLD = 'bld', // Agoric
  BSC = 'bsc',
  BSV = 'bsv',
  BTC = 'btc',
  BTG = 'btg',
  DASH = 'dash',
  DOT = 'dot',
  CELO = 'celo', // Celo main coin
  COREUM = 'coreum',
  CSPR = 'cspr',
  ETH = 'eth',
  ETH2 = 'eth2',
  ETHW = 'ethw',
  ETC = 'etc',
  EOS = 'eos',
  ERD = 'erd',
  EUR = 'eur',
  EURCVV0 = 'eurcvv0',
  EURCV = 'eurcv',
  EUROC = 'euroc',
  GBP = 'gbp',
  GTC = 'gtc',
  HASH = 'hash', // Provenance
  HBAR = 'hbar', // Hedera main coin
  INJECTIVE = 'injective',
  ISLM = 'islm',
  KAVA = 'kava',
  LTC = 'ltc',
  NEAR = 'near',
  OPETH = 'opeth',
  OSMO = 'osmo',
  POLYGON = 'polygon',
  RBTC = 'rbtc', // RSK main coin
  SEI = 'sei',
  SOL = 'sol',
  SUI = 'sui',
  STX = 'stx',
  TIA = 'tia', // Celestia
  TON = 'ton',
  TRX = 'trx',
  USD = 'usd',
  XLM = 'xlm',
  XRP = 'xrp',
  XTZ = 'xtz',
  ZEC = 'zec',
  ZETA = 'zeta',
  ZKETH = 'zketh',

  // ERC 20 tokens
  '$Evmosia.com' = '$evmosia.com',
  '0xREVIEW' = '0xreview',
  '1INCH' = '1inch',
  '1UP' = '1up',
  '3CRV' = '3crv',
  AAVE = 'aave',
  ABT = 'abt',
  ACE = 'ace',
  ACEV2 = 'acev2',
  ACXT = 'acxt',
  ACH = 'ach',
  ADABEAR = 'adabear',
  ADABULL = 'adabull',
  AE = 'ae',
  AERGO = 'aergo',
  AERGO1 = 'aergo1',
  AGEUR = 'ageur',
  AGI = 'agi',
  AGLD = 'agld',
  AGWD = 'agwd',
  AION = 'aion',
  AJNA = 'ajna',
  AKRO = 'akro',
  ALCX = 'alcx',
  ALD = 'ald',
  ALDRIN = 'aldrin',
  ALEPH = 'aleph',
  ALGOBEAR = 'algobear',
  ALGOBULL = 'algobull',
  ALGODOOM = 'algodoom',
  ALGOHEDGE = 'algohedge',
  ALGOMOON = 'algomoon',
  ALTDOOM = 'altdoom',
  ALTMOON = 'altmoon',
  ALI = 'ali',
  ALICE = 'alice',
  ALK = 'alk',
  ALM = 'alm',
  ALPHA = 'alpha',
  ALTBEAR = 'altbear',
  ALTBULL = 'altbull',
  ALTHEDGE = 'althedge',
  AMKT = 'amkt',
  AMN = 'amn',
  AMO = 'amo',
  AMP = 'amp',
  AMPL = 'ampl',
  AMON = 'amon',
  AMPX = 'ampx',
  ANA = 'ana',
  ANGLE = 'angle',
  ANKR = 'ankr',
  ANKRETH = 'ankreth',
  ANML = 'anml',
  ANT = 'ant',
  ANTV2 = 'antv2',
  AOA = 'aoa',
  APPC = 'appc',
  APT = 'apt',
  AQT = 'aqt',
  ARCT = 'arct',
  ARCX = 'arcx',
  ARMOR = 'armor',
  ARTEQ = 'arteq',
  ASD = 'asd',
  AST = 'ast',
  ATA = 'ata',
  ATF = 'atf',
  ATL = 'atl',
  ATLAS = 'atlas',
  ATOMBEAR = 'atombear',
  ATOMBULL = 'atombull',
  ATRI = 'atri',
  AUDIO = 'audio',
  AUDX = 'audx',
  AUSDT = 'ausdt',
  AUST = 'aust',
  AVT = 'avt',
  AWBTC = 'awbtc',
  AXPR = 'axpr',
  AXS = 'axs',
  AXSV2 = 'axsv2',
  AYFI = 'ayfi',
  AZUKI = 'azuki',
  AZUKI2 = 'azuki2',
  AZUKIPEPE = 'azukipepe',
  BADGER = 'badger',
  BAI = 'bai',
  BAL = 'bal',
  BAND = 'band',
  BANK = 'bank',
  BAO = 'bao',
  BASIC = 'basic',
  BAT = 'bat',
  BAX = 'bax',
  BBANK = 'bbank',
  BBSAMO = 'bbsamo',
  BBTC = 'BBTC',
  BBX = 'bbx',
  BCAP = 'bcap',
  BCC = 'bcc',
  BCHBEAR = 'bchbear',
  BCHBULL = 'bchbull',
  BCHDOOM = 'bchdoom',
  BCHHEDGE = 'bchhedge',
  BCHMOON = 'bchmoon',
  BCIO = 'bcio',
  BCUT = 'bcut',
  BCT = 'bct',
  BEAR = 'bear',
  BEARSHIT = 'bearshit',
  BED = 'bed',
  BEND = 'bend',
  BEPRO = 'bepro',
  BGBG = 'bgbg',
  BICO = 'bico',
  BID = 'bid',
  BIDL = 'bidl',
  BIRD = 'bird',
  BIT = 'bit',
  BKX = 'bkx',
  BLCT = 'blct',
  BLT = 'blt',
  BLUR = 'blur',
  BLUR0x083 = 'blur0x083',
  BLUR0xb93 = 'blur0xb93',
  BLZ = 'blz',
  BNB = 'bnb',
  BNBBEAR = 'bnbbear',
  BNBBULL = 'bnbbull',
  BNBDOOM = 'bnbdoom',
  BNBHEDGE = 'bnbhedge',
  BNBMOON = 'bnbmoon',
  BNK = 'bnk',
  BNL = 'bnl',
  BNT = 'bnt',
  BNTY = 'bnty',
  BOND = 'bond',
  BONE = 'bone',
  BORG = 'borg',
  BOTTO = 'botto',
  BLOCKS = 'blocks',
  BOX = 'box',
  BOBA = 'boba',
  BRD = 'brd',
  BRIBE = 'bribe',
  BRZ = 'brz',
  BSGG = 'bsgg',
  BST = 'bst',
  BSVBEAR = 'bsvbear',
  BSVBULL = 'bsvbull',
  BSVDOOM = 'bsvdoom',
  BSVHEDGE = 'bsvhedge',
  BSVMOON = 'bsvmoon',
  BSX = 'bsx',
  BTC2XFLI = 'btc2xfli',
  BTMXBEAR = 'btmxbear',
  BTMXBULL = 'btmxbull',
  BTRST = 'btrst',
  BTSG = 'btsg',
  BTT = 'btt',
  BTU = 'btu',
  BULL = 'bull',
  BULLSHIT = 'bullshit',
  BURP = 'burp',
  BUSD = 'busd',
  BUY = 'buy',
  BPT = 'bpt',
  BVOL = 'bvol',
  BXX = 'bxx',
  BXXV1 = 'bxxv1',
  BZZ = 'bzz',
  C3 = 'c3',
  C6P = 'c6p',
  C8P = 'c8p',
  C98 = 'c98',
  CACXT = 'cacxt',
  CADX = 'cadx',
  CAG = 'cag',
  CANTO = 'canto',
  CAPS = 'caps',
  CASH = 'cash',
  CBAT = 'cbat',
  CBC = 'cbc',
  CBETH = 'cbeth',
  CBRL = 'cbrl',
  CCAI = 'ccai',
  CCT = 'cct',
  CDAG = 'cdag',
  CDAI = 'cdai',
  CDAIV2 = 'cdaiV2',
  CDT = 'cdt',
  CEL = 'cel',
  CELLS = 'cells',
  CELR = 'celr',
  CERE = 'cere',
  CETH = 'ceth',
  CFX = 'cfx',
  CHAINLINK = 'chainlink',
  CHART = 'chart',
  CHO = 'cho',
  CHFX = 'chfx',
  CHR = 'chr',
  CHSB = 'chsb',
  CHZ = 'chz',
  CIBO = 'cibo',
  CIX100 = 'cix100',
  CLIQ = 'cliq',
  CLN = 'cln',
  CLT = 'clt',
  CLV = 'clv',
  CMFI = 'cmfi',
  CNFI = 'cnfi',
  CNG = 'cng',
  CNYX = 'cnyx',
  COLLAR = 'collar',
  COMP = 'comp',
  CONV = 'conv',
  COPE = 'cope',
  CORE = 'core',
  COTI = 'coti',
  COVAL = 'coval',
  COVER = 'cover',
  COVERPROTOCOL = 'coverprotocol',
  COW = 'cow',
  CPAY = 'cpay',
  CPLT = 'cplt',
  CPOOL = 'cpool',
  CQT = 'cqt',
  CQX = 'cqx',
  CRA = 'cra',
  CRDT = 'crdt',
  CRE = 'cre',
  CREAM = 'cream',
  CREP = 'crep',
  CRI = 'cri',
  CRO = 'cro',
  CRV = 'crv',
  CRPT = 'crpt',
  CRPT1 = 'crpt1',
  CSLV = 'cslv',
  CSOL = 'csol',
  CSP = 'csp',
  CTSI = 'ctsi',
  CUBE = 'cube',
  CUSD = 'cusd',
  CUSDC = 'cusdc',
  CVXFXS = 'cvxfxs',
  CWAR = 'cwar',
  CWBTC = 'cwbtc',
  CVC = 'cvc',
  CVX = 'cvx',
  CZRX = 'czrx',
  DACXI = 'dacxi',
  DADI = 'dadi',
  DAMM = 'damm',
  DAI = 'dai',
  DAO = 'dao',
  DAOLANG = 'daolang',
  DATA = 'data',
  DATAV2 = 'datav2',
  DATAECON = 'dataecon',
  DAWN = 'dawn',
  DEC = 'dec',
  DENT = 'dent',
  DEP = 'dep',
  DEPAY = 'depay',
  DEXA = 'dexa',
  DFD = 'dfd',
  DFI = 'dfi',
  DFL = 'dfl',
  DGCL = 'dgcl',
  DGD = 'dgd',
  DGLD = 'dgld',
  DGX = 'dgx',
  DHT = 'dht',
  DIGG = 'digg',
  DIA = 'dia',
  DING = 'ding',
  DMG = 'dmg',
  DMT = 'dmt',
  DNA = 'dna',
  DNT = 'dnt',
  DODO = 'dodo',
  DOG = 'dog',
  DOGE = 'doge',
  DOGEBEAR = 'dogebear',
  DOGEBEAR2021 = 'dogebear2021',
  DOGEBULL = 'dogebull',
  DOOM = 'doom',
  DOOMSHIT = 'doomshit',
  DOSE = 'dose',
  DOTK = 'dotk',
  DPAY = 'dpay',
  DPI = 'dpi',
  DPX = 'dpx',
  DPY = 'dpy',
  DRAM = 'dram',
  DRGNBEAR = 'drgnbear',
  DRGNBULL = 'drgnbull',
  DRPU = 'drpu',
  DRV = 'drv',
  DUC = 'duc',
  DUCK = 'duck',
  DUSD = 'dusd',
  DUST = 'dust',
  DX1U = 'dx1u',
  DXGT = 'dxgt',
  DXPT = 'dxpt',
  DXST = 'dxst',
  DYDX = 'dydx',
  DYN = 'dyn',
  EASY = 'easy',
  EBTCQ = 'ebtcq',
  ECHT = 'echt',
  ECOX = 'ecox',
  EDEN = 'eden',
  EDISON = 'edison',
  EDO = 'edo',
  ELON = 'elon',
  EMB = 'emb',
  EDN = 'edn',
  EDR = 'edr',
  EFI = 'efi',
  EGL = 'egl',
  EGLD = 'egld',
  EGOLD = 'egold',
  ELF = 'elf',
  ELU = 'elu',
  EMX = 'emx',
  ENG = 'eng',
  ENJ = 'enj',
  ENS = 'ens',
  EON = 'eon',
  EOP = 'eop',
  EOSBEAR = 'eosbear',
  EOSBULL = 'eosbull',
  EOSDOOM = 'eosdoom',
  EOSHEDGE = 'eoshedge',
  EOSMOON = 'eosmoon',
  EQO = 'eqo',
  ETA = 'eta',
  ETHBULL = 'ethbull',
  ETCBEAR = 'etcbear',
  ETCBULL = 'etcbull',
  ETCDOOM = 'etcdoom',
  ETCHEDOOM = 'etchedoom',
  ETCMOON = 'etcmoon',
  ETHBEAR = 'ethbear',
  ETHDOOM = 'ethdoom',
  ETHHEDGE = 'ethhedge',
  ETHMOON = 'ethmoon',
  ETHOPT = 'ethopt',
  ETHOS = 'ethos',
  ETHX = 'ethx',
  ETV = 'etv',
  ETX = 'etx',
  EUL = 'eul',
  EURS = 'eurs',
  EURST = 'eurst',
  EURT = 'eurt',
  EURX = 'eurx',
  EUX = 'eux',
  EVER = 'ever',
  EVRY = 'evry',
  EVX = 'evx',
  EXCHBEAR = 'exchbear',
  EXCHBULL = 'exchbull',
  EXCHDOOM = 'exchdoom',
  EXCHHEDGE = 'exchhedge',
  EXCHMOON = 'exchmoon',
  EXE = 'exe',
  FANT = 'fant',
  FEI = 'fei',
  FET = 'fet',
  FET1 = 'fet1',
  FDT = 'fdt',
  FF1 = 'ff1',
  FF6000 = 'ff6000',
  FFT = 'fft',
  FIDA = 'fida',
  FIDU = 'fidu',
  FIN = 'fin',
  FIRE = 'fire',
  FIRSTBLOOD = 'firstblood',
  FIXED = 'fixed',
  FLIP = 'flip',
  FLOKI = 'floki',
  FLY = 'fly',
  FMF = 'fmf',
  FOREX = 'forex',
  FORT = 'fort',
  FORTH = 'forth',
  FOX = 'fox',
  FPIS = 'fpis',
  FRAX = 'frax',
  FRONT = 'front',
  FT = 'ft',
  FTM = 'ftm',
  FTT = 'ftt',
  FTT20 = 'ftt20',
  FTX2 = 'ftx2',
  FUCKFTX = 'fuckftx',
  FUN = 'fun',
  FWB = 'fwb',
  FX = 'fx',
  FXRT = 'fxrt',
  FXS = 'fxs',
  GAL = 'gal',
  GALA = 'gala',
  GALAV2 = 'galav2',
  'GAME.COM' = 'game.com',
  GAMMA = 'gamma',
  GARI = 'gari',
  GATE = 'gate',
  GBPT = 'gbpt',
  GBPX = 'gbpx',
  GDT = 'gdt',
  GEAR = 'gear',
  GEC = 'gec',
  GEN = 'gen',
  GENE = 'gene',
  GENIE = 'genie',
  GF = 'gf',
  GFI = 'gfi',
  GHUB = 'ghub',
  GIGDROP = 'gigdrop',
  GIV = 'giv',
  GLDX = 'gldx',
  GLM = 'glm',
  GMT = 'gmt',
  GNO = 'gno',
  GNT = 'gnt',
  GODS = 'gods',
  GOHM = 'gohm',
  GOG = 'gog',
  GOLD = 'gold',
  GOM = 'gom',
  GOMINING = 'gomining',
  GOT = 'got',
  GRID = 'grid',
  GRT = 'grt',
  GST = 'gst',
  GT = 'gt',
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
  GXT = 'gxt',
  GYEN = 'gyen',
  HBB = 'hbb',
  HBTC = 'hbtc',
  HCN = 'hcn',
  HDO = 'hdo',
  HEDG = 'hedg',
  HEDGE = 'hedge',
  HEDGESHIT = 'hedgeshit',
  HFT = 'hft',
  HGET = 'hget',
  HIT = 'hit',
  HKDX = 'hkdx',
  HLC = 'hlc',
  HMT = 'hmt',
  HNT = 'hnt',
  HOLD = 'hold',
  HOLY = 'holy',
  HOP = 'hop',
  HOT = 'hot',
  HPO = 'hpo',
  HQG = 'hqg',
  HQT = 'hqt',
  HST = 'hst',
  HT = 'ht',
  HTBEAR = 'htbear',
  HTBULL = 'htbull',
  HTDOOM = 'htdoom',
  HTHEDGE = 'hthedge',
  HTMOON = 'htmoon',
  HUM = 'hum',
  HUMV2 = 'humv2',
  HUSD = 'husd',
  HXRO = 'hxro',
  HYB = 'hyb',
  HYDRO = 'hydro',
  HYDROPROTOCOL = 'hydroprotocol',
  I8 = 'i8',
  IBEUR = 'ibeur',
  IBOX = 'ibox',
  IBVOL = 'ibvol',
  ICETH = 'iceth',
  IDEX = 'idex',
  IDRC = 'idrc',
  IDRT = 'idrt',
  ILV = 'ilv',
  IMX = 'imx',
  IMXV2 = 'imxv2',
  INCX = 'incx',
  IND = 'ind',
  INDEX = 'index',
  INDI = 'indi',
  INF = 'inf',
  INJ = 'inj',
  INJV2 = 'injv2',
  INST = 'inst',
  INSUR = 'insur',
  INV = 'inv',
  INX = 'inx',
  IOTX = 'iotx',
  IP3 = 'ip3',
  ISF = 'isf',
  ISR = 'isr',
  IVO = 'ivo',
  IVY = 'ivy',
  JASMY = 'jasmy',
  JBC = 'jbc',
  JCR = 'jcr',
  JCG = 'jcg',
  JET = 'jet',
  JFIN = 'jfin',
  JPYX = 'jpyx',
  JSOL = 'jsol',
  KARATE = 'karate',
  KARMA = 'karma',
  KCASH = 'kcash',
  KEEP = 'keep',
  KEY = 'key',
  KILL0 = 'kill0',
  KIN = 'kin',
  KIRO = 'kiro',
  KISHUI = 'kishui',
  KITTY = 'kitty',
  KNC = 'knc',
  KNC2 = 'knc2',
  KOIN = 'koin',
  KOL = 'kol',
  KOZ = 'koz',
  KP3R = 'kp3r',
  KTRC = 'ktrc',
  KZE = 'kze',
  LA = 'la',
  LAYER = 'layer',
  LAYERZERO = 'layerzero',
  LBA = 'lba',
  LCX = 'lcx',
  LDO = 'ldo',
  LEND = 'lend',
  LEO = 'leo',
  LEOBEAR = 'leobear',
  LEOBULL = 'leobull',
  LEODOOM = 'leodoom',
  LEOHEDGE = 'leohedge',
  LEOMOON = 'leomoon',
  LEV = 'lev',
  LGO = 'lgo',
  LIEN = 'lien',
  LIKE = 'like',
  LINA = 'lina',
  LINK = 'link',
  LINKBEAR = 'linkbear',
  LINKBULL = 'linkbull',
  LION = 'lion',
  LIT = 'lit',
  LITH = 'lith',
  LITv2 = 'litv2',
  LKR = 'lkr',
  LMWR = 'lmwr',
  LNC = 'lnc',
  LOOKS = 'looks',
  LOOM = 'loom',
  LOOM1 = 'loom1',
  LOVE = 'love',
  LOWB = 'lowb',
  LPT = 'lpt',
  LQID = 'lqid',
  LQTY = 'lqty',
  LRC = 'lrc',
  LRCV2 = 'lrcv2',
  LSETH = 'lseth',
  LTCBEAR = 'ltcbear',
  LTCBULL = 'ltcbull',
  LTCDOOM = 'ltcdoom',
  LTCHEDGE = 'ltchedge',
  LTCMOON = 'ltcmoon',
  LUA = 'lua',
  LUNA = 'luna',
  LUNAWORMHOLE = 'lunawormhole',
  LYN = 'lyn',
  LYXE = 'lyxe',
  MAGIC = 'magic',
  MANA = 'mana',
  MANTRADAO = 'mantradao',
  MAPS = 'maps',
  MASK = 'mask',
  MATH = 'math',
  MATIC = 'matic',
  MATICBEAR = 'maticbear',
  MATICBEAR2021 = 'maticbear2021',
  MATICBULL = 'maticbull',
  MATTER = 'matter',
  MBS = 'mbs',
  MCAU = 'mcau',
  MCB = 'mcb',
  MCDAI = 'mcdai',
  MCO = 'mco',
  MCO2 = 'mco2',
  MCS = 'mcs',
  MCX = 'mcx',
  MDFC = 'mdfc',
  MDX = 'mdx',
  MEAN = 'mean',
  MEDIA = 'media',
  MEDIAv2 = 'mediav2',
  MEDX = 'medx',
  MEME = 'meme',
  MEOW = 'meow',
  MER = 'mer',
  MET = 'met',
  META = 'meta',
  METIS = 'metis',
  MFG = 'mfg',
  MFPH = 'mfph',
  MFT = 'mft',
  MIDBEAR = 'midbear',
  MIDBULL = 'midbull',
  MIDDOOM = 'middoom',
  MIDHEDGE = 'midhedge',
  MIDMOON = 'midmoon',
  MILKV2 = 'milkv2',
  MIM = 'mim',
  MIR = 'mir',
  MITH = 'mith',
  MIX = 'mix',
  MIZN = 'mizn',
  MKR = 'mkr',
  MLN = 'mln',
  MNS = 'mns',
  MNT = 'mnt',
  MNDE = 'mnde',
  MOC = 'moc',
  MOCHI = 'mochi',
  MOF = 'mof',
  MOH = 'moh',
  MOON = 'moon',
  MOONSHIT = 'moonshit',
  MNGO = 'mngo',
  MPAY = 'mpay',
  MPL = 'mpl',
  MPLX = 'mplx',
  MRTWEET = 'mrtweet',
  MSOL = 'msol',
  MTA = 'mta',
  MTCN = 'mtcn',
  MTH = 'mth',
  MTL = 'mtl',
  MTV = 'mtv',
  MUSD = 'musd',
  MVL = 'mvl',
  MVI = 'mvi',
  MWT = 'mwt',
  NAAI = 'naai',
  NAS = 'nas',
  NCT = 'nct',
  NDX = 'ndx',
  'NEAR-ERC20' = 'near-erc20',
  NEU = 'neu',
  NEWO = 'newo',
  NEXO = 'nexo',
  'NFCWIN-SB-2021' = 'nfcwin-sb-2021',
  NFTX = 'nftx',
  NGNT = 'ngnt',
  NIAX = 'niax',
  NKN = 'nkn',
  NMR = 'nmr',
  NOTE = 'note',
  NOVA = 'nova',
  NPXS = 'npxs',
  NS2DRP = 'ns2drp',
  NU = 'nu',
  NUTS = 'nuts',
  NYM = 'nym',
  NZDX = 'nzdx',
  OAX = 'oax',
  OCEAN = 'ocean',
  OCEANV2 = 'oceanv2',
  OCTAV = 'octav',
  OGN = 'ogn',
  OGV = 'ogv',
  OKB = 'okb',
  OKBBEAR = 'okbbear',
  OKBBULL = 'okbbull',
  OKBDOOM = 'okbdoom',
  OKBHEDGE = 'okbhedge',
  OKBMOON = 'okbmoon',
  OM = 'om',
  OMG = 'omg',
  ONL = 'onl',
  OP = 'op',
  OPIUM = 'opium',
  OPT = 'opt',
  ORAI = 'orai',
  ORBS = 'orbs',
  ORC = 'orc',
  ORCA = 'orca',
  OS = 'os',
  OSETH = 'oseth',
  OUSD = 'ousd',
  OUSG = 'ousg',
  OXT = 'oxt',
  OXY = 'oxy',
  OHM = 'ohm',
  PAI = 'pai',
  PAR = 'par',
  PASS = 'pass',
  PAU = 'pau',
  PAX = 'pax',
  PAXG = 'paxg',
  PAXGBEAR = 'paxgbear',
  PAXGBULL = 'paxgbull',
  PAY = 'pay',
  PBCH = 'pbch',
  PBTC = 'pbtc',
  PDATA = 'pdata',
  PDI = 'pdi',
  PEBBLE = 'pebble',
  PEG = 'peg',
  PENDLE = 'pendle',
  PEOPLE = 'people',
  PEPE = 'pepe',
  PERP = 'perp',
  PETH = 'peth',
  PHA = 'pha',
  PHNX = 'phnx',
  PICK = 'pick',
  PICKLE = 'pickle',
  PIE = 'pie',
  PINE = 'pine',
  PLC = 'plc',
  PFCT = 'pfct',
  PLANET = 'planet',
  PLNX = 'plnx',
  PLX = 'plx',
  PMA = 'pma',
  POLIS = 'polis',
  POLY = 'poly',
  POLS = 'pols',
  PONYS = 'ponys',
  PORT = 'port',
  POWR = 'powr',
  PPT = 'ppt',
  PRDX = 'prdx',
  PRINTS = 'prints',
  PRISM = 'prism',
  PRO = 'pro',
  PROM = 'prom',
  PROS = 'pros',
  PRT = 'prt',
  PRTS = 'prts',
  PSOL = 'psol',
  PSP = 'psp',
  PSTAKE = 'pstake',
  PSY = 'psy',
  PTU = 'ptu',
  PUNDIX = 'pundix',
  PUSD = 'pusd',
  PXP = 'pxp',
  PYR = 'pyr',
  PYUSD = 'pyusd',
  QASH = 'qash',
  QCAD = 'qcad',
  QOM = 'qom',
  QUICK = 'quick',
  QDT = 'qdt',
  QKC = 'qkc',
  QLINDO = 'qlindo',
  QNT = 'qnt',
  QRDO = 'qrdo',
  QRL = 'qrl',
  QSP = 'qsp',
  QVT = 'qvt',
  RAD = 'rad',
  RALPH = 'ralph',
  RAMP = 'ramp',
  RARE = 'rare',
  RARI = 'rari',
  RAY = 'ray',
  RAZOR = 'razor',
  RBANK = 'rbank',
  RBN = 'rbn',
  RBX = 'rbx',
  RBY = 'rby',
  RCOIN = 'rcoin',
  RCT = 'rct',
  RDN = 'rdn',
  REAL = 'real',
  REB = 'reb',
  REBL = 'rebl',
  REEF = 'reef',
  REF = 'ref',
  REKT = 'rekt',
  REKTGAME = 'rektgame',
  REN = 'ren',
  RENBTC = 'renbtc',
  RENDOGE = 'rendoge',
  REP = 'rep',
  REPV2 = 'repv2',
  REQ = 'REQ',
  'RETH-ROCKET' = 'reth-rocket',
  'RETH-STAFI' = 'reth-stafi',
  'RETH-H' = 'reth-h',
  RETH2 = 'reth2',
  REVV = 'revv',
  RFOX = 'rfox',
  RFR = 'rfr',
  RFUEL = 'rfuel',
  RGT = 'rgt',
  RIF = 'rif',
  RINGX = 'ringx',
  RLC = 'rlc',
  RLY = 'rly',
  RND = 'rnd',
  RNDR = 'rndr',
  ROOK = 'rook',
  RON = 'ron',
  RONC = 'ronc',
  ROOBEE = 'roobee',
  RPL = 'rpl',
  RSR = 'rsr',
  RUBX = 'rubx',
  RUEDATK = 'ruedatk',
  RUN = 'run',
  RYOSHI = 'ryoshi',
  SAIL = 'sail',
  SAITABIT = 'saitabit',
  SALT = 'salt',
  SAND = 'sand',
  SASHIMI = 'sashimi',
  SAMO = 'samo',
  SBC = 'sbc',
  SBF = 'sbf',
  SBR = 'sbr',
  // Saber IOU Token (Liquidity Mining Rewards)
  SBRIOU = 'sbriou',
  SCNSOL = 'scnsol',
  SCOPE = 'scope',
  SD = 'sd',
  SDL = 'sdl',
  SECO = 'seco',
  SETH = 'seth',
  'SETH-H' = 'seth-h',
  SETH2 = 'seth2',
  SEWERCOIN = 'sewercoin',
  SGA = 'sga',
  SGDX = 'sgdx',
  SGR = 'sgr',
  SGT = 'sgt',
  SHDW = 'shdw',
  SHEESH = 'sheesh',
  SHIDO = 'shido',
  SHK = 'shk',
  SHOPX = 'shopx',
  SHOW = 'show',
  SHIB = 'shib',
  SHR = 'shr',
  SIH = 'sih',
  SILV = 'silv',
  SIPHER = 'sipher',
  SIS = 'sis',
  SKALE = 'skale',
  SLAB = 'slab',
  SLC = 'slc',
  SLCL = 'slcl',
  SLND = 'slnd',
  SLOT = 'slot',
  SLP = 'slp',
  SLRS = 'slrs',
  SLVX = 'slvx',
  SNC = 'snc',
  SNM = 'snm',
  SNOV = 'snov',
  SNT = 'snt',
  SNX = 'snx',
  SNY = 'sny',
  SOC = 'soc',
  SOHM = 'sohm',
  SOMM = 'somm',
  SOS = 'sos',
  SPA = 'spa',
  SPELL = 'spell',
  SPF = 'spf',
  SPO = 'spo',
  SOLVE = 'solve',
  'SQUID2.0' = 'squid2.0',
  SRNT = 'srnt',
  SRM = 'srm',
  STARS = 'stars',
  STATE = 'state',
  STBU = 'stbu',
  STC = 'stc',
  STCV2 = 'stcv2',
  STEP = 'step',
  STETH = 'steth',
  STG = 'stg',
  STKAAVE = 'stkaave',
  STMX = 'stmx',
  STORE = 'store',
  STORJ = 'storj',
  STORM = 'storm',
  STRIKE = 'strike',
  STRK = 'strk',
  STSOL = 'stsol',
  STZEN = 'stzen',
  'SUI-ERC20' = 'sui-erc20',
  SUN = 'sun',
  SUNNY = 'sunny',
  SUPER = 'super',
  SUPERPERIO = 'superperio',
  SUSD = 'susd',
  SUSHI = 'sushi',
  SQUIG = 'squig',
  SVT = 'svt',
  SWAG = 'swag',
  SWEAT = 'sweat',
  SWISE = 'swice',
  SWITCH = 'switch',
  SWRV = 'swrv',
  SXP = 'sxp',
  SYN = 'syn',
  SYNCH = 'synch',
  'SYNTH-SUSD' = 'synth-susd',
  THRESHOLD = 'threshold',
  THEU = 'theu',
  TAUD = 'taud',
  TBILL = 'tbill',
  TBTC1 = 'tbtc1',
  TBTC2 = 'tbtc2',
  TCAD = 'tcad',
  TCO = 'tco',
  TEL = 'tel',
  TELEGRAMDAO = 'telegramdao',
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
  BGERCH = 'bgerch',
  TGBP = 'tgbp',
  THKD = 'thkd',
  TIO = 'tio',
  TIOX = 'tiox',
  TKMK = 'tkmk',
  TKNT = 'tknt',
  TKX = 'tkx',
  TLAB = 'tlab',
  TLM = 'tlm',
  TLOS = 'tlos',
  TMATIC = 'tmatic',
  TNT = 'tnt',
  TOKAMAK = 'tokamak',
  TOKE = 'toke',
  TOMI = 'tomi',
  TOMOBEAR = 'tomobear',
  TOMOBEAR2 = 'tomobear2',
  TOMOBULL = 'tomobull',
  TOMOE = 'tomoe',
  TOK = 'tok',
  TONCOIN = 'toncoin',
  TOPM = 'topm',
  TRAC = 'trac',
  TRAXX = 'traxx',
  TRIBE = 'tribe',
  TRL = 'trl',
  TRST = 'trst',
  TRU = 'tru',
  TRUMPLOSE = 'trumplose',
  TRUMPWIN = 'trumpwin',
  TRXBEAR = 'trxbear',
  TRXBULL = 'trxbull',
  TRXDOOM = 'trxdoom',
  TRXHEDGE = 'trxhedge',
  TRXMOON = 'trxmoon',
  // Bilira
  TRYB = 'tryb',
  // TRYB on Solana - https://solscan.io/token/6ry4WBDvAwAnrYJVv6MCog4J8zx6S3cPgSqnTsDZ73AR
  TRYB2 = 'tryb2',
  TRYBBEAR = 'trybbear',
  TRYBBULL = 'trybbull',
  TRYX = 'tryx',
  TSUKA = 'tsuka',
  TULIP = 'tulip',
  TUPOLIS = 'tupolis',
  TUSD = 'tusd',
  TUSDC = 'tusdc',
  TUSDT = 'tusdt',
  TUSRM = 'tusrm',
  TWDOGE = 'twdoge',
  TXL = 'txl',
  UAIR = 'uair',
  UBXT = 'ubxt',
  UCO = 'uco',
  UKG = 'ukg',
  UMA = 'uma',
  UMEE = 'umee',
  UNB = 'unb',
  UNI = 'uni',
  UOS = 'uos',
  UP = 'up',
  UPBTC = 'upbtc',
  UPP = 'upp',
  UPT = 'upt',
  UPUSD = 'upusd',
  UQC = 'uqc',
  URHD = 'urhd',
  USDC = 'usdc',
  'USDC-POS-WORMHOLE' = 'usdc-pos-wormhole',
  USDGLO = 'usdglo',
  USDH = 'usdh',
  USDK = 'usdk',
  // Also available on EOS
  USDT = 'usdt',
  USDTBEAR = 'usdtbear',
  USDTBULL = 'usdtbull',
  USDTDOOM = 'usdtdoom',
  USDTHEDGE = 'usdthedge',
  USDTMOON = 'usdtmoon',
  USDX = 'usdx',
  USG = 'usg',
  USPX = 'uspx',
  UST = 'ust',
  'UST-WORMHOLE' = 'ust-wormhole',
  USX = 'usx',
  UTK = 'utk',
  UTK1 = 'utk1',
  UXB = 'uxb',
  UXP = 'uxp',
  VALOR = 'valor',
  VBNT = 'vbnt',
  VCORE = 'vcore',
  VDX = 'vdx',
  VEE = 'vee',
  VEGA = 'vega',
  VEXT = 'vext',
  VGX = 'vgx',
  VI = 'vi',
  VISR = 'visr',
  VIU = 'viu',
  VRA = 'vra',
  VRGX = 'vrgx',
  VSP = 'vsp',
  VXC = 'vxc',
  VXV = 'vxv',
  // Wrapped AAVE
  WAAVE = 'waave',
  WABI = 'wabi',
  WAFL = 'wafl',
  WAGMI = 'wagmi',
  // Wrapped AAVAX
  WAVAX = 'wavax',
  WAVES = 'waves',
  WAX = 'wax',
  WAXP = 'waxp',
  // Wrapped BNB
  WBNB = 'wbnb',
  WECAN = 'wecan',
  WFEE = 'wfee',
  WHAT = 'what',
  WOO = 'woo',
  WTK = 'wtk',
  WBTC = 'wbtc',
  WDAIV2 = 'wdaiv2',
  WDOGE = 'wdoge',
  WCFG = 'wcfg',
  WEC = 'wec',
  WET = 'wet',
  WETH = 'weth',
  WFLOW = 'wflow',
  WFFT = 'wfft',
  WHALE = 'whale',
  WHT = 'wht',
  WILD = 'wild',
  WNXM = 'wnxm',
  WLD = 'wld',
  WLUNA = 'wluna',
  WLXT = 'wlxt',
  // Wrapped SOL
  WSOL = 'wsol',
  WSTETH = 'wsteth',
  WPX = 'wpx',
  WTC = 'wtc',
  // USD Coin (Wormhole)
  WUSDC = 'wusdc',
  WUSDCV2 = 'wusdvcv2',
  // Tether USD (Wormhole)
  WUSDTV2 = 'wusdtv2',
  WXRP = 'wxrp',
  WXRPV0 = 'wxrpv0',
  WXT = 'wxt',
  XAUD = 'xaud',
  XAURY = 'xaury',
  XAUT = 'xaut',
  XAUTBEAR = 'xautbear',
  XAUTBULL = 'xautbull',
  XBGOLD = 'xbgold',
  XCD = 'xcd',
  XCN = 'xcn',
  XDEFI = 'xdefi',
  XDOGE = 'xdoge',
  XEX = 'xex',
  XLMBEAR = 'xlmbear',
  XLMBULL = 'xlmbull',
  XRL = 'xrl',
  XRPBEAR = 'xrpbear',
  XRPBULL = 'xrpbull',
  XRPDOOM = 'xrpdoom',
  XRPHEDGE = 'xrphedge',
  XRPMOON = 'xrpmoon',
  XSGD = 'xsgd',
  XSUSHI = 'xsushi',
  XTP = 'xtp',
  XTZBEAR = 'xtzbear',
  XTZBULL = 'xtzbull',
  XUSD = 'xusd',
  XX = 'xx',
  YAMV2 = 'yamv2',
  YFDAI = 'yfdai',
  YFI = 'yfi',
  YFII = 'yfii',
  YFL = 'yfl',
  YGG = 'ygg',
  YLD = 'yld',
  YNG = 'yng',
  YSEY = 'ysey',
  ZARX = 'zarx',
  ZBC = 'zbc',
  ZBU = 'zbu',
  ZCO = 'zco',
  ZECBEAR = 'zecbear',
  ZECBULL = 'zecbull',
  ZETACHAIN = 'zetachain',
  ZIL = 'zil',
  ZIP = 'zip',
  ZIX = 'zix',
  ZKS = 'zks',
  ZLW = 'zlw',
  ZMT = 'zmt',
  ZOOM = 'zoom',
  'ZRO-0x320' = 'zro-0x320',
  'ZRO-0xFCF' = 'zro-0xfcf',
  'ZRO-0xE5C' = 'zro-0xe5c',
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
  'xlm:EURC-GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2' = 'xlm:EURC-GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',

  // Eth NFTs
  // generic NFTs
  'erc721:token' = 'erc721:token',
  'erc1155:token' = 'erc1155:token',
  'nonstandard:token' = 'nonstandard:token',
  // Test Eth NFTs
  'terc721:token' = 'terc721:token',
  'terc1155:token' = 'terc1155:token',
  'tnonstandard:token' = 'tnonstandard:token',

  // Algorand mainnet tokens
  'algo:USDC-31566704' = 'algo:USDC-31566704',
  'algo:USDt-312769' = 'algo:USDt-312769',
  'algo:MCAU-6547014' = 'algo:MCAU-6547014',
  'algo:QCAD-84507107' = 'algo:QCAD-84507107',
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
  'talgo:JPT-162085446' = 'talgo:JPT-162085446',

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
  'avaxc:cai' = 'avaxc:cai',
  'avaxc:aave' = 'avaxc:aave',
  'avaxc:btc' = 'avaxc:btc',
  'avaxc:dai' = 'avaxc:dai',
  'avaxc:tryb' = 'avaxc:tryb',
  'avaxc:wbtc' = 'avaxc:wbtc',
  'avaxc:weth' = 'avaxc:weth',
  'tavaxc:opm' = 'tavaxc:opm',
  // Begin FTX missing AVAXC tokens
  'avaxc:yeti' = 'avaxc:yeti',
  'avaxc:spell' = 'avaxc:spell',
  'avaxc:yusd' = 'avaxc:yusd',
  'avaxc:yusdcrv-f' = 'avaxc:yusdcrv-f',
  'avaxc:ecd' = 'avaxc:ecd',
  'avaxc:blzz' = 'avaxc:blzz',
  'avaxc:ptp' = 'avaxc:ptp',
  'avaxc:stg' = 'avaxc:stg',
  'avaxc:syn' = 'avaxc:syn',
  'avaxc:aavausdc' = 'avaxc:aavausdc',
  'avaxc:tusd' = 'avaxc:tusd',
  'avaxc:crv' = 'avaxc:crv',
  'avaxc:savax' = 'avaxc:savax',
  'avaxc:ampl' = 'avaxc:ampl',
  'avaxc:cnr' = 'avaxc:cnr',
  'avaxc:roco' = 'avaxc:roco',
  'avaxc:aavadai' = 'avaxc:aavadai',
  'avaxc:vtx' = 'avaxc:vtx',
  'avaxc:wavax' = 'avaxc:wavax',
  'avaxc:bnb' = 'avaxc:bnb',
  'avaxc:aavausdt' = 'avaxc:aavausdt',
  'avaxc:acre' = 'avaxc:acre',
  'avaxc:gmx' = 'avaxc:gmx',
  'avaxc:mim' = 'avaxc:mim',
  'avaxc:axlusdc' = 'avaxc:axlusdc',
  'avaxc:lot' = 'avaxc:lot',
  'avaxc:av3crv' = 'avaxc:av3crv',
  'avaxc:time' = 'avaxc:time',
  'avaxc:uni.e' = 'avaxc:uni.e',
  'avaxc:sb' = 'avaxc:sb',
  'avaxc:dyp' = 'avaxc:dyp',
  'avaxc:sing' = 'avaxc:sing',
  'avaxc:gohm' = 'avaxc:gohm',
  'avaxc:boofi' = 'avaxc:boofi',
  'avaxc:eth' = 'avaxc:eth',
  'avaxc:wmemo' = 'avaxc:wmemo',
  'avaxc:fxs' = 'avaxc:fxs',
  'avaxc:sifu' = 'avaxc:sifu',
  'avaxc:sushi.e' = 'avaxc:sushi.e',
  'avaxc:sushi' = 'avaxc:sushi',
  'avaxc:mimatic' = 'avaxc:mimatic',
  'avaxc:sspell' = 'avaxc:sspell',
  'avaxc:grape' = 'avaxc:grape',
  'avaxc:xjoe' = 'avaxc:xjoe',
  'avaxc:bsgg' = 'avaxc:bsgg',
  'avaxc:roy' = 'avaxc:roy',
  'avaxc:wow' = 'avaxc:wow',
  'avaxc:wine' = 'avaxc:wine',
  'avaxc:mu' = 'avaxc:mu',
  'avaxc:frax' = 'avaxc:frax',
  'avaxc:movr' = 'avaxc:movr',
  'avaxc:ice' = 'avaxc:ice',
  'avaxc:note' = 'avaxc:note',
  // End FTX missing AVAXC tokens

  // polygon Token ERC-20
  'polygon:usdc' = 'polygon:usdc',
  'polygon:usdcv2' = 'polygon:usdcv2',
  'polygon:usdt' = 'polygon:usdt',
  'polygon:weth' = 'polygon:weth',
  'polygon:wbtc' = 'polygon:wbtc',
  'polygon:sand' = 'polygon:sand',
  'polygon:dai' = 'polygon:dai',
  'polygon:woo' = 'polygon:woo',
  'polygon:aave' = 'polygon:aave',
  'polygon:link' = 'polygon:link',
  'polygon:tusd' = 'polygon:tusd',
  'polygon:cel' = 'polygon:cel',
  'polygon:busd' = 'polygon:busd',
  'polygon:frax' = 'polygon:frax',
  'polygon:crv' = 'polygon:crv',
  'polygon:uni' = 'polygon:uni',
  'polygon:fcd' = 'polygon:fcd',
  'polygon:ape' = 'polygon:ape',
  'polygon:srm' = 'polygon:srm',
  'polygon:fly' = 'polygon:fly',
  'polygon:gfc' = 'polygon:gfc',
  'polygon:rbw' = 'polygon:rbw',
  'polygon:zed' = 'polygon:zed',
  'polygon:vext' = 'polygon:vext',
  'polygon:vcnt' = 'polygon:vcnt',
  'polygon:sushi' = 'polygon:sushi',
  'polygon:wmatic' = 'polygon:wmatic',
  'polygon:1inch' = 'polygon:1inch',
  'polygon:comp' = 'polygon:comp',
  'polygon:sol' = 'polygon:sol',
  'polygon:wavax' = 'polygon:wavax',
  'polygon:wbnb' = 'polygon:wbnb',
  'polygon:wftm' = 'polygon:wftm',
  'polygon:yfi' = 'polygon:yfi',
  'polygon:treta' = 'polygon:treta',
  'polygon:orb' = 'polygon:orb',
  'polygon:route' = 'polygon:route',
  'polygon:sbc' = 'polygon:sbc',
  'polygon:xsgd' = 'polygon:xsgd',

  // Polygon NFTs
  // generic NFTs
  'erc721:polygontoken' = 'erc721:polygontoken',
  'erc1155:polygontoken' = 'erc1155:polygontoken',

  // BSC Token BEP-20
  'bsc:busd' = 'bsc:busd',
  'bsc:hook' = 'bsc:hook',
  'bsc:ksm' = 'bsc:ksm',
  'bsc:usdt' = 'bsc:usdt',
  'bsc:vet' = 'bsc:vet',
  'bsc:cake' = 'bsc:cake',
  'tbsc:busd' = 'tbsc:busd',
  // BSC NFTs
  // generic NFTs
  'erc721:bsctoken' = 'erc721:bsctoken',
  'erc1155:bsctoken' = 'erc1155:bsctoken',
  // Test BSC NFTs
  'terc721:bsctoken' = 'terc721:bsctoken',
  'terc1155:bsctoken' = 'terc1155:bsctoken',

  // Polygon testnet tokens
  'tpolygon:derc20' = 'tpolygon:derc20',
  'tpolygon:link' = 'tpolygon:link',
  'tpolygon:name' = 'tpolygon:name',
  'tpolygon:opm' = 'tpolygon:opm',
  'tpolygon:pme' = 'tpolygon:pme',

  // generic NFTs
  'terc721:polygontoken' = 'terc721:polygontoken',
  'terc1155:polygontoken' = 'terc1155:polygontoken',

  // Arbitrum mainnet tokens
  'arbeth:link' = 'arbeth:link',
  'arbeth:usdc' = 'arbeth:usdc',
  'arbeth:usdcv2' = 'arbeth:usdcv2',
  'arbeth:usdt' = 'arbeth:usdt',

  // Arbitrum testnet tokens
  'tarbeth:link' = 'tarbeth:link',

  // Optimism mainnet tokens
  'opeth:link' = 'opeth:link',
  'opeth:usdc' = 'opeth:usdc',
  'opeth:usdcv2' = 'opeth:usdcv2',
  'opeth:usdt' = 'opeth:usdt',

  // Optimism testnet tokens
  'topeth:terc18dp' = 'topeth:terc18dp',

  // zkSync mainnet tokens
  'zketh:link' = 'zketh:link',

  // zkSync testnet tokens
  'tzketh:link' = 'tzketh:link',

  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  NONSTANDARD = 'nonstandard',

  // Cardano Token
  adaTestnetToken = 'temporary-placeholder',

  // solana token
  '3uejh-usdc' = '3uejh-usdc',
  'avax-usdc' = 'avax-usdc',
  'bop-usdc' = 'bop-usdc',
  'crown' = 'crown',
  'elu-usdt' = 'elu-usdt',
  'fida-usdc' = 'fida-usdc',
  'fida-usdt' = 'fida-usdt',
  'ftt-ftt' = 'ftt-ftt',
  'link-usdc' = 'link-usdc',
  'lqid-usdc' = 'lqid-usdc',
  'maticpo-usdc' = 'maticpo-usdc',
  'msol-sol' = 'msol-sol',
  'msol-usdc' = 'msol-usdc',
  'prism-usdc' = 'prism-usdc',
  'pyth' = 'pyth',
  'rendoge-usdc' = 'rendoge-usdc',
  'shdw-usdc' = 'shdw-usdc',
  'sol-wtust' = 'sol-wtust',
  'srm-usdc' = 'srm-usdc',
  'srmet-srm' = 'srmet-srm',
  'sushi-usdc' = 'sushi-usdc',
  'tuatlas' = 'tuatlas',
  'tucope' = 'tucope',
  'tulike' = 'tulike',
  'tureal' = 'tureal',
  'tusamo' = 'tusamo',
  'usdt-usdc' = 'usdt-usdc',
  'wbwbnb-usdc' = 'wbwbnb-usdc',
  'wheth-usdc' = 'wheth-usdc',
  'wtust-usdt' = 'wtust-usdt',
  'xcope-usdc' = 'xcope-usdc',
  'xrp-sollet' = 'xrp-sollet',
  'aury' = 'aury',
  'dio' = 'dio',
  'sol-perp' = 'sol-perp',
  'sol-woo' = 'sol-woo',
  'sol-weth' = 'sol-weth',
  'btc-sollet' = 'btc-sollet',
  'eth-sollet' = 'eth-sollet',
  'bonk' = 'bonk',

  // XRP tokens
  'txrp:tst-rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd' = 'txrp:tst-rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
}

/**
 * This is the curve BitGo signs against with the user, backup and BitGo key.
 */
export enum KeyCurve {
  Secp256k1 = 'secp256k1',
  Ed25519 = 'ed25519',
  BLS = 'bls',
}

/**
 * This enum contains the base units for the coins that BitGo supports
 */
export enum BaseUnit {
  ATOM = 'uatom',
  ETH = 'wei',
  BTC = 'satoshi',
  BSC = 'jager',
  XLM = 'stroop',
  TRX = 'sun',
  HBAR = 'tinybar',
  ALGO = 'microAlgo',
  EOS = 'eos', // eos has no base unit. smallest amount in eos is 4 decimals
  SOL = 'lamport',
  ADA = 'lovelace',
  USD = 'USD',
  LTC = 'microlitecoins',
  DASH = 'duff',
  ZEC = 'zatoshi',
  CSPR = 'mote',
  DOT = 'planck',
  XRP = 'drop',
  XTZ = 'micro xtz',
  STX = 'micro-STX',
  SUI = 'MIST',
  TON = 'nanoton',
  NEAR = 'yocto',
  OFC = 'ofcCoin',
  OSMO = 'uosmo',
  FIAT = 'fiatCoin',
  TIA = 'utia',
  HASH = 'nhash',
  BLD = 'ubld',
  SEI = 'usei',
  INJECTIVE = 'inj',
  ZETA = 'azeta',
  KAVA = 'ukava',
  COREUM = 'ucore',
  TCOREUM = 'utestcore', // Coreum testnet uses different name for native coin
  BERA = 'abera',
  ISLM = 'aISLM',
}

export interface BaseCoinConstructorOptions {
  id: string; // uuid v4
  fullName: string; // full, human-readable name of this coin. Eg, "Bitcoin Cash" for bch
  name: string; // unique identifier for this coin, usually the lowercase ticker or symbol. Eg, "btc" for bitcoin
  alias?: string; // alternative name usually used during name migrations
  prefix?: string;
  suffix?: string;
  baseUnit: string; // the base unit for each coin. e.g. satoshi for BTC
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
  public readonly id: string;
  public readonly fullName: string;
  public readonly name: string;
  public readonly prefix?: string;
  public readonly suffix?: string;
  public readonly baseUnit: string;
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

  private static isValidUuidV4 = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

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

    // assets require a valid uuid v4 id
    if (!BaseCoin.isValidUuidV4(options.id)) {
      throw new InvalidIdError(options.name, options.id);
    }
  }

  protected constructor(options: BaseCoinConstructorOptions) {
    this.validateOptions(options);

    this.id = options.id;
    this.fullName = options.fullName;
    this.name = options.name;
    this.alias = options.alias;
    this.prefix = options.prefix;
    this.suffix = options.suffix;
    this.baseUnit = options.baseUnit;
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
