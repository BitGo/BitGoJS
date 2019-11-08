import * as _ from 'lodash';
import * as bitcoin from 'bitgo-utxo-lib';
import * as querystring from 'querystring';
import * as url from 'url';
import * as Bluebird from 'bluebird';
import * as request from 'superagent';
import * as stellar from 'stellar-sdk';
import { BigNumber } from 'bignumber.js';
import { BitGo } from '../../bitgo';
import { KeyIndices } from '../keychains';

import { Ed25519KeyDeriver } from '../internal/keyDeriver';
import * as config from '../../config';
import * as common from '../../common';
import {
  InvalidAddressError,
  InvalidMemoIdError,
  KeyRecoveryServiceError,
  UnexpectedAddressError,
  StellarFederationUserNotFoundError,
} from '../../errors';
import {
  BaseCoin,
  TransactionRecipient as BaseTransactionOutput,
  TransactionExplanation as BaseTransactionExplanation,
  KeyPair,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  TransactionPrebuild as BaseTransactionPrebuild,
  ParseTransactionOptions,
  ParsedTransaction,
  VerifyTransactionOptions as BaseVerifyTransactionOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionParams as BaseTransactionParams, ExtraPrebuildParamsOptions,
} from '../baseCoin';
import { NodeCallback } from '../types';
import { Wallet } from '../wallet';

const co = Bluebird.coroutine;

interface AddressDetails {
  address: string;
  memoId?: string;
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
  tx: string;
  recoveryAmount: number;
  backupKey?: string;
  coin?: string;
}

interface BuildOptions {
  wallet?: Wallet;
  recipients?: object[];
  type?: string;
  walletPassphrase?: string;
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
  }
}

interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}

interface ExplainTransactionOptions {
  txBase64: string;
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

