import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { Address } from '../address';
import { ValueFields } from '../iface';
import { getHexAddressFromBase58Address } from '../utils';
import { protocol } from '../../../../resources/trx/protobuf/tron';
import { TxCreateDataBuilder } from './txCreateDataBuilder';

export class SendFoundCreateDataBuilder extends TxCreateDataBuilder {
  private _toAddress: string;
  private _amount: string;
  private _ownerAddress: string;

  constructor() {
    super();
    this._contract = protocol.Transaction.Contract.ContractType.TransferContract;
  }

  /** @inheritDoc */
  buildData(): ValueFields {
    return {
      to_address: getHexAddressFromBase58Address(this._toAddress),
      owner_address: getHexAddressFromBase58Address(this._ownerAddress),
      amount: new BigNumber(this._amount).toNumber(),
    };
  }

  source(address: Address): this {
    this.validateAddress(address);
    this._ownerAddress = address.address;
    return this;
  }

  /**
   * Set the destination address where the funds will be sent,
   *
   * @param {Address} address the address to transfer funds to
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  to(address: Address): this {
    this.validateAddress(address);
    this._toAddress = address.address;
    return this;
  }

  /**
   * Set the amount to be transferred
   *
   * @param {string} amount amount to transfer in sun, 1 TRX = 1000000 sun
   * @returns {TransferBuilder} the builder with the new parameter set
   */
  amount(amount: string): this {
    const BNamount = new BigNumber(amount);
    this.validateValue(BNamount);
    this._amount = BNamount.toFixed();
    return this;
  }
}
