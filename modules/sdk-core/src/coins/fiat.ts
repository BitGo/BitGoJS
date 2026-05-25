/**
 * @prettier
 */
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  CoinConstructor,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '../';

export interface FiatCoinConfig {
  chain: string;
  fullName: string;
  baseFactor: number;
}

export class Fiat extends BaseCoin {
  private readonly config: FiatCoinConfig;

  constructor(bitgo: BitGoBase, config: FiatCoinConfig) {
    super(bitgo);
    this.config = config;
  }

  static createConstructor(config: FiatCoinConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Fiat(bitgo, config);
  }

  getBaseFactor() {
    return this.config.baseFactor;
  }

  getChain() {
    return this.config.chain;
  }

  getFamily() {
    return 'fiat';
  }

  getFullName() {
    return this.config.fullName;
  }

  isValidMofNSetup({ m, n }: { m: number; n: number }) {
    return m === 0 && n === 0;
  }

  isValidAddress(address: string): boolean {
    throw new MethodNotImplementedError();
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    throw new MethodNotImplementedError();
  }

  isValidPub(pub: string): boolean {
    throw new MethodNotImplementedError();
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  async signTransaction(params: SignTransactionOptions = {}): Promise<SignedTransaction> {
    throw new MethodNotImplementedError();
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams): void {
    throw new MethodNotImplementedError();
  }
}

/**
 * Configuration for all fiat currencies.
 * To add a new fiat currency, just add an entry here — registration is automatic.
 */
export const fiatCoins: FiatCoinConfig[] = [
  { chain: 'fiataed', fullName: 'United Arab Emirates Dirham', baseFactor: 1e2 },
  { chain: 'fiataud', fullName: 'Australian Dollar', baseFactor: 1e2 },
  { chain: 'fiatcad', fullName: 'Canadian Dollar', baseFactor: 1e2 },
  { chain: 'fiatchf', fullName: 'Swiss Franc', baseFactor: 1e2 },
  { chain: 'fiatcny', fullName: 'Chinese Yuan', baseFactor: 1e2 },
  { chain: 'fiateur', fullName: 'European Union Euro', baseFactor: 1e2 },
  { chain: 'fiatgbp', fullName: 'British Pound Sterling', baseFactor: 1e2 },
  { chain: 'fiathkd', fullName: 'Hong Kong Dollar', baseFactor: 1e2 },
  { chain: 'fiatidr', fullName: 'Indonesian Rupiah', baseFactor: 1e2 },
  { chain: 'fiatinr', fullName: 'Indian Rupee', baseFactor: 1e2 },
  { chain: 'fiatjpy', fullName: 'Japanese Yen', baseFactor: 1 },
  { chain: 'fiatkrw', fullName: 'South Korean Won', baseFactor: 1 },
  { chain: 'fiatnok', fullName: 'Norwegian Krone', baseFactor: 1e2 },
  { chain: 'fiatnzd', fullName: 'New Zealand Dollar', baseFactor: 1e2 },
  { chain: 'fiatsek', fullName: 'Swedish Krona', baseFactor: 1e2 },
  { chain: 'fiatsgd', fullName: 'Singapore Dollar', baseFactor: 1e2 },
  { chain: 'fiatusd', fullName: 'USD Dollar', baseFactor: 1e2 },
  { chain: 'fiatzar', fullName: 'South African Rand', baseFactor: 1e2 },
];

/**
 * Testnet configs derived automatically from mainnet configs.
 */
export const testnetFiatCoins: FiatCoinConfig[] = fiatCoins.map((c) => ({
  chain: `t${c.chain}`,
  fullName: `Testnet ${c.fullName}`,
  baseFactor: c.baseFactor,
}));

/**
 * All fiat coin configs (mainnet + testnet).
 */
export const allFiatCoins: FiatCoinConfig[] = [...fiatCoins, ...testnetFiatCoins];
