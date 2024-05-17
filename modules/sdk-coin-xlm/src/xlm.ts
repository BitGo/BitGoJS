import assert from 'assert';
import * as _ from 'lodash';
import * as querystring from 'querystring';
import * as url from 'url';
import * as request from 'superagent';
import * as stellar from 'stellar-sdk';
import { BigNumber } from 'bignumber.js';

import {
  BaseCoin,
  BitGoBase,
  checkKrsProvider,
  common,
  ExtraPrebuildParamsOptions,
  InvalidAddressError,
  InvalidMemoIdError,
  ITransactionRecipient,
  KeyIndices,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  promiseProps,
  SignTransactionOptions as BaseSignTransactionOptions,
  StellarFederationUserNotFoundError,
  TokenEnablementConfig,
  TransactionExplanation as BaseTransactionExplanation,
  TransactionParams as BaseTransactionParams,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient as BaseTransactionOutput,
  UnexpectedAddressError,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions as BaseVerifyTransactionOptions,
  Wallet,
  NotSupported,
} from '@bitgo/sdk-core';
import { toBitgoRequest } from '@bitgo/sdk-api';
import { getStellarKeys } from './getStellarKeys';

/**
 * XLM accounts support virtual (muxed) addresses
 * A base address starts with "G" and is tied to the underlying "real" account
 * A muxed address starts with "M" and combines the base address with a 64-bit integer ID in order to provide
 * an alternative to memo ids.
 */
interface AddressDetails {
  baseAddress: string;
  address: string;
  id?: string;
  memoId?: string | undefined;
}

interface Memo {
  type: stellar.MemoType;
  value: string;
}

interface InitiateRecoveryOptions {
  userKey: string;
  backupKey: string;
  recoveryDestination: string;
  krsProvider?: string;
  walletPassphrase?: string;
}

interface RecoveryOptions extends InitiateRecoveryOptions {
  rootAddress?: string;
}

interface RecoveryTransaction {
  txBase64: string;
  recoveryAmount: number;
  coin?: string;
  backupKey?: string;
  txInfo?: any;
  feeInfo?: any;
}

interface BuildOptions {
  wallet?: Wallet;
  recipients?: Record<string, string>[];
  type?: string;
  walletPassphrase?: string;
  [index: string]: unknown;
}

interface TransactionPrebuild extends BaseTransactionPrebuild {
  txBase64: string;
}

interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

interface HalfSignedTransaction {
  halfSigned: {
    txBase64: string;
  };
  recipients?: ITransactionRecipient[];
  type?: string;
}

interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}

interface ExplainTransactionOptions {
  txHex?: string;
  txBase64?: string;
}

interface TransactionMemo {
  value?: string;
  type?: string;
}

interface TransactionOperation {
  type: string;
  coin: string;
  limit?: string;
  asset?: stellar.Asset;
}

interface TransactionOutput extends BaseTransactionOutput {
  coin: string;
}

interface TransactionExplanation extends BaseTransactionExplanation {
  memo: TransactionMemo;
}

interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

interface TrustlineOptions {
  token: string;
  action: string;
  limit?: string;
}

interface TransactionParams extends BaseTransactionParams {
  trustlines?: TrustlineOptions[];
}

interface VerifyTransactionOptions extends BaseVerifyTransactionOptions {
  txParams: TransactionParams;
}

