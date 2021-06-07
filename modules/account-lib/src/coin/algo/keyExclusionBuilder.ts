/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';

export class KeyExclusionBuilder extends TransactionBuilder {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const nonParticipation = true;
    this.transaction.setAlgoTransaction(
      algosdk.makeKeyRegistrationTxnWithSuggestedParams(
        this._sender,
        this._note,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        this.suggestedParams,
        this._reKeyTo,
        nonParticipation,
      ),
    );
    return await super.buildImplementation();
  }
}
