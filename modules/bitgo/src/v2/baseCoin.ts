/**
 * @prettier
 */
import * as crypto from 'crypto';
import * as bip32 from 'bip32';
import { BigNumber } from 'bignumber.js';
import { BaseCoin as AccountLibBasecoin } from '@bitgo/account-lib';
import * as utxolib from '@bitgo/utxo-lib';

import { BitGo } from '../bitgo';
import { RequestTracer } from './internal/util';
import { Wallet, WalletData } from './wallet';
import { Wallets } from './wallets';
import { Markets } from './markets';
import { Webhooks } from './webhooks';
import { PendingApprovals } from './pendingApprovals';
import { Keychain, Keychains, KeyIndices } from './keychains';
import { Enterprises } from './enterprises';

import { InitiateRecoveryOptions } from './recovery/initiate';
import { signMessage } from '../bip32util';
import { TssUtils } from './internal/tssUtils';

// re-export account lib transaction types
export type TransactionType = AccountLibBasecoin.TransactionType;

export interface TransactionRecipient {
  address: string;
  amount: string | number;
  memo?: string;
}

export interface TransactionFee<TAmount = string> {
  fee: TAmount;
  feeRate?: number;
  size?: number;
}

export interface TransactionExplanation<TFee = any, TAmount = any> {
  displayOrder: string[];
  id: string;
  outputs: TransactionRecipient[];
  outputAmount: TAmount;
  changeOutputs: TransactionRecipient[];
  changeAmount: TAmount;
  fee: TFee;
  proxy?: string;
  producers?: string[];
}

export interface KeyPair {
  pub?: string;
  prv: string;
}

export interface BlsKeyPair extends KeyPair {
  secretShares?: string[];
}

export interface VerifyAddressOptions {
  address: string;
  addressType?: string;
  keychains?: {
    pub: string;
  }[];
  error?: string;
  coinSpecific?: AddressCoinSpecific;
  impliedForwarderVersion?: number;
}

export interface TransactionParams {
  recipients?: TransactionRecipient[];
  walletPassphrase?: string;
  type?: string;
}

export interface AddressVerificationData {
  coinSpecific?: AddressCoinSpecific;
  chain?: number;
  index?: number;
}

export interface VerificationOptions {
  disableNetworking?: boolean;
  keychains?: {
    user?: Keychain;
    backup?: Keychain;
    bitgo?: Keychain;
  };
  addresses?: { [address: string]: AddressVerificationData };
  allowPaygoOutput?: boolean;
  considerMigratedFromAddressInternal?: boolean;
}

export interface VerifyTransactionOptions {
  txPrebuild: TransactionPrebuild;
  txParams: TransactionParams;
  wallet: Wallet;
  verification?: VerificationOptions;
  reqId?: RequestTracer;
}

export interface SupplementGenerateWalletOptions {
  label: string;
  m: number;
  n: number;
  enterprise?: string;
  disableTransactionNotifications?: boolean;
  gasPrice?: number | string;
  eip1559?: {
    maxFeePerGas: number | string;
    maxPriorityFeePerGas?: number | string;
  };
  walletVersion?: number;
  keys: string[];
  isCold: boolean;
  keySignatures?: {
    backup: string;
    bitgo: string;
  };
  rootPrivateKey?: string;
  disableKRSEmail?: boolean;
  multisigType?: 'tss' | 'onchain' | 'blsdkg';
}

export interface FeeEstimateOptions {
  numBlocks?: number;
  hop?: boolean;
  recipient?: string;
  data?: string;
  amount?: string;
}

