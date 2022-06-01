/**
 * @prettier
 */
import { BitGoBase } from '../bitgoBase';
import { Affirmation, ISettlement, SettlementStatus, SettlementType, Trade } from '../trading';

export class Settlement implements ISettlement {
  private readonly bitgo: BitGoBase;
  private readonly enterpriseId: string;

  public id: string;
  public requesterAccountId: string;
  public status: SettlementStatus;
  public type: SettlementType;
  public affirmations: Affirmation[];
  public createdAt: Date;
  public expireAt: Date;
  public settledAt: Date;
  public trades: Trade[];

  constructor(settlementData, bitgo, enterpriseId: string) {
    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;

    this.id = settlementData.id;
    this.requesterAccountId = settlementData.requesterAccountId;
    this.status = settlementData.status;
    this.type = settlementData.type;
    this.affirmations = settlementData.affirmations.map(
      (affirmation) => new Affirmation(affirmation, this.bitgo, this.enterpriseId)
    );
    this.createdAt = new Date(settlementData.createdAt);
    this.expireAt = new Date(settlementData.expireAt);
    this.settledAt = new Date(settlementData.settledAt);
    this.trades = settlementData.trades as Trade[];
  }
}
