import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { DeployUtil } from 'casper-client-sdk';
import { InvalidTransactionError, ParseTransactionError } from '../baseCoin/errors';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isWalletInitContract } from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return this.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /** @inheritDoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritDoc */
  from(raw: string): TransactionBuilder {
    this.validateRawTransaction(raw);
    const tx = new Transaction(this._coinConfig);
    const deployJson = JSON.parse(raw);
    const deployObject = DeployUtil.deployFromJson(deployJson);

    if (!deployObject) {
      throw new InvalidTransactionError('Invalid transaction: ' + deployObject);
    }

    tx.casperTx = deployObject;

    if (tx.casperTx.session.isTransfer()) {
      return this.getTransferBuilder(tx);
    } else if (tx.casperTx.session.isModuleBytes()) {
      if (isWalletInitContract(tx.casperTx.session.asModuleBytes())) {
        return this.getWalletInitializationBuilder(tx);
      } else {
        throw new InvalidTransactionError('Invalid transaction' + tx.casperTx);
      }
    } else {
      throw new InvalidTransactionError('Invalid transaction ' + tx.casperTx);
    }
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @param {TransactionBuilder} builder - the builder to be initialized
   * @returns {TransactionBuilder} the builder initialized
   */
  private initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param {any} rawTransaction - Transaction in any format
   */
  private validateRawTransaction(rawTransaction: any) {
    if (!rawTransaction) {
      throw new ParseTransactionError('Invalid raw transaction: Undefined');
    }
    try {
      JSON.parse(rawTransaction);
    } catch (e) {
      throw new ParseTransactionError('Invalid raw transaction format');
    }
  }
}
