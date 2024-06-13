/**
 * @prettier
 */
import * as _ from 'lodash';
import { SeedValidator } from './seedValidator';
import { coins, CoinFamily } from '@bitgo/statics';
import * as AlgoLib from './lib';
import {
  AddressCoinSpecific,
  BaseBroadcastTransactionOptions,
  BaseBroadcastTransactionResult,
  BaseCoin,
  BitGoBase,
  InvalidAddressError,
  InvalidKey,
  KeyIndices,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  TokenManagementType,
  TransactionExplanation,
  TransactionRecipient,
  TransactionType,
  UnexpectedAddressError,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  NotSupported,
} from '@bitgo/sdk-core';
import stellar from 'stellar-sdk';
import BigNumber from 'bignumber.js';
import Utils from './lib/utils';
import { TxData } from './lib/ifaces';
import * as algosdk from 'algosdk';
import {
  MAINNET_GENESIS_HASH,
  MAINNET_GENESIS_ID,
  TESTNET_GENESIS_HASH,
  TESTNET_GENESIS_ID,
} from './lib/transactionBuilder';
import { Buffer } from 'buffer';

const SUPPORTED_ADDRESS_VERSION = 1;
const MSIG_THRESHOLD = 2; // m in m-of-n

export interface AlgoAddressCoinSpecifics extends AddressCoinSpecific {
  rootAddress: string;
  bitgoKey: string;
  bitgoPubKey?: string;
  addressVersion: number;
  threshold: number;
}

export interface VerifyAlgoAddressOptions extends VerifyAddressOptions {
  chain: number;
  index: number;
  coin: string;
  wallet: string;
  coinSpecific: AlgoAddressCoinSpecifics;
}

export interface AlgoTransactionExplanation extends TransactionExplanation {
  memo?: string;
  type?: string | number;
  voteKey?: string;
  selectionKey?: string;
  voteFirst?: number;
  voteLast?: number;
  voteKeyDilution?: number;
  tokenId?: number;
  operations?: TransactionOperation[];
}

export interface TransactionOperation {
  type: string;
  coin: string;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  halfSigned?: {
    txHex: string;
  };
  txInfo: {
    from: string;
    to: string;
    amount: string;
    fee: number;
    firstRound: number;
    lastRound: number;
    genesisID: string;
    genesisHash: string;
    note?: string;
  };
  keys: string[];
  addressVersion: number;
}

export interface FullySignedTransaction {
  txHex: string;
}

export interface HalfSignedTransaction {
  halfSigned: {
    txHex: string;
  };
}

export interface TransactionFee {
  fee: string;
}
export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  publicKeys?: string[];
  feeInfo: TransactionFee;
}

interface NodeParams {
  token: string;
  baseServer: string;
  port: number;
}

export interface VerifiedTransactionParameters {
  txHex: string;
  addressVersion: number;
  signers: string[];
  prv: string;
  isHalfSigned: boolean;
  numberSigners: number;
}

export interface RecoveryOptions {
  backupKey: string;
  userKey: string;
  rootAddress: string;
  recoveryDestination: string;
  bitgoKey: string;
  walletPassphrase?: string;
  fee: number;
  firstRound?: number;
  note?: string;
  nodeParams: NodeParams;
}

interface RecoveryInfo {
  id: string;
  tx: string;
  coin: string;
  fee: number;
  firstRound: number;
  lastRound: number;
  genesisId: string;
  genesisHash: string;
  note?: string;
}

export interface OfflineVaultTxInfo {
  txHex: string;
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  type?: string;
  address: string;
  coin: string;
  feeInfo: number;
  amount: string;
  firstRound: number;
  lastRound: number;
  genesisId: string;
  genesisHash: string;
  note?: string;
  addressVersion: number;
  keys: string[];
}

export interface BroadcastTransactionOptions extends BaseBroadcastTransactionOptions {
  nodeParams: NodeParams;
}

