import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey, Entry } from '../baseCoin/iface';
import { InvalidTransactionError } from '../baseCoin/errors';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { KeyPair } from './keyPair';
import * as nearAPI from 'near-api-js';
import * as sha256 from 'js-sha256';

export class Transaction extends BaseTransaction {
  private _nearTransaction: nearAPI.transactions.Transaction;
  private _nearSignedTransaction: nearAPI.transactions.SignedTransaction;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get nearTransaction(): nearAPI.transactions.Transaction {
    return this._nearTransaction;
  }

  set nearTransaction(tx: nearAPI.transactions.Transaction) {
    this._nearTransaction = tx;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    try {
      new KeyPair({ prv: key.key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._nearTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const txSeralized = this._nearSignedTransaction
      ? nearAPI.utils.serialize.base_encode(this._nearSignedTransaction.encode())
      : nearAPI.utils.serialize.base_encode(this._nearTransaction.encode());
    return txSeralized;
  }

  /** @inheritdoc */
  toJson(): any {
    if (!this._nearTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }

    return {
      signer_id: this._nearTransaction.signerId,
      public_key: this._nearTransaction.publicKey.toString(),
      nonce: this._nearTransaction.nonce,
      receiver_id: this._nearTransaction.receiverId,
      actions: this._nearTransaction.actions,
      signature: typeof this._nearSignedTransaction === 'undefined' ? '' : this._nearSignedTransaction.signature,
    };
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      const signedTx = nearAPI.utils.serialize.deserialize(
        nearAPI.transactions.SCHEMA,
        nearAPI.transactions.SignedTransaction,
        nearAPI.utils.serialize.base_decode(rawTransaction),
      );
      this._nearSignedTransaction = signedTx;
      this._nearTransaction = signedTx.transaction;
    } catch (e) {
      try {
        this._nearTransaction = nearAPI.utils.serialize.deserialize(
          nearAPI.transactions.SCHEMA,
          nearAPI.transactions.Transaction,
          nearAPI.utils.serialize.base_decode(rawTransaction),
        );
      } catch (e) {
        throw new InvalidTransactionError('unable to build transaction from raw');
      }
    }

    this.buildInputAndOutput();
  }

  /**
   * Sign this transaction
   *
   * @param {KeyPair} signer key
   */

  sign(signer: KeyPair): void {
    if (!this._nearTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }
    const serializedTx = nearAPI.utils.serialize.serialize(nearAPI.transactions.SCHEMA, this._nearTransaction);
    const serializedTxHash = new Uint8Array(sha256.sha256.array(serializedTx));
    const signature = signer.signMessageinUint8Array(serializedTxHash);
    this._nearSignedTransaction = new nearAPI.transactions.SignedTransaction({
      transaction: this._nearTransaction,
      signature: new nearAPI.transactions.Signature({
        keyType: this._nearTransaction.publicKey.keyType,
        data: signature,
      }),
    });
    this.buildInputAndOutput();
  }

  /**
   * Build input and output field for this transaction
   *
   */

  buildInputAndOutput(): void {
    if (this._nearTransaction.actions.length != 1) {
      throw new InvalidTransactionError('too many actions in raw transaction');
    }

    if (this._nearTransaction.actions[0].enum === 'transfer') {
      this.setTransactionType(TransactionType.Send);
    } else {
      throw new InvalidTransactionError('unsupported action in raw transaction');
    }

    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    switch (this.type) {
      case TransactionType.Send:
        const amount = nearAPI.utils.format.formatNearAmount(
          this._nearTransaction.actions[0].transfer.deposit.toString(),
        );

        inputs.push({
          address: this._nearTransaction.signerId,
          value: amount,
          coin: this._coinConfig.name,
        });
        outputs.push({
          address: this._nearTransaction.receiverId,
          value: amount,
          coin: this._coinConfig.name,
        });
        break;
    }
    this._outputs = outputs;
    this._inputs = inputs;
  }
}
