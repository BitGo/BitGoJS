import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { ValidatorTxBuilder } from './validatorTxBuilder';
import utils from './utils';
import { PlatformVMConstants } from 'avalanche/dist/apis/platformvm/constants';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected recoverSigner = false;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    const tx = utils.from(raw);
    const baseTx = tx.getUnsignedTx().getTransaction();
    let transactionBuilder: TransactionBuilder;
    if (baseTx.getTypeID() === PlatformVMConstants.ADDVALIDATORTX) {
      transactionBuilder = this.getValidatorBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    transactionBuilder.initBuilder(baseTx).credentials(tx.getCredentials());
    return transactionBuilder;
  }

  /** @inheritdoc */
  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig);
  }

  /**
   * Initialize Validator builder
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @returns {StakingTxBuilder} the builder initialized
   */
  getValidatorBuilder(): ValidatorTxBuilder {
    return new ValidatorTxBuilder(this._coinConfig);
  }

  getWalletInitializationBuilder(): TransactionBuilder {
    throw new NotSupported('Wallet initialization is not needed');
  }
}
