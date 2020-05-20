import ethUtil from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';
import { BuildTransactionError, InvalidParameterValueError } from '../baseCoin/errors';
import { isValidEthAddress, sendMultiSigData } from './utils';
import { sendMultisigMethodId } from './walletUtil';

/** ETH transfer builder */
export class TransferBuilder {
  private _amount: string;
  private _toAddress: string;
  private _sequenceId: number;
  private _data: string;
  private _signKey: string;
  private _expirationTime: number;
  private _signature?: string;

  //initialize with default values for non mandatory fields
  constructor(serializedData?: string) {
    if (serializedData) {
      this.decodeTransferData(serializedData);
    } else {
      this._expirationTime = this.getExpirationTime();
      this._data = '0x';
    }
  }

  amount(amount: string): TransferBuilder {
    this._signature = undefined;
    this._amount = amount;
    return this;
  }

  to(address: string): TransferBuilder {
    if (isValidEthAddress(address)) {
      this._signature = undefined;
      this._toAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  contractSequenceId(counter: number): TransferBuilder {
    this._signature = undefined;
    this._sequenceId = counter;
    return this;
  }

  data(additionalData: string): TransferBuilder {
    this._signature = undefined;
    this._data = additionalData;
    return this;
  }

  key(signKey: string): TransferBuilder {
    this._signature = undefined;
    this._signKey = signKey;
    return this;
  }

  expirationTime(date: number): TransferBuilder {
    this._signature = undefined;
    this._expirationTime = date;
    return this;
  }

  signAndBuild(): string {
    if (this.hasMandatoryFields()) {
      return sendMultiSigData(
        this._toAddress,
        new BigNumber(this._amount).toNumber(),
        this._data,
        this._expirationTime,
        this._sequenceId,
        this._encodedSignature,
      );
    }
    throw new BuildTransactionError(
      'Missing transfer mandatory fields. Amount, destination (to) address, signing key and sequenceID are mandatory',
    );
  }

  private hasMandatoryFields(): boolean {
    return (
      this._amount !== undefined &&
      this._toAddress !== undefined &&
      this._sequenceId !== undefined &&
      (this._signKey !== undefined || this._signature !== undefined)
    );
  }

  /** Return an expiration time, in seconds, set to one hour from now
   *
   * @returns {number} expiration time
   */
  private getExpirationTime(): number {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1);
    return currentDate.getTime() / 1000;
  }

  private getOperationHash(): (string | Buffer)[][] {
    const operationData = [
      ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
      [
        'ETHER',
        new ethUtil.BN(ethUtil.stripHexPrefix(this._toAddress), 16),
        this._amount,
        new Buffer(ethUtil.stripHexPrefix(this._data) || '', 'hex'),
        this._expirationTime,
        this._sequenceId,
      ],
    ];
    return ethUtil.bufferToHex(EthereumAbi.soliditySHA3(...operationData));
  }

  private get _encodedSignature(): string {
    if (this._signKey) {
      this._signature = this.ethSignMsgHash();
    }
    return this._signature as string;
  }

  private ethSignMsgHash(): string {
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

  private decodeTransferData(data: string): void {
    if (!data.startsWith(sendMultisigMethodId)) {
      throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
    }
    const splitBytecode = data.split(sendMultisigMethodId);
    if (splitBytecode.length !== 2) {
      throw new BuildTransactionError(`Invalid send bytecode: ${data}`);
    }
    const serializedArgs = Buffer.from(splitBytecode[1], 'hex');
    const decoded = EthereumAbi.rawDecode(['address', 'uint', 'bytes', 'uint', 'uint', 'bytes'], serializedArgs);
    this._toAddress = ethUtil.bufferToHex(decoded[0]);
    this._amount = ethUtil.bufferToInt(decoded[1]).toString();
    this._data = ethUtil.bufferToHex(decoded[2]);
    this._expirationTime = ethUtil.bufferToInt(decoded[3]);
    this._sequenceId = ethUtil.bufferToInt(decoded[4]);
    this._signature = ethUtil.bufferToHex(decoded[5]);
  }
}
