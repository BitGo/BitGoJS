/**
 * @prettier
 */
import { BitGoBase } from '../bitgoBase';
import { AffirmationStatus, IAffirmation, Lock, Payload } from '../trading';

export class Affirmation implements IAffirmation {
  private bitgo: BitGoBase;
  private enterpriseId: string;

  public id?: string;
  public partyAccountId?: string;
  public status?: AffirmationStatus;
  public settlement?: string;
  public lock?: Lock;
  public payload?: string;
  public createdAt?: Date;
  public expireAt?: Date;

  constructor(affirmationData: any, bitgo: BitGoBase, enterpriseId: string) {
    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;

    this.updateAffirmationData(affirmationData);
  }

  /**
   * Affirms a pending affirmation, authorizing the settlement
   * @param payload payload authorizing the movement of funds from a trading account
   * @param signature signature of the payload with the user key of the trading account
   */
  async affirm(payload: Payload, signature: string): Promise<void> {
    const body = {
      payload: JSON.stringify(payload),
      signature: signature,
    };

    return await this.updateStatus(AffirmationStatus.AFFIRMED, body);
  }

  /**
   * Rejects a pending affirmation, cancelling the settlement
   */
  async reject(): Promise<void> {
    return this.updateStatus(AffirmationStatus.REJECTED, null);
  }

  /**
   * Cancels a pending affirmation, cancelling the settlement
   */
  async cancel(): Promise<void> {
    return this.updateStatus(AffirmationStatus.CANCELED, null);
  }

  private async updateStatus(status: AffirmationStatus, body?: any): Promise<void> {
    const bodyWithStatus = { status, ...body };
    const url = this.bitgo.microservicesUrl(
      `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.partyAccountId}/affirmations/${this.id}`
    );
    const response = await this.bitgo.put(url).send(bodyWithStatus).result();
    this.updateAffirmationData(response);
  }

  private updateAffirmationData(affirmationData: any) {
    this.id = affirmationData.id;
    this.partyAccountId = affirmationData.partyAccountId;
    this.status = affirmationData.status;
    this.settlement = affirmationData.settlement;
    this.lock = affirmationData.lock as Lock;
    this.payload = affirmationData.payload;
    this.createdAt = new Date(affirmationData.createdAt);
    this.expireAt = new Date(affirmationData.expireAt);
  }
}
