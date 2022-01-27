import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { DeployUtil } from 'casper-js-sdk';
import { InvalidTransactionError, ParseTransactionError } from '../baseCoin/errors';
import { BaseTransactionBuilderFactory, TransactionType } from '../baseCoin';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { getDeployType } from './utils';
import { DelegateBuilder } from './delegateBuilder';
import { UndelegateBuilder } from './undelegateBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return this.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /**
   * Initialize an undelegate builder
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @returns {UndelegateBuilder} the builder initialized
   */
  getUndelegateBuilder(tx?: Transaction): UndelegateBuilder {
    return this.initializeBuilder(tx, new UndelegateBuilder(this._coinConfig));
  }

  /**
   * Initialize an delegate builder
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @returns {DelegateBuilder} the builder initialized
   */
  getDelegateBuilder(tx?: Transaction): DelegateBuilder {
    return this.initializeBuilder(tx, new DelegateBuilder(this._coinConfig));
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
    try {
      tx.casperTx = DeployUtil.deployFromJson(deployJson).unwrap();
    } catch (e) {
      throw new InvalidTransactionError('Invalid transaction: ' + e);
    }

    const casperDeployType = getDeployType(tx.casperTx.session);
    switch (casperDeployType) {
      case TransactionType.Send:
        return this.getTransferBuilder(tx);
      case TransactionType.WalletInitialization:
        return this.getWalletInitializationBuilder(tx);
      case TransactionType.StakingLock:
        return this.getDelegateBuilder(tx);
      case TransactionType.StakingUnlock:
        return this.getUndelegateBuilder(tx);
      default:
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
  private validateRawTransaction(rawTransaction: string) {
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
