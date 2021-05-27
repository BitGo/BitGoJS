/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import algosdk from 'algosdk';
import { InvalidTransactionError } from '../baseCoin/errors';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';

export class KeyExclusionBuilder extends TransactionBuilder {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const voteKey = undefined;
    const selectionKey = undefined;
    const voteFirst = undefined;
    const voteLast = undefined;
    const voteKeyDilution = undefined;
    const rekeyTo = undefined;
    const nonParticipation = true;
    this.transaction.setAlgoTransaction(
      algosdk.makeKeyRegistrationTxn(
        this._sender!,
        this._fee!,
        this._firstRound!,
        this._lastRound!,
        this._note!,
        this._genesisHash!,
        this._genesisId!,
        voteKey,
        selectionKey,
        voteFirst,
        voteLast,
        voteKeyDilution,
        rekeyTo,
        nonParticipation,
      ),
    );
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const algoTx = tx.getAlgoTransaction();
    if (!algoTx) {
      throw new InvalidTransactionError('Transaction is empty');
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    super.validateTransaction(transaction);
  }
}
