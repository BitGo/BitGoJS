import { IWallet } from './iWallet';
import { IAffirmations, ISettlements } from './trading';

export interface IEnterprise {
  url(query: undefined): string;
  coinUrl(query: undefined): string;
  coinWallets(params: Record<string, never>): Promise<IWallet[]>;
  users(params: Record<string, never>): Promise<any>;
  getFeeAddressBalance(params: Record<string, never>): Promise<any>;
  addUser(params: any): Promise<any>;
  removeUser(params: any): Promise<any>;
  getFirstPendingTransaction(params: Record<string, never>): Promise<any>;
  settlements(): ISettlements;
  affirmations(): IAffirmations;
}
