import EthereumAbi from 'ethereumjs-abi';
import ethUtil from 'ethereumjs-utils-old';
import { BuildTransactionError, InvalidParameterValueError } from '../../baseCoin/errors';
import { ContractCall, serializeAnyTypeContractCalls } from '../contractCall';
import { decodeERC721TransferData, isValidEthAddress, sendMultiSigData } from '../utils';

// https://eips.ethereum.org/EIPS/eip-721
// function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;
// https://eips.ethereum.org/EIPS/eip-1155
// function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes calldata _data) external;
// function safeBatchTransferFrom(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) external;

export class ERC721TransferBuilder {

  private readonly _EMPTY_HEX_VALUE = '0x';
  // dummy account value, for compatibility with SendMultiSig
  protected _fromAddress: string;
  protected _toAddress: string;
  protected _sequenceId: number;
  protected _signKey: string;
  protected _expirationTime: number;
  protected _signature: string;
  private _data: string;
  private _tokenContractAddress: string;
  private _tokenId: number;

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

  // TODO: update docs
  /**
   * A method to set the ERC20 token to be transferred.
   * This ERC20 token may not be compatible with the network.
   *
   * @param {string} coin the ERC20 coin to be set
   * @returns {TransferBuilder} the transfer builder instance modified
   */
  tokenContractAddress(tokenContractAddress: string): ERC721TransferBuilder {
    this._tokenContractAddress = tokenContractAddress;
    return this;
  }

  from(address: string): ERC721TransferBuilder {
    if (isValidEthAddress(address)) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._fromAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  to(address: string): ERC721TransferBuilder {
    if (isValidEthAddress(address)) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._toAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  tokenId(token: number): ERC721TransferBuilder {
    this._tokenId = token;
    return this;
  }

  contract(address: string): ERC721TransferBuilder{
    if (isValidEthAddress(address)) {
     this._tokenContractAddress = address;
     return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  contractSequenceId(counter: number): ERC721TransferBuilder {
    if (counter >= 0) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._sequenceId = counter;
      return this;
    }
    throw new InvalidParameterValueError('Invalid contract sequence id');
  }

  key(signKey: string): ERC721TransferBuilder {
    this._signKey = signKey;
    return this;
  }

  expirationTime(date: number): ERC721TransferBuilder {
    if (date > 0) {
      this._signature = this._EMPTY_HEX_VALUE;
      this._expirationTime = date;
      return this;
    }
    throw new InvalidParameterValueError('Invalid expiration time');
  }

  signAndBuild(): string {
    if (this.hasMandatoryFields()) {
      const types = ['address', 'address', 'uint256', 'bytes'];
      const values = [this._fromAddress, this._toAddress, this._tokenId, ''];
      this._data = serializeAnyTypeContractCalls('safeTransferFrom', types, values);

      return sendMultiSigData(
        this._tokenContractAddress, // to
        "0", // dummy amount value 
        this._data,
        this._expirationTime,
        this._sequenceId,
        this.getSignature(),
      );
    }
    throw new BuildTransactionError(
      'Missing transfer mandatory fields. Amount, destination (to) address and sequenceID are mandatory',
    );
  }

  private hasMandatoryFields(): boolean {
    return this._tokenId !== undefined &&
      this._tokenContractAddress !== undefined &&
      this._toAddress !== undefined &&
      this._sequenceId !== undefined;
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
    return [
      ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
      [
        this.getNativeOperationHashPrefix(),
        new ethUtil.BN(ethUtil.stripHexPrefix(this._toAddress), 16),
        "0",
        Buffer.from(ethUtil.stripHexPrefix(this._data) || '', 'hex'),
        this._expirationTime,
        this._sequenceId,
      ],
    ];
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
    const signatureInParts = ethUtil.ecsign(
      Buffer.from(ethUtil.stripHexPrefix(data), 'hex'),
      Buffer.from(this._signKey, 'hex'),
    );

    // Assemble strings from r, s and v
    const r = ethUtil.setLengthLeft(signatureInParts.r, 32).toString('hex');
    const s = ethUtil.setLengthLeft(signatureInParts.s, 32).toString('hex');
    const v = ethUtil.stripHexPrefix(ethUtil.intToHex(signatureInParts.v));

    // Concatenate the r, s and v parts to make the signature string
    return ethUtil.addHexPrefix(r.concat(s, v));
  }

  private decodeTransferData(data: string): void {
    const transferData = decodeERC721TransferData(data);
    this._toAddress = transferData.to;
    this._expirationTime = transferData.expireTime;
    this._sequenceId = transferData.sequenceId;
    this._signature = transferData.signature;
    this._tokenContractAddress = transferData.tokenContractAddress;
    this._tokenId = transferData.tokenId;
    if (transferData.data) {
      this._data = transferData.data;
    }
  }

}
