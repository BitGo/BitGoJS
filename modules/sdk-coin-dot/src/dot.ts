import * as _ from 'lodash';
import {
  BaseCoin,
  BitGoBase,
  DotAssetTypes,
  Eddsa,
  Environments,
  ExplanationResult,
  KeyPair,
  MethodNotImplementedError,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  UnsignedTransaction,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  EDDSAMethods,
  EDDSAMethodTypes,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, PolkadotSpecNameType } from '@bitgo/statics';
import { Interface, KeyPair as DotKeyPair, Transaction, TransactionBuilderFactory, Utils } from './lib';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Material } from './lib/iface';
import { isInteger } from 'lodash';

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  transaction: Interface.TxData;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
}

interface RecoveryOptions {
  userKey?: string; // Box A
  backupKey?: string; // Box B
  bitgoKey: string; // Box C
  recoveryDestination: string;
  krsProvider?: string;
  walletPassphrase?: string;
  startingScanIndex?: number;
  scan?: number;
}

interface DotTx {
  serializedTx: string;
  scanIndex: number;
}

const dotUtils = Utils.default;

export class Dot extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  readonly MAX_VALIDITY_DURATION = 2400;
  readonly SWEEP_TXN_DURATION = 64;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  protected static initialized = false;
  protected static MPC: Eddsa;
  protected static nodeApiInitialized = false;
  protected static API: ApiPromise;

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Dot(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'dot';
  }

  getBaseChain(): string {
    return 'dot';
  }

  getFamily(): string {
    return 'dot';
  }

  getFullName(): string {
    return 'Polkadot';
  }

  supportsStaking(): boolean {
    return true;
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? dotUtils.keyPairFromSeed(new Uint8Array(seed)) : new DotKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return dotUtils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether the supplied private key is a valid dot private key
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return dotUtils.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return dotUtils.isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   * @return {Buffer} A signature over the given message using the given key
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const msg = Buffer.isBuffer(message) ? message.toString('utf8') : message;
    // reconstitute keys and sign
    return Buffer.from(new DotKeyPair({ prv: key.prv }).signMessage(msg));
  }

  /**
   * Explain/parse transaction
   * @param unsignedTransaction
   */
  async explainTransaction(unsignedTransaction: UnsignedTransaction): Promise<ExplanationResult> {
    let outputAmount = 0;
    unsignedTransaction.parsedTx.outputs.forEach((o) => {
      outputAmount += parseInt(o.valueString, 10);
    });
    const explanationResult: ExplanationResult = {
      displayOrder: [
        'outputAmount',
        'changeAmount',
        'outputs',
        'changeOutputs',
        'fee',
        'type',
        'sequenceId',
        'id',
        'blockNumber',
      ],
      sequenceId: unsignedTransaction.parsedTx.sequenceId,
      fee: unsignedTransaction.feeInfo?.feeString,
      id: unsignedTransaction.parsedTx.id,
      type: unsignedTransaction.parsedTx.type,
      outputs: unsignedTransaction.parsedTx.outputs,
      blockNumber: unsignedTransaction.coinSpecific?.blockNumber,
      outputAmount: outputAmount,
      changeOutputs: [],
      changeAmount: '0',
    };

    return explanationResult;
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params.prv;

    const txHex = params.txPrebuild.txHex;

    if (!txHex) {
      throw new Error('missing txPrebuild parameter');
    }

    if (!_.isString(txHex)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txHex}`);
    }

    if (!prv) {
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params, 'pubs')) {
      throw new Error('missing public key parameter to sign transaction');
    }

    return { txHex, prv };
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
    const { txHex, prv } = this.verifySignTransactionParams(params);
    const factory = this.getBuilder();
    const txBuilder = factory.from(txHex);
    const keyPair = new DotKeyPair({ prv: prv });
    const { referenceBlock, blockNumber, transactionVersion, sender } = params.txPrebuild.transaction;

    txBuilder
      .validity({ firstValid: blockNumber, maxDuration: this.MAX_VALIDITY_DURATION })
      .referenceBlock(referenceBlock)
      .version(transactionVersion)
      .sender({ address: sender })
      .sign({ key: keyPair.getKeys().prv });
    const transaction = await txBuilder.build();
    if (!transaction) {
      throw new Error('Invalid transaction');
    }
    const signedTxHex = transaction.toBroadcastFormat();
    return { txHex: signedTxHex };
  }

  protected async getInitializedNodeAPI(): Promise<ApiPromise> {
    if (!Dot.nodeApiInitialized) {
      const wsProvider = new WsProvider(Environments[this.bitgo.getEnv()].dotNodeUrls);
      Dot.API = await ApiPromise.create({ provider: wsProvider });
      Dot.nodeApiInitialized = true;
    }
    return Dot.API;
  }

  protected async getAccountInfo(walletAddr: string): Promise<{ nonce: number; freeBalance: number }> {
    const api = await this.getInitializedNodeAPI();
    const { nonce, data: balance } = await api.query.system.account(walletAddr);
    return { nonce: nonce.toNumber(), freeBalance: balance.free.toNumber() };
  }

  protected async getHeaderInfo(): Promise<{ headerNumber: number; headerHash: string }> {
    const api = await this.getInitializedNodeAPI();
    const { number, hash } = await api.rpc.chain.getHeader();
    return { headerNumber: number.toNumber(), headerHash: hash.toString() };
  }

  /**
   *
   * Estimate the fee of the transaction
   *
   * @param {string} destAddr destination wallet address
   * @param {string} srcAddr source wallet address
   * @param {string} amount amount to transfer
   * @returns {number} the estimated fee the transaction will cost
   *
   * @see https://polkadot.js.org/docs/api/cookbook/tx#how-do-i-estimate-the-transaction-fees
   */
  protected async getFee(destAddr: string, srcAddr: string, amount: number): Promise<number> {
    const api = await this.getInitializedNodeAPI();
    const info = await api.tx.balances.transfer(destAddr, amount).paymentInfo(srcAddr);
    return info.partialFee.toNumber();
  }

  protected async getMaterial(): Promise<Material> {
    const api = await this.getInitializedNodeAPI();
    return {
      genesisHash: api.genesisHash.toString(),
      chainName: api.runtimeChain.toString(),
      specName: api.runtimeVersion.specName.toString() as PolkadotSpecNameType,
      specVersion: api.runtimeVersion.specVersion.toNumber(),
      txVersion: api.runtimeVersion.transactionVersion.toNumber(),
      metadata: api.runtimeMetadata.toHex(),
    };
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param {RecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {DotTx} the serialized transaction hex string and index
   * of the address being swept
   */
  async recover(params: RecoveryOptions): Promise<DotTx> {
    if (!params.bitgoKey) {
      throw new Error('missing bitgoKey');
    }
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }
    let startIdx = params.startingScanIndex;
    if (_.isUndefined(startIdx)) {
      startIdx = 0;
    } else if (!isInteger(startIdx) || startIdx < 0) {
      throw new Error('Invalid starting index to scan for addresses');
    }
    let numIteration = params.scan;
    if (_.isUndefined(numIteration)) {
      numIteration = 20;
    } else if (!isInteger(numIteration) || numIteration <= 0) {
      throw new Error('Invalid scanning factor');
    }
    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;

    const MPC = await EDDSAMethods.getInitializedMpcInstance();

    for (let i = startIdx; i < numIteration + startIdx; i++) {
      const currPath = `m/${i}`;
      const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
      const senderAddr = this.getAddressFromPublicKey(accountId);
      const { nonce, freeBalance } = await this.getAccountInfo(senderAddr);
      if (freeBalance <= 0) {
        continue;
      }

      // first build the unsigned txn
      const { headerNumber, headerHash } = await this.getHeaderInfo();
      const material = await this.getMaterial();

      const txnBuilder = this.getBuilder().getTransferBuilder().material(material);
      txnBuilder
        .sweep()
        .to({ address: params.recoveryDestination })
        .sender({ address: senderAddr })
        .validity({ firstValid: headerNumber, maxDuration: this.SWEEP_TXN_DURATION })
        .referenceBlock(headerHash)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: nonce })
        .fee({ amount: 0, type: 'tip' });
      const unsignedTransaction = (await txnBuilder.build()) as Transaction;

      let serializedTx = unsignedTransaction.toBroadcastFormat();
      if (!isUnsignedSweep) {
        if (!params.userKey) {
          throw new Error('missing userKey');
        }
        if (!params.backupKey) {
          throw new Error('missing backupKey');
        }
        if (!params.walletPassphrase) {
          throw new Error('missing wallet passphrase');
        }

        // Clean up whitespace from entered values
        const userKey = params.userKey.replace(/\s/g, '');
        const backupKey = params.backupKey.replace(/\s/g, '');

        // Decrypt private keys from KeyCard values
        let userPrv;
        try {
          userPrv = this.bitgo.decrypt({
            input: userKey,
            password: params.walletPassphrase,
          });
        } catch (e) {
          throw new Error(`Error decrypting user keychain: ${e.message}`);
        }
        /** TODO BG-52419 Implement Codec for parsing */
        const userSigningMaterial = JSON.parse(userPrv) as EDDSAMethodTypes.UserSigningMaterial;

        let backupPrv;
        try {
          backupPrv = this.bitgo.decrypt({
            input: backupKey,
            password: params.walletPassphrase,
          });
        } catch (e) {
          throw new Error(`Error decrypting backup keychain: ${e.message}`);
        }
        const backupSigningMaterial = JSON.parse(backupPrv) as EDDSAMethodTypes.BackupSigningMaterial;

        // add signature
        const signatureHex = await EDDSAMethods.getTSSSignature(
          userSigningMaterial,
          backupSigningMaterial,
          currPath,
          unsignedTransaction
        );
        const dotKeyPair = new DotKeyPair({ pub: accountId });
        txnBuilder.addSignature({ pub: dotKeyPair.getKeys().pub }, signatureHex);
        const signedTransaction = await txnBuilder.build();
        serializedTx = signedTransaction.toBroadcastFormat();
      }
      return { serializedTx: serializedTx, scanIndex: i };
    }
    throw new Error('Did not find an address with funds to recover');
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  getAddressFromPublicKey(Pubkey: string): string {
    return new DotKeyPair({ pub: Pubkey }).getAddress(Utils.default.getAddressFormat(this.getChain() as DotAssetTypes));
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }
}
