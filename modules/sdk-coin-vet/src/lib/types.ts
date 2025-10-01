import { ParseTransactionOptions } from '@bitgo/sdk-core';

export interface ExplainTransactionOptions {
  txHex: string;
}

export interface VetParseTransactionOptions extends ParseTransactionOptions {
  txHex: string;
}

export interface ClaimRewardsData {
  tokenId: string;
  delegationContractAddress?: string;
  stargateNftAddress?: string;
  claimBaseRewards?: boolean;
  claimStakingRewards?: boolean;
}
