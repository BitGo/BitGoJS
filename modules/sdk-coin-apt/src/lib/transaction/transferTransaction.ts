import { Transaction } from './transaction';
import { TxData } from '../iface';
import { TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';

export class TransferTransaction extends Transaction {
  toJson(): TxData {
    const rawTxn = this._rawTransaction;
    const payload = this._rawTransaction.payload as TransactionPayloadEntryFunction;
    const entryFunction = payload.entryFunction;
    return {
      id: this.id,
      sender: this.sender,
      sequenceNumber: rawTxn.sequence_number,
      maxGasAmount: rawTxn.max_gas_amount,
      gasUnitPrice: rawTxn.gas_unit_price,
      expirationTime: rawTxn.expiration_timestamp_secs,
      payload: {
        function: entryFunction.function_name.identifier,
        typeArguments: entryFunction.type_args.map((a) => a.toString()),
        arguments: entryFunction.args.map((a) => a.toString()),
        type: 'entry_function_payload',
      },
      chainId: rawTxn.chain_id.chainId,
    };
  }
}
