/**
 * @prettier
 */
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, InvalidParameterValueError } from '@bitgo/sdk-core';
import { ContractCall } from '@bitgo/abstract-eth';
import { UPLOAD_KYC_METHOD_ID, getValidatorContractAddress } from './validatorContract';

/**
 * Represents an XDC uploadKYC contract call
 * This is used to submit KYC document hashes (IPFS hashes) to the XDC Validator contract
 */
export class UploadKycCall extends ContractCall {
  public readonly contractAddress: string;
  public readonly ipfsHash: string;

  constructor(contractAddress: string, ipfsHash: string) {
    // uploadKYC(string) - takes a single string parameter (the IPFS hash)
    super(UPLOAD_KYC_METHOD_ID, ['string'], [ipfsHash]);
    this.contractAddress = contractAddress;
    this.ipfsHash = ipfsHash;
  }
}

/**
 * Builder for XDC uploadKYC transactions
 *
 * This builder creates transactions that upload KYC document hashes to the XDC Validator contract.
 * The flow is:
 * 1. Upload KYC document to IPFS → get IPFS hash (e.g., "Qm...")
 * 2. Use this builder to create a transaction that submits the hash to the validator contract
 * 3. The transaction is signed using TSS/MPC
 * 4. After successful upload, the address can propose a validator candidate
 *
 * @example
 * ```typescript
 * const builder = new UploadKycBuilder(coinConfig);
 * const call = builder
 *   .ipfsHash('QmRealIPFSHash...')
 *   .build();
 * ```
 */
export class UploadKycBuilder {
  private _ipfsHash?: string;
  private _contractAddress?: string;
  private readonly _coinConfig: Readonly<CoinConfig>;

  constructor(coinConfig: Readonly<CoinConfig>) {
    this._coinConfig = coinConfig;
  }

  /**
   * Set the IPFS hash of the uploaded KYC document
   *
   * @param {string} hash - The IPFS hash (e.g., "QmRealIPFSHash...")
   * @returns {UploadKycBuilder} this builder instance
   * @throws {InvalidParameterValueError} if the hash is invalid
   */
  ipfsHash(hash: string): this {
    if (!hash || hash.trim().length === 0) {
      throw new InvalidParameterValueError('IPFS hash cannot be empty');
    }

    // Basic IPFS hash validation (should start with 'Qm' for v0 or 'b' for v1)
    if (!hash.startsWith('Qm') && !hash.startsWith('b')) {
      throw new InvalidParameterValueError(
        'Invalid IPFS hash format. Expected hash starting with "Qm" (v0) or "b" (v1)'
      );
    }

    this._ipfsHash = hash;
    return this;
  }

  /**
   * Set a custom validator contract address
   * If not set, the default address for the network will be used
   *
   * @param {string} address - The validator contract address
   * @returns {UploadKycBuilder} this builder instance
   * @throws {InvalidParameterValueError} if the address is invalid
   */
  contractAddress(address: string): this {
    if (!address || address.trim().length === 0) {
      throw new InvalidParameterValueError('Contract address cannot be empty');
    }

    // Basic Ethereum address validation
    if (!/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
      throw new InvalidParameterValueError('Invalid contract address format');
    }

    this._contractAddress = address.toLowerCase().startsWith('0x') ? address : `0x${address}`;
    return this;
  }

  /**
   * Build the uploadKYC contract call
   *
   * @returns {UploadKycCall} the constructed contract call
   * @throws {BuildTransactionError} if required fields are missing
   */
  build(): UploadKycCall {
    this.validateMandatoryFields();
    const contractAddress = this._contractAddress || this.getDefaultContractAddress();
    const ipfsHash = this._ipfsHash as string; // validated by validateMandatoryFields
    return new UploadKycCall(contractAddress, ipfsHash);
  }

  /**
   * Validate that all mandatory fields are set
   * @private
   */
  private validateMandatoryFields(): void {
    if (!this._ipfsHash) {
      throw new BuildTransactionError('Missing IPFS hash for uploadKYC transaction');
    }
  }

  /**
   * Get the default validator contract address for the current network
   * @private
   */
  private getDefaultContractAddress(): string {
    const isTestnet = this._coinConfig.name === 'txdc';
    return getValidatorContractAddress(isTestnet);
  }
}
