import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType, PublicKey } from '@bitgo/sdk-core';
import { TransactionBuilder as AbstractTransactionBuilder, Transaction, TxData } from '@bitgo/abstract-eth';
import { getCommon } from './utils';
import { TransferBuilder } from './transferBuilder';
import { UploadKycBuilder, UploadKycCall } from './uploadKycBuilder';

export class TransactionBuilder extends AbstractTransactionBuilder {
  protected _transfer: TransferBuilder;
  private _signatures: { publicKey: PublicKey; signature: Buffer }[];
  private _uploadKycBuilder?: UploadKycBuilder;
  private _uploadKycCall?: UploadKycCall;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig.network.type);
    this.transaction = new Transaction(this._coinConfig, this._common);
    this._signatures = [];
  }

  /** @inheritdoc */
  transfer(data?: string): TransferBuilder {
    if (this._type !== TransactionType.Send) {
      throw new BuildTransactionError('Transfers can only be set for send transactions');
    }
    if (!this._transfer) {
      this._transfer = new TransferBuilder(data);
    }
    return this._transfer;
  }

  /**
   * Gets the uploadKYC builder if it exists, or creates a new one for this transaction
   *
   * @returns {UploadKycBuilder} the uploadKYC builder
   * @throws {BuildTransactionError} if transaction type is not ContractCall
   */
  uploadKyc(): UploadKycBuilder {
    if (this._type !== TransactionType.ContractCall) {
      throw new BuildTransactionError('uploadKYC can only be set for contract call transactions');
    }
    if (!this._uploadKycBuilder) {
      this._uploadKycBuilder = new UploadKycBuilder(this._coinConfig);
    }
    return this._uploadKycBuilder;
  }

  /** @inheritdoc */
  async build(): Promise<Transaction> {
    // If uploadKYC builder is set, build and cache the result before validation
    if (this._uploadKycBuilder && this._type === TransactionType.ContractCall) {
      this._uploadKycCall = this._uploadKycBuilder.build();
      this.contract(this._uploadKycCall.contractAddress);
      this.data(this._uploadKycCall.serialize());
    }

    return (await super.build()) as Transaction;
  }

  /**
   * Build the transaction data for uploadKYC contract call
   * @private
   */
  private buildUploadKycTransaction(): TxData {
    if (!this._uploadKycCall) {
      throw new BuildTransactionError('uploadKYC call not initialized');
    }

    // The contract address and data are already set in build() method
    // Just return the base transaction data with the serialized data
    return this.buildBase(this._uploadKycCall.serialize());
  }

  /** @inheritdoc */
  protected getTransactionData(): TxData {
    // If uploadKYC builder is set, build uploadKYC transaction
    if (this._uploadKycBuilder && this._type === TransactionType.ContractCall) {
      return this.buildUploadKycTransaction();
    }

    // Otherwise, use the parent implementation
    return super.getTransactionData();
  }

  addSignature(publicKey: PublicKey, signature: Buffer): void {
    this._signatures = [];
    this._signatures.push({ publicKey, signature });
  }

  protected getContractData(addresses: string[]): string {
    throw new Error('Method not implemented.');
  }
}
