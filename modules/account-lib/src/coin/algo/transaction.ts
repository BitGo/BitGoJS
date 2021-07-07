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

  /** @inheritdoc */
  toBroadcastFormat(): string {
    throw new NotImplementedError('toBroadcastFormat not implemented');
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._algoTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const result: TxData = {
      id: this._algoTransaction.txID(),
      from: algosdk.encodeAddress(this._algoTransaction.from.publicKey),
      fee: this._algoTransaction.fee,
      firstRound: this._algoTransaction.firstRound,
      lastRound: this._algoTransaction.lastRound,
      note: this._algoTransaction.note,
      tokenId: this._algoTransaction?.assetIndex,
      genesisID: this._algoTransaction.genesisID,
      genesisHash: this._algoTransaction.genesisHash,
    };
    if (this.type === TransactionType.Send) {
      result.to = algosdk.encodeAddress(this._algoTransaction.to.publicKey);
      result.amount = this._algoTransaction.amount.toString();
    }
    if (this.type === TransactionType.WalletInitialization) {
      result.voteKey = this._algoTransaction.voteKey.toString('base64');
      result.selectionKey = this._algoTransaction.selectionKey.toString('base64');
      result.voteFirst = this._algoTransaction.voteFirst;
      result.voteLast = this._algoTransaction.voteLast;
      result.voteKeyDilution = this._algoTransaction.voteKeyDilution;
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