// TODO (SDKT-9): reverse engineer and add options
export interface ExtraPrebuildParamsOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface PresignTransactionOptions {
  txPrebuild?: TransactionPrebuild;
  walletData: WalletData;
  tssUtils: TssUtils;
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface PrecreateBitGoOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface VerifyRecoveryTransactionOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface ParseTransactionOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface ParsedTransaction {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface SignTransactionOptions {
  [index: string]: unknown;
}

export interface KeychainsTriplet {
  userKeychain: Keychain;
  backupKeychain: Keychain;
  bitgoKeychain: Keychain;
}

export interface TransactionPrebuild {
  txBase64?: string;
  txHex?: string;
  txInfo?: unknown;
  wallet?: Wallet;
  buildParams?: any;
  consolidateId?: string;
  txRequestId?: string;
}

export interface AddressCoinSpecific {
  outputScript?: string;
  redeemScript?: string;
  witnessScript?: string;
  baseAddress?: string;
  pendingChainInitialization?: boolean;
  forwarderVersion?: number;
}

export interface FullySignedTransaction {
  txHex: string; // Transaction in any format required by each coin, i.e. in Tron it is a stringifyed JSON
}

export interface HalfSignedUtxoTransaction {
  txHex: string;
}

export interface HalfSignedAccountTransaction {
  halfSigned?: {
    txHex?: string; // Transaction in any format required by each coin, i.e. in Tron it is a stringifyed JSON
    payload?: string;
    txBase64?: string;
  };
}

export interface SignedTransactionRequest {
  txRequestId: string;
}

export type SignedTransaction =
  | HalfSignedAccountTransaction
  | HalfSignedUtxoTransaction
  | FullySignedTransaction
  | SignedTransactionRequest;

export abstract class BaseCoin {
  protected readonly bitgo: BitGo;
  protected readonly _url: string;
  protected readonly _enterprises: Enterprises;
  protected readonly _wallets: Wallets;
  protected readonly _keychains: Keychains;
  protected readonly _webhooks: Webhooks;
  protected readonly _pendingApprovals: PendingApprovals;
  protected readonly _markets: Markets;
  protected static readonly _coinTokenPatternSeparator = ':';

  protected constructor(bitgo: BitGo) {
    this.bitgo = bitgo;
    this._url = this.bitgo.url('/', 2);
    this._wallets = new Wallets(this.bitgo, this);
    this._keychains = new Keychains(this.bitgo, this);
    this._webhooks = new Webhooks(this.bitgo, this);
    this._pendingApprovals = new PendingApprovals(this.bitgo, this);
    this._enterprises = new Enterprises(this.bitgo, this);
    this._markets = new Markets(this.bitgo, this);
  }

  public url(suffix: string): string {
    return this._url + this.getChain() + suffix;
  }

  public wallets(): Wallets {
    return this._wallets;
  }

  public enterprises(): Enterprises {
    return this._enterprises;
  }

  public keychains(): Keychains {
    return this._keychains;
  }

  public webhooks(): Webhooks {
    return this._webhooks;
  }

  public pendingApprovals(): PendingApprovals {
    return this._pendingApprovals;
  }

  public markets(): Markets {
    return this._markets;
  }

  public static get coinTokenPatternSeparator(): string {
    return this._coinTokenPatternSeparator;
  }

  public get type(): string {
    return this.getChain();
  }

  /**
   * Name of the chain which supports this coin (eg, 'btc', 'eth')
   */
  abstract getChain(): string;

  /**
   * Name of the coin family (eg. for tbtc, this would be btc)
   */
  abstract getFamily(): string;

  /**
   * Human readable full name for the coin
   */
  abstract getFullName(): string;

  /**
   * Flag for sending value of 0.
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Use `sendMany()` to perform wallet sweep.
   * FIXME(BG-39738): add coin.sweepWallet() instead
   */
  sweepWithSendMany(): boolean {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed(): boolean {
    return false;
  }

  /**
   * Flag for determining whether this coin supports account consolidations
   * from its receive addresses to the root address.
   * @returns {boolean} True if okay to consolidate over this coin; false, otherwise
   */
  allowsAccountConsolidations(): boolean {
    return false;
  }

  /**
   * Flag indicating if this coin supports TSS wallets.
   * @returns {boolean} True if TSS Wallets can be created for this coin
   */
  supportsTss(): boolean {
    return false;
  }

  /**
   * Flag indicating if this coin supports BLS-DKG wallets.
   * @returns {boolean} True if BLS-DKG Wallets can be created for this coin
   */
  supportsBlsDkg(): boolean {
    return false;
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  abstract getBaseFactor(): number | string;

  /**
   * Convert a currency amount represented in base units (satoshi, wei, atoms, drops, stroops)
   * to big units (btc, eth, xrp, xlm)
   */
  baseUnitsToBigUnits(baseUnits: string | number): string {
    const dividend = this.getBaseFactor();
    const bigNumber = new BigNumber(baseUnits).dividedBy(dividend);
    // set the format so commas aren't added to large coin amounts
    return bigNumber.toFormat(null as any, null as any, { groupSeparator: '', decimalSeparator: '.' });
  }

  /**
   * Convert a currency amount represented in big units (btc, eth, xrp, xlm)
   * to base units (satoshi, wei, atoms, drops, stroops)
   * @param bigUnits
   */
  bigUnitsToBaseUnits(bigUnits: string | number): string {
    const multiplier = this.getBaseFactor();
    const bigNumber = new BigNumber(bigUnits).times(multiplier);
    if (!bigNumber.isInteger()) {
      throw new Error(`non-integer output resulted from multiplying ${bigUnits} by ${multiplier}`);
    }
    return bigNumber.toFixed(0);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: { prv: string }, message: string): Promise<Buffer> {
    return signMessage(message, bip32.fromBase58(key.prv), utxolib.networks.bitcoin);
  }

  /**
   * Decompose a raw transaction into useful information.
   * @param options - coin-specific
   */
  explainTransaction(options: Record<string, any>): Promise<TransactionExplanation<any, string | number> | undefined> {
    throw new Error(`not implemented`);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   */
  abstract verifyTransaction(params: VerifyTransactionOptions): Promise<boolean>;

  /**
   * @deprecated use {@see isWalletAddress} instead
   */
  verifyAddress(params: VerifyAddressOptions): boolean {
    return this.isWalletAddress(params);
  }

  /**
   * @param params
   * @return true iff address is a wallet address. Must return false if address is outside wallet.
   */
  abstract isWalletAddress(params: VerifyAddressOptions): boolean;

  /**
   * convert address into desired address format.
   * @param address
   * @param format
   */
  canonicalAddress(address: string, format?: unknown): string {
    return address;
  }

  /**
   * Check whether a coin supports blockTarget for transactions to be included in
   * @returns {boolean}
   */
  supportsBlockTarget() {
    return false;
  }

  /**
   * Hook to add additional parameters to the wallet generation
   * @param walletParams
   * @param keychains
   * @return {*}
   */
  supplementGenerateWallet(walletParams: SupplementGenerateWalletOptions, keychains: KeychainsTriplet): Promise<any> {
    return Promise.resolve(walletParams);
  }

  /**
   * Get extra parameters for prebuilding a tx. Add things like hop transaction params
   */
  getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions): Promise<Record<string, unknown>> {
    return Promise.resolve({});
  }

  /**
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   */
  postProcessPrebuild(prebuildResponse: TransactionPrebuild): Promise<TransactionPrebuild> {
    return Promise.resolve(prebuildResponse);
  }

  /**
   * Coin-specific things done before signing a transaction, i.e. verification
   */
  presignTransaction(params: PresignTransactionOptions): Promise<PresignTransactionOptions> {
    return Promise.resolve(params);
  }

  /**
   * Create a new wallet object from a wallet data object
   * @param walletParams
   */
  newWalletObject(walletParams: any): Wallet {
    return new Wallet(this.bitgo, this, walletParams);
  }

  /**
   * Fetch fee estimate information from the server
   * @param {Object} params The params passed into the function
   * @param {Integer} params.numBlocks The number of blocks to target for conformation (Only works for btc)
   * @returns {Object} The info returned from the merchant server
   */
  async feeEstimate(params: FeeEstimateOptions): Promise<any> {
    const query: any = {};
    if (params && params.numBlocks) {
      query.numBlocks = params.numBlocks;
    }

    return this.bitgo.get(this.url('/tx/fee')).query(query).result();
  }

  /**
   * The cold wallet tool uses this function to derive an extended key that is based on the passed key and seed
   * @param key
   * @param seed
   * @returns {{key: string, derivationPath: string}}
   */
  deriveKeyWithSeed({ key, seed }: { key: string; seed: string }): { key: string; derivationPath: string } {
    function sha256(input) {
      return crypto.createHash('sha256').update(input).digest();
    }
    const derivationPathInput = sha256(sha256(`${seed}`)).toString('hex');
    const derivationPathParts = [
      parseInt(derivationPathInput.slice(0, 7), 16),
      parseInt(derivationPathInput.slice(7, 14), 16),
    ];
    const derivationPath = 'm/999999/' + derivationPathParts.join('/');
    const keyNode = bip32.fromBase58(key);
    const derivedKeyNode = keyNode.derivePath(derivationPath);
    return {
      key: derivedKeyNode.toBase58(),
      derivationPath: derivationPath,
    };
  }

  /**
   * Specifies what key we will need for signing - right now we just need the
   * user key.
   */
  keyIdsForSigning(): number[] {
    return [KeyIndices.USER];
  }

  /**
   * Perform additional checks before adding a bitgo key. Base controller
   * is a no-op, but coin-specific controller may do something
   * @param params
   */
  preCreateBitGo(params: PrecreateBitGoOptions): void {
    return;
  }

  /**
   * @deprecated - use getBip32Keys() in conjunction with isValidAddress instead
   */
  initiateRecovery(params: InitiateRecoveryOptions): never {
    throw new Error('deprecated method');
  }

  abstract parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction>;

  /**
   * Generate a key pair on the curve used by the coin
   *
   * @param seed
   */
  abstract generateKeyPair(seed?: Buffer): KeyPair;

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  abstract isValidPub(pub: string): boolean;

  /**
   * Return wether the given m of n wallet signers/ key amounts are valid for the coin
   */
  isValidMofNSetup({ m, n }: { m?: number; n?: number }): boolean {
    return m === 2 && n === 3;
  }

  /**
   * Check if `address` is a plausibly valid address for the given coin.
   *
   * Does not verify that the address belongs to a wallet. For that,
   * use [[verifyAddress]]
   * @param address
   */
  abstract isValidAddress(address: string): boolean;

  /**
   * Sign a transaction
   */
  abstract signTransaction(params: SignTransactionOptions): Promise<SignedTransaction>;

  /**
   * Returns the portion of the transaction that needs to be signed in Buffer format.
   * Only needed for coins that support adding signatures directly (e.g. TSS).
   *
   * @param {String} serializedTx - the unsigned transaction in broadcast format
   * @returns {Promise<Buffer>} - the portion of the transaction that needs to be signed
   */
  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    return Buffer.from(serializedTx);
  }
}