export class Algo extends BaseCoin {
  readonly ENABLE_TOKEN: TokenManagementType = 'enabletoken';
  readonly DISABLE_TOKEN: TokenManagementType = 'disabletoken';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Algo(bitgo);
  }

  getChain(): string {
    return 'algo';
  }

  getBaseChain(): string {
    return 'algo';
  }

  getFamily(): string {
    return 'algo';
  }

  getFullName(): string {
    return 'Algorand';
  }

  getBaseFactor(): number | string {
    return 1e6;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Algorand supports account consolidations. These are transfers from the receive addresses
   * to the main address.
   */
  allowsAccountConsolidations(): boolean {
    return true;
  }

  /** inheritdoc */
  deriveKeyWithSeed(): { derivationPath: string; key: string } {
    throw new NotSupported('method deriveKeyWithSeed not supported for eddsa curve');
  }

  /** inheritdoc */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new AlgoLib.KeyPair({ seed }) : new AlgoLib.KeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }

    return {
      pub: keyPair.getAddress(),
      prv: AlgoLib.algoUtils.encodeSeed(Buffer.from(keyPair.getSigningKey())),
    };
  }

  /** inheritdoc */
  generateRootKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new AlgoLib.KeyPair({ seed }) : new AlgoLib.KeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return { prv: keys.prv + keys.pub, pub: keys.pub };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return AlgoLib.algoUtils.isValidAddress(pub) || AlgoLib.algoUtils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   * In Algorand, when the private key is encoded as base32 string only the first 32 bytes are taken,
   * so the encoded value is actually the seed
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return AlgoLib.algoUtils.isValidSeed(prv) || AlgoLib.algoUtils.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return AlgoLib.algoUtils.isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const algoKeypair = new AlgoLib.KeyPair({ prv: key.prv });
    if (Buffer.isBuffer(message)) {
      message = message.toString('base64');
    }
    return Buffer.from(algoKeypair.signMessage(message));
  }

  /**
   * Specifies what key we will need for signing` - Algorand needs the backup, bitgo pubs.
   */
  keyIdsForSigning(): number[] {
    return [KeyIndices.USER, KeyIndices.BACKUP, KeyIndices.BITGO];
  }

  getTokenNameById(tokenId: number | string): string {
    const tokenNames = coins.filter((coin) => coin.family === 'algo' && coin.isToken).map(({ name }) => name!);
    return tokenNames.find((tokenName) => tokenName.split('-')[1] === `${tokenId}`) || 'AlgoToken unknown';
  }

  /**
   * Explain/parse transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<AlgoTransactionExplanation | undefined> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }

    const factory = this.getBuilder();

    const txBuilder = factory.from(txHex);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    if (tx.type === TransactionType.Send) {
      const outputs: TransactionRecipient[] = [
        {
          address: txJson.to,
          amount: txJson.amount,
          memo: txJson.note,
        },
      ];
      const operations: TransactionOperation[] = [];

      const isTokenTx = this.isTokenTx(txJson.type);
      if (isTokenTx) {
        const type = AlgoLib.algoUtils.getTokenTxType(txJson.amount, txJson.from, txJson.to, txJson.closeRemainderTo);
        operations.push({
          type: type,
          coin: this.getTokenNameById(txJson.tokenId),
        });
      }

      const displayOrder = [
        'id',
        'outputAmount',
        'changeAmount',
        'outputs',
        'changeOutputs',
        'fee',
        'memo',
        'type',
        'operations',
      ];

      const explanationResult: AlgoTransactionExplanation = {
        displayOrder,
        id: txJson.id,
        outputAmount: txJson.amount.toString(),
        changeAmount: '0',
        outputs,
        changeOutputs: [],
        fee: txJson.fee,
        memo: txJson.note,
        type: tx.type.toString(),
        operations,
      };

      if (txJson.tokenId) {
        explanationResult.tokenId = txJson.tokenId;
      }

      return explanationResult;
    }

    if (tx.type === TransactionType.WalletInitialization) {
      const displayOrder = [
        'id',
        'fee',
        'memo',
        'type',
        'voteKey',
        'selectionKey',
        'voteFirst',
        'voteLast',
        'voteKeyDilution',
      ];

      return {
        displayOrder,
        id: txJson.id,
        outputAmount: '0',
        changeAmount: '0',
        outputs: [],
        changeOutputs: [],
        fee: txJson.fee,
        memo: txJson.note,
        type: tx.type,
        voteKey: txJson.voteKey,
        selectionKey: txJson.selectionKey,
        voteFirst: txJson.voteFirst,
        voteLast: txJson.voteLast,
        voteKeyDilution: txJson.voteKeyDilution,
      };
    }
  }

  /**
   * returns if a tx is a token tx
   * @param type {string} - tx type
   * @returns true if it's a token tx
   */
  isTokenTx(type: string): boolean {
    return type === 'axfer';
  }

  /**
   * Check if a seed is a valid stellar seed
   *
   * @param {String} seed the seed to check
   * @returns {Boolean} true if the input is a Stellar seed
   */
  isStellarSeed(seed: string): boolean {
    return SeedValidator.isValidEd25519SeedForCoin(seed, CoinFamily.XLM);
  }

  /**
   * Convert a stellar seed to an algo seed
   *
   * @param {String} seed the seed to convert
   * @returns {Boolean | null} seed in algo encoding
   */
  convertFromStellarSeed(seed: string): string | null {
    // assume this is a trust custodial seed if its a valid ed25519 prv
    if (!this.isStellarSeed(seed) || SeedValidator.hasCompetingSeedFormats(seed)) {
      return null;
    }

    if (SeedValidator.isValidEd25519SeedForCoin(seed, CoinFamily.XLM)) {
      return AlgoLib.algoUtils.convertFromStellarSeed(seed);
    }

    return null;
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params.prv;
    const addressVersion = params.txPrebuild.addressVersion;
    let isHalfSigned = false;

    // it's possible this tx was already signed - take the halfSigned
    // txHex if it is
    let txHex = params.txPrebuild.txHex;
    if (params.txPrebuild.halfSigned) {
      isHalfSigned = true;
      txHex = params.txPrebuild.halfSigned.txHex;
    }

    if (_.isUndefined(txHex)) {
      throw new Error('missing txPrebuild parameter');
    }

    if (!_.isString(txHex)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txHex}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params.txPrebuild, 'keys')) {
      throw new Error('missing public keys parameter to sign transaction');
    }

    if (!_.isNumber(addressVersion)) {
      throw new Error('missing addressVersion parameter to sign transaction');
    }

    const signers = params.txPrebuild.keys.map((key) => {
      // if we are receiving addresses do not try to convert them
      if (!AlgoLib.algoUtils.isValidAddress(key)) {
        return AlgoLib.algoUtils.publicKeyToAlgoAddress(AlgoLib.algoUtils.toUint8Array(key));
      }
      return key;
    });
    // TODO(https://bitgoinc.atlassian.net/browse/STLX-6067): fix the number of signers using
    // should be similar to other coins implementation
    // If we have a number with digits to eliminate them without taking any rounding criteria.
    const numberSigners = Math.trunc(signers.length / 2) + 1;
    return { txHex, addressVersion, signers, prv, isHalfSigned, numberSigners };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {TransactionPrebuild} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @returns {Promise<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const { txHex, signers, prv, isHalfSigned, numberSigners } = this.verifySignTransactionParams(params);
    const factory = this.getBuilder();
    const txBuilder = factory.from(txHex);
    txBuilder.numberOfRequiredSigners(numberSigners);
    txBuilder.sign({ key: prv });
    txBuilder.setSigners(signers);
    const transaction = await txBuilder.build();
    if (!transaction) {
      throw new Error('Invalid transaction');
    }
    const signedTxHex = Buffer.from(transaction.toBroadcastFormat()).toString('base64');
    if (numberSigners === 1) {
      return { txHex: signedTxHex };
    } else if (isHalfSigned) {
      return { txHex: signedTxHex };
    } else {
      return { halfSigned: { txHex: signedTxHex } };
    }
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Check if address can be used to send funds.
   *
   * @param params.address address to validate
   * @param params.keychains public keys to generate the wallet
   */
  async isWalletAddress(params: VerifyAlgoAddressOptions): Promise<boolean> {
    const {
      address,
      keychains,
      coinSpecific: { bitgoPubKey },
    } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (!keychains) {
      throw new Error('missing required param keychains');
    }

    const effectiveKeychain = bitgoPubKey ? keychains.slice(0, -1).concat([{ pub: bitgoPubKey }]) : keychains;
    const pubKeys = effectiveKeychain.map((key) => this.stellarAddressToAlgoAddress(key.pub));

    if (!pubKeys.every((pubKey) => this.isValidPub(pubKey))) {
      throw new InvalidKey('invalid public key');
    }

    const rootAddress = AlgoLib.algoUtils.multisigAddress(SUPPORTED_ADDRESS_VERSION, MSIG_THRESHOLD, pubKeys);

    return rootAddress === address;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  decodeTx(txn: Buffer): unknown {
    return AlgoLib.algoUtils.decodeAlgoTxn(txn);
  }

  getAddressFromPublicKey(pubKey: Uint8Array): string {
    return AlgoLib.algoUtils.publicKeyToAlgoAddress(pubKey);
  }

  supportsDeriveKeyWithSeed(): boolean {
    return false;
  }

  /**
   * Gets config for how token enablements work for this coin
   * @returns
   *    requiresTokenEnablement: True if tokens need to be enabled for this coin
   *    supportsMultipleTokenEnablements: True if multiple tokens can be enabled in one transaction
   */
  getTokenEnablementConfig() {
    return {
      requiresTokenEnablement: true,
      supportsMultipleTokenEnablements: false,
    };
  }

  /**
   * Gets the balance of the root address in base units of algo
   * Eg. If balance is 1 Algo, this returns 1*10^6
   * @param rootAddress
   * @param client
   */
  async getAccountBalance(rootAddress: string, client: algosdk.Algodv2): Promise<number> {
    const accountInformation = await client.accountInformation(rootAddress).do();
    // Extract the balance from the account information
    return accountInformation.amount;
  }

  /**
   * Returns the Algo client for the given token, baseServer and port
   * Used to interact with the Algo network
   */
  getClient(token: string, baseServer: string, port: number): algosdk.Algodv2 {
    return new algosdk.Algodv2(token, baseServer, port);
  }

  public async recover(params: RecoveryOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    const isUnsignedSweep = this.isValidPub(params.userKey) && this.isValidPub(params.backupKey);

    if (!params.nodeParams) {
      throw new Error('Please provide the details of an ALGO node to use for recovery');
    }

    // Validate the root address
    if (!this.isValidAddress(params.rootAddress)) {
      throw new Error('invalid rootAddress, got: ' + params.rootAddress);
    }

    // Validate the destination address
    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination, got: ' + params.recoveryDestination);
    }

    if (params.firstRound && new BigNumber(params.firstRound).isNegative()) {
      throw new Error('first round needs to be a positive value');
    }

    const genesisId = this.bitgo.getEnv() === 'prod' ? MAINNET_GENESIS_ID : TESTNET_GENESIS_ID;
    const genesisHash = this.bitgo.getEnv() === 'prod' ? MAINNET_GENESIS_HASH : TESTNET_GENESIS_HASH;

    Utils.validateBase64(genesisHash);

    if (!isUnsignedSweep && !params.walletPassphrase) {
      throw new Error('walletPassphrase is required for non-bitgo recovery');
    }

    const factory = new AlgoLib.TransactionBuilderFactory(coins.get('algo'));
    const txBuilder = factory.getTransferBuilder();

    let userPrv: string | undefined;
    let backupPrv: string | undefined;
    if (!isUnsignedSweep) {
      if (!params.bitgoKey) {
        throw new Error('bitgo public key from the keyCard is required for non-bitgo recovery');
      }
      try {
        userPrv = this.bitgo.decrypt({ input: params.userKey, password: params.walletPassphrase });
        backupPrv = this.bitgo.decrypt({ input: params.backupKey, password: params.walletPassphrase });
        const userKeyAddress = Utils.privateKeyToAlgoAddress(userPrv);
        const backupKeyAddress = Utils.privateKeyToAlgoAddress(backupPrv);
        txBuilder.numberOfRequiredSigners(2).setSigners([userKeyAddress, backupKeyAddress, params.bitgoKey]);
      } catch (e) {
        throw new Error(
          'unable to decrypt userKey or backupKey with the walletPassphrase provided, got error: ' + e.message
        );
      }
    }

    const client = this.getClient(params.nodeParams.token, params.nodeParams.baseServer, params.nodeParams.port);
    const nativeBalance = await this.getAccountBalance(params.rootAddress, client);

    // Algorand accounts require a min. balance of 1 ALGO
    const MIN_MICROALGOS_BALANCE = 100000;
    const spendableAmount = new BigNumber(nativeBalance).minus(params.fee).minus(MIN_MICROALGOS_BALANCE).toNumber();

    if (new BigNumber(spendableAmount).isZero() || new BigNumber(spendableAmount).isLessThanOrEqualTo(params.fee)) {
      throw new Error(
        'Insufficient balance to recover, got balance: ' +
          nativeBalance +
          ' fee: ' +
          params.fee +
          ' min account balance: ' +
          MIN_MICROALGOS_BALANCE
      );
    }

    let latestRound: number | undefined;
    if (!params.firstRound) {
      latestRound = await client
        .status()
        .do()
        .then((status) => status['last-round']);
    }

    const firstRound = !params.firstRound ? latestRound : params.firstRound;
    if (!firstRound) {
      throw new Error('Unable to fetch the latest round from the node. Please provide the firstRound or try again.');
    }
    const LAST_ROUND_BUFFER = 1000;
    const lastRound = firstRound + LAST_ROUND_BUFFER;

    txBuilder
      .fee({ fee: params.fee.toString() })
      .isFlatFee(true)
      .sender({
        address: params.rootAddress,
      })
      .to({
        address: params.recoveryDestination,
      })
      .amount(spendableAmount)
      .genesisId(genesisId)
      .genesisHash(genesisHash)
      .firstRound(new BigNumber(firstRound).toNumber())
      .lastRound(new BigNumber(lastRound).toNumber());

    if (params.note) {
      const note = new Uint8Array(Buffer.from(params.note, 'utf-8'));
      txBuilder.note(note);
    }

    // Cold wallet, offline vault
    if (isUnsignedSweep) {
      const tx = await txBuilder.build();
      const txJson = tx.toJson() as TxData;

      return {
        txHex: Buffer.from(tx.toBroadcastFormat()).toString('hex'),
        type: txJson.type,
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        address: params.rootAddress,
        coin: this.getChain(),
        feeInfo: txJson.fee,
        amount: txJson.amount ?? nativeBalance.toString(),
        firstRound: txJson.firstRound,
        lastRound: txJson.lastRound,
        genesisId: genesisId,
        genesisHash: genesisHash,
        note: txJson.note ? Buffer.from(txJson.note.buffer).toString('utf-8') : undefined,
        keys: [params.userKey, params.backupKey, params.bitgoKey],
        addressVersion: 1,
      };
    }

    // Non-bitgo Recovery (Hot wallets)
    txBuilder.sign({ key: userPrv });
    txBuilder.sign({ key: backupPrv });

    const tx = await txBuilder.build();
    const txJson = tx.toJson() as TxData;

    return {
      tx: Buffer.from(tx.toBroadcastFormat()).toString('base64'),
      id: txJson.id,
      coin: this.getChain(),
      fee: txJson.fee,
      firstRound: txJson.firstRound,
      lastRound: txJson.lastRound,
      genesisId: genesisId,
      genesisHash: genesisHash,
      note: txJson.note ? Buffer.from(txJson.note.buffer).toString('utf-8') : undefined,
    };
  }

  /**
   * Accepts a fully signed serialized base64 transaction and broadcasts it on the network.
   * Uses the external node provided by the client
   * @param serializedSignedTransaction
   * @param nodeParams
   */
  async broadcastTransaction({
    serializedSignedTransaction,
    nodeParams,
  }: BroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    if (!nodeParams) {
      throw new Error('Please provide the details of the algorand node');
    }
    try {
      const txHex = Buffer.from(serializedSignedTransaction, 'base64').toString('hex');
      const algoTx = Utils.toUint8Array(txHex);
      const client = this.getClient(nodeParams.token, nodeParams.baseServer, nodeParams.port);

      return await client.sendRawTransaction(algoTx).do();
    } catch (e) {
      throw new Error('Failed to broadcast transaction, error: ' + e.message);
    }
  }

  /**
   * Stellar and Algorand both use keys on the ed25519 curve, but use different encodings.
   * As the HSM doesn't have explicit support to create Algorand addresses, we use the Stellar
   * keys and re-encode them to the Algorand encoding.
   *
   * This method should only be used when creating Algorand custodial wallets reusing Stellar keys.
   *
   * @param {string} addressOrPubKey a Stellar pubkey or Algorand address
   * @return {*}
   */
  private stellarAddressToAlgoAddress(addressOrPubKey: string): string {
    // we have an Algorand address
    if (this.isValidAddress(addressOrPubKey)) {
      return addressOrPubKey;
    }

    // we have a stellar key
    if (stellar.StrKey.isValidEd25519PublicKey(addressOrPubKey)) {
      const stellarPub = stellar.StrKey.decodeEd25519PublicKey(addressOrPubKey);
      const algoAddress = AlgoLib.algoUtils.encodeAddress(stellarPub);
      if (this.isValidAddress(algoAddress)) {
        return algoAddress;
      }
      throw new UnexpectedAddressError('Cannot convert Stellar address to an Algorand address via stellar pubkey.');
      // we have a root pubkey
    } else if (AlgoLib.algoUtils.isValidPublicKey(addressOrPubKey)) {
      const kp = new AlgoLib.KeyPair({ pub: addressOrPubKey });
      const algoAddress = kp.getAddress();
      if (this.isValidAddress(algoAddress)) {
        return algoAddress;
      }
      throw new UnexpectedAddressError('Invalid root pubkey.');
    }

    throw new UnexpectedAddressError('Neither an Algorand address, a stellar pubkey or a root public key.');
  }

  private getBuilder(): AlgoLib.TransactionBuilderFactory {
    return new AlgoLib.TransactionBuilderFactory(coins.get(this.getBaseChain()));
  }
}
