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

export type RecoverOptions = {
  userKey: string;
  backupKey: string;
  walletPassphrase?: string;
  walletContractAddress: string; // use this as walletBaseAddress for TSS
  recoveryDestination: string;
  isUnsignedSweep?: boolean; // specify if this is an unsigned recovery
};

export interface RecoveryTransaction {
  id: string;
  tx: string;
}

export interface UnsignedSweepRecoveryTransaction {
  txHex: string;
  coin: string;
}
