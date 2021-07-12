import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { InvalidTransactionError } from '../baseCoin/errors';
import { EosActionBuilder } from './eosActionBuilder';
import { Action } from './ifaces';
import { BuyRamBytesActionSchema } from './txnSchema';

export class BuyRamBytesActionBuilder extends EosActionBuilder {
  private _payer: string;
  private _receiver: string;
  private _bytes: number;

  constructor(act: Action) {
    super(act);
    this.action.name = this.actionName();
  }

  /**
   * Sets the account name of the payer
   *
   * @returns {this} this action builder.
   *
   * @param {string} payer valid eos name
   */
  payer(payer: string): this {
    this._payer = payer;
    return this;
  }

  /**
   * Sets the account name of the reciever
   *
   * @returns {this} this action builder.
   *
   * @param {string} receiver valid eos name
   */
  receiver(receiver: string): this {
    this._receiver = receiver;
    return this;
  }

  /**
   * Sets the bytes quantity
   *
   * @returns {this} this action builder.
   *
   * @param {number} bytes valid eos quantity
   */
  bytes(bytes: number): this {
    this._bytes = bytes;
    return this;
  }

  /**
   * Get action name
   *
   * @returns {string} The name of the action e.g. transfer, buyrambytes, delegatebw etc
   */
  actionName(): string {
    return 'buyrambytes';
  }

  /** @inheritdoc */
  build(builder: EosTxBuilder): EosJs.Serialize.Action {
    const data = this.action.data;
    if (typeof data === 'string') {
      return {
        account: this.action.account,
        name: this.actionName(),
        authorization: this.action.authorization,
        data: data,
      };
    } else {
      this.validateMandatoryFields(
        this._payer,
        this._receiver,
        this._bytes,
      );
      return builder
        .with(this.action.account)
        .as(this.action.authorization)
        .buyrambytes(this._payer, this._receiver, this._bytes);
    }
  }

  /**
   * Validates whether the required fields are present
   *
   * @param {string} payer name of payer
   * @param {string} receiver name of receiver
   * @param {number} bytes bytes
   */
  private validateMandatoryFields(
    payer: string,
    receiver: string,
    bytes: number
  ) {
    const validationResult = BuyRamBytesActionSchema.validate({
      payer,
      receiver,
      bytes,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}


