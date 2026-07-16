import assert from 'assert';
import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';
import * as querystring from 'querystring';
import * as stellar from '@stellar/stellar-sdk';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Federation: FederationAxios } = require('@stellar/stellar-sdk/axios') as typeof stellar;
import * as request from 'superagent';
import * as url from 'url';
import { KeyPair as StellarKeyPair } from './lib/keyPair';
import * as Utils from './lib/utils';

import { toBitgoRequest } from '@bitgo/sdk-api';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  TransactionRecipient as BaseTransactionOutput,
  TransactionParams as BaseTransactionParams,
  TransactionPrebuild as BaseTransactionPrebuild,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions as BaseVerifyTransactionOptions,
  BitGoBase,
  checkKrsProvider,
  common,
  ExtraPrebuildParamsOptions,
  InvalidAddressError,
  InvalidMemoIdError,
  ITransactionRecipient,
  KeyIndices,
  KeyPair,
  MultisigType,
  multisigTypes,
  NotSupported,
  ParsedTransaction,
  ParseTransactionOptions,
  promiseProps,
  StellarFederationUserNotFoundError,
  TokenEnablementConfig,
  UnexpectedAddressError,
  Wallet,
} from '@bitgo/sdk-core';
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
  // accountConfig (setOptions) operation fields
  setFlags?: number;
  clearFlags?: number;
  // authorizeTrustline (setTrustLineFlags) operation fields
  trustor?: string;
  authorized?: boolean;
  // clawback operation fields
  from?: string;
  amount?: string;
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

export interface AccountFlags {
  authRequired?: boolean;
  authRevocable?: boolean;
  authClawbackEnabled?: boolean;
}

export interface TrustlineAuthEntry {
  trustor: string;
  token: string; // 'xlm:ASSETCODE-ISSUERADDRESS'
  authorize: boolean;
}

export interface ClawbackEntry {
  from: string;
  token: string; // 'xlm:ASSETCODE-ISSUERADDRESS'
  amount: string; // base units (stroops)
}

export interface AccountConfigVerifyParams extends BuildOptions {
  type: 'accountConfig';
  flags?: AccountFlags;
  clearFlags?: AccountFlags;
}

export interface AuthorizeTrustlineVerifyParams extends BuildOptions {
  type: 'authorizeTrustline';
  trustlineAuths: TrustlineAuthEntry[];
}

export interface ClawbackVerifyParams extends BuildOptions {
  type: 'clawback';
  clawbacks: ClawbackEntry[];
}

function isAccountConfigVerifyParams(params: unknown): params is AccountConfigVerifyParams {
  if (typeof params !== 'object' || params === null) return false;
  const p = params as Record<string, unknown>;
  // flags and clearFlags are optional, but must be plain objects when present
  return (
    p.type === 'accountConfig' &&
    (p.flags === undefined || (typeof p.flags === 'object' && p.flags !== null)) &&
    (p.clearFlags === undefined || (typeof p.clearFlags === 'object' && p.clearFlags !== null))
  );
}

function isAuthorizeTrustlineVerifyParams(params: unknown): params is AuthorizeTrustlineVerifyParams {
  if (typeof params !== 'object' || params === null) return false;
  const p = params as Record<string, unknown>;
  // trustlineAuths is required and must be an array
  return p.type === 'authorizeTrustline' && Array.isArray(p.trustlineAuths);
}

