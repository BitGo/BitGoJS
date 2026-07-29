import { PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, EndInvestorOnboardingOfferData } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';

/**
 * Builder for an EndInvestorOnboardingOffer txRequest — an internal, non-signable transaction
 * that records an on-chain EndInvestorOnboardingOffer contract on the end investor's wallet
 * so they can accept or reject. Built locally without an IMS call because the inviting
 * participant may be external (non-BitGo) and therefore not registered in BitGo's IMS.
 *
 * setTransaction and addSignature are intentionally not implemented because this
 * transaction type is never signed or broadcast directly.
 */
export class EndInvestorOnboardingOfferBuilder extends TransactionBuilder {
  private _contractId: string;
  private _endInvestorPartyId: string;
  private _participantPartyId: string;
  private _comment?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.EndInvestorOnboardingOffer;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.EndInvestorOnboardingOffer;
  }

  setTransaction(_transaction: CantonPrepareCommandResponse): void {
    throw new Error('Not implemented!');
  }

  /** @inheritDoc */
  addSignature(_publicKey: PublicKey, _signature: Buffer): void {
    throw new Error('Not implemented!');
  }

  /**
   * Sets the on-chain contractId of the EndInvestorOnboardingOffer.
   * Also sets the transaction id.
   * @param id - contract id (from pendingContractId)
   */
  contractId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('contractId must be a non-empty string');
    }
    this._contractId = id.trim();
    this.transaction.id = id.trim();
    return this;
  }

  /**
   * Sets the Canton party ID of the end investor being onboarded.
   * @param id - end investor party id
   */
  endInvestorPartyId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('endInvestorPartyId must be a non-empty string');
    }
    this._endInvestorPartyId = id.trim();
    return this;
  }

  /**
   * Sets the Canton party ID of the participant that created the offer.
   * @param id - participant party id (may be external to BitGo)
   */
  participantPartyId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('participantPartyId must be a non-empty string');
    }
    this._participantPartyId = id.trim();
    return this;
  }

  /**
   * Sets an optional free-form comment from the participant.
   * @param comment - comment string
   */
  comment(comment: string): this {
    this._comment = comment;
    return this;
  }

  /**
   * Builds and returns the EndInvestorOnboardingOfferData object from the builder's internal state.
   *
   * @returns {EndInvestorOnboardingOfferData} - A fully constructed and validated data object.
   * @throws {Error} If any required field is missing.
   */
  toRequestObject(): EndInvestorOnboardingOfferData {
    this.validate();
    const result: EndInvestorOnboardingOfferData = {
      contractId: this._contractId,
      endInvestorPartyId: this._endInvestorPartyId,
      participantPartyId: this._participantPartyId,
    };
    if (this._comment !== undefined) {
      result.comment = this._comment;
    }
    return result;
  }

  protected async buildImplementation(): Promise<Transaction> {
    this.validate();
    this.transaction.endInvestorOnboardingOfferData = this.toRequestObject();
    return this.transaction;
  }

  private validate(): void {
    if (!this._contractId) throw new Error('contractId is missing');
    if (!this._endInvestorPartyId) throw new Error('endInvestorPartyId is missing');
    if (!this._participantPartyId) throw new Error('participantPartyId is missing');
  }
}
