import { HalfSignedAccountTransaction } from '../baseCoin';

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
  amount: string;
  clientId?: string;
  type: 'STAKE' | 'UNSTAKE';
  coin: string;
  status: string;
  goSpecificStatus: string;
  error?: string;
  rawError?: string;
  statusModifiedDate: string;
  createdDate: string;
}

interface BaseGoStakeOptions {
  amount: string;
  clientId?: string;
}

export type GoStakeOptions = BaseGoStakeOptions;
export type GoUnstakeOptions = BaseGoStakeOptions;

export interface GoStakeFinalizeOptions extends BaseGoStakeOptions {
  frontTransferSendRequest: FrontTransferSendRequest;
}

export interface GoStakeUnsignedFinalizeOptions extends BaseGoStakeOptions {
  payload: string;
}

export type FrontTransferSendRequest = HalfSignedAccountTransaction;

export interface IGoStakingWallet {
  readonly accountId: string;
  stake(coin: string, options: GoStakeOptions): Promise<GoStakingRequest>;
  unstake(coin: string, options: GoUnstakeOptions): Promise<GoStakingRequest>;
  getGoStakingRequest(coin: string, stakingRequestId: string): Promise<GoStakingRequest>;
}
