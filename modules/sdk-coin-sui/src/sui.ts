import {
  BaseBroadcastTransactionOptions,
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
  MPCRecoveryOptions,
  MPCConsolidationRecoveryOptions,
  MPCSweepRecoveryOptions,
  MPCSweepTxs,
  MPCTx,
  MPCTxs,
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
import { SuiObjectInfo, SuiTransactionType } from './lib/iface';
import {
  DEFAULT_GAS_OVERHEAD,
  DEFAULT_GAS_PRICE,
  DEFAULT_SCAN_FACTOR,
  MAX_GAS_BUDGET,
  MAX_OBJECT_LIMIT,
} from './lib/constants';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';

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
    const { address: newAddress } = params;

    if (!this.isValidAddress(newAddress)) {
      throw new InvalidAddressError(`invalid address: ${newAddress}`);
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
  async recover(params: MPCRecoveryOptions): Promise<MPCTxs | MPCSweepTxs> {
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
      const derivationPath = (params.seed ? getDerivationPath(params.seed) : 'm') + `/${idx}`;
      const derivedPublicKey = MPC.deriveUnhardened(bitgoKey, derivationPath).slice(0, 64);
      const senderAddress = this.getAddressFromPublicKey(derivedPublicKey);
      let availableBalance = new BigNumber(0);
      try {
        availableBalance = new BigNumber(await this.getBalance(senderAddress));
      } catch (e) {
        continue;
      }
      if (availableBalance.minus(MAX_GAS_BUDGET).toNumber() <= 0) {
        continue;
      }

      let inputCoins = await this.getInputCoins(senderAddress);
      inputCoins = inputCoins.sort((a, b) => {
        return b.balance.minus(a.balance).toNumber();
      });
      if (inputCoins.length > MAX_OBJECT_LIMIT) {
        inputCoins = inputCoins.slice(0, MAX_OBJECT_LIMIT);
      }
      let netAmount = inputCoins.reduce((acc, obj) => acc.plus(obj.balance), new BigNumber(0));
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

      netAmount = netAmount.plus(MAX_GAS_BUDGET).minus(gasBudget);
      recipients[0].amount = netAmount.toString();
      txBuilder.send(recipients);
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

    throw new Error(
      `Did not find an address with sufficient funds to recover. Please start the next scan at address index ${endIdx}.`
    );
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
    params: MPCRecoveryOptions,
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
  }: BaseBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    const txIds: string[] = [];
    const url = this.getPublicNodeUrl();
    let digest = '';
    if (!!transactions) {
      for (const txn of transactions) {
        try {
          digest = await utils.executeTransactionBlock(url, txn.serializedTx, [txn.signature!]);
        } catch (e) {
          throw new Error(`Failed to broadcast transaction, error: ${e.message}`);
        }
        txIds.push(digest);
      }
    }
    return { txIds };
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

  /**
   * Builds native SUI recoveries of receive addresses in batch without BitGo.
   * Funds will be recovered to base address first. You need to initiate another sweep txn after that.
   *
   * @param {MPCConsolidationRecoveryOptions} params - options for consolidation recovery.
   * @param {string} [params.startingScanIndex] - receive address index to start scanning from. default to 1 (inclusive).
   * @param {string} [params.endingScanIndex] - receive address index to end scanning at. default to startingScanIndex + 20 (exclusive).
   */
  async recoverConsolidations(params: MPCConsolidationRecoveryOptions): Promise<MPCTxs | MPCSweepTxs> {
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;
    const startIdx = utils.validateNonNegativeNumber(
      1,
      'Invalid starting index to scan for addresses',
      params.startingScanIndex
    );
    const endIdx = utils.validateNonNegativeNumber(
      startIdx + DEFAULT_SCAN_FACTOR,
      'Invalid ending index to scan for addresses',
      params.endingScanIndex
    );

    if (startIdx < 1 || endIdx <= startIdx || endIdx - startIdx > 10 * DEFAULT_SCAN_FACTOR) {
      throw new Error(
        `Invalid starting or ending index to scan for addresses. startingScanIndex: ${startIdx}, endingScanIndex: ${endIdx}.`
      );
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    const derivationPath = (params.seed ? getDerivationPath(params.seed) : 'm') + '/0';
    const derivedPublicKey = MPC.deriveUnhardened(bitgoKey, derivationPath).slice(0, 64);
    const baseAddress = this.getAddressFromPublicKey(derivedPublicKey);

    const consolidationTransactions: any[] = [];
    let lastScanIndex = startIdx;
    for (let idx = startIdx; idx < endIdx; idx++) {
      const recoverParams = {
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletPassphrase: params.walletPassphrase,
        seed: params.seed,
        recoveryDestination: baseAddress,
        startingScanIndex: idx,
        scan: 1,
      };

      let recoveryTransaction: MPCTxs | MPCSweepTxs;
      try {
        recoveryTransaction = await this.recover(recoverParams);
      } catch (e) {
        if (e.message.startsWith('Did not find an address with sufficient funds to recover.')) {
          lastScanIndex = idx;
          continue;
        }
        throw e;
      }

      if (isUnsignedSweep) {
        consolidationTransactions.push((recoveryTransaction as MPCSweepTxs).txRequests[0]);
      } else {
        consolidationTransactions.push((recoveryTransaction as MPCTxs).transactions[0]);
      }
      lastScanIndex = idx;
    }

    if (consolidationTransactions.length === 0) {
      throw new Error(
        `Did not find an address with sufficient funds to recover. Please start the next scan at address index ${
          lastScanIndex + 1
        }.`
      );
    }

    if (isUnsignedSweep) {
      // lastScanIndex will be used to inform user the last address index scanned for available funds (so they can
      // appropriately adjust the scan range on the next iteration of consolidation recoveries). In the case of unsigned
      // sweep consolidations, this lastScanIndex will be provided in the coinSpecific of the last txn made.
      consolidationTransactions[
        consolidationTransactions.length - 1
      ].transactions[0].unsignedTx.coinSpecific.lastScanIndex = lastScanIndex;
      return { txRequests: consolidationTransactions };
    }

    return { transactions: consolidationTransactions, lastScanIndex };
  }
}
