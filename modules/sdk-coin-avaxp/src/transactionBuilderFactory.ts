import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NotImplementedError, BaseTransactionBuilderFactory } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { ValidatorTxBuilder } from './validatorTxBuilder';
import { BaseTx, Tx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import utils from './utils';
import { PlatformVMConstants } from 'avalanche/dist/apis/platformvm/constants';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    const tx = new Tx();
    let utx;
    try {
      tx.fromString(raw);
      utx = tx.getUnsignedTx();
    } catch (err) {
      utx = new UnsignedTx();
      utx.fromBuffer(utils.cb58Decode(raw));
    }
    const baseTx = utx.getTransaction();
    if (baseTx.getTypeID() === PlatformVMConstants.ADDVALIDATORTX) {
      return this.getValidatorBuilder(baseTx);
    }
    throw new NotImplementedError('from not implemented');
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: BaseTx): TransferBuilder {
    return new TransferBuilder(this._coinConfig).initBuilder(tx);
  }

  /**
   * Initialize Validator builder
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @returns {StakingTxBuilder} the builder initialized
   */
  getValidatorBuilder(tx?: BaseTx): ValidatorTxBuilder {
    return new ValidatorTxBuilder(this._coinConfig).initBuilder(tx);
  }

  getWalletInitializationBuilder(): TransactionBuilder {
    throw new NotImplementedError('Wallet initialization is not needed');
  }
}
