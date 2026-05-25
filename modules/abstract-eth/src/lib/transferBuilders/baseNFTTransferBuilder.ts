import { InvalidParameterValueError, InvalidSignatureError } from '@bitgo/sdk-core';
import { isValidEthAddress } from '../utils';
import { joinSignature, solidityKeccak256, SigningKey } from 'ethers/lib/utils';
import { BaseCoin } from '@bitgo/statics';

export abstract class BaseNFTTransferBuilder {
  protected readonly _EMPTY_HEX_VALUE = '0x';
  // dummy account value, for compatibility with SendMultiSig
  protected _fromAddress: string;
  protected _toAddress: string;
  protected _sequenceId: number;
  protected _signKey: string;
  protected _expirationTime: number;
  protected _signature: string;
  protected _data: string;
  protected _tokenContractAddress: string;
  protected _coin: Readonly<BaseCoin>;
  protected _nativeCoinOperationHashPrefix?: string;
  protected _chainId?: string;
  protected _walletVersion?: number;

  public abstract build(): string;

  protected constructor(serializedData?: string) {
    if (serializedData === undefined) {
      // initialize with default values for non mandatory fields
      this._expirationTime = BaseNFTTransferBuilder.getExpirationTime();
      this._data = this._EMPTY_HEX_VALUE;
      this._signature = this._EMPTY_HEX_VALUE;
    }
  }

  expirationTime(date: number): this {
    if (date > 0) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._expirationTime = date;
      return this;
    }
    throw new InvalidParameterValueError('Invalid expiration time');
  }

  walletVersion(version: number): this {
    this._walletVersion = version;
    return this;
  }

  key(signKey: string): this {
    this._signKey = signKey;
    return this;
  }

  contractSequenceId(counter: number): this {
    if (counter >= 0) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._sequenceId = counter;
      return this;
    }
    throw new InvalidParameterValueError('Invalid contract sequence id');
  }

  to(address: string): this {
    if (isValidEthAddress(address)) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._toAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  from(address: string): this {
    if (isValidEthAddress(address)) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._fromAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  /** Return an expiration time, in seconds, set to one hour from now
   *
   * @returns {number} expiration time
   */
  private static getExpirationTime(): number {
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
    if (this._signature === null) {
      throw new InvalidSignatureError('Null signature value');
    }
    return this._signature;
  }

  /**
   * Get the prefix used in generating an operation hash for sending native coins
   *
   * @returns the string prefix
   */
  protected getNativeOperationHashPrefix(): string {
    if (this._walletVersion === 4) {
      return this._chainId ?? 'ETHER';
    }
    return this._nativeCoinOperationHashPrefix ?? this._chainId ?? 'ETHER';
  }

  /**
   * Obtains the proper operation hash to sign either a sendMultiSig data
   * or a sendMultiSigToken data
   *
   * @returns {string} the operation hash
   */
  private getOperationHash(): string {
    const hash = solidityKeccak256(
      ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
      [
        this.getNativeOperationHashPrefix(),
        this._toAddress,
        '0', // dummy amount value
        this._data,
        this._expirationTime,
        this._sequenceId,
      ]
    );
    return hash;
  }

  /**
   * Signs the Message with the given private key
   * @returns {string} 65 byte long raw signature
   */
  protected ethSignMsgHash(): string {
    const signKey = new SigningKey('0x'.concat(this._signKey));
    const digest = signKey.signDigest(this.getOperationHash());
    const rawSignature = joinSignature(digest);

    return rawSignature;
  }
}
