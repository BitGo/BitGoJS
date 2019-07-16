/**
 * @prettier
 */
import * as Bluebird from 'bluebird';

import { Lock } from './lock';
import { Payload } from './payload';

const co = Bluebird.coroutine;

export class Affirmation {
  private bitgo: any;

  public id: string;
  public partyAccountId: string;
  public status: AffirmationStatus;
  public settlement: string;
  public lock: Lock;
  public payload: string;
  public createdAt: Date;
  public expireAt: Date;

  constructor(affirmationData, bitgo) {
    this.bitgo = bitgo;

    this.updateAffirmationData(affirmationData);
  }

  /**
   * Affirms a pending affirmation, authorizing the settlement
   * @param payload payload authorizing the movement of funds from a trading account
   * @param signature signature of the payload with the user key of the trading account
   * @param callback
   */
  affirm(payload: Payload, signature: string, callback?): Bluebird<void> {
    const body = {
      payload: JSON.stringify(payload),
      signature: signature,
    };

    return this.updateStatus(AffirmationStatus.AFFIRMED, body, callback);
  }

  /**
   * Rejects a pending affirmation, cancelling the settlement
   * @param callback
   */
  reject(callback?): Bluebird<void> {
    return this.updateStatus(AffirmationStatus.REJECTED, null, callback);
  }

  /**
   * Cancels a pending affirmation, cancelling the settlement
   * @param callback
   */
  cancel(callback?): Bluebird<void> {
    return this.updateStatus(AffirmationStatus.CANCELED, null, callback);
  }

  private updateStatus(status: AffirmationStatus, body?, callback?): Bluebird<void> {
    return co(function* updateStatus() {
      const bodyWithStatus = { status, ...body };
      const url = this.bitgo.microservicesUrl(`/api/trade/v1/affirmations/${this.id}`);
      const response = yield this.bitgo
        .put(url)
        .send(bodyWithStatus)
        .result();
      this.updateAffirmationData(response);
    })
      .call(this)
      .asCallback(callback);
  }

  private updateAffirmationData(affirmationData) {
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

export enum AffirmationStatus {
  PENDING = 'pending',
  OVERDUE = 'overdue',
  REJECTED = 'rejected',
  AFFIRMED = 'affirmed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}
