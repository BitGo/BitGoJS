import {
  BaseBroadcastTransactionResult,
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  EDDSAMethods,
  EDDSAMethodTypes,
  Environments,
  InvalidAddressError,
  KeyPair,
  MPCAlgorithm,
  MPCSweepRecoveryOptions,
  MPCSweepTxs,
  MPCTx,
  MPCUnsignedTx,
  ParsedTransaction,
  ParseTransactionOptions as BaseParseTransactionOptions,
  RecoveryTxRequest,
  SignedTransaction,
  SignTransactionOptions,
  TransactionExplanation,
  TssVerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { KeyPair as SuiKeyPair, TransactionBuilderFactory, TransferBuilder, TransferTransaction } from './lib';
import utils from './lib/utils';
import * as _ from 'lodash';
import {
  SuiBroadcastTransactionOptions,
  SuiMPCRecoveryOptions,
  SuiMPCTx,
  SuiMPCTxs,
  SuiObjectInfo,
  SuiTransactionType,
} from './lib/iface';
import { DEFAULT_GAS_OVERHEAD, DEFAULT_GAS_PRICE, MAX_GAS_BUDGET, MAX_OBJECT_LIMIT } from './lib/constants';
import { Buffer } from 'buffer';

export interface ExplainTransactionOptions {
  txHex: string;
}

export interface SuiParseTransactionOptions extends BaseParseTransactionOptions {
  txHex: string;
}

interface TransactionOutput {
  address: string;
  amount: string;
}

type TransactionInput = TransactionOutput;

export interface SuiParsedTransaction extends ParsedTransaction {
  // total assets being moved, including fees
  inputs: TransactionInput[];

  // where assets are moved to
  outputs: TransactionOutput[];

  fee: BigNumber;
}

export type SuiTransactionExplanation = TransactionExplanation;

export class Sui extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Sui(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e9;
  }

  public getChain(): string {
    return 'sui';
  }

  public getFamily(): string {
    return 'sui';
  }

  public getFullName(): string {
    return 'Sui';
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
    let totalAmount = new BigNumber(0);
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const transaction = new TransferTransaction(coinConfig);
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }

    transaction.fromRawTransaction(Buffer.from(rawTx, 'hex').toString('base64'));
    const explainedTx = transaction.explainTransaction();

    if (txParams.recipients && txParams.recipients.length > 0) {
      const filteredRecipients = txParams.recipients?.map((recipient) => {
        const filteredRecipient = _.pick(recipient, ['address', 'amount']);
        filteredRecipient.amount = new BigNumber(filteredRecipient.amount).toFixed();
        return filteredRecipient;
      });
      const filteredOutputs = explainedTx.outputs.map((output) => {
        const filteredOutput = _.pick(output, ['address', 'amount']);
        filteredOutput.amount = new BigNumber(filteredOutput.amount).toFixed();
        return filteredOutput;
      });

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
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
      const expectedAddress = this.getAddressFromPublicKey(derivedPublicKey);

      if (newAddress !== expectedAddress) {
        return false;
      }
    }

    return true;
  }

  async parseTransaction(params: SuiParseTransactionOptions): Promise<SuiParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txHex: params.txHex });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    let fee = new BigNumber(0);

    const suiTransaction = transactionExplanation as SuiTransactionExplanation;
    if (suiTransaction.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
        fee,
      };
    }

    const senderAddress = suiTransaction.outputs[0].address;
    if (suiTransaction.fee.fee !== '') {
      fee = new BigNumber(suiTransaction.fee.fee);
    }

    // assume 1 sender, who is also the fee payer
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(suiTransaction.outputAmount).plus(fee).toFixed(),
      },
    ];

    const outputs: TransactionOutput[] = suiTransaction.outputs.map((output) => {
      return {
        address: output.address,
        amount: new BigNumber(output.amount).toFixed(),
      };
    });

    return {
      inputs,
      outputs,
      fee,
    };
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new SuiKeyPair({ seed }) : new SuiKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  isValidPub(_: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidPrv(_: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  signTransaction(_: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Explain a Sui transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<SuiTransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction: BaseTransaction;

    try {
      const transactionBuilder = factory.from(Buffer.from(params.txHex, 'hex').toString('base64'));
      rebuiltTransaction = await transactionBuilder.build();
    } catch {
      throw new Error('Invalid transaction');
    }

    return rebuiltTransaction.explainTransaction();
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  private getAddressFromPublicKey(derivedPublicKey: string) {
    // TODO(BG-59016) replace with account lib implementation
    return utils.getAddressFromPublicKey(derivedPublicKey);
  }

  /** @inheritDoc */
  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    const factory = this.getBuilder();
    const rebuiltTransaction = await factory.from(serializedTx).build();
    return rebuiltTransaction.signablePayload;
  }

  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].suiNodeUrl;
  }

  protected async getBalance(owner: string, coinType?: string): Promise<string> {
    const url = this.getPublicNodeUrl();
    return await utils.getBalance(url, owner, coinType);
  }

  protected async getInputCoins(owner: string, coinType?: string): Promise<SuiObjectInfo[]> {
    const url = this.getPublicNodeUrl();
    return await utils.getInputCoins(url, owner, coinType);
  }

  protected async getFeeEstimate(txHex: string): Promise<BigNumber> {
    const url = this.getPublicNodeUrl();
    return await utils.getFeeEstimate(url, txHex);
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
  async recover(params: SuiMPCRecoveryOptions): Promise<SuiMPCTxs | MPCSweepTxs> {
    if (!params.bitgoKey) {
      throw new Error('missing bitgoKey');
    }
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    const startIdx = utils.validateNonNegativeNumber(
      0,
      'Invalid starting index to scan for addresses',
      params.startingScanIndex
    );
    const numIterations = utils.validateNonNegativeNumber(20, 'Invalid scanning factor', params.scan);
    const endIdx = startIdx + numIterations;
    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;
    const MPC = await EDDSAMethods.getInitializedMpcInstance();

    for (let idx = startIdx; idx < endIdx; idx++) {
      const derivationPath = `m/${idx}`;
      const derivedPublicKey = MPC.deriveUnhardened(bitgoKey, derivationPath).slice(0, 64);
      const senderAddress = this.getAddressFromPublicKey(derivedPublicKey);
      let availableBalance = new BigNumber(0);
      try {
        availableBalance = new BigNumber(await this.getBalance(senderAddress));
      } catch (e) {
        continue;
      }
      if (availableBalance.toNumber() <= 0) {
        continue;
      }
      let netAmount = availableBalance.minus(MAX_GAS_BUDGET);
      if (netAmount.toNumber() <= 0) {
        throw new Error(
          `Found address ${senderAddress} with non-zero fund but fund is insufficient to support a recovery ` +
            `transaction. Please start the next scan at address index ${idx + 1}.`
        );
      }

      let inputCoins = await this.getInputCoins(senderAddress);
      inputCoins = inputCoins.sort((a, b) => {
        return b.balance.minus(a.balance).toNumber();
      });
      if (inputCoins.length > MAX_OBJECT_LIMIT) {
        inputCoins = inputCoins.slice(0, MAX_OBJECT_LIMIT);
      }
      netAmount = inputCoins.reduce((acc, obj) => acc.plus(obj.balance), new BigNumber(0));
      netAmount = netAmount.minus(MAX_GAS_BUDGET);

      const recipients = [
        {
          address: params.recoveryDestination,
          amount: netAmount.toString(),
        },
      ];

      // first build the unsigned txn
      const factory = new TransactionBuilderFactory(coins.get(this.getChain()));
      const txBuilder = factory
        .getTransferBuilder()
        .type(SuiTransactionType.Transfer)
        .sender(senderAddress)
        .send(recipients)
        .gasData({
          owner: senderAddress,
          price: DEFAULT_GAS_PRICE,
          budget: MAX_GAS_BUDGET,
          payment: inputCoins,
        });

      const tempTx = (await txBuilder.build()) as TransferTransaction;
      const feeEstimate = await this.getFeeEstimate(tempTx.toBroadcastFormat());
      const gasBudget = Math.trunc(feeEstimate.toNumber() * DEFAULT_GAS_OVERHEAD);
      txBuilder.gasData({
        owner: senderAddress,
        price: DEFAULT_GAS_PRICE,
        budget: gasBudget,
        payment: inputCoins,
      });

      if (isUnsignedSweep) {
        return this.buildUnsignedSweepTransaction(txBuilder, senderAddress, bitgoKey, idx, derivationPath);
      }

      await this.signRecoveryTransaction(txBuilder, params, derivationPath, derivedPublicKey);
      const tx = (await txBuilder.build()) as TransferTransaction;
      return {
        transactions: [
          {
            scanIndex: idx,
            recoveryAmount: netAmount.toString(),
            serializedTx: tx.toBroadcastFormat(),
            signature: Buffer.from(tx.serializedSig).toString('base64'),
          },
        ],
        lastScanIndex: idx,
      };
    }

    throw new Error('Did not find an address with funds to recover');
  }

  private async buildUnsignedSweepTransaction(
    txBuilder: TransferBuilder,
    senderAddress: string,
    bitgoKey: string,
    index: number,
    derivationPath: string
  ): Promise<MPCSweepTxs> {
    const unsignedTransaction = (await txBuilder.build()) as TransferTransaction;
    const serializedTx = unsignedTransaction.toBroadcastFormat();
    const serializedTxHex = Buffer.from(serializedTx, 'base64').toString('hex');
    const parsedTx = await this.parseTransaction({ txHex: serializedTxHex });
    const walletCoin = this.getChain();
    const output = parsedTx.outputs[0];
    const inputs = [
      {
        address: senderAddress,
        valueString: output.amount,
        value: new BigNumber(output.amount),
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
    const completedParsedTx = {
      inputs: inputs,
      outputs: outputs,
      spendAmount: spendAmount,
      type: SuiTransactionType.Transfer,
    };
    const fee = parsedTx.fee;
    const feeInfo = { fee: fee.toNumber(), feeString: fee.toString() };
    const coinSpecific = { commonKeychain: bitgoKey };
    const transaction: MPCTx = {
      serializedTx: serializedTxHex,
      scanIndex: index,
      coin: walletCoin,
      signableHex: unsignedTransaction.signablePayload.toString('hex'),
      derivationPath,
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
    return { txRequests: [txRequest] };
  }

  private async signRecoveryTransaction(
    txBuilder: TransferBuilder,
    params: SuiMPCRecoveryOptions,
    derivationPath: string,
    derivedPublicKey: string
  ) {
    // TODO(BG-51092): This looks like a common part which can be extracted out too
    const unsignedTx = (await txBuilder.build()) as TransferTransaction;
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
    let userPrv: string;
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

    let backupPrv: string;
    try {
      backupPrv = this.bitgo.decrypt({
        input: backupKey,
        password: params.walletPassphrase,
      });
    } catch (e) {
      throw new Error(`Error decrypting backup keychain: ${e.message}`);
    }
    const backupSigningMaterial = JSON.parse(backupPrv) as EDDSAMethodTypes.BackupSigningMaterial;
    /* ********************** END ***********************************/

    // add signature
    const signatureHex = await EDDSAMethods.getTSSSignature(
      userSigningMaterial,
      backupSigningMaterial,
      derivationPath,
      unsignedTx
    );
    txBuilder.addSignature({ pub: derivedPublicKey }, signatureHex);
  }

  async broadcastTransaction({
    transactions,
  }: SuiBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    const txIds: string[] = [];
    for (const txn of transactions) {
      try {
        const url = this.getPublicNodeUrl();
        const digest = await utils.executeTransactionBlock(url, txn.serializedTx, [txn.signature!]);
        txIds.push(digest);
      } catch (e) {
        throw new Error(`Failed to broadcast transaction, error: ${e.message}`);
      }
    }
    return { txIds };
  }

  /** inherited doc */
  async createBroadcastableSweepTransaction(params: MPCSweepRecoveryOptions): Promise<SuiMPCTxs> {
    const req = params.signatureShares;
    const broadcastableTransactions: SuiMPCTx[] = [];
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
      const serializedTxBase64 = Buffer.from(transaction.serializedTx, 'hex').toString('base64');
      const txBuilder = this.getBuilder().from(serializedTxBase64);
      if (!transaction.coinSpecific?.commonKeychain) {
        throw new Error('Missing common keychain');
      }
      const commonKeychain = transaction.coinSpecific!.commonKeychain! as string;
      if (!transaction.derivationPath) {
        throw new Error('Missing derivation path');
      }
      const derivationPath = transaction.derivationPath as string;
      const derivedPublicKey = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);

      // add combined signature from ovc
      txBuilder.addSignature({ pub: derivedPublicKey }, signatureHex);
      const signedTransaction = (await txBuilder.build()) as TransferTransaction;
      const serializedTx = signedTransaction.toBroadcastFormat();
      const outputAmount = signedTransaction.explainTransaction().outputAmount;

      broadcastableTransactions.push({
        serializedTx: serializedTx,
        scanIndex: transaction.scanIndex,
        signature: Buffer.from(signedTransaction.serializedSig).toString('base64'),
        recoveryAmount: outputAmount.toString(),
      });

      if (i === req.length - 1 && transaction.coinSpecific!.lastScanIndex) {
        lastScanIndex = transaction.coinSpecific!.lastScanIndex as number;
      }
    }

    return { transactions: broadcastableTransactions, lastScanIndex };
  }
}
