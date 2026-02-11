import { ParseTransactionOptions } from '@bitgo/sdk-core';

export interface ExplainTransactionOptions {
  txHex: string;
}

export interface VetParseTransactionOptions extends ParseTransactionOptions {
  txHex: string;
}

export interface ClaimRewardsData {
  tokenId: string;
  stakingContractAddress?: string;
}

export type RecoverOptions = {
  userKey?: string;
  backupKey?: string;
  walletPassphrase?: string;
  recoveryDestination: string;
  isUnsignedSweep?: boolean; // specify if this is an unsigned recovery
  bitgoKey?: string;
  tokenContractAddress?: string;
};

export interface RecoveryTransaction {
  id: string | undefined;
  tx: string;
}

export interface UnsignedSweepRecoveryTransaction {
  txHex: string;
  coin: string;
}
