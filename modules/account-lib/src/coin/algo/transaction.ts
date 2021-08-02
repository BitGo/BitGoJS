import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';

export class Transaction extends BaseTransaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    throw new NotImplementedError('canSign not implemented');
  }

  estimateSize(): number {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }

    return this._algoTransaction.estimateSize();
  }

  /** @inheritdoc */
  toBroadcastFormat(): Uint8Array {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._signedTransaction && this._signedTransaction.length > 0) {
      return this._signedTransaction;
    } else {
      return algosdk.encodeUnsignedTransaction(this._algoTransaction);
    }
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const result: TxData = {
      id: this._algoTransaction.txID(),
      type: this._algoTransaction.type?.toString(),
      from: algosdk.encodeAddress(this._algoTransaction.from.publicKey),
      fee: this._algoTransaction.fee,
      firstRound: this._algoTransaction.firstRound,
      lastRound: this._algoTransaction.lastRound,
      note: this._algoTransaction.note,
      tokenId: this._algoTransaction?.assetIndex,
      genesisID: this._algoTransaction.genesisID,
      genesisHash: this._algoTransaction.genesisHash.toString('base64'),
    };
    if (this._algoTransaction.closeRemainderTo) {
      result.closeRemainderTo = algosdk.encodeAddress(this._algoTransaction.closeRemainderTo.publicKey);
    }
    if (this.type === TransactionType.Send) {
      result.to = algosdk.encodeAddress(this._algoTransaction.to.publicKey);
      result.amount = this._algoTransaction.amount.toString();
    }
    if (this.type === TransactionType.WalletInitialization) {
      if (!this._algoTransaction.nonParticipation) {
        result.voteKey = this._algoTransaction.voteKey.toString('base64');
        result.selectionKey = this._algoTransaction.selectionKey.toString('base64');
        result.voteFirst = this._algoTransaction.voteFirst;
        result.voteLast = this._algoTransaction.voteLast;
        result.voteKeyDilution = this._algoTransaction.voteKeyDilution;
      } else {
        result.nonParticipation = this._algoTransaction.nonParticipation;
      }
    }
    return result;
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this._algoTransaction) {
      return;
    }
    if (this.type === TransactionType.Send) {
      this._outputs = [
        {
          address: algosdk.encodeAddress(this._algoTransaction.to.publicKey),
          value: this._algoTransaction.amount.toString(),
          coin: this._coinConfig.name,
        },
      ];

      this._inputs = [
        {
          address: algosdk.encodeAddress(this._algoTransaction.from.publicKey),
          value: this._algoTransaction.amount.toString(),
          coin: this._coinConfig.name,
        },
      ];
    }
  }
}
