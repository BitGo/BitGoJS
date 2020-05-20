import ethUtil from 'ethereumjs-util';
import { InvalidParameterValueError } from '../baseCoin/errors';
import { isValidEthAddress } from './utils';

/** ETH transfer builder */
export abstract class TransferBuilder {
  protected _amount: string;
  protected _toAddress: string;
  protected _sequenceId: number;
  protected _signKey: string;
  protected _expirationTime: number;
  protected _signature: string;

  //initialize with default values for non mandatory fields
  constructor() {
    this._expirationTime = this.getExpirationTime();
  }

  amount(amount: string): TransferBuilder {
    this._amount = amount;
    return this;
  }

  to(address: string): TransferBuilder {
    if (isValidEthAddress(address)) {
      this._toAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  contractSequenceId(counter: number): TransferBuilder {
    this._sequenceId = counter;
    return this;
  }

  key(signKey: string): TransferBuilder {
    this._signKey = signKey;
    return this;
  }

  expirationTime(date: number): TransferBuilder {
    this._expirationTime = date;
    return this;
  }

  protected abstract signAndBuild(): string;

  protected abstract hasMandatoryFields(): boolean;

  /** Return an expiration time, in seconds, set to one hour from now
   *
   * @returns {number} expiration time
   */
  private getExpirationTime(): number {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1);
    return currentDate.getTime() / 1000;
  }

  protected abstract getOperationHash(): (string | Buffer)[][];

  protected ethSignMsgHash(): void {
    const data = this.getOperationHash();
    const signatureInParts = ethUtil.ecsign(
      new Buffer(ethUtil.stripHexPrefix(data), 'hex'),
      new Buffer(this._signKey, 'hex'),
    );

    // Assemble strings from r, s and v
    const r = ethUtil.setLengthLeft(signatureInParts.r, 32).toString('hex');
    const s = ethUtil.setLengthLeft(signatureInParts.s, 32).toString('hex');
    const v = ethUtil.stripHexPrefix(ethUtil.intToHex(signatureInParts.v));

    // Concatenate the r, s and v parts to make the signature string
    this._signature = ethUtil.addHexPrefix(r.concat(s, v));
  }
}
