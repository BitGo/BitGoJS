import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import { BaseAddress } from '../baseCoin/iface';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { TransferBuilder } from './transferBuilder';
import { Transaction } from './transaction';
import { AssetTransferTxnSchema } from './txnSchema';
import Utils from './utils';

export class AssetTransferBuilder extends TransferBuilder {
  private _tokenId: number;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Sets the token id.
   *
   * The token id uniquely identifies the asset.
   *
   * @param {number} id The token id.
   * @returns {AssetTransferBuilder} This transaction builder.
   *
   * @see https://developer.algorand.org/docs/reference/transactions/#asset-transfer-transaction
   */
  tokenId(id: number): this {
    if (id <= 0) {
      throw new Error('Asset index must be a uint64 value');
    }
    this._tokenId = id;

    return this;
  }

  /**
   * Sets the parameters of the transaction builder to allowlist an asset.
   *
   * To allow list an asset, you send 0 units of the asset to yourself.
   *
   * This method sets the tokenId, sender, receiver, asset amount, and
   * fee parameters to their respective values to allowlist and asset.
   *
   * @param {number} tokenId The unique identifier of the asset.
   * @param {BaseAddress} userAddress The address of the user.
   * @returns {AssetTransferBuilder} This transaction builder.
   */
  allowListAsset(tokenId: number, userAddress: BaseAddress): this {
    this.tokenId(tokenId);
    this.sender(userAddress);
    this.to(userAddress);
    this.isFlatFee(true);
    this.fee({ fee: '1000' });
    this.amount(0);

    return this;
  }

  protected buildAlgoTxn(): algosdk.Transaction {
    return algosdk.makeAssetTransferTxnWithSuggestedParams(
      this._sender,
      this._to,
      undefined,
      undefined,
      this._amount,
      this._note,
      this._tokenId,
      this.suggestedParams,
      this._reKeyTo,
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const algoTx = tx.getAlgoTransaction();
    if (!algoTx) {
      throw new InvalidTransactionError('Transaction is empty');
    }

    this._tokenId = algoTx.assetIndex;
    this._amount = algoTx.amount;
    this._to = algosdk.encodeAddress(algoTx.to.publicKey);

    return tx;
  }

  validateRawTransaction(rawTransaction: Uint8Array | string): void {
    const { txn: algoTxn } = Utils.decodeAlgoTxn(rawTransaction);
    if (algoTxn.type !== algosdk.TransactionType.axfer) {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${algoTxn.type}. Expected ${algosdk.TransactionType.axfer}`,
      );
    }

    this.validateFields(algoTxn.assetIndex, algoTxn.amount, algosdk.encodeAddress(algoTxn.to.publicKey));
  }

  /** @inheritdoc */
  validateTransaction(txn: Transaction): void {
    super.validateTransaction(txn);
    this.validateFields(this._tokenId, this._amount, this._to);
  }

  private validateFields(tokenId: number, assetAmount: number | bigint, receiver: string): void {
    const validationResult = AssetTransferTxnSchema.validate({
      tokenId,
      assetAmount,
      receiver,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
