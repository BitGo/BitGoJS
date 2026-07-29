import { BuildTransactionError, InvalidParameterValueError } from '@bitgo/sdk-core';
import { coins, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';

import { ContractCall } from '../contractCall';
import { decodeConfidentialTransferData, isValidEthAddress, sendMultiSigData } from '../utils';
import { BaseNFTTransferBuilder } from './baseNFTTransferBuilder';
import { confidentialTransferWithProofMethodId, confidentialTransferWithProofTypes } from '../walletUtil';

export class TransferBuilderERC7984 extends BaseNFTTransferBuilder {
  private _encryptedHandle: string;
  private _inputProof: string;
  /** Plaintext token amount in base units, stored as metadata only (NOT included in calldata). */
  private _amount: string;

  constructor(serializedData?: string) {
    super(serializedData);
    if (serializedData) {
      this.decodeTransferData(serializedData);
    }
  }

  coin(coin: string): this {
    this._coin = coins.get(coin);
    this._nativeCoinOperationHashPrefix = (this._coin.network as EthLikeNetwork).nativeCoinOperationHashPrefix;
    return this;
  }

  tokenContractAddress(address: string): this {
    if (isValidEthAddress(address)) {
      this._tokenContractAddress = address;
      return this;
    }
    throw new InvalidParameterValueError('Invalid address');
  }

  /**
   * Set the plaintext transfer amount in base units.
   *
   * This value is stored as metadata only — it is NOT included in the on-chain
   * calldata, which carries only the encrypted form (encryptedHandle + inputProof).
   * Storing it here lets verifyTransaction confirm the signer's intent against
   * the original amount the client submitted.
   */
  amount(amount: string): this {
    if (!/^\d+$/.test(amount) || BigInt(amount) <= 0n) {
      throw new InvalidParameterValueError('amount must be a positive integer string in base units');
    }
    this._amount = amount;
    return this;
  }

  /**
   * Set the encrypted handle (bytes32 hex from WP)
   * Must be a 0x-prefixed 32-byte hex string (66 chars total)
   */
  encryptedHandle(handle: string): this {
    if (!/^0x[0-9a-fA-F]{64}$/.test(handle)) {
      throw new InvalidParameterValueError('encryptedHandle must be a 0x-prefixed 32-byte hex string (66 characters)');
    }
    this._encryptedHandle = handle;
    return this;
  }

  /**
   * Set the input proof (bytes hex from WP)
   * Must be a 0x-prefixed non-empty hex bytes string
   */
  inputProof(proof: string): this {
    if (!/^0x[0-9a-fA-F]{2,}$/.test(proof)) {
      throw new InvalidParameterValueError('inputProof must be a 0x-prefixed non-empty hex bytes string');
    }
    this._inputProof = proof;
    return this;
  }

  getIsFirstSigner(): boolean {
    return false;
  }

  build(): string {
    this.validateMandatoryFields();
    const contractCall = new ContractCall(confidentialTransferWithProofMethodId, confidentialTransferWithProofTypes, [
      this._toAddress,
      this._encryptedHandle,
      this._inputProof,
    ]);
    return contractCall.serialize();
  }

  signAndBuild(chainId: string): string {
    if (!Number.isInteger(this._sequenceId)) {
      throw new BuildTransactionError('Missing mandatory field: contract sequence id');
    }
    this._chainId = chainId;
    this.validateMandatoryFields();
    this._data = this.build();

    return sendMultiSigData(
      this._tokenContractAddress,
      '0',
      this._data,
      this._expirationTime,
      this._sequenceId,
      this.getSignature()
    );
  }

  private validateMandatoryFields(): void {
    if (!this._toAddress) {
      throw new BuildTransactionError('Missing mandatory field: destination (to) address');
    }
    if (!this._tokenContractAddress) {
      throw new BuildTransactionError('Missing mandatory field: token contract address');
    }
    if (!this._encryptedHandle) {
      throw new BuildTransactionError('Missing mandatory field: encryptedHandle');
    }
    if (!this._inputProof || this._inputProof === '0x' || !/^0x[0-9a-fA-F]{2,}$/.test(this._inputProof)) {
      throw new BuildTransactionError('Missing mandatory field: inputProof');
    }
  }

  private decodeTransferData(data: string): void {
    const transferData = decodeConfidentialTransferData(data);
    this._toAddress = transferData.toAddress;
    this._tokenContractAddress = transferData.tokenContractAddress;
    this._encryptedHandle = transferData.encryptedHandle;
    this._inputProof = transferData.inputProof;
    this._expirationTime = parseInt(transferData.expireTime, 10);
    this._sequenceId = parseInt(transferData.sequenceId, 10);
    this._signature = transferData.signature;
  }
}
