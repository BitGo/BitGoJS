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
  protected _signature?: string;

  constructor();
  constructor(serializedData: string);
  constructor(serializedData?: string) {
    if (serializedData) {
      this.decodeTransferData(serializedData);
    } else {
      //initialize with default values for non mandatory fields
      this._expirationTime = this.getExpirationTime();
    }
  }

  amount(amount: string): this {
    this._signature = undefined;
    this._amount = amount;
    return this;
  }

  to(address: string): this {
    if (isValidEthAddress(address)) {
      this._signature = undefined;
      this._toAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  contractSequenceId(counter: number): this {
    this._signature = undefined;
    this._sequenceId = counter;
    return this;
  }

  key(signKey: string): this {
    this._signKey = signKey;
    return this;
  }

  expirationTime(date: number): this {
    this._signature = undefined;
    this._expirationTime = date;
    return this;
  }

  abstract signAndBuild(): string;

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

  /**
   * If a signing key is set for this builder, recalculates the signature
   *
   * @returns the signature value
   */
  protected getSignature(): string {
    if (this._signKey) {
      this._signature = this.ethSignMsgHash();
    }
    return this._signature!; //should it fail if a signature has not being set?
  }

  protected ethSignMsgHash(): string {
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
    return ethUtil.addHexPrefix(r.concat(s, v));
  }

  protected abstract decodeTransferData(data: string): void;
}