function isClawbackVerifyParams(params: unknown): params is ClawbackVerifyParams {
  if (typeof params !== 'object' || params === null) return false;
  const p = params as Record<string, unknown>;
  // clawbacks is required and must be an array
  return p.type === 'clawback' && Array.isArray(p.clawbacks);
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
    const keyPair = seed ? new StellarKeyPair({ seed }) : new StellarKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return { pub: keys.pub, prv: keys.prv };
  }

  generateRootKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new StellarKeyPair({ seed }) : new StellarKeyPair();
    const keys = keyPair.getKeys(true);
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return { prv: keys.prv + keys.pub, pub: keys.pub };
  }

  /**
   * Get encoded ed25519 public key from raw data
   *
   * @param pub Raw public key
   * @returns Encoded public key
   */
  getPubFromRaw(pub: string): string {
    return Utils.encodePublicKey(Buffer.from(pub, 'hex'));
  }

  /**
   * Get encoded ed25519 private key from raw data
   *
   * @param prv Raw private key
   * @returns Encoded private key
   */
  getPrvFromRaw(prv: string): string {
    return Utils.encodePrivateKey(Buffer.from(prv, 'hex'));
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param pub the pub to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    // Stellar's validation method only allows keys in Stellar-specific format, with a 'G' prefix
    // We need to allow for both Stellar and raw root keys
    return Utils.isValidRootPublicKey(pub) || Utils.isValidStellarPublicKey(pub);
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    // Stellar's validation method only allows keys in Stellar-specific format, with an 'S' prefix
    // We need to allow for both Stellar and raw root private keys
    return Utils.isValidRootPrivateKey(prv) || Utils.isValidStellarPrivateKey(prv);
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

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
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
    const server = new stellar.Horizon.Server(this.getHorizonUrl());

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
    const server = new stellar.Horizon.Server(this.getHorizonUrl());

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
  getBitGoFederationServer(): stellar.Federation.Server {
    // Identify the URI scheme in case we need to allow connecting to HTTP server.
    const isNonSecureEnv = !_.startsWith(common.Environments[this.bitgo.env].uri, 'https');
    const federationServerOptions = { allowHttp: isNonSecureEnv };
    return new FederationAxios.Server(this.getFederationServerUrl(), 'bitgo.com', federationServerOptions);
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
  }): Promise<stellar.Federation.Api.Record> {
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
  async federationLookupByName(address: string): Promise<stellar.Federation.Api.Record> {
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
  async federationLookupByAccountId(accountId: string): Promise<stellar.Federation.Api.Record> {
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
    const nonPaymentTypes = ['trustline', 'accountConfig', 'authorizeTrustline', 'clawback'];
    // Non-payment transaction types must not inject a default recipient
    if (nonPaymentTypes.includes(buildParams.type as string)) {
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
    // Check if unencrypted root keys were provided, convert to Stellar format if necessary
    if (Utils.isValidRootPrivateKey(params.userKey)) {
      params.userKey = Utils.encodePrivateKey(Buffer.from(params.userKey.slice(0, 64), 'hex'));
    } else if (Utils.isValidRootPublicKey(params.userKey)) {
      params.userKey = Utils.encodePublicKey(Buffer.from(params.userKey, 'hex'));
    }

    if (Utils.isValidRootPrivateKey(params.backupKey)) {
      params.backupKey = Utils.encodePrivateKey(Buffer.from(params.backupKey.slice(0, 64), 'hex'));
    } else if (Utils.isValidRootPublicKey(params.backupKey)) {
      params.backupKey = Utils.encodePublicKey(Buffer.from(params.backupKey, 'hex'));
    }

    // Stellar's Ed25519 public keys start with a G, while private keys start with an S
    const isKrsRecovery = params.backupKey.startsWith('G') && !params.userKey.startsWith('G');
    const isUnsignedSweep = params.backupKey.startsWith('G') && params.userKey.startsWith('G');

    if (isKrsRecovery) {
      checkKrsProvider(this, params.krsProvider);
    }

    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new InvalidAddressError('Invalid destination address!');
    }

    const [userKey, backupKey] = await getStellarKeys(this.bitgo, params);

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

    const keyPair = Utils.createStellarKeypairFromPrv(prv);
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

    const keypair = Utils.createStellarKeypairFromPrv(key.prv);
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

    const keyPair = Utils.createStellarKeypairFromPub(pub);
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

    _.forEach(tx.operations, (op) => {
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
      } else if (op.type === 'setOptions') {
        const setOptionsOp = op as stellar.Operation.SetOptions;
        operations.push({
          type: 'accountConfig',
          coin: this.getChain(),
          setFlags: setOptionsOp.setFlags,
          clearFlags: setOptionsOp.clearFlags,
        });
      } else if (op.type === 'setTrustLineFlags') {
        const setTrustLineFlagsOp = op as stellar.Operation.SetTrustLineFlags;
        operations.push({
          type: 'authorizeTrustline',
          coin: this.getTokenNameFromStellarAsset(setTrustLineFlagsOp.asset),
          trustor: setTrustLineFlagsOp.trustor,
          authorized: setTrustLineFlagsOp.flags?.authorized,
        });
      } else if (op.type === 'clawback') {
        const clawbackOp = op as stellar.Operation.Clawback;
        operations.push({
          type: 'clawback',
          coin: this.getTokenNameFromStellarAsset(clawbackOp.asset),
          from: clawbackOp.from,
          amount: this.bigUnitsToBaseUnits(clawbackOp.amount),
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

  getTrustlineOperationsOrThrow(
    operations: stellar.OperationRecord[],
    txParams: TransactionParams,
    operationTypePropName: 'trustlines' | 'recipients'
  ): stellar.Operation.ChangeTrust[] {
    const trustlineOperations = operations.filter(
      (op): op is stellar.Operation.ChangeTrust => op?.type === 'changeTrust'
    );
    if (trustlineOperations.length !== _.get(txParams, operationTypePropName, []).length) {
      throw new Error('transaction prebuild does not match expected trustline operations');
    }

    return trustlineOperations;
  }

  isChangeTrustOperation(operation: stellar.OperationRecord): operation is stellar.Operation.ChangeTrust {
    return operation.type === 'changeTrust';
  }

  getTrustlineOperationLineOrThrow(operation: stellar.OperationRecord): stellar.Asset | stellar.LiquidityPoolAsset {
    if (this.isChangeTrustOperation(operation) && operation.line) return operation.line;
    throw new Error('Invalid operation - expected changeTrust operation with line property');
  }

  getTrustlineOperationLimitOrThrow(operation: stellar.OperationRecord): string {
    if (this.isChangeTrustOperation(operation) && operation.limit) return operation.limit;
    throw new Error('Invalid operation - expected changeTrust operation with limit property');
  }

  isOperationLineOfAssetType(line: stellar.Asset | stellar.LiquidityPoolAsset): line is stellar.Asset {
    // line should be stellar.Asset, we removed the explicit cast and check the type instead
    if (!line.getAssetType) return false;
    return line.getAssetType() !== 'liquidity_pool_shares';
  }

  /**
   * Verify that a tx prebuild's operations comply with the original intention
   * @param {stellar.Operation} operations - tx operations
   * @param {TransactionParams} txParams - params used to build the tx
   */
  verifyTrustlineTxOperations(operations: stellar.OperationRecord[], txParams: TransactionParams): void {
    const trustlineOperations = this.getTrustlineOperationsOrThrow(operations, txParams, 'trustlines');
    _.forEach(trustlineOperations, (op) => {
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

  private verifyAccountConfigOperations(operations: stellar.Operation[], txParams: AccountConfigVerifyParams): void {
    const setOptionsOps = operations.filter(
      (operation): operation is stellar.Operation.SetOptions => operation.type === 'setOptions'
    );
    if (setOptionsOps.length === 0) {
      throw new Error('accountConfig transaction must contain at least one setOptions operation');
    }
    // Reject multiple setOptions ops: txParams only carries one flags/clearFlags set, so any
    // additional ops would be silently unverified — a verification gap.
    if (setOptionsOps.length > 1) {
      throw new Error('accountConfig transaction must contain exactly one setOptions operation');
    }
    const setOptionsOp = setOptionsOps[0];

    if (txParams.flags) {
      const expectedSetFlag = ((txParams.flags.authRequired ? stellar.AuthRequiredFlag : 0) |
        (txParams.flags.authRevocable ? stellar.AuthRevocableFlag : 0) |
        (txParams.flags.authClawbackEnabled ? stellar.AuthClawbackEnabledFlag : 0)) as number;
      if (setOptionsOp.setFlags !== expectedSetFlag) {
        throw new Error(`accountConfig setFlags mismatch: expected ${expectedSetFlag}, got ${setOptionsOp.setFlags}`);
      }
    }

    if (txParams.clearFlags) {
      const expectedClearFlag = ((txParams.clearFlags.authRequired ? stellar.AuthRequiredFlag : 0) |
        (txParams.clearFlags.authRevocable ? stellar.AuthRevocableFlag : 0) |
        (txParams.clearFlags.authClawbackEnabled ? stellar.AuthClawbackEnabledFlag : 0)) as number;
      if (setOptionsOp.clearFlags !== expectedClearFlag) {
        throw new Error(
          `accountConfig clearFlags mismatch: expected ${expectedClearFlag}, got ${setOptionsOp.clearFlags}`
        );
      }
    }
  }

  private verifyAuthorizeTrustlineOperations(
    operations: stellar.Operation[],
    txParams: AuthorizeTrustlineVerifyParams
  ): void {
    const trustLineFlagOps = operations.filter(
      (operation): operation is stellar.Operation.SetTrustLineFlags => operation.type === 'setTrustLineFlags'
    );
    if (trustLineFlagOps.length !== txParams.trustlineAuths.length) {
      throw new Error(
        `authorizeTrustline operation count mismatch: expected ${txParams.trustlineAuths.length}, got ${trustLineFlagOps.length}`
      );
    }
    txParams.trustlineAuths.forEach((trustlineAuth, index) => {
      const trustLineFlagOp = trustLineFlagOps[index];
      if (trustLineFlagOp.trustor !== trustlineAuth.trustor) {
        throw new Error(`authorizeTrustline trustor mismatch at index ${index}`);
      }
      const actualToken = this.getTokenNameFromStellarAsset(trustLineFlagOp.asset);
      if (actualToken !== trustlineAuth.token) {
        throw new Error(
          `authorizeTrustline token mismatch at index ${index}: expected ${trustlineAuth.token}, got ${actualToken}`
        );
      }
      const actualAuthorized = trustLineFlagOp.flags?.authorized;
      if (actualAuthorized !== trustlineAuth.authorize) {
        throw new Error(
          `authorizeTrustline authorize mismatch at index ${index}: expected ${trustlineAuth.authorize}, got ${actualAuthorized}`
        );
      }
    });
  }

  private verifyClawbackOperations(operations: stellar.Operation[], txParams: ClawbackVerifyParams): void {
    const clawbackOps = operations.filter(
      (operation): operation is stellar.Operation.Clawback => operation.type === 'clawback'
    );
    if (clawbackOps.length !== txParams.clawbacks.length) {
      throw new Error(
        `clawback operation count mismatch: expected ${txParams.clawbacks.length}, got ${clawbackOps.length}`
      );
    }
    txParams.clawbacks.forEach((clawbackEntry, index) => {
      const clawbackOp = clawbackOps[index];
      if (clawbackOp.from !== clawbackEntry.from) {
        throw new Error(`clawback 'from' address mismatch at index ${index}`);
      }
      const actualToken = this.getTokenNameFromStellarAsset(clawbackOp.asset);
      if (actualToken !== clawbackEntry.token) {
        throw new Error(
          `clawback token mismatch at index ${index}: expected ${clawbackEntry.token}, got ${actualToken}`
        );
      }
      const actualAmountInBaseUnits = new BigNumber(this.bigUnitsToBaseUnits(clawbackOp.amount));
      const expectedAmountInBaseUnits = new BigNumber(clawbackEntry.amount);
      if (!actualAmountInBaseUnits.eq(expectedAmountInBaseUnits)) {
        throw new Error(
          `clawback amount mismatch at index ${index}: expected ${
            clawbackEntry.amount
          }, got ${actualAmountInBaseUnits.toFixed()}`
        );
      }
    });
  }

  getRecipientOrThrow(txParams: TransactionParams): ITransactionRecipient {
    if (!txParams.recipients || txParams.recipients.length === 0)
      throw new Error('Missing recipients on token enablement');
    if (txParams.recipients.length > 1) throw new Error('Multiple recipients not supported on token enablement');
    return txParams.recipients[0];
  }

  getTokenDataOrThrow(txParams: TransactionParams): string {
    const recipient = this.getRecipientOrThrow(txParams);
    const fullTokenData = recipient.tokenName;
    if (!fullTokenData || fullTokenData === '') throw new Error('Missing tokenName on token enablement recipient');
    return fullTokenData;
  }

  private getTokenCodeFromTokenName(tokenName: string): string {
    const tokenCode = tokenName.split(':')[1]?.split('-')[0] ?? '';
    if (tokenCode === '') throw new Error(`Invalid tokenName format on token enablement for token ${tokenName}`);
    return tokenCode;
  }

  private getIssuerFromTokenName(tokenName: string): string {
    const issuer = tokenName.split(':')[1]?.split('-')[1] ?? '';
    if (issuer === '') throw new Error(`Invalid issuer format on token enablement for token ${tokenName}`);
    return issuer;
  }

  verifyTxType(operations: stellar.OperationRecord[]): void {
    operations.forEach((operation) => {
      if (!this.isChangeTrustOperation(operation))
        throw new Error(
          !operation.type
            ? 'Missing operation type on token enablements'
            : `Invalid operation on token enablement: expected changeTrust, got ${operation.type}`
        );
    });
  }

  verifyAssetType(txParams: TransactionParams, operations: stellar.OperationRecord[]): void {
    operations.forEach((operation) => {
      const line = this.getTrustlineOperationLineOrThrow(operation);
      if (!this.isOperationLineOfAssetType(line)) {
        const assetType = line.getAssetType();
        throw new Error(`Invalid asset type on token enablement: got ${assetType}`);
      }
    });
  }

  verifyTokenIssuer(txParams: TransactionParams, operations: stellar.OperationRecord[]): void {
    const fullTokenData = this.getTokenDataOrThrow(txParams);
    const expectedIssuer = this.getIssuerFromTokenName(fullTokenData);

    operations.forEach((operation) => {
      const line = this.getTrustlineOperationLineOrThrow(operation);
      if (!('issuer' in line)) throw new Error('Missing issuer on token enablement operation');
      if (line.issuer !== expectedIssuer)
        throw new Error(`Invalid issuer on token enablement operation: expected ${expectedIssuer}, got ${line.issuer}`);
    });
  }

  verifyTokenName(txParams: TransactionParams, operations: stellar.OperationRecord[]): void {
    const fullTokenData = this.getTokenDataOrThrow(txParams);
    const expectedTokenCode = this.getTokenCodeFromTokenName(fullTokenData);

    operations.forEach((operation) => {
      const line = this.getTrustlineOperationLineOrThrow(operation);
      if (!('code' in line)) throw new Error('Missing token code on token enablement operation');
      if (line.code === '') throw new Error('Empty token code on token enablement operation');
      if (line.code !== expectedTokenCode)
        throw new Error(
          `Invalid token code on token enablement operation: expected ${expectedTokenCode}, got ${line.code}`
        );
    });
  }

  verifyTokenLimits(txParams: TransactionParams, operations: stellar.OperationRecord[]): void {
    const recipient = this.getRecipientOrThrow(txParams);

    operations.forEach((operation) => {
      // trustline params use limits in base units
      const line = this.getTrustlineOperationLineOrThrow(operation);
      const limit = this.getTrustlineOperationLimitOrThrow(operation); // line should be stellar.Asset
      if (!this.isOperationLineOfAssetType(line)) throw new Error('Invalid asset type');
      const operationLimitBaseUnits = this.bigUnitsToBaseUnits(limit);
      const operationToken = this.getTokenNameFromStellarAsset(line);

      // Enable token limit is set to Xlm.maxTrustlineLimit by default
      if (recipient.tokenName !== operationToken || operationLimitBaseUnits !== Xlm.maxTrustlineLimit) {
        throw new Error('Token limit must be set to max limit on enable token operations');
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

    if (txParams.type === 'enabletoken' && verification.verifyTokenEnablement) {
      const trustlineOperations = this.getTrustlineOperationsOrThrow(tx.operations, txParams, 'recipients');
      this.verifyTxType(trustlineOperations);
      this.verifyAssetType(txParams, trustlineOperations);
      this.verifyTokenIssuer(txParams, trustlineOperations);
      this.verifyTokenName(txParams, trustlineOperations);
      this.verifyTokenLimits(txParams, trustlineOperations);
    } else if (txParams.type === 'trustline') {
      this.verifyTrustlineTxOperations(tx.operations, txParams);
    } else if (isAccountConfigVerifyParams(txParams)) {
      this.verifyAccountConfigOperations(tx.operations, txParams);
    } else if (isAuthorizeTrustlineVerifyParams(txParams)) {
      this.verifyAuthorizeTrustlineOperations(tx.operations, txParams);
    } else if (isClawbackVerifyParams(txParams)) {
      this.verifyClawbackOperations(tx.operations, txParams);
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

  // v16 exposes toXDR() directly on TransactionBase, returning base64
  protected static txToString = (tx: stellar.Transaction): string => tx.toXDR();

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

  /** @inheritDoc */
  auditDecryptedKey({ publicKey, prv, multiSigType }: AuditDecryptedKeyParams) {
    if (multiSigType === 'tss') {
      throw new Error('Unsupported multiSigType');
    }

    let xlmKeyPair;
    try {
      xlmKeyPair = new StellarKeyPair({ prv });
    } catch (e) {
      // Avoid adding the error message to the thrown error because it can contain sensitive information
      throw new Error(`Invalid private key: Unable to generate keypair from prv`);
    }

    if (publicKey && publicKey !== xlmKeyPair.getKeys().pub) {
      throw new Error('Invalid public key');
    }
  }
}
