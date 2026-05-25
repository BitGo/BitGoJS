import { FrontTransferSendRequest } from './iGoStakingWallet';

export interface UnsignedGoStakingRequest {
  payload: string;
  coin: string;
  token: string;
  feeInfo: FeeInfo;
}

interface FeeInfo {
  feeString: string;
}

export interface GoStakingRequest {
  id: string;
  clientId?: string;
  goAccountId: string;
  amount: string;
  type: 'STAKE' | 'UNSTAKE';
  coin: string;
  status: string;
  error?: string;
  statusModifiedDate: string;
  createdDate: string;
  properties?: GoStakingRequestProperties;
}

interface GoStakingRequestProperties {
  amount: string;
}

export interface GoStakeOptions {
  amount: string;
  clientId?: string;
  walletPassphrase: string;
}

export interface BaseGoStakeOptions {
  amount: string;
  clientId?: string;
}

export interface GoStakeFinalizeOptions extends BaseGoStakeOptions {
  frontTransferSendRequest: FrontTransferSendRequest;
}

export interface GoStakingRequestOptions {
  status?: string;
  page?: number;
  pageSize?: number;
  createdDateGte?: string;
  createdDateLt?: string;
  sortBy?: string;
}

export interface GoStakingRequestResults {
  requests: GoStakingRequest[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export interface GoStakingWalletResults {
  coins: GoStakingWalletObject[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export interface StakingPermissionAttributes {
  enabled: boolean;
  disabledReason?: string;
  allowClientToUseOwnValidator: boolean;
}

export interface UnstakingPermissionAttributes {
  enabled: boolean;
  disabledReason?: string;
}

export interface WalletPermissionAttributes {
  useValidatorList: boolean;
  allowPartialUnstake: boolean;
  validatorNotNeededForStake: boolean;
}

export interface PermissionAttributes {
  staking: StakingPermissionAttributes;
  unstaking: UnstakingPermissionAttributes;
  wallet: WalletPermissionAttributes;
}

export interface StakingSpendableAttributes {
  fee: string;
  max: string;
  min: string;
  netMax: string;
  netMin: string;
  minStakeMore: string;
  minDuration?: string;
  maxDuration?: string;
}

export interface UnstakingSpendableAttributes {
  fee?: string;
  max?: string;
  min?: string;
  multipleDelegations: boolean;
  requiresAmount: boolean;
  requiresDelegationId: boolean;
  requiresDelegationIds: boolean;
}

export interface SpendableAttributes {
  staking: StakingSpendableAttributes;
  unstaking: UnstakingSpendableAttributes;
}

export interface StakingDisclaimer {
  info: string[];
  rewardPercentageRate?: string;
  stakeWarmupPeriodDesc?: string;
}

export interface UnstakingDisclaimer {
  info: string[];
  unStakeCooldownPeriodDesc?: string;
}

export interface NextRewardsDisclaimer {
  rewardCycle: number;
}

export interface DisclaimerAttributes {
  staking: StakingDisclaimer;
  unstaking: UnstakingDisclaimer;
  nextRewards?: NextRewardsDisclaimer;
}

export interface GoStakingAttributes {
  permissionAttributes: PermissionAttributes;
  spendableAttributes: SpendableAttributes;
  disclaimerAttributes: DisclaimerAttributes;
}

export interface GoStakingWalletObject {
  coin: string;
  activeStake: string;
  pendingStake: string;
  pendingUnstake: string;
  rewards: string;
  attributes: GoStakingAttributes;
}
