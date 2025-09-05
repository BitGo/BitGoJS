import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';

export class ExportTxBuilder extends AtomicTransactionBuilder {
  private _amount = 0n;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  /**
   * Amount is a long that specifies the quantity of the asset that this output owns. Must be positive.
   *
   * @param {BN | string} amount The withdrawal amount
   */
  amount(value: bigint | string | number): this {
    const v = typeof value === 'bigint' ? value : BigInt(value);
    this.validateAmount(v);
    this._amount = v;
    return this;
  }

  /** @inheritdoc */
  // Placeholder: parsing existing ExportTx not yet supported on Flare P-chain
  initBuilder(_tx: unknown): this {
    super.initBuilder(_tx);
    return this;
  }

  // Type verification not yet implemented for Flare P-chain
  static verifyTxType(_baseTx: unknown): boolean {
    return false;
  }

  verifyTxType(_baseTx: unknown): boolean {
    return ExportTxBuilder.verifyTxType(_baseTx);
  }

  /**
   * Create the internal transaction.
   * @protected
   */
  // Build not implemented yet
  protected buildFlareTransaction(): void {
    throw new Error('Flare P-chain export transaction build not implemented');
  }

  /**
   * Create the ExportedOut where the recipient address are the sender.
   * Later a importTx should complete the operations signing with the same keys.
   * @protected
   */
  protected exportedOutputs(): unknown[] {
    return [];
  }
}
