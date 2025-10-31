import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder/transactionBuilder';
import { TransferBuilder } from './transactionBuilder/transferBuilder';
import utils from './utils';
import { Transaction } from './transaction/transaction';
import { SignedTransaction } from '@aptos-labs/ts-sdk';
import { TransferTransaction } from './transaction/transferTransaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { FungibleAssetTransfer } from './transaction/fungibleAssetTransfer';
import { FungibleAssetTransferBuilder } from './transactionBuilder/fungibleAssetTransferBuilder';
import { DigitalAssetTransfer } from './transaction/digitalAssetTransfer';
import { DigitalAssetTransferBuilder } from './transactionBuilder/digitalAssetTransferBuilder';
import { CustomTransaction } from './transaction/customTransaction';
import { CustomTransactionBuilder } from './transactionBuilder/customTransactionBuilder';
import { DelegationPoolAddStakeTransaction } from './transaction/delegationPoolAddStakeTransaction';
import { DelegationPoolAddStakeTransactionBuilder } from './transactionBuilder/delegationPoolAddStakeTransactionBuilder';
import { DelegationPoolUnlockTransaction } from './transaction/delegationPoolUnlockTransaction';
import { DelegationPoolUnlockTransactionBuilder } from './transactionBuilder/delegationPoolUnlockTransactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(signedRawTxn: string, abi?: any): TransactionBuilder {
    try {
      const signedTxn = Transaction.deserializeSignedTransaction(signedRawTxn);
      const txnType = this.getTransactionTypeFromSignedTxn(signedTxn);

      switch (txnType) {
        case TransactionType.Send:
          const transferTx = new TransferTransaction(this._coinConfig);
          transferTx.fromDeserializedSignedTransaction(signedTxn);
          return this.getTransferBuilder(transferTx);
        case TransactionType.SendToken:
          const fungibleTransferTokenTx = new FungibleAssetTransfer(this._coinConfig);
          fungibleTransferTokenTx.fromDeserializedSignedTransaction(signedTxn);
          return this.getFungibleAssetTransactionBuilder(fungibleTransferTokenTx);
        case TransactionType.SendNFT:
          const digitalAssetTransferTx = new DigitalAssetTransfer(this._coinConfig);
          digitalAssetTransferTx.fromDeserializedSignedTransaction(signedTxn);
          return this.getDigitalAssetTransactionBuilder(digitalAssetTransferTx);
        case TransactionType.StakingDelegate:
          const delegateTx = new DelegationPoolAddStakeTransaction(this._coinConfig);
          delegateTx.fromDeserializedSignedTransaction(signedTxn);
          return this.getDelegationPoolAddStakeTransactionBuilder(delegateTx);
        case TransactionType.StakingUnlock:
          const unlockTx = new DelegationPoolUnlockTransaction(this._coinConfig);
          unlockTx.fromDeserializedSignedTransaction(signedTxn);
          return this.getDelegationPoolUnlockTransactionBuilder(unlockTx);
        case TransactionType.CustomTx:
          const customTx = new CustomTransaction(this._coinConfig);
          if (abi) {
            customTx.setEntryFunctionAbi(abi);
          }
          customTx.fromDeserializedSignedTransaction(signedTxn);
          return this.getCustomTransactionBuilder(customTx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw e;
    }
  }

  getTransactionTypeFromSignedTxn(signedTxn: SignedTransaction): TransactionType {
    const rawTxn = signedTxn.raw_txn;
    return utils.getTransactionTypeFromTransactionPayload(rawTxn.payload);
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getFungibleAssetTransactionBuilder(tx?: Transaction): FungibleAssetTransferBuilder {
    return this.initializeBuilder(tx, new FungibleAssetTransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getDigitalAssetTransactionBuilder(tx?: Transaction): DigitalAssetTransferBuilder {
    return this.initializeBuilder(tx, new DigitalAssetTransferBuilder(this._coinConfig));
  }

  getDelegationPoolAddStakeTransactionBuilder(tx?: Transaction): DelegationPoolAddStakeTransactionBuilder {
    return this.initializeBuilder(tx, new DelegationPoolAddStakeTransactionBuilder(this._coinConfig));
  }

  getDelegationPoolUnlockTransactionBuilder(tx?: Transaction): DelegationPoolUnlockTransactionBuilder {
    return this.initializeBuilder(tx, new DelegationPoolUnlockTransactionBuilder(this._coinConfig));
  }

  /**
   * Get a custom transaction builder
   *
   * @param tx - Optional transaction to initialize the builder with
   * @returns A custom transaction builder
   */
  getCustomTransactionBuilder(tx?: Transaction): CustomTransactionBuilder {
    return this.initializeBuilder(tx, new CustomTransactionBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
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
}
