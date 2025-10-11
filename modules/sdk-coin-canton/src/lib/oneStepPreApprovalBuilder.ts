import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';

export class OneStepPreApprovalBuilder extends TransactionBuilder {
  private _partyId: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.OneStepPreApproval;
  }

  /**
   *
   */
  public partyId(partyId: string): this {
    this._partyId = partyId;
    return this;
  }
}
