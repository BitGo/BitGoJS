import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
  TransactionRecipient,
} from '@bitgo/sdk-core';

/**
 * Interface for ABI input parameter
 */
export interface AbiInput {
  internalType: string;
  name: string;
  type: string;
}

/**
 * Interface for ABI output parameter
 */
export interface AbiOutput {
  internalType?: string;
  name?: string;
  type: string;
}

/**
 * Interface for ABI function definition
 */
export interface AbiFunction {
  inputs: AbiInput[];
  name: string;
  outputs: AbiOutput[];
  stateMutability: string;
  type: string;
}

/**
 * Type for contract ABI
 */
export type ContractAbi = AbiFunction[];

/**
 * The transaction data returned from the toJson() function of a transaction
 */
export interface VetTransactionData {
  id: string;
  chainTag: number;
  blockRef: string;
  expiration: number;
  gasPriceCoef: number;
  gas: number;
  dependsOn: string | null;
  nonce: string;
  sender?: string;
  feePayer?: string;
  recipients?: TransactionRecipient[];
  data?: string;
  value?: string;
  deployedAddress?: string;
  to?: string;
  tokenAddress?: string;
  tokenId?: string; // Added for unstaking and burn NFT transactions
  stakingContractAddress?: string;
  amountToStake?: string;
  nftCollectionId?: string;
}

export interface VetTransactionExplanation extends BaseTransactionExplanation {
  sender?: string;
  type?: BitGoTransactionType;
}