  constructor(bitgo: BitGo) {
    super(bitgo);
    this.homeDomain = 'bitgo.com'; // used for reverse federation lookup
    stellar.Network.use(new stellar.Network(stellar.Networks.PUBLIC));
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Xlm(bitgo);
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

  /**
   * Generate a new key pair on the ed25519 curve
   * @param seed
   * @returns generated pub and prv
   */
  generateKeyPair(seed: Buffer): KeyPair {
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

    return (memoIdNumber.gte(0) && memoIdNumber.lt(Xlm.maxMemoId));
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
   * Minimum balance of a 2-of-3 multisig wallet
   * @returns minimum balance in stroops
   */
  getMinimumReserve(): Bluebird<number> {
    const self = this;
    return co<number>(function *() {
      const server = new stellar.Server(self.getHorizonUrl());

      const horizonLedgerInfo = yield server
        .ledgers()
        .order('desc')
        .limit(1)
        .call();

      if (!horizonLedgerInfo) {
        throw new Error('unable to connect to Horizon for reserve requirement data');
      }

      const baseReserve: number = horizonLedgerInfo.records[0].base_reserve_in_stroops;

      // 2-of-3 wallets have a minimum reserve of 5x the base reserve
      return 5 * baseReserve;
    }).call(this);
  }

  /**
   * Transaction fee for each operation
   * @returns transaction fee in stroops
   */
  getBaseTransactionFee(): Bluebird<number> {
    const self = this;
    return co<number>(function *() {
      const server = new stellar.Server(self.getHorizonUrl());

      const horizonLedgerInfo = yield server
        .ledgers()
        .order('desc')
        .limit(1)
        .call();

      if (!horizonLedgerInfo) {
        throw new Error('unable to connect to Horizon for reserve requirement data');
      }

      return horizonLedgerInfo.records[0].base_fee_in_stroops;
    }).call(this);
  }

  /**
   * Process address into address and memo id
   *
   * @param address the address
   * @returns object containing address and memo id
   */
  getAddressDetails(address: string): AddressDetails {
    const destinationDetails = url.parse(address);
    const destinationAddress = destinationDetails.pathname;
    if (!destinationAddress || !stellar.StrKey.isValidEd25519PublicKey(destinationAddress)) {
      throw new Error(`invalid address: ${address}`);
    }
    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        address: address,
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

    const [memoId] = _.castArray(queryDetails.memoId);
    if (!this.isValidMemoId(memoId)) {
      throw new InvalidMemoIdError(`invalid address: '${address}', memoId is not valid`);
    }

    return {
      address: destinationAddress,
      memoId,
    };
  }

  /**
   * Validate and return address with appended memo id
   *
   * @param address address
   * @param memoId memo id
   * @returns address with memo id
   */
  normalizeAddress({ address, memoId }: AddressDetails): string {
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
  getTokenNameFromStellarAsset(asset: stellar.Asset) {
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
  private federationLookup({ address, accountId }: { address?: string, accountId?: string }): Bluebird<stellar.FederationServer.Record> {
    const self = this;
    return co<stellar.FederationServer.Record>(function *() {
      try {
        const federationServer = self.getBitGoFederationServer();
        if (address) {
          return yield federationServer.resolveAddress(address);
        } else if (accountId) {
          return yield federationServer.resolveAccountId(accountId);
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
    }).call(this);
  }

  /**
   * Attempt to resolve a stellar address into a stellar account
   *
   * @param {String} address - stellar address to look for
   */
  federationLookupByName(address: string): Bluebird<stellar.FederationServer.Record> {
    const self = this;
    return co<stellar.FederationServer.Record>(function *() {
      if (!address) {
        throw new Error('invalid Stellar address');
      }

      return self.federationLookup({ address });
    }).call(this);
  }

  /**
   * Attempt to resolve an account id into a stellar account
   * Only works for accounts that can be resolved by our federation server
   *
   * @param {String} accountId - stellar account id
   */
  federationLookupByAccountId(accountId: string): Bluebird<stellar.FederationServer.Record> {
    const self = this;
    return co<stellar.FederationServer.Record>(function *() {
      if (!accountId) {
        throw new Error('invalid Stellar account');
      }
      return self.federationLookup({ accountId });
    }).call(this);
  }

  /**
   * Check if address is a valid XLM address, and then make sure it matches the root address.
   *
   * @param address {String} the address to verify
   * @param rootAddress {String} the wallet's root address
   */
  verifyAddress({ address, rootAddress }: VerifyAddressOptions): boolean {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);

    if (addressDetails.address !== rootAddressDetails.address) {
      throw new UnexpectedAddressError(`address validation failure: ${addressDetails.address} vs ${rootAddressDetails.address}`);
    }

    return true;
  }

  /**
   * Get extra parameters for prebuilding a tx
   * Set empty recipients array in trustline txs
   */
  getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions, callback?: NodeCallback<BuildOptions>): Bluebird<BuildOptions> {
    const params: { recipients?: object[] } = {};
    if (buildParams.type === 'trustline') {
      params.recipients = [];
    }
    return Bluebird.resolve(params).asCallback(callback);
  }

  /**
   * Generates Stellar keypairs from the user key and backup key
   * @param params
   */
  initiateRecovery(params: RecoveryOptions): Bluebird<stellar.Keypair[]> {
    const self = this;
    return co<stellar.Keypair[]>(function *() {
      const keys: stellar.Keypair[] = [];
      let userKey = params.userKey;
      let backupKey = params.backupKey;

      // Stellar's Ed25519 public keys start with a G, while private keys start with an S
      const isKrsRecovery = backupKey.startsWith('G') && !userKey.startsWith('G');
      const isUnsignedSweep = backupKey.startsWith('G') && userKey.startsWith('G');


      if (isKrsRecovery && params.krsProvider && _.isUndefined(config.krsProviders[params.krsProvider])) {
        throw new KeyRecoveryServiceError(`Unknown key recovery service provider - ${params.krsProvider}`);
      }

      if (isKrsRecovery && params.krsProvider && !config.krsProviders[params.krsProvider].supportedCoins.includes(self.getFamily())) {
        throw new KeyRecoveryServiceError(`Specified key recovery service does not support recoveries for ${self.getChain()}`);
      }

      if (!self.isValidAddress(params.recoveryDestination)) {
        throw new InvalidAddressError('Invalid destination address!');
      }

      try {
        if (!userKey.startsWith('S') && !userKey.startsWith('G')) {
          userKey = self.bitgo.decrypt({
            input: userKey,
            password: params.walletPassphrase,
          });
        }

        const userKeyPair = isUnsignedSweep ?
          stellar.Keypair.fromPublicKey(userKey) :
          stellar.Keypair.fromSecret(userKey);
        keys.push(userKeyPair);
      } catch (e) {
        throw new Error('Failed to decrypt user key with passcode - try again!');
      }

      try {
        if (!backupKey.startsWith('S') && !isKrsRecovery && !isUnsignedSweep) {
          backupKey = this.bitgo.decrypt({
            input: backupKey,
            password: params.walletPassphrase,
          });
        }

        if (isKrsRecovery || isUnsignedSweep) {
          keys.push(stellar.Keypair.fromPublicKey(backupKey));
        } else {
          keys.push(stellar.Keypair.fromSecret(backupKey));
        }
      } catch (e) {
        throw new Error('Failed to decrypt backup key with passcode - try again!');
      }

      return keys;
    }).call(this);
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
   * @param callback
   */
  recover(params: RecoveryOptions, callback: NodeCallback<RecoveryTransaction>): Bluebird<RecoveryTransaction> {
    const self = this;
    return co<RecoveryTransaction>(function *() {
      const [userKey, backupKey] = yield self.initiateRecovery(params);
      const isKrsRecovery = params.backupKey.startsWith('G') && !params.userKey.startsWith('G');
      const isUnsignedSweep = params.backupKey.startsWith('G') && params.userKey.startsWith('G');

      if (!params.rootAddress || !stellar.StrKey.isValidEd25519PublicKey(params.rootAddress)) {
        throw new Error(`Invalid wallet address: ${params.rootAddress}`);
      }

      const accountDataUrl = `${self.getHorizonUrl()}/accounts/${params.rootAddress}`;
      const destinationUrl = `${self.getHorizonUrl()}/accounts/${params.recoveryDestination}`;

      let accountData;
      try {
        accountData = yield request.get(accountDataUrl).result();
      } catch (e) {
        throw new Error('Unable to reach the Stellar network via Horizon.');
      }

      // Now check if the destination account is empty or not
      let unfundedDestination = false;
      try {
        yield request.get(destinationUrl);
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
      const nativeBalanceInfo = accountData.balances.find(assetBalance => assetBalance['asset_type'] === 'native');

      if (!nativeBalanceInfo) {
        throw new Error('Provided wallet has a balance of 0 XLM, recovery aborted');
      }

      const walletBalance = Number(self.bigUnitsToBaseUnits(nativeBalanceInfo.balance));
      const minimumReserve: number = yield self.getMinimumReserve();
      const baseTxFee: number = yield self.getBaseTransactionFee();
      const recoveryAmount = walletBalance - minimumReserve - baseTxFee;
      const formattedRecoveryAmount = self.baseUnitsToBigUnits(recoveryAmount).toString();

      const txBuilder = new stellar.TransactionBuilder(account);
      const operation = unfundedDestination ?
        // In this case, we need to create the account
        stellar.Operation.createAccount({
          destination: params.recoveryDestination,
          startingBalance: formattedRecoveryAmount,
        }) :
        // Otherwise if the account already exists, we do a normal send
        stellar.Operation.payment({
          destination: params.recoveryDestination,
          asset: stellar.Asset.native(),
          amount: formattedRecoveryAmount,
        });
      const tx = txBuilder.addOperation(operation).build();

      if (!isUnsignedSweep) {
        tx.sign(userKey);
      }

      if (!isKrsRecovery && !isUnsignedSweep) {
        tx.sign(backupKey);
      }

      const transaction: RecoveryTransaction = {
        tx: Xlm.txToString(tx),
        recoveryAmount,
      };

      if (isKrsRecovery) {
        transaction.backupKey = params.backupKey;
        transaction.coin = self.getChain();
      }

      return transaction;
    }).call(this).asCallback(callback);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   */
  signTransaction(params: SignTransactionOptions): HalfSignedTransaction {
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
    const tx = new stellar.Transaction(txPrebuild.txBase64);
    tx.sign(keyPair);

    return {
      halfSigned: {
        txBase64: Xlm.txToString(tx),
      },
    };
  }

  /**
   * Extend walletParams with extra params required for generating an XLM wallet
   *
   * Stellar wallets have three keychains on them. Two are generated by the platform, and the last is generated by the user.
   * Initially, we need a root prv to generate the account, which must be distinct from all three keychains on the wallet.
   * If a root prv is not provided, a random one is generated.
   */
  supplementGenerateWallet(walletParams: SupplementGenerateWalletOptions): Bluebird<SupplementGenerateWalletOptions> {
    const self = this;
    return co<SupplementGenerateWalletOptions>(function *() {
      let seed;
      const rootPrv = walletParams.rootPrivateKey;
      if (rootPrv) {
        if (!self.isValidPrv(rootPrv)) {
          throw new Error('rootPrivateKey needs to be valid ed25519 secret seed');
        }
        seed = stellar.StrKey.decodeEd25519SecretSeed(rootPrv);
      }
      const keyPair = self.generateKeyPair(seed);
      // extend the wallet initialization params
      walletParams.rootPrivateKey = keyPair.prv;
      return walletParams;
    }).call(this);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key: KeyPair, message: string | Buffer): Buffer {
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
   * @param callback
   */
  explainTransaction(params: ExplainTransactionOptions, callback?: NodeCallback<TransactionExplanation>): Bluebird<TransactionExplanation> {
    const self = this;
    return co<TransactionExplanation>(function *() {
      const { txBase64 } = params;
      let tx: stellar.Transaction;

      try {
        tx = new stellar.Transaction(txBase64);
      } catch (e) {
        throw new Error('txBase64 needs to be a valid tx encoded as base64 string');
      }
      const id = tx.hash().toString('hex');

      // In a Stellar tx, the _memo property is an object with the methods:
      // value() and arm() that provide memo value and type, respectively.
      const memo: TransactionMemo = _.result(tx, '_memo.value') && _.result(tx, '_memo.arm') ?
        {
          value: (_.result(tx, '_memo.value') as any).toString(),
          type: _.result(tx, '_memo.arm'),
        } : {};

      let spendAmount = new BigNumber(0); // amount of XLM used in XLM-only txs
      const spendAmounts = {}; // track both xlm and token amounts
      if (_.isEmpty(tx.operations)) {
        throw new Error('missing operations');
      }

      const outputs: TransactionOutput[] = [];
      const operations: TransactionOperation[] = []; // non-payment operations

      _.forEach(tx.operations, op => {
        if (op.type === 'createAccount' || op.type === 'payment') {
          // TODO Remove memoId from address
          // Get memo to attach to address, if type is 'id'
          const memoId = _.get(memo, 'type') === 'id' && ! _.get(memo, 'value') ?
            `?memoId=${memo.value}` :
            '';
          const asset = op.type === 'payment' ? op.asset : stellar.Asset.native();
          const coin = self.getTokenNameFromStellarAsset(asset); // coin or token id
          const output: TransactionOutput = {
            amount: self.bigUnitsToBaseUnits(
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
          operations.push({
            type: op.type,
            coin: self.getTokenNameFromStellarAsset(op.line),
            asset: op.line,
            limit: self.bigUnitsToBaseUnits(op.limit),
          });
        }
      });

      const outputAmount = spendAmount.toFixed(0);
      const outputAmounts = _.mapValues(spendAmounts, (amount: BigNumber) => amount.toFixed(0));
      const fee = {
        fee: tx.fee.toFixed(0),
        feeRate: null,
        size: null,
      };

      return {
        displayOrder: ['id', 'outputAmount', 'outputAmounts', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo', 'operations'],
        id,
        outputs,
        outputAmount,
        outputAmounts,
        changeOutputs: [],
        changeAmount: '0',
        memo,
        fee,
        operations,
      };
    }).call(this).asCallback(callback);
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
    _.forEach(trustlineOperations, op => {
      const opToken = this.getTokenNameFromStellarAsset(op.line);
      const tokenTrustline = _.find(txParams.trustlines, trustline => {
        // trustline params use limits in base units
        const opLimitBaseUnits = this.bigUnitsToBaseUnits(op.limit);
        // Prepare the conditions to check for
        // Limit will always be set in the operation, even if it was omitted from txParams in the following cases:
        // 1. Action is 'add' - limit is set to Xlm.maxTrustlineLimit by default
        // 2. Action is 'remove' - limit is set to '0'
        const noLimit = _.isUndefined(trustline.limit);
        const addTrustlineWithDefaultLimit = (trustline.action === 'add' && opLimitBaseUnits === Xlm.maxTrustlineLimit);
        const removeTrustline = (trustline.action === 'remove' && opLimitBaseUnits === '0');
        return (trustline.token === opToken &&
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
   * @param callback
   */
  verifyTransaction(options: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    // TODO BG-5600 Add parseTransaction / improve verification
    const self = this;
    return co<boolean>(function *() {
      const {
        txParams,
        txPrebuild,
        wallet,
        verification = {},
      } = options;
      const disableNetworking = !!verification.disableNetworking;

      if (!txPrebuild.txBase64) {
        throw new Error('missing required tx prebuild property txBase64');
      }

      const tx = new stellar.Transaction(txPrebuild.txBase64);

      if (txParams.recipients && txParams.recipients.length > 1) {
        throw new Error('cannot specify more than 1 recipient');
      }

      // Stellar txs are made up of operations. We only care about Create Account and Payment for sending funds.
      const outputOperations = _.filter(tx.operations, operation =>
        operation.type === 'createAccount' || operation.type === 'payment'
      );

      if (txParams.type === 'trustline') {
        this.verifyTrustlineTxOperations(tx.operations, txParams);
      } else {
        if (_.isEmpty(outputOperations)) {
          throw new Error('transaction prebuild does not have any operations');
        }

        _.forEach(txParams.recipients, (expectedOutput, index) => {
          const expectedOutputAddress = self.getAddressDetails(expectedOutput.address);
          const output = outputOperations[index] as (stellar.Operation.Payment | stellar.Operation.CreateAccount);
          if (output.destination !== expectedOutputAddress.address) {
            throw new Error('transaction prebuild does not match expected recipient');
          }

          const expectedOutputAmount = new BigNumber(expectedOutput.amount);
          // The output amount is expressed as startingBalance in createAccount operations and as amount in payment operations.
          const outputAmountString = (output.type === 'createAccount') ? output.startingBalance : output.amount;
          const outputAmount = new BigNumber(self.bigUnitsToBaseUnits(outputAmountString));

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
          keychains = yield Bluebird.props({
            user: self.keychains().get({ id: wallet.keyIds()[KeyIndices.USER] }),
            backup: self.keychains().get({ id: wallet.keyIds()[KeyIndices.BACKUP] }),
          });
        }

        if (!keychains || !keychains.backup || !keychains.user) {
          throw new Error('keychains are required, but could not be fetched');
        }

        if (self.verifySignature(keychains.backup.pub, tx.hash(), userSignature)) {
          throw new Error('transaction signed with wrong key');
        }
        if (!self.verifySignature(keychains.user.pub, tx.hash(), userSignature)) {
          throw new Error('transaction signature invalid');
        }
      }

      return true;
    }).call(this).asCallback(callback);
  }

  /**
   * Derive a hardened child public key from a master key seed using an additional seed for randomness.
   *
   * Due to technical differences between keypairs on the ed25519 curve and the secp256k1 curve,
   * only hardened private key derivation is supported.
   *
   * @param key seed for the master key. Note: Not the public key or encoded private key. This is the raw seed.
   * @param entropySeed random seed which is hashed to generate the derivation path
   */
  deriveKeyWithSeed({ key, seed }: { key: string; seed: string }): { derivationPath: string; key: string } {
    const derivationPathInput = bitcoin.crypto.hash256(`${seed}`).toString('hex');
    const derivationPathParts = [
      999999,
      parseInt(derivationPathInput.slice(0, 7), 16),
      parseInt(derivationPathInput.slice(7, 14), 16),
    ];
    const derivationPath = 'm/' + derivationPathParts
      .map((part) => `${part}'`)
      .join('/');
    const derivedKey = Ed25519KeyDeriver.derivePath(derivationPath, key).key;
    const keypair = stellar.Keypair.fromRawEd25519Seed(derivedKey);
    return {
      key: keypair.publicKey(),
      derivationPath,
    };
  }

  /**
   * stellar-sdk has two overloads for toXDR, and typescript can't seem to figure out the
   * correct one to use, so we have to be very explicit as to which one we want.
   * @param tx transaction to convert
   */
  protected static txToString = (tx: stellar.Transaction): string => (tx.toEnvelope().toXDR as ((_: string) => string))('base64');

  parseTransaction(params: ParseTransactionOptions, callback?: NodeCallback<ParsedTransaction>): Bluebird<ParsedTransaction> {
    return Bluebird.resolve({}).asCallback(callback);
  }
}
