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

export type FrontTransferSendRequest = HalfSignedAccountTransaction;

export interface IGoStakingWallet {
  readonly accountId: string;
  stake(options: GoStakeOptions): Promise<GoStakingRequest>;
  unstake(options: BaseGoStakeOptions): Promise<GoStakingRequest>;
  getGoStakingRequest(stakingRequestId: string): Promise<GoStakingRequest>;
}
