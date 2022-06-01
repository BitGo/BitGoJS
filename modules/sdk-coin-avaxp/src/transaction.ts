import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction, TransactionType } from '@bitgo/sdk-core/src/account-lib/baseCoin';
import { BaseKey } from '@bitgo/sdk-core/src/account-lib/baseCoin/iface';
import { NotImplementedError, SigningError } from '@bitgo/sdk-core/src/account-lib/baseCoin/errors';
import { KeyPair } from './keyPair';
import { TxData } from './iface';
import { UnsignedTx } from 'avalanche/dist/apis/platformvm/tx';
import { BaseTx } from 'avalanche/dist/apis/platformvm/basetx';

export class Transaction extends BaseTransaction {
  protected _avaxpTransaction!: UnsignedTx;
  protected _avaxpBaseTransaction!: BaseTx;
  private _sender!: string;
  protected _type: TransactionType;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    throw new NotImplementedError('canSign not implemented');
  }

  /**
   * Sign a avaxp transaction and update the transaction hex
   *
   * @param {KeyPair} keyPair
   */
  sign(keyPair: KeyPair): void {
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    throw new NotImplementedError('Sign not implemented');
  }

  sender(sender: string): void {
    this._sender = sender;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    throw new NotImplementedError('toBroadcastFormat not implemented');
  }

  // types - stakingTransaction, import, export
  /** @inheritdoc */
  toJson(): TxData {
    throw new NotImplementedError('toJson not implemented');
  }

  setTransaction(tx: UnsignedTx): void {
    this._avaxpTransaction = tx;
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }
}
