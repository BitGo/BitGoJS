import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  InvalidAddressError,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { KeyPair as AptKeyPair, TransactionBuilderFactory } from './lib';
import utils from './lib/utils';
import * as _ from 'lodash';
import BigNumber from 'bignumber.js';
import { ExplainTransactionOptions } from './lib/types';
import { AptTransactionExplanation } from './lib/iface';

export interface AptParseTransactionOptions extends ParseTransactionOptions {
  txHex: string;
}

export class Apt extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Apt(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e8;
  }

  public getChain(): string {
    return 'apt';
  }

  public getFamily(): string {
    return 'apt';
  }

  public getFullName(): string {
    return 'Aptos';
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

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const txHex = txPrebuild.txHex;
    if (!txHex) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const explainedTx = await this.explainTransaction({ txHex });
    if (!explainedTx) {
      throw new Error('failed to explain transaction');
    }
    if (txParams.recipients !== undefined) {
      const filteredRecipients = txParams.recipients?.map((recipient) => {
        return {
          address: recipient.address,
          amount: BigInt(recipient.amount),
        };
      });
      const filteredOutputs = explainedTx.outputs.map((output) => {
        return {
          address: output.address,
          amount: BigInt(output.amount),
        };
      });
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

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address: newAddress } = params;

    if (!this.isValidAddress(newAddress)) {
      throw new InvalidAddressError(`invalid address: ${newAddress}`);
    }
    return true;
  }

  async parseTransaction(params: AptParseTransactionOptions): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txHex: params.txHex });
    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }
    return {
      inputs: [
        {
          address: transactionExplanation.sender,
          amount: transactionExplanation.outputAmount,
        },
      ],
      outputs: [
        {
          address: transactionExplanation.outputs[0].address,
          amount: transactionExplanation.outputs[0].amount,
        },
      ],
    };
  }

  /**
   * Explain a Apt transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<AptTransactionExplanation | undefined> {
    let rebuiltTransaction: BaseTransaction;
    try {
      rebuiltTransaction = await this.rebuildTransaction(params.txHex);
    } catch {
      return undefined;
    }
    return rebuiltTransaction.explainTransaction();
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new AptKeyPair({ seed }) : new AptKeyPair();
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
    return utils.isValidPublicKey(pub);
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  protected getTxBuilderFactory(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  protected async rebuildTransaction(txHex: string): Promise<BaseTransaction> {
    const txBuilderFactory = this.getTxBuilderFactory();
    try {
      const txBuilder = txBuilderFactory.from(txHex);
      return await txBuilder.build();
    } catch {
      throw new Error('Failed to rebuild transaction');
    }
  }
}
