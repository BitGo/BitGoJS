import BigNumber from 'bignumber.js';
import { InputsAndOutputs, Transaction } from './transaction';
import { TxData } from '../iface';

/**
 * This is for transactions where one sender sends coins to recipients.
 */
export abstract class AbstractTransferTransaction extends Transaction {
  override inputsAndOutputs(): InputsAndOutputs {
    const totalAmount = this._recipients.reduce(
      (accumulator, current) => accumulator.plus(current.amount),
      new BigNumber('0')
    );
    const inputs = [
      {
        address: this.sender,
        value: totalAmount.toString(),
        coin: this._coinConfig.name,
      },
    ];
    const outputs = this._recipients.map((recipient) => {
      return {
        address: recipient.address,
        value: recipient.amount as string,
        coin: this._coinConfig.name,
      };
    });
    return { inputs, outputs, externalOutputs: this._recipients };
  }

  override toJson(): TxData {
    return {
      ...super.toJson(),
      recipient: this.recipient,
    };
  }
}
