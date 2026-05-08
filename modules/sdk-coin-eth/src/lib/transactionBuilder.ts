import { BaseCoin as CoinConfig, EthereumNetwork } from '@bitgo/statics';
import { Transaction, getCommon, TransactionBuilder as EthLikeTransactionBuilder } from '@bitgo/abstract-eth';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';

import { TransferBuilder } from './transferBuilder';
import { walletSimpleByteCode } from './walletUtil';
import { ERC721TransferBuilder, ERC1155TransferBuilder } from './transferBuilders';
/**
 * Ethereum transaction builder.
 */
export class TransactionBuilder extends EthLikeTransactionBuilder {
  protected _transfer: TransferBuilder | ERC721TransferBuilder | ERC1155TransferBuilder;
  private _signatures: any;
  /**
   * Public constructor.
   *
   * @param _coinConfig
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig.network as EthereumNetwork);
    this.transaction = new Transaction(this._coinConfig, this._common);
    this._walletSimpleByteCode = walletSimpleByteCode;
  }

  /**
   * Gets the transfer funds builder if exist, or creates a new one for this transaction and returns it
   *
   * @param {string} data transfer data to initialize the transfer builder with, empty if none given
   * @param {boolean} isFirstSigner whether the transaction is being signed by the first signer
   * @returns {TransferBuilder | ERC721TransferBuilder | ERC1155TransferBuilder} the transfer builder
   */
  transfer(data?: string, isFirstSigner?: boolean): TransferBuilder | ERC721TransferBuilder | ERC1155TransferBuilder {
    if (
      !(
        this._type === TransactionType.Send ||
        this._type === TransactionType.SendERC721 ||
        this._type === TransactionType.SendERC1155
      )
    ) {
      throw new BuildTransactionError('Transfers can only be set for send transactions');
    } else if (!this._transfer) {
      if (this._type === TransactionType.Send) {
        this._transfer = new TransferBuilder(data, isFirstSigner);
      } else if (this._type === TransactionType.SendERC721) {
        this._transfer = new ERC721TransferBuilder(data);
      } else if (this._type === TransactionType.SendERC1155) {
        this._transfer = new ERC1155TransferBuilder(data);
      }
    }
    return this._transfer;
  }

  addSignature(publicKey, signature) {
    this._signatures = [];
    this._signatures.push({ publicKey, signature });
  }
}
