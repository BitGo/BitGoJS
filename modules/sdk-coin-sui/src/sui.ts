import {
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
  ParsedTransaction,
  ParseTransactionOptions as BaseParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  TransactionExplanation,
  TssVerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { TransactionBuilderFactory, KeyPair as SuiKeyPair, TransferTransaction, TransferBuilder } from './lib';
import utils from './lib/utils';
import * as _ from 'lodash';
import { SuiObjectInfo, SuiRecoveryTx, SuiTransactionType } from './lib/iface';
import { DEFAULT_GAS_OVERHEAD, DEFAULT_GAS_PRICE, MAX_GAS_BUDGET, MAX_OBJECT_LIMIT } from './lib/constants';

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
}

export type SuiTransactionExplanation = TransactionExplanation;

export interface SuiRecoveryOptions extends MPCRecoveryOptions {
  startingScanIndex?: number;
  scan?: number;
}

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

    const suiTransaction = transactionExplanation as SuiTransactionExplanation;
    if (suiTransaction.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }

    const senderAddress = suiTransaction.outputs[0].address;
    const feeAmount = new BigNumber(suiTransaction.fee.fee === '' ? '0' : suiTransaction.fee.fee);

    // assume 1 sender, who is also the fee payer
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(suiTransaction.outputAmount).plus(feeAmount).toFixed(),
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
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: SuiRecoveryOptions): Promise<SuiRecoveryTx> {
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
      netAmount = inputCoins.reduce((acc, obj) => acc.plus(obj.balance!), new BigNumber(0));
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

      const suiRecoveryTx: SuiRecoveryTx = {
        scanIndex: idx,
        recoveryAmount: netAmount.toString(),
        serializedTx: '',
      };
      let tx: TransferTransaction;
      if (isUnsignedSweep) {
        tx = (await txBuilder.build()) as TransferTransaction;
      } else {
        await this.signRecoveryTransaction(txBuilder, params, derivationPath, derivedPublicKey);
        tx = (await txBuilder.build()) as TransferTransaction;
        suiRecoveryTx.signature = Buffer.from(tx.serializedSig).toString('base64');
      }

      suiRecoveryTx.serializedTx = tx.toBroadcastFormat();
      return suiRecoveryTx;
    }

    throw new Error('Did not find an address with funds to recover');
  }

  private async signRecoveryTransaction(
    txBuilder: TransferBuilder,
    params: SuiRecoveryOptions,
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
}
