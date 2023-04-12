import { ISettlements, IAffirmations } from '../trading';
import { IWallet } from '../wallet';

export interface IEnterprise {
  url(query?: string): string;
  coinUrl(query?: string): string;
  coinWallets(params?: Record<string, never>): Promise<IWallet[]>;
  users(params?: Record<string, never>): Promise<any>;
  getFeeAddressBalance(params?: Record<string, never>): Promise<any>;
  addUser(params?: any): Promise<any>;
  removeUser(params?: any): Promise<any>;
  getFirstPendingTransaction(params?: Record<string, never>): Promise<any>;
  settlements(): ISettlements;
  affirmations(): IAffirmations;
  initiateChallengesForEcdsaSigning(): Promise<void>;
}
