import { BaseAddress, TransactionType } from "@bitgo/sdk-core";
import { TransactionBuilder } from '@bitgo/sdk-coin-dot';
import {
  DecodedSigningPayload,
  DecodedSignedTx,
  UnsignedTransaction,
  TokenSymbol,
  methods,
} from '@acala-network/txwrapper-acala';
// import { TypeRegistry } from '@polkadot/types';
import { AcaCreateBaseTxInfo } from './iface';
import BigNumber from "bignumber.js";

export class TokenTransferBuilder extends TransactionBuilder {
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
    // const baseTxInfo = this.acaCreateBaseTxInfo();
    const baseTxInfo = this.createBaseTxInfo();
    const tokenTransferTx = methods.currencies.transfer(
      {
        amount: this._amount,
        currencyId: { Token: this._token },
        dest: this._to,
      },
      baseTxInfo.baseTxInfo,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore sjupress this now
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

  /**
   *
   * The amount for transfer transaction.
   *
   * @param {string} amount
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://wiki.polkadot.network/docs/build-protocol-info
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  /**
   *
   * The destination address for transfer transaction.
   *
   * @param {string} dest
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://wiki.polkadot.network/docs/build-protocol-info
   */
  to({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._to = address;
    return this;
  }
}
