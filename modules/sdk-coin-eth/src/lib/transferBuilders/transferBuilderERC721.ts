import { BuildTransactionError, InvalidParameterValueError } from '@bitgo/sdk-core';
import { ContractCall } from '../contractCall';
import { decodeERC721TransferData, isValidEthAddress, sendMultiSigData } from '../utils';
import { BaseNFTTransferBuilder } from './baseNFTTransferBuilder';
import { ERC721SafeTransferTypeMethodId } from '../walletUtil';
import { hexlify, hexZeroPad } from 'ethers/lib/utils';

export class ERC721TransferBuilder extends BaseNFTTransferBuilder {
  private _tokenId: string;
  private _bytes: string;

  constructor(serializedData?: string) {
    super(serializedData);
    this.bytes(0);
    if (serializedData) {
      this.decodeTransferData(serializedData);
    }
  }

  tokenContractAddress(address: string): ERC721TransferBuilder {
    if (isValidEthAddress(address)) {
      this._tokenContractAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  tokenId(token: string): ERC721TransferBuilder {
    this._tokenId = token;
    return this;
  }

  bytes(bytesInNumber: number): ERC721TransferBuilder {
    this._bytes = hexZeroPad(hexlify(bytesInNumber), 32);
    return this;
  }

  signAndBuild(): string {
    if (this.hasMandatoryFields()) {
      const types = ['address', 'address', 'uint256', 'bytes'];
      const values = [this._fromAddress, this._toAddress, this._tokenId, this._bytes];
      const contractCall = new ContractCall(ERC721SafeTransferTypeMethodId, types, values);
      this._data = contractCall.serialize();

      return sendMultiSigData(
        this._tokenContractAddress, // to
        '0', // dummy amount value
        this._data,
        this._expirationTime,
        this._sequenceId,
        this.getSignature()
      );
    }

    throw new BuildTransactionError(
      `Missing transfer mandatory fields. 
       Destination (to) address, Source (from) address, sequenceID, the token contract address and tokenID are mandatory`
    );
  }

  private hasMandatoryFields(): boolean {
    return (
      this._tokenId !== undefined &&
      this._toAddress !== undefined &&
      this._fromAddress !== undefined &&
      this._tokenContractAddress !== undefined &&
      this._sequenceId !== undefined
    );
  }

  private decodeTransferData(data: string): void {
    const transferData = decodeERC721TransferData(data);
    this._toAddress = transferData.to;
    this._fromAddress = transferData.from;
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
