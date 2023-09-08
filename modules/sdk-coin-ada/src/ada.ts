import assert from 'assert';
import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  InvalidAddressError,
  KeyPair,
  MPCAlgorithm,
  NodeEnvironmentError,
  ParsedTransaction,
  ParseTransactionOptions as BaseParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  EDDSAMethods,
  EDDSAMethodTypes,
  AddressFormat,
  Environments,
  ITransactionRecipient,
  MPCTx,
  MPCRecoveryOptions,
  MPCConsolidationRecoveryOptions,
  MPCSweepTxs,
  RecoveryTxRequest,
  MPCUnsignedTx,
  MPCSweepRecoveryOptions,
  MPCTxs,
} from '@bitgo/sdk-core';
import { KeyPair as AdaKeyPair, Transaction, TransactionBuilderFactory, Utils } from './lib';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import adaUtils from './lib/utils';
import * as request from 'superagent';
import BigNumber from 'bignumber.js';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';

export const DEFAULT_SCAN_FACTOR = 20; // default number of receive addresses to scan for funds

export interface TransactionPrebuild {
  txHex: string;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
}

export interface AdaParseTransactionOptions extends BaseParseTransactionOptions {
  txPrebuild: TransactionPrebuild;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

interface AdaAddressParams {
  bitgoKey: string;
  index: number;
  seed?: string;
}

interface AdaAddressAndAccountId {
  address: string;
  accountId: string;
}

export type AdaTransactionExplanation = TransactionExplanation;

export class Ada extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Ada(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e6;
  }

  public getChain(): string {
    return this._staticsCoin.name;
  }

  public getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  public getFullName(): string {
    return this._staticsCoin.fullName;
  }

  getBaseChain(): string {
    return this.getChain();
  }
  /**
   * Verify that a transaction prebuild complies with the original intention
   *  A prebuild transaction has to be parsed correctly and intended recipients has to be
   *  in the transaction output
   *
   * @param params.txPrebuild prebuild transaction
   * @param params.txParams transaction parameters
   * @return true if verification success
   *
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    try {
      const coinConfig = coins.get(this.getChain());
      const { txPrebuild: txPrebuild, txParams: txParams } = params;
      const transaction = new Transaction(coinConfig);
      assert(txPrebuild.txHex, new Error('missing required tx prebuild property txHex'));
      const rawTx = txPrebuild.txHex;

      transaction.fromRawTransaction(rawTx);
      const explainedTx = transaction.explainTransaction();

      if (txParams.recipients !== undefined) {
        for (const recipient of txParams.recipients) {
          let find = false;
          for (const output of explainedTx.outputs) {
            if (recipient.address === output.address && recipient.amount === output.amount) {
              find = true;
            }
          }
          if (!find) {
            throw new Error('cannot find recipient in expected output');
          }
        }
      }
    } catch (e) {
      if (e instanceof NodeEnvironmentError) {
        return true;
      } else {
        throw e;
      }
    }
    return true;
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address } = params;
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`Invalid Cardano Address: ${address}`);
    }
    return true;
  }

  /** @inheritDoc */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const adaKeypair = new AdaKeyPair({ prv: key.prv });
    const messageHex = message instanceof Buffer ? message.toString('hex') : message;

