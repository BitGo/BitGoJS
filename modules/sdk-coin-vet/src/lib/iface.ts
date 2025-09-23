import {
  TransactionExplanation as BaseTransactionExplanation,
  TransactionType as BitGoTransactionType,
  TransactionRecipient,
} from '@bitgo/sdk-core';
import { ClaimRewardsData } from './types';

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
  claimRewardsData?: ClaimRewardsData;
}

export interface VetTransactionExplanation extends BaseTransactionExplanation {
  sender?: string;
  type?: BitGoTransactionType;
  claimRewardsData?: ClaimRewardsData;
}
