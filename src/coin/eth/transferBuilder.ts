import ethUtil from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';
import { coins, Erc20Coin } from '@bitgo/statics';
import { BuildTransactionError } from '../baseCoin/errors';
import { InvalidParameterValueError } from '../baseCoin/errors';
import { sendMultiSigData, sendMultiSigTokenData } from './utils';
import {
  sendMultisigMethodId,
  sendMultiSigTypes,
  sendMultiSigTokenTypes,
  sendMultisigTokenMethodId,
} from './walletUtil';
import { isValidEthAddress } from './utils';

/** ETH transfer builder */
export class TransferBuilder {
  protected _amount: string;
  protected _toAddress: string;
  protected _sequenceId: number;
  protected _signKey: string;
  protected _expirationTime: number;
  protected _signature?: string;
  private _data: string;
  private _tokenContractAddress?: string;

  constructor();
  constructor(serializedData: string);
  constructor(serializedData?: string) {
    if (serializedData) {
      this.decodeTransferData(serializedData);
    } else {
      //initialize with default values for non mandatory fields
      this._expirationTime = this.getExpirationTime();
      this._data = '0x';
    }
  }

  /**
   * A method to set the ERC20 token to be transferred.
   * This ERC20 token may not be compatible with the network.
   *
   * @param {string} coin the ERC20 coin to be set
   * @returns {TransferBuilder} the transfer builder instance modified
   */
  coin(coin: string): TransferBuilder {
    const coinType = coins.get(coin);
    if (!(coinType instanceof Erc20Coin)) {
      throw new BuildTransactionError('There was an error using that coin as a transfer currency');
    }
    this._tokenContractAddress = coinType.contractAddress.toString();

    return this;
  }

  data(additionalData: string): TransferBuilder {
    this._signature = undefined;
    this._data = additionalData;
    return this;
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

  key(signKey: string): TransferBuilder {
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
      if (this._tokenContractAddress !== undefined) {
        return sendMultiSigTokenData(
          this._toAddress,
          new BigNumber(this._amount).toNumber(),
          this._tokenContractAddress,
          this._expirationTime,
          this._sequenceId,
          this.getSignature(),
        );
      } else {
        return sendMultiSigData(
          this._toAddress,
          new BigNumber(this._amount).toNumber(),
          this._data,
          this._expirationTime,
          this._sequenceId,
          this.getSignature(),
        );
      }
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

  protected getOperationHash(): (string | Buffer)[][] {
    const operationData = this.getOperationData();
    return ethUtil.bufferToHex(EthereumAbi.soliditySHA3(...operationData));
  }

  private getOperationData(): any[][] {
    let operationData;
    if (this._tokenContractAddress !== undefined) {
      operationData = [
        ['string', 'address', 'uint', 'address', 'uint', 'uint'],
        [
          'ERC20',
          new ethUtil.BN(ethUtil.stripHexPrefix(this._toAddress), 16),
          this._amount,
          new ethUtil.BN(ethUtil.stripHexPrefix(this._tokenContractAddress), 16),
          this._expirationTime,
          this._sequenceId,
        ],
      ];
    } else {
      operationData = [
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
    }
    return operationData;
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

  private decodeTransferData(data: string): void {
    if (!(data.startsWith(sendMultisigMethodId) || data.startsWith(sendMultisigTokenMethodId))) {
      throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
    }
    let decoded;
    if (this.isTokenTransfer(data)) {
      decoded = this.getRawDecoded(sendMultiSigTokenTypes, this.getBufferedByteCode(sendMultisigTokenMethodId, data));
      this._tokenContractAddress = ethUtil.bufferToHex(decoded[2]);
    } else {
      decoded = this.getRawDecoded(sendMultiSigTypes, this.getBufferedByteCode(sendMultisigMethodId, data));
      this._data = ethUtil.bufferToHex(decoded[2]);
    }
    this._toAddress = ethUtil.bufferToHex(decoded[0]);
    this._amount = ethUtil.bufferToInt(decoded[1]).toString();
    this._data = ethUtil.bufferToHex(decoded[2]);
    this._expirationTime = ethUtil.bufferToInt(decoded[3]);
    this._sequenceId = ethUtil.bufferToInt(decoded[4]);
    this._signature = ethUtil.bufferToHex(decoded[5]);
  }

  private isTokenTransfer(data: string): boolean {
    return data.startsWith(sendMultisigTokenMethodId);
  }

  private getBufferedByteCode(methodId: string, rawData: string): Buffer {
    const splitBytecode = rawData.split(methodId);
    if (splitBytecode.length !== 2) {
      throw new BuildTransactionError(`Invalid send bytecode: ${rawData}`);
    }
    return Buffer.from(splitBytecode[1], 'hex');
  }

  private getRawDecoded(types: string[], serializedArgs: Buffer): Buffer[] {
    return EthereumAbi.rawDecode(types, serializedArgs);
  }
}
