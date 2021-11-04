import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAmount, isValidPublicKey } from './utils';
import { TransactionType } from '../baseCoin';
import { InstructionBuilderTypes } from './constants';
import { Transfer } from './iface';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   *  Set a transfer
   *
   * @param {string} fromAddress - the sender address
   * @param {string} toAddress - the receiver address
   * @param {string} amount - the amount sent
   * @returns {TransactionBuilder} This transaction builder
   */
  transfer(fromAddress: string, toAddress: string, amount: string): this {
    if (!fromAddress || !isValidPublicKey(fromAddress)) {
      throw new BuildTransactionError('Invalid or missing fromAddress, got: ' + fromAddress);
    }
    if (!toAddress || !isValidPublicKey(toAddress)) {
      throw new BuildTransactionError('Invalid or missing toAddress, got: ' + toAddress);
    }
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }

    const transferData: Transfer = {
      type: InstructionBuilderTypes.Transfer,
      params: { fromAddress, toAddress, amount },
    };
    this._instructionsData.push(transferData);
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    return await super.buildImplementation();
  }
}
