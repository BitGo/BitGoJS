/**
 * @prettier
 */
import * as crypto from 'crypto';
import { bip32 } from '@bitgo/utxo-lib';
import { BigNumber } from 'bignumber.js';

import * as utxolib from '@bitgo/utxo-lib';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

import { InitiateRecoveryOptions } from '../recovery';
import { signMessage } from '../bip32util';
import { NotImplementedError } from '../../account-lib';
import { BitGoBase } from '../bitgoBase';
import { Enterprises } from '../enterprise';
import { Keychains, KeyIndices } from '../keychain';
import { Markets } from '../market';
import { PendingApprovals } from '../pendingApproval';
import { Wallets, IWallet, Wallet } from '../wallet';
import { Webhooks } from '../webhook';
import {
  ExtraPrebuildParamsOptions,
  FeeEstimateOptions,
  IBaseCoin,
  ParsedTransaction,
  ITransactionExplanation,
  KeychainsTriplet,
  KeyPair,
  MPCAlgorithm,
  ParseTransactionOptions,
  PrecreateBitGoOptions,
  PresignTransactionOptions,
  RecoverTokenTransaction,
  RecoverWalletTokenOptions,
  SignedTransaction,
  SignTransactionOptions,
  SupplementGenerateWalletOptions,
  TokenEnablementConfig,
  TransactionPrebuild,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  BuildNftTransferDataOptions,
  BaseBroadcastTransactionOptions,
  BaseBroadcastTransactionResult,
} from './iBaseCoin';
import { IInscriptionBuilder } from '../inscriptionBuilder';
import { Hash } from 'crypto';

export abstract class BaseCoin implements IBaseCoin {
  protected readonly bitgo: BitGoBase;
  protected readonly _url: string;
  protected readonly _enterprises: Enterprises;
  protected readonly _wallets: Wallets;
  protected readonly _keychains: Keychains;
  protected readonly _webhooks: Webhooks;
  protected readonly _pendingApprovals: PendingApprovals;
  protected readonly _markets: Markets;
  protected static readonly _coinTokenPatternSeparator = ':';
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase) {
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
   * Gets the statics coin object
   * @returns {Readonly<StaticsBaseCoin>} the statics coin object
   */
  getConfig(): Readonly<StaticsBaseCoin> {
    return this._staticsCoin;
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
   * Gets config for how token enablements work for this coin
   * @returns
   *    requiresTokenEnablement: True if tokens need to be enabled for this coin
   *    supportsMultipleTokenEnablements: True if multiple tokens can be enabled in one transaction
   */
  getTokenEnablementConfig(): TokenEnablementConfig {
    return {
      requiresTokenEnablement: false,
      supportsMultipleTokenEnablements: false,
    };
  }

  /**
   * Flag indicating if this coin supports TSS wallets.
   * @returns {boolean} True if TSS Wallets can be created for this coin
   */
  supportsTss(): boolean {
    return false;
  }

  /**
   * Flag indicating if the coin supports deriving a key with a seed (keyID)
   * to the user/backup keys.
   */
  supportsDeriveKeyWithSeed(): boolean {
    return true;
  }

  /**
   * Flag indicating if this blockchain runs on EVM architecture.
   * @returns {boolean} True if the blockchain runs on EVM architecture.
   */
  isEVM(): boolean {
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
    BigNumber.set({ DECIMAL_PLACES: 24 });
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
   * Create signatures for the backup and bitgo keys using the user key.
   * We can verify the signatures when fetching the keys from wallet-platform later.
   * Currently only `AbstractUtxoCoin` implements and uses the complementary `verifyKeySignature` method.
   * @param prv - the user private key
   * @param backupKeychain - contains the backup public key
   * @param bitgoKeychain - contains the bitgo public key
   */
  public async createKeySignatures(
    prv: string,
    backupKeychain: { pub: string },
    bitgoKeychain: { pub: string }
  ): Promise<{
    backup: string;
    bitgo: string;
  }> {
    return {
      backup: (await this.signMessage({ prv }, backupKeychain.pub)).toString('hex'),
      bitgo: (await this.signMessage({ prv }, bitgoKeychain.pub)).toString('hex'),
    };
  }

  /**
   * Decompose a raw transaction into useful information.
   * @param options - coin-specific
   */
  explainTransaction(options: Record<string, any>): Promise<ITransactionExplanation<any, string | number> | undefined> {
    throw new Error(`not implemented`);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   */
  abstract verifyTransaction(params: VerifyTransactionOptions): Promise<boolean>;

  /**
   * @deprecated use {@see isWalletAddress} instead
   */
  verifyAddress(params: VerifyAddressOptions): Promise<boolean> {
    return this.isWalletAddress(params);
  }

  /**
   * @param params
   * @return true iff address is a wallet address. Must return false if address is outside wallet.
   */
  abstract isWalletAddress(params: VerifyAddressOptions): Promise<boolean>;

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
   * Check whether a coin supports lightning transactions
   * @returns {boolean}
   */
  supportsLightning() {
    return false;
  }

  /**
   * Check whether a coin supports message signing
   * @returns {boolean}
   */
  supportsMessageSigning(): boolean {
    return false;
  }

  /**
   * Check whether a coin supports signing of Typed data
   * @returns {boolean}
   */
  supportsSigningTypedData(): boolean {
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
  newWalletObject(walletParams: any): IWallet {
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

  /**
   * Only used in PendingApproval for comparing PAYGo fees purpose
   * @param params options for parsing
   */
  abstract parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction>;

  /**
   * Generate a key pair on the curve used by the coin
   * @param {Buffer} seed - seed to use for key pair generation
   * @returns {KeyPair} the generated key pair
   */
  abstract generateKeyPair(seed?: Buffer): KeyPair;

  /**
   * Generate a root key pair on the curve used by the coin
   * @param {Buffer} seed - seed to use for key pair generation
   * @returns {KeyPair} the generated key pair
   */
  generateRootKeyPair(seed?: Buffer): KeyPair {
    throw new NotImplementedError('generateRootKeyPair is not supported for this coin');
  }

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

  /**
   * Returns the MPC algorithm (ecdsa or eddsa) used for coins that support TSS
   */
  getMPCAlgorithm(): MPCAlgorithm {
    throw new Error('no MPC algorithm is defined for this coin');
  }

  async recoverToken(params: RecoverWalletTokenOptions): Promise<RecoverTokenTransaction> {
    throw new NotImplementedError('recoverToken is not supported for this coin');
  }

  getInscriptionBuilder(wallet: Wallet): IInscriptionBuilder {
    throw new NotImplementedError('Inscription Builder is not supported for this coin');
  }

  /**
   * Function to get coin specific hash function used to generate transaction digests.
   * @returns {@see Hash} hash function if implemented, otherwise throws exception
   */
  getHashFunction(): Hash {
    throw new NotImplementedError('getHashFunction is not supported for this coin');
  }

  buildNftTransferData(params: BuildNftTransferDataOptions): string {
    throw new NotImplementedError('buildNftTransferData is not supported for this coin');
  }

  /**
   * Broadcast a transaction to the network
   * @param params options for broadcasting
   * @returns {Promise<BaseBroadcastTransactionResult>} result of broadcast
   * @throws {NotImplementedError} if not implemented
   */
  broadcastTransaction(params: BaseBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    throw new NotImplementedError('broadcastTransaction is not supported for this coin');
  }
}
