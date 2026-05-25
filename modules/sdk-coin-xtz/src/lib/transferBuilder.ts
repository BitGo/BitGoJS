import { BuildTransactionError } from '@bitgo/sdk-core';
import { TransferData } from './iface';

/** Tezos transfer builder. */
// TODO: implement BaseTransferBuilder
export class TransferBuilder {
  private _amount: string;
  private _coin: string;
  private _toAddress: string;
  private _fromAddress: string;
  private _fee: string;
  private _gasLimit: string;
  private _storageLimit: string;
  private _dataToSign: string;
  private _counter: string;

  amount(amount: string): TransferBuilder {
    this._amount = amount;
    return this;
  }

  coin(coin: string): TransferBuilder {
    this._coin = coin;
    return this;
  }

  from(address: string): TransferBuilder {
    this._fromAddress = address;
    return this;
  }

  to(address: string): TransferBuilder {
    this._toAddress = address;
    return this;
  }

  fee(fee: string): TransferBuilder {
    this._fee = fee;
    return this;
  }

  gasLimit(gasLimit: string): TransferBuilder {
    this._gasLimit = gasLimit;
    return this;
  }

  storageLimit(storageLimit: string): TransferBuilder {
    this._storageLimit = storageLimit;
    return this;
  }

  dataToSign(dataToSign: string): TransferBuilder {
    this._dataToSign = dataToSign;
    return this;
  }

  counter(counter: string): TransferBuilder {
    this._counter = counter;
    return this;
  }

  build(): TransferData {
    if (!this._amount || !this._fromAddress || !this._toAddress || !this._fee) {
      throw new BuildTransactionError(
        'Missing transfer mandatory fields. Amount, from address, destination (to) address and fee are mandatory'
      );
    }
    return {
      amount: this._amount,
      coin: this._coin,
      from: this._fromAddress,
      to: this._toAddress,
      fee: {
        fee: this._fee,
        gasLimit: this._gasLimit,
        storageLimit: this._storageLimit,
      },
      dataToSign: this._dataToSign,
      counter: this._counter,
    };
  }
}
