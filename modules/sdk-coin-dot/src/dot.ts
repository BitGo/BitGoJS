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
  MPCTx,
  MPCRecoveryOptions,
  MPCConsolidationRecoveryOptions,
  MPCSweepTxs,
  RecoveryTxRequest,
  MPCUnsignedTx,
  MPCSweepRecoveryOptions,
  MPCTxs,
  MultisigType,
  multisigTypes,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, PolkadotSpecNameType } from '@bitgo/statics';
import { Interface, KeyPair as DotKeyPair, Transaction, TransactionBuilderFactory, Utils } from './lib';
import '@polkadot/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Material } from './lib/iface';
import BigNumber from 'bignumber.js';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';

export const DEFAULT_SCAN_FACTOR = 20; // default number of receive addresses to scan for funds

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

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
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
    const info = await api.tx.balances.transferAllowDeath(destAddr, amount).paymentInfo(srcAddr);
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
   * @param {MPCRecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {MPCTx} the serialized transaction hex string and index
   * of the address being swept
   */
  async recover(params: MPCRecoveryOptions): Promise<MPCTx | MPCSweepTxs> {
    if (!params.bitgoKey) {
      throw new Error('missing bitgoKey');
    }
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;

    const MPC = await EDDSAMethods.getInitializedMpcInstance();

    const index = params.index || 0;
    const currPath = params.seed ? getDerivationPath(params.seed) + `/${index}` : `m/${index}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
    const senderAddr = this.getAddressFromPublicKey(accountId);

    const { nonce, freeBalance } = await this.getAccountInfo(senderAddr);
    const destAddr = params.recoveryDestination;
    const amount = freeBalance;
    const partialFee = await this.getFee(destAddr, senderAddr, amount);

    const value = new BigNumber(freeBalance).minus(new BigNumber(partialFee));
    if (value.isLessThanOrEqualTo(0)) {
      throw new Error('Did not find address with funds to recover');
    }

    // first build the unsigned txn
    const { headerNumber, headerHash } = await this.getHeaderInfo();
    const material = await this.getMaterial();
    const validityWindow = { firstValid: headerNumber, maxDuration: this.MAX_VALIDITY_DURATION };

    const txnBuilder = this.getBuilder().getTransferBuilder().material(material);
    txnBuilder
      .sweep(false)
      .to({ address: params.recoveryDestination })
      .sender({ address: senderAddr })
      .validity(validityWindow)
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
    } else {
      const value = new BigNumber(freeBalance);
      const walletCoin = this.getChain();
      const inputs = [
        {
          address: unsignedTransaction.inputs[0].address,
          valueString: value.toString(),
          value: value.toNumber(),
        },
      ];
      const outputs = [
        {
          address: unsignedTransaction.outputs[0].address,
          valueString: value.toString(),
          coinName: walletCoin,
        },
      ];
      const spendAmount = value.toString();
      const parsedTx = { inputs: inputs, outputs: outputs, spendAmount: spendAmount, type: '' };
      const feeInfo = { fee: 0, feeString: '0' };
      const transaction: MPCTx = {
        serializedTx: serializedTx,
        scanIndex: index,
        coin: walletCoin,
        signableHex: unsignedTransaction.signablePayload.toString('hex'),
        derivationPath: currPath,
        parsedTx: parsedTx,
        feeInfo: feeInfo,
        coinSpecific: { ...validityWindow, commonKeychain: bitgoKey },
      };

      const unsignedTx: MPCUnsignedTx = { unsignedTx: transaction, signatureShares: [] };
      const transactions: MPCUnsignedTx[] = [unsignedTx];
      const txRequest: RecoveryTxRequest = {
        transactions: transactions,
        walletCoin: walletCoin,
      };
      const txRequests: MPCSweepTxs = { txRequests: [txRequest] };
      return txRequests;
    }
    const transaction: MPCTx = { serializedTx: serializedTx, scanIndex: index };
    return transaction;
  }

  /**
   * Builds native DOT recoveries of receive addresses in batch without BitGo.
   * Funds will be recovered to base address first. You need to initiate another sweep txn after that.
   *
   * @param {MPCConsolidationRecoveryOptions} params - options for consolidation recovery.
   * @param {string} [params.startingScanIndex] - receive address index to start scanning from. default to 1 (inclusive).
   * @param {string} [params.endingScanIndex] - receive address index to end scanning at. default to startingScanIndex + 20 (exclusive).
   */
  async recoverConsolidations(params: MPCConsolidationRecoveryOptions): Promise<MPCTxs | MPCSweepTxs> {
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;
    const startIdx = params.startingScanIndex || 1;
    const endIdx = params.endingScanIndex || startIdx + DEFAULT_SCAN_FACTOR;

    if (startIdx < 1 || endIdx <= startIdx || endIdx - startIdx > 10 * DEFAULT_SCAN_FACTOR) {
      throw new Error(
        `Invalid starting or ending index to scan for addresses. startingScanIndex: ${startIdx}, endingScanIndex: ${endIdx}.`
      );
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    const baseIndex = 0;
    const basePath = params.seed ? getDerivationPath(params.seed) + `/${baseIndex}` : `m/${baseIndex}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, basePath).slice(0, 64);
    const baseAddress = this.getAddressFromPublicKey(accountId);

    const consolidationTransactions: any[] = [];
    let lastScanIndex = startIdx;
    for (let i = startIdx; i < endIdx; i++) {
      const recoverParams = {
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletPassphrase: params.walletPassphrase,
        recoveryDestination: baseAddress,
        seed: params.seed,
        index: i,
      };

      let recoveryTransaction;
      try {
        recoveryTransaction = await this.recover(recoverParams);
      } catch (e) {
        if (e.message === 'Did not find address with funds to recover') {
          lastScanIndex = i;
          continue;
        }
        throw e;
      }

      if (isUnsignedSweep) {
        consolidationTransactions.push((recoveryTransaction as MPCSweepTxs).txRequests[0]);
      } else {
        consolidationTransactions.push(recoveryTransaction);
      }
      lastScanIndex = i;
    }

    if (consolidationTransactions.length == 0) {
      throw new Error('Did not find an address with funds to recover');
    }

    if (isUnsignedSweep) {
      // lastScanIndex will be used to inform user the last address index scanned for available funds (so they can
      // appropriately adjust the scan range on the next iteration of consolidation recoveries). In the case of unsigned
      // sweep consolidations, this lastScanIndex will be provided in the coinSpecific of the last txn made.
      const lastTransactionCoinSpecific = {
        firstValid:
          consolidationTransactions[consolidationTransactions.length - 1].transactions[0].unsignedTx.coinSpecific
            .firstValid,
        maxDuration:
          consolidationTransactions[consolidationTransactions.length - 1].transactions[0].unsignedTx.coinSpecific
            .maxDuration,
        commonKeychain:
          consolidationTransactions[consolidationTransactions.length - 1].transactions[0].unsignedTx.coinSpecific
            .commonKeychain,
        lastScanIndex: lastScanIndex,
      };
      consolidationTransactions[consolidationTransactions.length - 1].transactions[0].unsignedTx.coinSpecific =
        lastTransactionCoinSpecific;
      const consolidationSweepTransactions: MPCSweepTxs = { txRequests: consolidationTransactions };
      return consolidationSweepTransactions;
    }

    return { transactions: consolidationTransactions, lastScanIndex };
  }

  /** inherited doc */
  async createBroadcastableSweepTransaction(params: MPCSweepRecoveryOptions): Promise<MPCTxs> {
    const req = params.signatureShares;
    const broadcastableTransactions: MPCTx[] = [];
    let lastScanIndex = 0;

    for (let i = 0; i < req.length; i++) {
      const MPC = await EDDSAMethods.getInitializedMpcInstance();
      const transaction = req[i].txRequest.transactions[0].unsignedTx;
      if (!req[i].ovc || !req[i].ovc[0].eddsaSignature) {
        throw new Error('Missing signature(s)');
      }
      const signature = req[i].ovc[0].eddsaSignature;
      if (!transaction.signableHex) {
        throw new Error('Missing signable hex');
      }
      const messageBuffer = Buffer.from(transaction.signableHex!, 'hex');
      const result = MPC.verify(messageBuffer, signature);
      if (!result) {
        throw new Error('Invalid signature');
      }
      const signatureHex = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
      if (
        !transaction.coinSpecific ||
        !transaction.coinSpecific?.firstValid ||
        !transaction.coinSpecific?.maxDuration
      ) {
        throw new Error('missing validity window');
      }
      const validityWindow = {
        firstValid: transaction.coinSpecific?.firstValid,
        maxDuration: transaction.coinSpecific?.maxDuration,
      };
      const material = await this.getMaterial();
      if (!transaction.coinSpecific?.commonKeychain) {
        throw new Error('Missing common keychain');
      }
      const commonKeychain = transaction.coinSpecific!.commonKeychain! as string;
      if (!transaction.derivationPath) {
        throw new Error('Missing derivation path');
      }
      const derivationPath = transaction.derivationPath as string;
      const accountId = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
      const senderAddr = this.getAddressFromPublicKey(accountId);
      const txnBuilder = this.getBuilder()
        .material(material)
        .from(transaction.serializedTx as string)
        .sender({ address: senderAddr })
        .validity(validityWindow);
      const dotKeyPair = new DotKeyPair({ pub: accountId });
      txnBuilder.addSignature({ pub: dotKeyPair.getKeys().pub }, signatureHex);
      const signedTransaction = await txnBuilder.build();
      const serializedTx = signedTransaction.toBroadcastFormat();

      broadcastableTransactions.push({
        serializedTx: serializedTx,
        scanIndex: transaction.scanIndex,
      });

      if (i === req.length - 1 && transaction.coinSpecific!.lastScanIndex) {
        lastScanIndex = transaction.coinSpecific!.lastScanIndex as number;
      }
    }
    return { transactions: broadcastableTransactions, lastScanIndex };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild, txParams } = params;

    // Verify single recipient constraint
    if (Array.isArray(txParams?.recipients) && txParams.recipients.length > 1) {
      throw new Error(
        `${this.getChain()} doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
      );
    }

    // Get raw transaction from either txHex or txRequest
    const rawTx =
      txPrebuild.txHex ||
      (txPrebuild.txRequest?.apiVersion === 'full'
        ? txPrebuild.txRequest.transactions?.[0]?.unsignedTx?.signableHex
        : txPrebuild.txRequest?.unsignedTxs?.[0]?.signableHex);

    if (!rawTx) {
      throw new Error('missing required transaction hex');
    }

    // Verify recipient and amount if provided
    if (txParams?.recipients?.[0]) {
      const recipient = txParams.recipients[0];
      const txBuilder = this.getBuilder();
      const transaction = txBuilder.from(rawTx);
      const decodedTx = await transaction.build();
      const explainedTx = decodedTx.explainTransaction();

      // Verify recipient address matches
      if (recipient.address !== explainedTx.to) {
        throw new Error('transaction recipient address does not match expected address');
      }

      // Verify amount matches
      if (!new BigNumber(recipient.amount).isEqualTo(explainedTx.amount)) {
        throw new Error('transaction amount does not match expected amount');
      }
    }

    return true;
  }

  getAddressFromPublicKey(Pubkey: string): string {
    return new DotKeyPair({ pub: Pubkey }).getAddress(Utils.default.getAddressFormat(this.getChain() as DotAssetTypes));
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }
}