    return Buffer.from(adaKeypair.signMessage(messageHex));
  }

  /**
   * Explain/parse transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<AdaTransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction: BaseTransaction;
    const txRaw = params.txPrebuild.txHex;

    try {
      const transactionBuilder = factory.from(txRaw);
      rebuiltTransaction = await transactionBuilder.build();
    } catch {
      throw new Error('Invalid transaction');
    }

    return rebuiltTransaction.explainTransaction();
  }

  async parseTransaction(params: AdaParseTransactionOptions): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({
      txPrebuild: params.txPrebuild,
    });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    return transactionExplanation as unknown as ParsedTransaction;
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new AdaKeyPair({ seed }) : new AdaKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  isValidPub(pub: string): boolean {
    return adaUtils.isValidPublicKey(pub);
  }

  isValidPrv(prv: string): boolean {
    return adaUtils.isValidPrivateKey(prv);
  }

  isValidAddress(address: string): boolean {
    return adaUtils.isValidAddress(address);
  }

  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const factory = this.getBuilder();
    const txBuilder = factory.from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });
    const transaction: BaseTransaction = await txBuilder.build();

    if (!transaction) {
      throw new Error('Invalid transaction');
    }

    const serializedTx = transaction.toBroadcastFormat();

    return {
      txHex: serializedTx,
    };
  }

  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].adaNodeUrl;
  }

  protected async getDataFromNode(endpoint: string, requestBody?: Record<string, unknown>): Promise<request.Response> {
    const restEndpoint = this.getPublicNodeUrl() + '/' + endpoint;
    try {
      const res = await request.post(restEndpoint).send(requestBody);
      return res;
    } catch (e) {
      console.debug(e);
    }
    throw new Error(`Unable to call endpoint ${restEndpoint}`);
  }

  protected async getAddressInfo(
    walletAddr: string
  ): Promise<{ balance: number; utxoSet: Array<Record<string, any>> }> {
    const requestBody = { _addresses: [walletAddr] };
    const res = await this.getDataFromNode('address_info', requestBody);
    if (res.status != 200) {
      throw new Error(`Failed to retrieve address info for address ${walletAddr}`);
    }
    const body = res.body[0];
    if (body === undefined) {
      return { balance: 0, utxoSet: [] };
    }
    return { balance: body.balance, utxoSet: body.utxo_set };
  }

  protected async getChainTipInfo(): Promise<Record<string, string>> {
    const res = await this.getDataFromNode('tip');
    if (res.status != 200) {
      throw new Error('Failed to retrieve chain tip info');
    }
    const body = res.body[0];
    return body;
  }

  /**
   * Creates funds sweep recovery transaction(s) without BitGo
   *
   * @param {MPCSweepRecoveryOptions} params parameters needed to combine the signatures
   * and transactions to create broadcastable transactions
   *
   * @returns {MPCTxs} array of the serialized transaction hex strings and indices
   * of the addresses being swept
   */
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
      const txBuilder = this.getBuilder().from(transaction.serializedTx as string);
      if (!transaction.coinSpecific?.commonKeychain) {
        throw new Error('Missing common keychain');
      }
      const commonKeychain = transaction.coinSpecific!.commonKeychain! as string;
      if (!transaction.derivationPath) {
        throw new Error('Missing derivation path');
      }
      const derivationPath = transaction.derivationPath as string;
      const accountId = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
      const adaKeyPair = new AdaKeyPair({ pub: accountId });

      // add combined signature from ovc
      txBuilder.addSignature({ pub: adaKeyPair.getKeys().pub }, signatureHex);
      const signedTransaction = await txBuilder.build();
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

  /**
   * Builds funds recovery transaction(s) without BitGo
   *
   * @param {MPCRecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {MPCTx | MPCSweepTxs} array of the serialized transaction hex strings and indices
   * of the addresses being swept
   */
  async recover(params: MPCRecoveryOptions): Promise<MPCTx | MPCSweepTxs> {
    if (!params.bitgoKey) {
      throw new Error('missing bitgoKey');
    }
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    const index = params.index || 0;
    const currPath = params.seed ? getDerivationPath(params.seed) + `/${index}` : `m/${index}`;
    const bitgoKey = params.bitgoKey.replace(/\s/g, '');

    const addressParams = {
      bitgoKey: params.bitgoKey,
      index: index,
      seed: params.seed,
    };
    const { address: senderAddr, accountId } = await this.getAdaAddressAndAccountId(addressParams);
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;
    const { balance, utxoSet } = await this.getAddressInfo(senderAddr);
    if (balance <= 0) {
      throw new Error('Did not find address with funds to recover');
    }

    // first build the unsigned txn
    const tipAbsSlot = await this.getChainTipInfo();
    const txBuilder = this.getBuilder().getTransferBuilder();
    txBuilder.changeAddress(params.recoveryDestination, balance.toString());
    for (const utxo of utxoSet) {
      txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
    }
    // each slot is about 1 second, so this transaction should be valid for
    // 7 * 86,400 seconds (7 days) after creation
    txBuilder.ttl(Number(tipAbsSlot.abs_slot) + 7 * 86400);
    const unsignedTransaction = (await txBuilder.build()) as Transaction;

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
      const adaKeyPair = new AdaKeyPair({ pub: accountId });
      txBuilder.addSignature({ pub: adaKeyPair.getKeys().pub }, signatureHex);
      const signedTransaction = await txBuilder.build();
      serializedTx = signedTransaction.toBroadcastFormat();
    } else {
      const transactionPrebuild = { txHex: serializedTx };
      const parsedTx = await this.parseTransaction({ txPrebuild: transactionPrebuild });
      const walletCoin = this.getChain();
      const output = (parsedTx.outputs as ITransactionRecipient)[0];
      const inputs = [
        {
          address: senderAddr,
          valueString: output.amount,
          value: new BigNumber(output.amount).toNumber(),
        },
      ];
      const outputs = [
        {
          address: output.address,
          valueString: output.amount,
          coinName: walletCoin,
        },
      ];
      const spendAmount = output.amount;
      const completedParsedTx = { inputs: inputs, outputs: outputs, spendAmount: spendAmount, type: '' };
      const fee = new BigNumber((parsedTx.fee as { fee: string }).fee);
      const feeInfo = { fee: fee.toNumber(), feeString: fee.toString() };
      const coinSpecific = { commonKeychain: bitgoKey };
      const transaction: MPCTx = {
        serializedTx: serializedTx,
        scanIndex: index,
        coin: walletCoin,
        signableHex: unsignedTransaction.signablePayload.toString('hex'),
        derivationPath: currPath,
        parsedTx: completedParsedTx,
        feeInfo: feeInfo,
        coinSpecific: coinSpecific,
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
   * Builds native ADA recoveries of receive addresses in batch without BitGo.
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

    const addressParams = {
      bitgoKey: params.bitgoKey,
      index: 0,
      seed: params.seed,
    };
    const { address: baseAddress } = await this.getAdaAddressAndAccountId(addressParams);
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

  /**
   * Obtains ADA address and account id from provided bitgo key for the given index and seed (optional).
   *
   * @param {AdaAddressParams} params - params to obtain ada address and account id
   */
  async getAdaAddressAndAccountId(params: AdaAddressParams): Promise<AdaAddressAndAccountId> {
    if (!params.bitgoKey) {
      throw new Error('missing bitgoKey');
    }

    let addrFormat = AddressFormat.testnet;
    if (this.getChain() === 'ada') {
      addrFormat = AddressFormat.mainnet;
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    const derivationPathPrefix = params.seed ? getDerivationPath(params.seed) : 'm';
    const stakeKeyPair = new AdaKeyPair({
      pub: MPC.deriveUnhardened(bitgoKey, derivationPathPrefix + '/0').slice(0, 64),
    });

    const currPath = derivationPathPrefix + `/${params.index}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
    const paymentKeyPair = new AdaKeyPair({ pub: accountId });
    const address = Utils.default.createBaseAddressWithStakeAndPaymentKey(stakeKeyPair, paymentKeyPair, addrFormat);
    return { address, accountId };
  }

  /** inherited doc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  /** inherited doc */
  allowsAccountConsolidations(): boolean {
    return true;
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getBaseChain()));
  }
}
