import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey, Entry, TransactionRecipient } from '../baseCoin/iface';
import { InvalidTransactionError } from '../baseCoin/errors';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionExplanation, TxData } from './iface';
import utils from './utils';
import { KeyPair } from './keyPair';
import * as nearAPI from 'near-api-js';
import * as sha256 from 'js-sha256';
import base58 from 'bs58';

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
    this._id = utils.base58Encode(this.getTransactionHash());
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
  toJson(): TxData {
    if (!this._nearTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }

    return {
      id: this._id,
      signerId: this._nearTransaction.signerId,
      publicKey: this._nearTransaction.publicKey.toString(),
      nonce: this._nearTransaction.nonce,
      receiverId: this._nearTransaction.receiverId,
      actions: this._nearTransaction.actions,
      signature: typeof this._nearSignedTransaction === 'undefined' ? undefined : this._nearSignedTransaction.signature,
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
      this._id = utils.base58Encode(this.getTransactionHash());
    } catch (e) {
      try {
        this._nearTransaction = nearAPI.utils.serialize.deserialize(
          nearAPI.transactions.SCHEMA,
          nearAPI.transactions.Transaction,
          nearAPI.utils.serialize.base_decode(rawTransaction),
        );
        this._id = utils.base58Encode(this.getTransactionHash());
      } catch (e) {
        throw new InvalidTransactionError('unable to build transaction from raw');
      }
    }

    this.loadInputsAndOutputs();
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
    const serializedTxHash = this.getTransactionHash();
    const signature = signer.signMessageinUint8Array(serializedTxHash);
    this._nearSignedTransaction = new nearAPI.transactions.SignedTransaction({
      transaction: this._nearTransaction,
      signature: new nearAPI.transactions.Signature({
        keyType: this._nearTransaction.publicKey.keyType,
        data: signature,
      }),
    });
    this.loadInputsAndOutputs();
  }

  /**
   * Build input and output field for this transaction
   *
   */

  loadInputsAndOutputs(): void {
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

  /**
   * Returns a complete explanation for a transfer transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    return {
      ...explanationResult,
      outputs: [
        {
          address: json.receiverId,
          amount: json.actions[0].transfer.deposit.toString(),
        },
      ],
    };
  }

  /** @inheritdoc */
  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'];
    const outputs: TransactionRecipient[] = [];
    const explanationResult: TransactionExplanation = {
      // txhash used to identify the transactions
      id: result.id || '',
      displayOrder,
      outputAmount: result.actions[0].transfer.deposit.toString(),
      changeAmount: '0',
      changeOutputs: [],
      outputs,
      fee: { fee: '' },
      type: this.type,
    };
    switch (this.type) {
      case TransactionType.Send:
        return this.explainTransferTransaction(result, explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  private getTransactionHash(): Uint8Array {
    const serializedTx = nearAPI.utils.serialize.serialize(nearAPI.transactions.SCHEMA, this._nearTransaction);
    return new Uint8Array(sha256.sha256.array(serializedTx));
  }

  get signablePayload(): Buffer {
    if (!this._nearTransaction) {
      throw new InvalidTransactionError('empty transaction');
    }
    return Buffer.from(nearAPI.utils.serialize.serialize(nearAPI.transactions.SCHEMA, this._nearTransaction));
  }

  /**
   * Constructs a signed payload using construct.signTx
   * This method will be called during the build step if a TSS signature
   * is added and will set the signTransaction which is the txHex that will be broadcasted
   * As well as add the signature used to sign to the signature array in hex format
   *
   * @param {Buffer} signature The signature to be added to a dot transaction
   */
  constructSignedPayload(signature: Buffer): void {
    this._nearSignedTransaction = new nearAPI.transactions.SignedTransaction({
      transaction: this._nearTransaction,
      signature: new nearAPI.transactions.Signature({
        keyType: this._nearTransaction.publicKey.keyType,
        data: signature,
      }),
    });
    this.loadInputsAndOutputs();
  }
  /** @inheritdoc **/
  get signature(): string[] {
    const signatures: string[] = [];

    if (this._nearSignedTransaction) {
      signatures.push(base58.encode(this._nearSignedTransaction.signature.data));
    }

    return signatures;
  }
}
