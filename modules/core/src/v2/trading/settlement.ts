/**
 * @prettier
 */
import { Trade } from './trade';
import { Affirmation } from './affirmation';

export class Settlement {
  private bitgo: any;

  public id: string;
  public requesterAccountId: string;
  public status: SettlementStatus;
  public affirmations: Affirmation[];
  public createdAt: Date;
  public expireAt: Date;
  public settledAt: Date;
  public trades: Trade[];

  constructor(settlementData, bitgo) {
    this.bitgo = bitgo;

    this.id = settlementData.id;
    this.requesterAccountId = settlementData.requesterAccountId;
    this.status = settlementData.status;
    this.affirmations = settlementData.affirmations.map(affirmation => new Affirmation(affirmation, this.bitgo));
    this.createdAt = new Date(settlementData.createdAt);
    this.expireAt = new Date(settlementData.expireAt);
    this.settledAt = new Date(settlementData.settledAt);
    this.trades = settlementData.trades as Trade[];
  }
}

export enum SettlementStatus {
  CANCELED = 'canceled',
  PENDING = 'pending',
  REJECTED = 'rejected',
  SETTLED = 'settled',
  FAILED = 'failed',
}
