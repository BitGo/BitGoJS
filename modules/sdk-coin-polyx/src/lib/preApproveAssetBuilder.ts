import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';
import { Interface } from '@bitgo/abstract-substrate';
import { PolyxBaseBuilder } from './baseBuilder';
import { TxMethod, PreApproveAssetArgs, MethodNames } from './iface';
import { PreApproveAssetTransactionSchema } from './txnSchema';
import { Transaction } from './transaction';

export class PreApproveAssetBuilder extends PolyxBaseBuilder<TxMethod, Transaction> {
  protected _assetId: string;
  protected _method: TxMethod;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.TrustLine;
  }

  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.preApproveAsset(
      {
        assetId: this._assetId,
      },
      baseTxInfo
    );
  }

  /**
   * Sets the asset ID for the pre-approval transaction.
   *
   * @param {string} assetId - The ID of the asset to be pre-approved.
   * @returns {this} The current instance of the builder.
   */
  assetId(assetId: string): this {
    this._assetId = assetId;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.PreApproveAsset) {
      const txMethod = this._method.args as PreApproveAssetArgs;
      this.assetId(txMethod.assetId);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected preApproveAsset`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction?: string): void {
    if (decodedTxn.method?.name === MethodNames.PreApproveAsset) {
      const txMethod = decodedTxn.method.args as PreApproveAssetArgs;
      const assetId = txMethod.assetId;

      const validationResult = PreApproveAssetTransactionSchema.validate({ assetId });
      if (!validationResult) {
        throw new InvalidTransactionError('Invalid transaction: assetId is required');
      }
    }
  }

  /**
   * Construct a transaction to pre-approve an asset
   *
   * @param {PreApproveAssetArgs} args Arguments to be passed to the preApproveAsset method
   * @param {Interface.CreateBaseTxInfo} info Base txn info required to construct the pre-approve asset txn
   * @returns {UnsignedTransaction} an unsigned transaction for asset pre-approval
   */
  private preApproveAsset(args: PreApproveAssetArgs, info: Interface.CreateBaseTxInfo): UnsignedTransaction {
    console.log(`PreApproveAssetBuilder: preApproveAsset called with args: ${JSON.stringify(args)}`);
    return defineMethod(
      {
        method: {
          args,
          name: 'preApproveAsset',
          pallet: 'asset',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
