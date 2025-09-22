import { ParseTransactionOptions } from '@bitgo-beta/sdk-core';

export interface ExplainTransactionOptions {
  txHex: string;
}

export interface VetParseTransactionOptions extends ParseTransactionOptions {
  txHex: string;
}

export interface ClaimRewardsData {
  validatorAddress: string;
  delegatorAddress: string;
  delegationContractAddress?: string;
  claimBaseRewards?: boolean;
  claimStakingRewards?: boolean;
}
