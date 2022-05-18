import { ISettlement } from './iSettlement';
import { Payload } from './payload';
import { Trade } from './trade';

export interface CreateSettlementParams {
  requesterAccountId: string;
  payload: Payload;
  signature: string;
  trades: Trade[];
}

export interface GetOptions {
  id: string;
  accountId: string;
}

export interface ISettlements {
  list(): Promise<ISettlement[]>;
  get(options: GetOptions): Promise<ISettlement>;
  create(params: CreateSettlementParams): Promise<ISettlement>;
}
