import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '@bitgo/sdk-coin-dot';
import {
  DecodedSigningPayload,
  DecodedSignedTx,
  UnsignedTransaction,
  TokenSymbol,
  methods,
  TypeRegistry,
} from '@acala-network/txwrapper-acala';
import { AcaCreateBaseTxInfo } from './iface';

export class tokenTransferBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _to: string;
  protected _token: TokenSymbol;
  /**
   *
   * Dispatch the given call from an account that the sender is authorised for through add_proxy.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#proxy
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.acaCreateBaseTxInfo();
    const tokenTransferTx = methods.currencies.transfer(
      {
        amount: this._amount,
        currencyId: { Token: this._token },
        dest: this._to,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
    return tokenTransferTx;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction: string): void {
    // const txMethod = decodedTxn.method.args as unknown as TransferArgs;
    // const amount = `${txMethod.value}`;
    // const to = txMethod.dest.id;
    // const validationResult = TransferTransactionSchema.validate({ amount, to });
    // if (validationResult.error) {
    //   throw new InvalidTransactionError(`Transfer Transaction validation failed: ${validationResult.error.message}`);
    // }
  }

  protected acaCreateBaseTxInfo(): AcaCreateBaseTxInfo {
    return {
      baseTxInfo: {
        address: this._sender,
        blockHash: this._referenceBlock,
        blockNumber: this._registry.createType('BlockNumber', this._blockNumber).toNumber(),
        eraPeriod: this._eraPeriod,
        genesisHash: this._material.genesisHash,
        metadataRpc: this._material.metadata,
        specVersion: this._material.specVersion,
        transactionVersion: this._material.txVersion,
        nonce: this._nonce,
        tip: this._tip,
      },
      options: {
        metadataRpc: this._material.metadata,
        registry: (this._registry as TypeRegistry),
        isImmortalEra: this._eraPeriod === 0,
      },
    };
  }
}
