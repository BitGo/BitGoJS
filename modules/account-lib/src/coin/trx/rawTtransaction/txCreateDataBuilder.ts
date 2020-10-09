import { BaseCoin } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { Address } from '../address';
import { isBase58Address } from '../utils';
import { protocol } from '../../../../resources/trx/protobuf/tron';
import { TxCreateData, ValueFields } from '../iface';
import { BuildTransactionError } from '../../baseCoin/errors';

export abstract class TxCreateDataBuilder {
  protected _contract: protocol.Transaction.Contract.ContractType;

  abstract buildData(): ValueFields;

  build(): TxCreateData {
    return {
      apiUrl: this.getApiUrl(),
      data: this.buildData(),
    };
  }

  getApiUrl(): string {
    switch (this._contract) {
      case protocol.Transaction.Contract.ContractType.TransferContract:
        return 'wallet/createtransaction';
      default:
        throw new BuildTransactionError('Unsupported contract type');
    }
  }

  validateAddress(address: Address): void {
    // assumes a base 58 address for our addresses
    if (!isBase58Address(address.address)) {
      throw new Error(address + ' is not a valid base58 address.');
    }
  }

  validateValue(value: BigNumber): void {
    if (value.isLessThanOrEqualTo(0)) {
      throw new Error('Value cannot be below zero.');
    }

    // max long in Java - assumed upper limit for a TRX transaction
    if (value.isGreaterThan(new BigNumber('9223372036854775807'))) {
      throw new Error('Value cannot be greater than handled by the javatron node.');
    }
  }
}