export class Xlm extends BaseCoin {
  public readonly homeDomain: string;
  public static readonly tokenPatternSeparator = '-'; // separator for token code and issuer
  static readonly maxMemoId: string = '0xFFFFFFFFFFFFFFFF'; // max unsigned 64-bit number = 18446744073709551615
  // max int64 number supported by the network (2^63)-1
  // See: https://www.stellar.org/developers/guides/concepts/assets.html#amount-precision-and-representation
  static readonly maxTrustlineLimit: string = '9223372036854775807';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
    this.homeDomain = 'bitgo.com'; // used for reverse federation lookup
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Xlm(bitgo);
  }

  protected getStellarNetwork(): stellar.Networks {
    return stellar.Networks.PUBLIC;
  }

  /**
   * Factor between the base unit and its smallest subdivison
   */
  getBaseFactor() {
    return 1e7;
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  getChain(): string {
    return 'xlm';
  }

  /**
   * Identifier for the coin family
   */
  getFamily(): string {
    return 'xlm';
  }

  /**
   * Complete human-readable name of this coin
   */
  getFullName(): string {
    return 'Stellar';
  }

  /**
   * Url at which the stellar federation server can be reached
   */
  getFederationServerUrl(): string {
    return common.Environments[this.bitgo.getEnv()].stellarFederationServerUrl;
  }

  /**
   * Url at which horizon can be reached
   */
  getHorizonUrl(): string {
    return 'https://horizon.stellar.org';
  }

  /** inheritdoc */
  generateKeyPair(seed?: Buffer): KeyPair {
    const pair = seed ? stellar.Keypair.fromRawEd25519Seed(seed) : stellar.Keypair.random();
    return {
      pub: pair.publicKey(),
      prv: pair.secret(),
    };
  }

  /**
   * Get decoded ed25519 public key from raw data
   *
   * @param pub Raw public key
   * @returns Encoded public key
   */
  getPubFromRaw(pub: string): string {
    return stellar.StrKey.encodeEd25519PublicKey(Buffer.from(pub, 'hex'));
  }

  /**
   * Get decoded ed25519 private key from raw data
   *
   * @param prv Raw private key
   * @returns Encoded private key
   */
  getPrvFromRaw(prv: string): string {
    return stellar.StrKey.encodeEd25519SecretSeed(Buffer.from(prv, 'hex'));
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param pub the pub to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    return stellar.StrKey.isValidEd25519PublicKey(pub);
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    return stellar.StrKey.isValidEd25519SecretSeed(prv);
  }

  /**
   * Return boolean indicating whether a memo id is valid
   *
   * @param memoId memo id
   * @returns true if memo id is valid
   */
  isValidMemoId(memoId: string): boolean {
    let memoIdNumber;
    try {
      stellar.Memo.id(memoId); // throws if the value is not valid memo id
      memoIdNumber = new BigNumber(memoId);
    } catch (e) {
      return false;
    }

    return memoIdNumber.gte(0) && memoIdNumber.lt(Xlm.maxMemoId);
  }

  supportsDeriveKeyWithSeed(): boolean {
    return false;
  }

  /**
   * Evaluates whether a memo is valid
   *
   * @param value value of the memo
   * @param type type of the memo
   * @returns true if value and type are a valid
   */
  isValidMemo({ value, type }: Memo): boolean {
    if (!value || !type) {
      return false;
    }
    try {
      // throws if the value is not valid for the type
      // valid types are: 'id', 'text', 'hash', 'return'
      // See https://www.stellar.org/developers/guides/concepts/transactions.html#memo
      stellar.Memo[type](value);
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * Create instance of stellar.MuxedAccount from M address
   * See: https://developers.stellar.org/docs/glossary/muxed-accounts
   */
  getMuxedAccount(address: string): stellar.MuxedAccount {
    try {
      return stellar.MuxedAccount.fromAddress(address, '0');
    } catch (e) {
      throw new Error(`invalid muxed address: ${address}`);
    }
  }

  /**
   * Return boolean indicating whether a muxed address is valid
   * See: https://developers.stellar.org/docs/glossary/muxed-accounts
   *
   * @param address
   * @returns {boolean}
   */
  isValidMuxedAddress(address: string): boolean {
    if (!_.isString(address) || !address.startsWith('M')) {
      return false;
    }

    try {
      // return true if muxed account is valid or throw
      return !!stellar.MuxedAccount.fromAddress(address, '0');
    } catch (e) {
      return false;
    }
  }

  /**
   * Minimum balance of a 2-of-3 multisig wallet
   * @returns minimum balance in stroops
   */
  async getMinimumReserve(): Promise<number> {
    const server = new stellar.Server(this.getHorizonUrl());

    const horizonLedgerInfo = await server.ledgers().order('desc').limit(1).call();

    if (!horizonLedgerInfo) {
      throw new Error('unable to connect to Horizon for reserve requirement data');
    }

    const baseReserve = horizonLedgerInfo.records[0].base_reserve_in_stroops;

    // 2-of-3 wallets have a minimum reserve of 5x the base reserve
    return 5 * baseReserve;
  }

  /**
   * Transaction fee for each operation
   * @returns transaction fee in stroops
   */
  async getBaseTransactionFee(): Promise<number> {
    const server = new stellar.Server(this.getHorizonUrl());

    const horizonLedgerInfo = await server.ledgers().order('desc').limit(1).call();

    if (!horizonLedgerInfo) {
      throw new Error('unable to connect to Horizon for reserve requirement data');
    }

    return horizonLedgerInfo.records[0].base_fee_in_stroops;
  }

  /**
   * Process address into address and memo id
   *
   * @param address the address
   * @returns object containing address and memo id
   */
  getAddressDetails(address: string): AddressDetails {
    if (address.startsWith('M')) {
      if (this.isValidMuxedAddress(address)) {
        const muxedAccount = this.getMuxedAccount(address);
        return {
          baseAddress: muxedAccount.baseAccount().accountId(),
          address,
          id: muxedAccount.id(),
          memoId: undefined,
        };
      } else {
        throw new InvalidAddressError(`invalid muxed address: ${address}`);
      }
    }

    const destinationDetails = url.parse(address);
    const destinationAddress = destinationDetails.pathname || '';
    if (!destinationAddress || !stellar.StrKey.isValidEd25519PublicKey(destinationAddress)) {
      throw new Error(`invalid address: ${address}`);
    }
    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        baseAddress: address,
        address: address,
        id: undefined,
        memoId: undefined,
      };
    }

    if (!destinationDetails.query) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const queryDetails = querystring.parse(destinationDetails.query);
    if (!queryDetails.memoId) {
      // if there are more properties, the query details need to contain the memo id property
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (Array.isArray(queryDetails.memoId)) {
      throw new InvalidAddressError(
        `memoId may only be given at most once, but found ${queryDetails.memoId.length} instances in address ${address}`
      );
    }

    if (Array.isArray(queryDetails.memoId) && queryDetails.memoId.length !== 1) {
      // valid addresses can only contain one memo id
      throw new InvalidAddressError(`invalid address '${address}', must contain exactly one memoId`);
    }

    const [memoId] = _.castArray(queryDetails.memoId) || undefined;
    if (!this.isValidMemoId(memoId)) {
      throw new InvalidMemoIdError(`invalid address: '${address}', memoId is not valid`);
    }

    return {
      baseAddress: destinationAddress,
      address: destinationAddress,
      id: undefined,
      memoId,
    };
  }

  /**
   * Validate and return address with appended memo id or muxed address
   *
   * @param address address
   * @param memoId memo id
   * @returns address with memo id
   */
  normalizeAddress({ address, memoId }: AddressDetails): string {
    if (this.isValidMuxedAddress(address)) {
      return address;
    }
    if (!stellar.StrKey.isValidEd25519PublicKey(address)) {
      throw new Error(`invalid address details: ${address}`);
    }
    if (memoId && this.isValidMemoId(memoId)) {
      return `${address}?memoId=${memoId}`;
    }
    return address;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param address the pub to be checked
   * @returns is it valid?
   */
  isValidAddress(address: string): boolean {
    try {
      const addressDetails = this.getAddressDetails(address);
      return address === this.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  /**
   * Return a Stellar Asset in coin:token form (i.e. (t)xlm:<code>-<issuer>)
   * If the asset is XLM, return the chain
   * @param {stellar.Asset} asset - instance of Stellar Asset
   */
  getTokenNameFromStellarAsset(asset: stellar.Asset): string {
    const code = asset.getCode();
    const issuer = asset.getIssuer();
    if (asset.isNative()) {
      return this.getChain();
    }
    return `${this.getChain()}${BaseCoin.coinTokenPatternSeparator}${code}${Xlm.tokenPatternSeparator}${issuer}`;
  }

  /**
   * Evaluate whether a stellar username has valid format
   * This method is used by the client when a stellar address is being added to a wallet
   * Example of a common stellar username: foo@bar.baz
   * The above example would result in the Stellar address: foo@bar.baz*bitgo.com
   *
   * @param username - stellar username
   * @return true if stellar username is valid
   */
  isValidStellarUsername(username: string): boolean {
    return /^[a-z0-9\-_.+@]+$/.test(username);
  }

  /**
   * Get an instance of FederationServer for BitGo lookups
   *
   * @returns instance of BitGo Federation Server
   */
  getBitGoFederationServer(): stellar.FederationServer {
    // Identify the URI scheme in case we need to allow connecting to HTTP server.
    const isNonSecureEnv = !_.startsWith(common.Environments[this.bitgo.env].uri, 'https');
    const federationServerOptions = { allowHttp: isNonSecureEnv };
    return new stellar.FederationServer(this.getFederationServerUrl(), 'bitgo.com', federationServerOptions);
  }

  /**
   * Perform federation lookups
   * Our federation server handles lookups for bitgo as well as for other federation domains
   *
   * @param {String} [address] - address to look up
   * @param {String} [accountId] - account id to look up
   */
  private async federationLookup({
    address,
    accountId,
  }: {
    address?: string;
    accountId?: string;
  }): Promise<stellar.FederationServer.Record> {
    try {
      const federationServer = this.getBitGoFederationServer();
      if (address) {
        return await federationServer.resolveAddress(address);
      } else if (accountId) {
        return await federationServer.resolveAccountId(accountId);
      } else {
        throw new Error('invalid argument - must provide Stellar address or account id');
      }
    } catch (e) {
      const error = _.get(e, 'response.data.detail');
      if (error) {
        throw new StellarFederationUserNotFoundError(error);
      } else {
        throw e;
      }
    }
  }

  /**
   * Attempt to resolve a stellar address into a stellar account
   *
   * @param {String} address - stellar address to look for
   */
  async federationLookupByName(address: string): Promise<stellar.FederationServer.Record> {
    if (!address) {
      throw new Error('invalid Stellar address');
    }

    return this.federationLookup({ address });
  }

  /**
   * Attempt to resolve an account id into a stellar account
   * Only works for accounts that can be resolved by our federation server
   *
   * @param {String} accountId - stellar account id
   */
  async federationLookupByAccountId(accountId: string): Promise<stellar.FederationServer.Record> {
    if (!accountId) {
      throw new Error('invalid Stellar account');
    }
    return this.federationLookup({ accountId });
  }

  /**
   * Check if address is a valid XLM address, and then make sure it matches the root address.
   *
   * @param address {String} the address to verify
   * @param rootAddress {String} the wallet's root address
   */
  async isWalletAddress({ address, rootAddress }: VerifyAddressOptions): Promise<boolean> {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);
    if (addressDetails.baseAddress !== rootAddressDetails.address) {
      throw new UnexpectedAddressError(
        `address validation failure: ${addressDetails.baseAddress} vs ${rootAddressDetails.address}`
      );
    }

    return true;
  }

  /**
   * Get extra parameters for prebuilding a tx
   * Set empty recipients array in trustline txs
   */
  async getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions): Promise<BuildOptions> {
    const params: { recipients?: Record<string, string>[] } = {};
    if (buildParams.type === 'trustline') {
      params.recipients = [];
    }
    return params;
  }

  /**
   * @deprecated
   */
  initiateRecovery(params: RecoveryOptions): never {
    throw new Error('deprecated method');
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * - userKey: [encrypted] Stellar private key
   * - backupKey: [encrypted] Stellar private key, or public key if the private key is held by a KRS provider
   * - walletPassphrase: necessary if one of the private keys is encrypted
   * - rootAddress: base address of the wallet to recover funds from
   * - krsProvider: necessary if backup key is held by KRS
   * - recoveryDestination: target address to send recovered funds to
   */
  async recover(params: RecoveryOptions): Promise<RecoveryTransaction> {
    // Stellar's Ed25519 public keys start with a G, while private keys start with an S
    const isKrsRecovery = params.backupKey.startsWith('G') && !params.userKey.startsWith('G');
    const isUnsignedSweep = params.backupKey.startsWith('G') && params.userKey.startsWith('G');

    if (isKrsRecovery) {
      checkKrsProvider(this, params.krsProvider);
    }

    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new InvalidAddressError('Invalid destination address!');
    }

    const [userKey, backupKey] = getStellarKeys(this.bitgo, params);

    if (!params.rootAddress || !stellar.StrKey.isValidEd25519PublicKey(params.rootAddress)) {
      throw new Error(`Invalid wallet address: ${params.rootAddress}`);
    }

    const accountDataUrl = `${this.getHorizonUrl()}/accounts/${params.rootAddress}`;
    const destinationUrl = `${this.getHorizonUrl()}/accounts/${params.recoveryDestination}`;

    let accountData;
    try {
      accountData = await toBitgoRequest(request.get(accountDataUrl)).result();
    } catch (e) {
      throw new Error('Unable to reach the Stellar network via Horizon.');
    }

    // Now check if the destination account is empty or not
    let unfundedDestination = false;
    try {
      await request.get(destinationUrl);
    } catch (e) {
      if (e.status === 404) {
        // If the destination account does not yet exist, horizon responds with 404
        unfundedDestination = true;
      }
    }

    if (!accountData.sequence || !accountData.balances) {
      throw new Error('Horizon server error - unable to retrieve sequence ID or account balance');
    }

    const account = new stellar.Account(params.rootAddress, accountData.sequence);

    // Stellar supports multiple assets on chain, we're only interested in the balances entry whose type is "native" (XLM)
    const nativeBalanceInfo = accountData.balances.find((assetBalance) => assetBalance['asset_type'] === 'native');

    if (!nativeBalanceInfo) {
      throw new Error('Provided wallet has a balance of 0 XLM, recovery aborted');
    }

    const walletBalance = Number(this.bigUnitsToBaseUnits(nativeBalanceInfo.balance));
    const minimumReserve = await this.getMinimumReserve();
    const baseTxFee = await this.getBaseTransactionFee();
    const recoveryAmount = walletBalance - minimumReserve - baseTxFee;
    const formattedRecoveryAmount = this.baseUnitsToBigUnits(recoveryAmount).toString();

    const txBuilder = new stellar.TransactionBuilder(account, {
      fee: baseTxFee.toFixed(0),
      networkPassphrase: this.getStellarNetwork(),
    });
    const operation = unfundedDestination
      ? // In this case, we need to create the account
        stellar.Operation.createAccount({
          destination: params.recoveryDestination,
          startingBalance: formattedRecoveryAmount,
        })
      : // Otherwise if the account already exists, we do a normal send
        stellar.Operation.payment({
          destination: params.recoveryDestination,
          asset: stellar.Asset.native(),
          amount: formattedRecoveryAmount,
        });
    const tx = txBuilder.addOperation(operation).setTimeout(stellar.TimeoutInfinite).build();

    const feeInfo = {
      fee: new BigNumber(tx.fee).toNumber(),
      feeString: tx.fee,
    };

    if (!isUnsignedSweep) {
      tx.sign(userKey);
    }

    if (!isKrsRecovery && !isUnsignedSweep) {
      tx.sign(backupKey);
    }

    const transaction: RecoveryTransaction = {
      txBase64: Xlm.txToString(tx),
      recoveryAmount,
    };

    if (isKrsRecovery) {
      transaction.backupKey = params.backupKey;
    }

    transaction.coin = this.getChain();
    transaction.feeInfo = feeInfo;

    return transaction;
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @returns {Promise<HalfSignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<HalfSignedTransaction> {
    const { txPrebuild, prv } = params;

    if (_.isUndefined(txPrebuild)) {
      throw new Error('missing txPrebuild parameter');
    }
    if (!_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }
    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    const keyPair = stellar.Keypair.fromSecret(prv);
    const tx = new stellar.Transaction(txPrebuild.txBase64, this.getStellarNetwork());
    tx.sign(keyPair);
    const txBase64 = Xlm.txToString(tx);

    const type = txPrebuild?.buildParams?.type;
    const recipients = txPrebuild?.buildParams?.recipients;
    if (type === 'enabletoken') {
      return {
        halfSigned: { txBase64 },
        type,
        recipients,
      };
    } else {
      return { halfSigned: { txBase64 } };
    }
  }

  /**
   * Extend walletParams with extra params required for generating an XLM wallet
   *
   * Stellar wallets have three keychains on them. Two are generated by the platform, and the last is generated by the user.
   * Initially, we need a root prv to generate the account, which must be distinct from all three keychains on the wallet.
   * If a root prv is not provided, a random one is generated.
   */
  async supplementGenerateWallet(
    walletParams: SupplementGenerateWalletOptions
  ): Promise<SupplementGenerateWalletOptions> {
    let seed;
    const rootPrv = walletParams.rootPrivateKey;
    if (rootPrv) {
      if (!this.isValidPrv(rootPrv)) {
        throw new Error('rootPrivateKey needs to be valid ed25519 secret seed');
      }
      seed = stellar.StrKey.decodeEd25519SecretSeed(rootPrv);
    }
    const keyPair = this.generateKeyPair(seed);
    // extend the wallet initialization params
    walletParams.rootPrivateKey = keyPair.prv;
    return walletParams;
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    if (!this.isValidPrv(key.prv)) {
      throw new Error(`invalid prv: ${key.prv}`);
    }
    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message);
    }
    const keypair = stellar.Keypair.fromSecret(key.prv);
    return keypair.sign(message);
  }

  /**
   * Verifies if signature for message is valid.
   *
   * @param pub public key
   * @param message signed message
   * @param signature signature to verify
   * @returns true if signature is valid.
   */
  verifySignature(pub: string, message: string | Buffer, signature: Buffer) {
    if (!this.isValidPub(pub)) {
      throw new Error(`invalid pub: ${pub}`);
    }
    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message);
    }
    const keyPair = stellar.Keypair.fromPublicKey(pub);
    return keyPair.verify(message, signature);
  }

  /**
   * Explain/parse transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const { txHex, txBase64 } = params;
    let tx: stellar.Transaction | undefined = undefined;

    if (!txHex && !txBase64) {
      throw new Error('explainTransaction missing txHex or txBase64 parameter, must have at least one');
    }

    try {
      if (txHex) {
        tx = new stellar.Transaction(Buffer.from(txHex, 'hex').toString('base64'), this.getStellarNetwork());
      } else if (txBase64) {
        tx = new stellar.Transaction(txBase64, this.getStellarNetwork());
      }
    } catch (e) {
      throw new Error('txBase64 needs to be a valid tx encoded as base64 string');
    }

    if (!tx) {
      throw new Error('tx needs to be defined in order to explain transaction');
    }
    const id = tx.hash().toString('hex');

    // In a Stellar tx, the _memo property is an object with the methods:
    // value() and arm() that provide memo value and type, respectively.
    const memo: TransactionMemo =
      _.result(tx, '_memo.value') && _.result(tx, '_memo.arm')
        ? {
            value: (_.result(tx, '_memo.value') as any).toString(),
            type: _.result(tx, '_memo.arm'),
          }
        : {};

    let spendAmount = new BigNumber(0); // amount of XLM used in XLM-only txs
    const spendAmounts = {}; // track both xlm and token amounts
    if (_.isEmpty(tx.operations)) {
      throw new Error('missing operations');
    }

    const outputs: TransactionOutput[] = [];
    const operations: TransactionOperation[] = []; // non-payment operations

    _.forEach(tx.operations, (op: stellar.Operation) => {
      if (op.type === 'createAccount' || op.type === 'payment') {
        // TODO Remove memoId from address
        // Get memo to attach to address, if type is 'id'
        const memoId = _.get(memo, 'type') === 'id' && !_.get(memo, 'value') ? `?memoId=${memo.value}` : '';
        let asset;
        if (op.type === 'payment') {
          if (op.asset.getAssetType() === 'liquidity_pool_shares') {
            throw new Error('Invalid asset type');
          }
          asset = op.asset as stellar.Asset;
        } else {
          asset = stellar.Asset.native();
        }
        const coin = this.getTokenNameFromStellarAsset(asset); // coin or token id
        const output: TransactionOutput = {
          amount: this.bigUnitsToBaseUnits(
            (op as stellar.Operation.CreateAccount).startingBalance || (op as stellar.Operation.Payment).amount
          ),
          address: op.destination + memoId,
          coin,
        };

        if (!_.isUndefined(spendAmounts[coin])) {
          spendAmounts[coin] = spendAmounts[coin].plus(output.amount);
        } else {
          spendAmounts[coin] = new BigNumber(output.amount);
        }
        if (asset.isNative()) {
          spendAmount = spendAmount.plus(output.amount);
        }
        outputs.push(output);
      } else if (op.type === 'changeTrust') {
        if (op.line.getAssetType() === 'liquidity_pool_shares') {
          throw new Error('Invalid asset type');
        }
        const asset = op.line as stellar.Asset;

        operations.push({
          type: op.type,
          coin: this.getTokenNameFromStellarAsset(asset),
          asset,
          limit: this.bigUnitsToBaseUnits(op.limit),
        });
      }
    });

    const outputAmount = spendAmount.toFixed(0);
    const outputAmounts = _.mapValues(spendAmounts, (amount: BigNumber) => amount.toFixed(0));
    const fee = {
      fee: new BigNumber(tx.fee).toFixed(0),
      feeRate: null,
      size: null,
    };

    return {
      displayOrder: [
        'id',
        'outputAmount',
        'outputAmounts',
        'changeAmount',
        'outputs',
        'changeOutputs',
        'fee',
        'memo',
        'operations',
      ],
      id,
      outputs,
      outputAmount,
      outputAmounts,
      changeOutputs: [],
      changeAmount: '0',
      memo,
      fee,
      operations,
    } as any;
  }

  /**
   * Verify that a tx prebuild's operations comply with the original intention
   * @param {stellar.Operation} operations - tx operations
   * @param {TransactionParams} txParams - params used to build the tx
   */
  verifyEnableTokenTxOperations(operations: stellar.Operation[], txParams: TransactionParams): void {
    const trustlineOperations = _.filter(operations, ['type', 'changeTrust']) as stellar.Operation.ChangeTrust[];
    if (trustlineOperations.length !== _.get(txParams, 'recipients', []).length) {
      throw new Error('transaction prebuild does not match expected trustline operations');
    }
    _.forEach(trustlineOperations, (op: stellar.Operation) => {
      if (op.type !== 'changeTrust') {
        throw new Error('Invalid asset type');
      }
      if (op.line.getAssetType() === 'liquidity_pool_shares') {
        throw new Error('Invalid asset type');
      }
      const asset = op.line as stellar.Asset;
      const opToken = this.getTokenNameFromStellarAsset(asset);
      const tokenTrustline = _.find(txParams.recipients, (recipient) => {
        // trustline params use limits in base units
        const opLimitBaseUnits = this.bigUnitsToBaseUnits(op.limit);
        // Enable token limit is set to Xlm.maxTrustlineLimit by default
        return recipient.tokenName === opToken && opLimitBaseUnits === Xlm.maxTrustlineLimit;
      });
      if (!tokenTrustline) {
        throw new Error('transaction prebuild does not match expected trustline tokens');
      }
    });
  }

  /**
   * Verify that a tx prebuild's operations comply with the original intention
   * @param {stellar.Operation} operations - tx operations
   * @param {TransactionParams} txParams - params used to build the tx
   */
  verifyTrustlineTxOperations(operations: stellar.Operation[], txParams: TransactionParams): void {
    const trustlineOperations = _.filter(operations, ['type', 'changeTrust']) as stellar.Operation.ChangeTrust[];
    if (trustlineOperations.length !== _.get(txParams, 'trustlines', []).length) {
      throw new Error('transaction prebuild does not match expected trustline operations');
    }
    _.forEach(trustlineOperations, (op: stellar.Operation) => {
      if (op.type !== 'changeTrust') {
        throw new Error('Invalid asset type');
      }
      if (op.line.getAssetType() === 'liquidity_pool_shares') {
        throw new Error('Invalid asset type');
      }
      const asset = op.line as stellar.Asset;
      const opToken = this.getTokenNameFromStellarAsset(asset);
      const tokenTrustline = _.find(txParams.trustlines, (trustline) => {
        // trustline params use limits in base units
        const opLimitBaseUnits = this.bigUnitsToBaseUnits(op.limit);
        // Prepare the conditions to check for
        // Limit will always be set in the operation, even if it was omitted from txParams in the following cases:
        // 1. Action is 'add' - limit is set to Xlm.maxTrustlineLimit by default
        // 2. Action is 'remove' - limit is set to '0'
        const noLimit = _.isUndefined(trustline.limit);
        const addTrustlineWithDefaultLimit = trustline.action === 'add' && opLimitBaseUnits === Xlm.maxTrustlineLimit;
        const removeTrustline = trustline.action === 'remove' && opLimitBaseUnits === '0';
        return (
          trustline.token === opToken &&
          (trustline.limit === opLimitBaseUnits || (noLimit && (addTrustlineWithDefaultLimit || removeTrustline)))
        );
      });
      if (!tokenTrustline) {
        throw new Error('transaction prebuild does not match expected trustline tokens');
      }
    });
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   *
   * @param options
   * @param options.txPrebuild prebuild object returned by platform
   * @param options.txPrebuild.txBase64 prebuilt transaction encoded as base64 string
   * @param options.wallet wallet object to obtain keys to verify against
   * @param options.verification specifying some verification parameters
   * @param options.verification.disableNetworking Disallow fetching any data from the internet for verification purposes
   * @param options.verification.keychains Pass keychains manually rather than fetching them by id
   */
  async verifyTransaction(options: VerifyTransactionOptions): Promise<boolean> {
    // TODO BG-5600 Add parseTransaction / improve verification
    const { txParams, txPrebuild, wallet, verification = {} } = options;
    const disableNetworking = !!verification.disableNetworking;

    if (!txPrebuild.txBase64) {
      throw new Error('missing required tx prebuild property txBase64');
    }

    const tx = new stellar.Transaction(txPrebuild.txBase64, this.getStellarNetwork());

    if (txParams.recipients && txParams.recipients.length > 1) {
      throw new Error('cannot specify more than 1 recipient');
    }

    // Stellar txs are made up of operations. We only care about Create Account and Payment for sending funds.
    const outputOperations = _.filter(
      tx.operations,
      (operation) => operation.type === 'createAccount' || operation.type === 'payment'
    );

    if (txParams.type === 'enabletoken') {
      this.verifyEnableTokenTxOperations(tx.operations, txParams);
    } else if (txParams.type === 'trustline') {
      this.verifyTrustlineTxOperations(tx.operations, txParams);
    } else {
      if (_.isEmpty(outputOperations)) {
        throw new Error('transaction prebuild does not have any operations');
      }

      _.forEach(txParams.recipients, (expectedOutput, index) => {
        const expectedOutputAddressDetails = this.getAddressDetails(expectedOutput.address);
        const expectedOutputAddress = expectedOutputAddressDetails.address;
        const output = outputOperations[index] as stellar.Operation.Payment | stellar.Operation.CreateAccount;
        if (output.destination !== expectedOutputAddress) {
          throw new Error('transaction prebuild does not match expected recipient');
        }

        const expectedOutputAmount = new BigNumber(expectedOutput.amount);
        // The output amount is expressed as startingBalance in createAccount operations and as amount in payment operations.
        const outputAmountString = output.type === 'createAccount' ? output.startingBalance : output.amount;
        const outputAmount = new BigNumber(this.bigUnitsToBaseUnits(outputAmountString));

        if (!outputAmount.eq(expectedOutputAmount)) {
          throw new Error('transaction prebuild does not match expected amount');
        }
      });
    }

    // Verify the user signature, if the tx is half-signed
    if (!_.isEmpty(tx.signatures)) {
      const userSignature = tx.signatures[0].signature();

      // obtain the keychains and key signatures
      let keychains = verification.keychains;
      if (!keychains && disableNetworking) {
        throw new Error('cannot fetch keychains without networking');
      } else if (!keychains) {
        keychains = await promiseProps({
          user: this.keychains().get({ id: wallet.keyIds()[KeyIndices.USER] }),
          backup: this.keychains().get({ id: wallet.keyIds()[KeyIndices.BACKUP] }),
        });
      }

      if (!keychains || !keychains.backup || !keychains.user) {
        throw new Error('keychains are required, but could not be fetched');
      }

      assert(keychains.backup.pub);
      if (this.verifySignature(keychains.backup.pub, tx.hash(), userSignature)) {
        throw new Error('transaction signed with wrong key');
      }
      assert(keychains.user.pub);
      if (!this.verifySignature(keychains.user.pub, tx.hash(), userSignature)) {
        throw new Error('transaction signature invalid');
      }
    }

    return true;
  }

  /** inheritdoc */
  deriveKeyWithSeed(): { derivationPath: string; key: string } {
    throw new NotSupported('method deriveKeyWithSeed not supported for eddsa curve');
  }

  /**
   * stellar-sdk has two overloads for toXDR, and typescript can't seem to figure out the
   * correct one to use, so we have to be very explicit as to which one we want.
   * @param tx transaction to convert
   */
  protected static txToString = (tx: stellar.Transaction): string =>
    (tx.toEnvelope().toXDR as (_: string) => string)('base64');

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Gets config for how token enablements work for this coin
   * @returns
   *    requiresTokenEnablement: True if tokens need to be enabled for this coin
   *    supportsMultipleTokenEnablements: True if multiple tokens can be enabled in one transaction
   */
  getTokenEnablementConfig(): TokenEnablementConfig {
    return {
      requiresTokenEnablement: true,
      supportsMultipleTokenEnablements: false,
    };
  }
}
