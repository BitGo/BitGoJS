import * as ethUtil from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import BN from 'bn.js';
import { coins, BaseCoin, ContractAddressDefinedToken } from '@bitgo/statics';
import { BuildTransactionError, InvalidParameterValueError } from '@bitgo/sdk-core';
import { decodeTransferData, sendMultiSigData, sendMultiSigTokenData, isValidEthAddress, isValidAmount } from './utils';

/** ETH transfer builder */
export class TransferBuilder {
  private readonly _EMPTY_HEX_VALUE = '0x';
  protected _amount: string;
  protected _toAddress: string;
  protected _sequenceId: number;
  protected _signKey: string;
  protected _expirationTime: number;
  protected _signature: string;
  private _data: string;
  private _tokenContractAddress?: string;
  private _coin: Readonly<BaseCoin>;

  constructor(serializedData?: string) {
    if (serializedData) {
      this.decodeTransferData(serializedData);
    } else {
      // initialize with default values for non mandatory fields
      this._expirationTime = this.getExpirationTime();
      this._data = this._EMPTY_HEX_VALUE;
      this._signature = this._EMPTY_HEX_VALUE;
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
    this._coin = coins.get(coin);

    if (this._coin instanceof ContractAddressDefinedToken) {
      this._tokenContractAddress = this._coin.contractAddress.toString();
    }

    return this;
  }

  data(additionalData: string): TransferBuilder {
    this._signature = this._EMPTY_HEX_VALUE;
    this._data = additionalData;
    return this;
  }

  amount(amount: string): this {
    if (!isValidAmount(amount)) {
      throw new InvalidParameterValueError('Invalid amount');
    }
    this._signature = this._EMPTY_HEX_VALUE;
    this._amount = amount;
    return this;
  }

  to(address: string): TransferBuilder {
    if (isValidEthAddress(address)) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._toAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  contractSequenceId(counter: number): TransferBuilder {
    if (counter >= 0) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._sequenceId = counter;
      return this;
    }
    throw new InvalidParameterValueError('Invalid contract sequence id');
  }

  key(signKey: string): TransferBuilder {
    this._signKey = signKey;
    return this;
  }

  expirationTime(date: number): TransferBuilder {
    if (date > 0) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._expirationTime = date;
      return this;
    }
    throw new InvalidParameterValueError('Invalid expiration time');
  }

  signAndBuild(): string {
    if (this.hasMandatoryFields()) {
      if (this._tokenContractAddress !== undefined) {
        return sendMultiSigTokenData(
          this._toAddress,
          this._amount,
          this._tokenContractAddress,
          this._expirationTime,
          this._sequenceId,
          this.getSignature()
        );
      } else {
        return sendMultiSigData(
          this._toAddress,
          this._amount,
          this._data,
          this._expirationTime,
          this._sequenceId,
          this.getSignature()
        );
      }
    }
    throw new BuildTransactionError(
      'Missing transfer mandatory fields. Amount, destination (to) address and sequenceID are mandatory'
    );
  }

  private hasMandatoryFields(): boolean {
    return this._amount !== undefined && this._toAddress !== undefined && this._sequenceId !== undefined;
  }

  /**
   * Obtains the proper operation hash to sign either a sendMultiSig data
   * or a sendMultiSigToken data
   *
   * @returns {string} the operation hash
   */
  private getOperationHash(): string {
    const operationData = this.getOperationData();
    return ethUtil.bufferToHex(EthereumAbi.soliditySHA3(...operationData));
  }

  protected getOperationData(): (string | Buffer)[][] {
    let operationData;
    if (this._tokenContractAddress !== undefined) {
      operationData = [
        ['string', 'address', 'uint', 'address', 'uint', 'uint'],
        [
          this.getTokenOperationHashPrefix(),
          new BN(ethUtil.stripHexPrefix(this._toAddress), 16),
          this._amount,
          new BN(ethUtil.stripHexPrefix(this._tokenContractAddress), 16),
          this._expirationTime,
          this._sequenceId,
        ],
      ];
    } else {
      operationData = [
        ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
        [
          this.getNativeOperationHashPrefix(),
          new BN(ethUtil.stripHexPrefix(this._toAddress), 16),
          this._amount,
          Buffer.from(ethUtil.padToEven(ethUtil.stripHexPrefix(this._data)) || '', 'hex'),
          this._expirationTime,
          this._sequenceId,
        ],
      ];
    }
    return operationData;
  }

  /**
   * Get the prefix used in generating an operation hash for sending tokens
   *
   * @returns the string prefix
   */
  protected getTokenOperationHashPrefix(): string {
    return 'ERC20';
  }

  /**
   * Get the prefix used in generating an operation hash for sending native coins
   *
   * @returns the string prefix
   */
  protected getNativeOperationHashPrefix(): string {
    return 'ETHER';
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
   * @returns {string} the signature value
   */
  protected getSignature(): string {
    if (this._signKey) {
      this._signature = this.ethSignMsgHash();
    }
    return this._signature!;
  }

  protected ethSignMsgHash(): string {
    const data = this.getOperationHash();
    const keyBuffer = Buffer.from(ethUtil.padToEven(this._signKey), 'hex');
    if (keyBuffer.length != 32) {
      throw new Error('private key length is invalid');
    }
    const signatureInParts = ethUtil.ecsign(
      Buffer.from(ethUtil.padToEven(ethUtil.stripHexPrefix(data)), 'hex'),
      keyBuffer
    );

    // Assemble strings from r, s and v
    const r = ethUtil.setLengthLeft(signatureInParts.r, 32).toString('hex');
    const s = ethUtil.setLengthLeft(signatureInParts.s, 32).toString('hex');
    const v = ethUtil.stripHexPrefix(ethUtil.intToHex(signatureInParts.v));

    // Concatenate the r, s and v parts to make the signature string
    return ethUtil.addHexPrefix(r.concat(s, v));
  }

  private decodeTransferData(data: string): void {
    const transferData = decodeTransferData(data);

    this._toAddress = transferData.to;
    this._amount = transferData.amount;
    this._expirationTime = transferData.expireTime;
    this._sequenceId = transferData.sequenceId;
    this._signature = transferData.signature;

    if (transferData.data) {
      this._data = transferData.data;
    }

    if (transferData.tokenContractAddress) {
      this._tokenContractAddress = transferData.tokenContractAddress;
    }
  }
}
