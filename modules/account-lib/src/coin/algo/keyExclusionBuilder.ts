/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import { TransactionType } from '../baseCoin';
import { TransactionBuilder } from './transactionBuilder';

export class KeyExclusionBuilder extends TransactionBuilder {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  protected buildAlgoTxn(): algosdk.Transaction {
    const nonParticipation = true;
    return algosdk.makeKeyRegistrationTxnWithSuggestedParams(
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
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }
}
