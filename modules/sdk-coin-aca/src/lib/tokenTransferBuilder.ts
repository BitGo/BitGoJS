import { BaseAddress, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '.';
import {
  DecodedSigningPayload,
  DecodedSignedTx,
  UnsignedTransaction,
  TokenSymbol,
  methods,
} from '@acala-network/txwrapper-acala';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';

export class TokenTransferBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _to: string;
  protected _token: TokenSymbol;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   *
   * Dispatch the given call from an account that the sender is authorised for through add_proxy.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#proxy
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
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

  /**
   *
   * The amount for transfer transaction.
   *
   * @param {string} amount
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://wiki.acala.network/integrate/integration/token-transfer
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
   * @see https://wiki.acala.network/integrate/integration/token-transfer
   */
  to({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._to = address;
    return this;
  }

  /**
   *
   * The token for transfer transaction.
   *
   * @param {string} dest
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://wiki.acala.network/integrate/integration/token-transfer
   */
  token(token: TokenSymbol): this {
    this.validateToken(token);
    this._token = token;
    return this;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction: string): void {
    // suppress empty error
  }
}
