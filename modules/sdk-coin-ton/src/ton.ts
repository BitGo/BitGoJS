import {
  BaseCoin,
  BitGoBase,
  EDDSAMethods,
  InvalidAddressError,
  KeyPair,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  TransactionExplanation,
  TssVerifyAddressOptions,
  VerifyTransactionOptions,
  MPCTx,
  MPCRecoveryOptions,
  MPCSweepTxs,
  Environments,
  EDDSAMethodTypes,
  PublicKey,
  OvcInput,
  OvcOutput,
  RecoveryTxRequest,
  MPCUnsignedTx,
  MPCConsolidationRecoveryOptions,
  MPCTxs,
  MPCSweepRecoveryOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { KeyPair as TonKeyPair } from './lib/keyPair';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import { Transaction, TransactionBuilderFactory, Utils, TransferBuilder } from './lib';
import TonWeb from 'tonweb';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';
import { privateKeys } from '../test/resources/ton';

export const DEFAULT_SCAN_FACTOR = 20; // default number of receive addresses to scan for funds

export interface TonParseTransactionOptions extends ParseTransactionOptions {
  txHex: string;
}

export class Ton extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Ton(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e9;
  }

  public getChain(): string {
    return 'ton';
  }

  public getFamily(): string {
    return 'ton';
  }

  public getFullName(): string {
    return 'Ton';
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

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const transaction = new Transaction(coinConfig);
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }

    transaction.fromRawTransaction(Buffer.from(rawTx, 'hex').toString('base64'));
    const explainedTx = transaction.explainTransaction();
    if (txParams.recipients !== undefined) {
      const filteredRecipients = txParams.recipients?.map((recipient) => {
        return {
          address: new TonWeb.Address(recipient.address).toString(true, true, true),
          amount: recipient.amount,
        };
      });
      const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount']));

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      let totalAmount = new BigNumber(0);
      for (const recipients of txParams.recipients) {
        totalAmount = totalAmount.plus(recipients.amount);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }

  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    const { keychains, address: newAddress, index } = params;

    if (!this.isValidAddress(newAddress)) {
      throw new InvalidAddressError(`invalid address: ${newAddress}`);
    }

    if (!keychains) {
      throw new Error('missing required param keychains');
    }

    for (const keychain of keychains) {
      const MPC = await EDDSAMethods.getInitializedMpcInstance();
      const commonKeychain = keychain.commonKeychain as string;

      const derivationPath = 'm/' + index;
      const derivedPublicKey = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
      const expectedAddress = await Utils.default.getAddressFromPublicKey(derivedPublicKey);

      if (newAddress !== expectedAddress) {
        return false;
      }
    }

    return true;
  }

  async parseTransaction(params: TonParseTransactionOptions): Promise<ParsedTransaction> {
    const factory = new TransactionBuilderFactory(coins.get(this.getChain()));
    const transactionBuilder = factory.from(Buffer.from(params.txHex, 'hex').toString('base64'));
    const rebuiltTransaction = await transactionBuilder.build();
    const parsedTransaction = rebuiltTransaction.toJson();
    return {
      inputs: [
        {
          address: parsedTransaction.sender,
          amount: parsedTransaction.amount,
        },
      ],
      outputs: [
        {
          address: parsedTransaction.destination,
          amount: parsedTransaction.amount,
        },
      ],
    };
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new TonKeyPair({ seed }) : new TonKeyPair();
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
    throw new Error('Method not implemented.');
  }

  isValidAddress(address: string): boolean {
    try {
      const addressBase64 = address.replace(/\+/g, '-').replace(/\//g, '_');
      const buf = Buffer.from(addressBase64, 'base64');
      return buf.length === 36;
    } catch {
      return false;
    }
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    const factory = new TransactionBuilderFactory(coins.get(this.getChain()));
    const rebuiltTransaction = await factory.from(serializedTx).build();
    return rebuiltTransaction.signablePayload;
  }

  /** @inheritDoc */
  async explainTransaction(params: Record<string, any>): Promise<TransactionExplanation> {
    try {
      const factory = new TransactionBuilderFactory(coins.get(this.getChain()));
      const transactionBuilder = factory.from(Buffer.from(params.txHex, 'hex').toString('base64'));
      const rebuiltTransaction = await transactionBuilder.build();
      return rebuiltTransaction.explainTransaction();
    } catch {
      throw new Error('Invalid transaction');
    }
  }

  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].tonNodeUrl;
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
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
    if (!params.apiKey) {
      throw new Error('missing apiKey');
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;

    // Build the transaction
    const tonweb = new TonWeb(new TonWeb.HttpProvider(this.getPublicNodeUrl(), { apiKey: params.apiKey }));
    const MPC = await EDDSAMethods.getInitializedMpcInstance();

    const index = params.index || 0;
    const currPath = params.seed ? getDerivationPath(params.seed) + `/${index}` : `m/${index}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
    const senderAddr = await Utils.default.getAddressFromPublicKey(accountId);
    const balance = await tonweb.getBalance(senderAddr);
    if (new BigNumber(balance).isEqualTo(0)) {
      throw Error('Did not find address with funds to recover');
    }

    const WalletClass = tonweb.wallet.all['v4R2'];
    const wallet = new WalletClass(tonweb.provider, {
      publicKey: tonweb.utils.hexToBytes(accountId),
      wc: 0,
    });
    const seqno = await wallet.methods.seqno().call();
    const feeEstimate = await wallet.methods
      .transfer({
        secretKey: tonweb.utils.stringToBytes(privateKeys.prvKey1), // using a dummy private key to estimate fee
        toAddress: params.recoveryDestination,
        amount: balance,
        seqno: seqno as number,
        sendMode: 1,
      })
      .estimateFee();
    const totalFeeEstimate =
      (feeEstimate.source_fees.in_fwd_fee +
        feeEstimate.source_fees.storage_fee +
        feeEstimate.source_fees.gas_fee +
        feeEstimate.source_fees.fwd_fee) *
      1.5;

    if (new BigNumber(totalFeeEstimate).gt(balance)) {
      throw Error('Did not find address with funds to recover');
    }

    const factory = this.getBuilder();
    // const walletCoin = this.getChain();
    const expireAt = Math.floor(Date.now() / 1e3) + 60 * 60 * 24 * 7; // 7 days

    const txBuilder = factory
      .getTransferBuilder()
      .sender(senderAddr)
      .sequenceNumber(seqno as number)
      .publicKey(accountId)
      .expireTime(expireAt);

    (txBuilder as TransferBuilder).send({
      address: params.recoveryDestination,
      amount: new BigNumber(balance).minus(new BigNumber(totalFeeEstimate)).toString(),
    });

    const unsignedTransaction = await txBuilder.build();

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

      const signatureHex = await EDDSAMethods.getTSSSignature(
        userSigningMaterial,
        backupSigningMaterial,
        currPath,
        unsignedTransaction
      );

      const publicKeyObj = { pub: senderAddr };
      txBuilder.addSignature(publicKeyObj as PublicKey, signatureHex);
    }

    const completedTransaction = await txBuilder.build();
    const serializedTx = completedTransaction.toBroadcastFormat();
    const walletCoin = this.getChain();

    const inputs: OvcInput[] = [];
    for (const input of completedTransaction.inputs) {
      inputs.push({
        address: input.address,
        valueString: input.value,
        value: new BigNumber(input.value).toNumber(),
      });
    }
    const outputs: OvcOutput[] = [];
    for (const output of completedTransaction.outputs) {
      outputs.push({
        address: output.address,
        valueString: output.value,
        coinName: output.coin,
      });
    }
    const spendAmount = completedTransaction.inputs.length === 1 ? completedTransaction.inputs[0].value : 0;
    const parsedTx = { inputs: inputs, outputs: outputs, spendAmount: spendAmount, type: '' };
    const feeInfo = { fee: totalFeeEstimate, feeString: totalFeeEstimate.toString() };
    const coinSpecific = { commonKeychain: bitgoKey };
    if (isUnsignedSweep) {
      const transaction: MPCTx = {
        serializedTx: serializedTx,
        scanIndex: index,
        coin: walletCoin,
        signableHex: completedTransaction.signablePayload.toString('hex'),
        derivationPath: currPath,
        parsedTx: parsedTx,
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

    const transaction: MPCTx = {
      serializedTx: serializedTx,
      scanIndex: index,
    };
    return transaction;
  }

  /**
   * Builds native TON recoveries of receive addresses in batch without BitGo.
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
    const baseAddressIndex = 0;
    const baseAddressPath = params.seed
      ? getDerivationPath(params.seed) + `/${baseAddressIndex}`
      : `m/${baseAddressIndex}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, baseAddressPath).slice(0, 64);
    const baseAddress = new TonKeyPair({ pub: accountId }).getAddress();

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
      const tonKeyPair = new TonKeyPair({ pub: accountId });

      // add combined signature from ovc
      txBuilder.addSignature({ pub: tonKeyPair.getKeys().pub }, signatureHex);
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
}
