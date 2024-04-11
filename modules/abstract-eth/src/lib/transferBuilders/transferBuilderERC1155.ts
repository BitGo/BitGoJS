import { BuildTransactionError, InvalidParameterValueError } from '@bitgo/sdk-core';
import { hexlify, hexZeroPad } from 'ethers/lib/utils';

import { ContractCall } from '../contractCall';
import { decodeERC1155TransferData, isValidEthAddress, sendMultiSigData } from '../utils';
import {
  ERC1155BatchTransferTypes,
  ERC1155SafeTransferTypes,
  ERC1155BatchTransferTypeMethodId,
  ERC1155SafeTransferTypeMethodId,
} from '../walletUtil';
import { BaseNFTTransferBuilder } from './baseNFTTransferBuilder';
import { coins, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';

export class ERC1155TransferBuilder extends BaseNFTTransferBuilder {
  private _tokenIds: string[];
  private _values: string[];
  private _bytes: string;

  constructor(serializedData?: string) {
    super(serializedData);
    this.bytes(0);
    if (serializedData) {
      this.decodeTransferData(serializedData);
    } else {
      this._tokenIds = [];
      this._values = [];
    }
  }

  coin(coin: string): ERC1155TransferBuilder {
    this._coin = coins.get(coin);
    this._nativeCoinOperationHashPrefix = (this._coin.network as EthLikeNetwork).nativeCoinOperationHashPrefix;
    return this;
  }

  tokenContractAddress(address: string): ERC1155TransferBuilder {
    if (isValidEthAddress(address)) {
      this._tokenContractAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  entry(tokenId: number, value: number): ERC1155TransferBuilder {
    this._tokenIds.push(tokenId.toString());
    this._values.push(value.toString());
    return this;
  }

  bytes(bytesInNumber: number): ERC1155TransferBuilder {
    this._bytes = hexZeroPad(hexlify(bytesInNumber), 32);
    return this;
  }

  signAndBuild(chainId: string): string {
    this._chainId = chainId;
    const hasMandatoryFields = this.hasMandatoryFields();
    if (hasMandatoryFields) {
      this._data = this.build();

      return sendMultiSigData(
        this._tokenContractAddress,
        '0', // dummy amount value
        this._data,
        this._expirationTime,
        this._sequenceId,
        this.getSignature()
      );
    }
    throw new BuildTransactionError(
      `Missing transfer mandatory fields. 
       Destination (to) address, source (from) address, sequenceID, the token contract address, tokenIDs and their values are mandatory`
    );
  }

  private hasMandatoryFields(): boolean {
    return (
      this._tokenIds !== undefined &&
      this._tokenIds.length !== 0 &&
      this._values.length !== 0 &&
      this._tokenIds.length === this._values.length &&
      this._toAddress !== undefined &&
      this._fromAddress !== undefined &&
      this._tokenContractAddress !== undefined &&
      this._sequenceId !== undefined
    );
  }
  private decodeTransferData(data: string): void {
    const transferData = decodeERC1155TransferData(data);
    this._toAddress = transferData.to;
    this._fromAddress = transferData.from;
    this._expirationTime = transferData.expireTime;
    this._sequenceId = transferData.sequenceId;
    this._signature = transferData.signature;
    this._tokenContractAddress = transferData.tokenContractAddress;
    this._tokenIds = transferData.tokenIds;
    this._values = transferData.values;
    if (transferData.data) {
      this._data = transferData.data;
    }
  }

  build(): string {
    if (this._tokenIds.length === 1) {
      const values = [this._fromAddress, this._toAddress, this._tokenIds[0], this._values[0], this._bytes];
      const contractCall = new ContractCall(ERC1155SafeTransferTypeMethodId, ERC1155SafeTransferTypes, values);
      return contractCall.serialize();
    } else {
      const values = [this._fromAddress, this._toAddress, this._tokenIds, this._values, this._bytes];
      const contractCall = new ContractCall(ERC1155BatchTransferTypeMethodId, ERC1155BatchTransferTypes, values);
      return contractCall.serialize();
    }
  }
}
