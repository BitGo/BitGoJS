import { HalfSignedAccountTransaction } from '../baseCoin';
import {
  BaseGoStakeOptions,
  GoStakeOptions,
  GoStakingRequest,
  GoStakingRequestOptions,
  GoStakingRequestResults,
  GoStakingWalletObject,
  GoStakingWalletResults,
} from './goStakingInterfaces';

export type FrontTransferSendRequest = HalfSignedAccountTransaction;

export interface IGoStakingWallet {
  readonly accountId: string;
  stake(options: GoStakeOptions): Promise<GoStakingRequest>;
  unstake(options: BaseGoStakeOptions): Promise<GoStakingRequest>;
  getGoStakingRequest(stakingRequestId: string): Promise<GoStakingRequest>;
  getGoStakingRequestsByWalletCoin(options?: GoStakingRequestOptions): Promise<GoStakingRequestResults>;
  getGoStakingRequests(options?: GoStakingRequestOptions): Promise<GoStakingRequestResults>;
  getGoStakingWallets(options?: { page?: number; pageSize?: number }): Promise<GoStakingWalletResults>;
  getGoStakingWallet(): Promise<GoStakingWalletObject>;
}
