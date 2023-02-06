import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { AtomTransaction, TransactionExplanation, TxData } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Buffer } from 'buffer';
import { AtomTransactionType, sendMsgType } from './constants';
import utils from './utils';
import { encodePubkey, makeSignBytes } from '@cosmjs/proto-signing';
import { encodeSecp256k1Pubkey } from '@cosmjs/amino';

export class Transaction extends BaseTransaction {
  private _atomTransaction: AtomTransaction;
  private _signature: Signature;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get atomTransaction(): AtomTransaction {
    return this._atomTransaction;
  }

  setAtomTransaction(tx: AtomTransaction): void {
    this._atomTransaction = tx;
  }

  /** @inheritDoc **/
  get id(): string {
    return this._id || 'UNAVAILABLE_TEXT';
  }

  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push(signature.toString('hex'));
    this._signature = { publicKey, signature };
    this.serialize();
  }

  get atomSignature(): Signature {
    return this._signature;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._atomTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._atomTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    const tx = this._atomTransaction;
    return {
      id: this._id,
      type: tx.type,
      signerAddress: tx.signerAddress,
      explicitSignerData: tx.explicitSignerData,
      sendMessages: tx.sendMessages,
      gasBudget: tx.gasBudget,
    };
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'];
    const outputs: TransactionRecipient[] = [];

    const explanationResult: TransactionExplanation = {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount: '0',
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this.atomTransaction.gasBudget.gas.toString() }, // TODO - explore the fee explanation more, do we need to show limit or base amount
      type: this.type,
    };

    switch (this.type) {
      case TransactionType.Send:
        return this.explainTransferTransaction(result, explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  transactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      this._atomTransaction = Transaction.deserializeAtomTransaction(rawTransaction);
      this._type = TransactionType.Send;
    } catch (e) {
      throw e;
    }
  }

  serialize(): string {
    const pubkey = encodePubkey(
      encodeSecp256k1Pubkey(Buffer.from(this._atomTransaction.sendMessages[0].value.fromAddress, 'hex'))
    ) as unknown as string;
    const signDoc = utils.createSignDocFromAtomTransaction(pubkey, this.atomTransaction);
    if (!this._signature) {
      // no signature yet, get the signable bytes
      const signableBytes = makeSignBytes(signDoc);
      const signableBytesBuffer = Buffer.from(signableBytes);
      return signableBytesBuffer.toString('base64');
    }
    // If we do have signatures, add them and return the base64 serialized signed tx data
    const signedRawTx = utils.createSignedTxRaw(pubkey, signDoc, this.signature[0]);
    return utils.createBase64SignedTxBytesFromSignedTxRaw(signedRawTx);
  }

  static deserializeAtomTransaction(rawTx: string): AtomTransaction {
    const decodedTx = utils.getDecodedTxFromRawBase64(rawTx);
    let type: AtomTransactionType;
    const typeUrl = utils.getTypeUrlFromDecodedTx(decodedTx);
    if (typeUrl === sendMsgType) {
      type = AtomTransactionType.Pay;
    } else {
      throw new Error('Transaction type not supported: ' + typeUrl);
    }
    const sendMessageData = utils.getMessageDataFromDecodedTx(decodedTx);
    const explicitSignerData = utils.getExplicitSignerDataFromDecodedTx(decodedTx);
    const gasBudget = utils.getGasBudgetFromDecodedTx(decodedTx);
    return {
      type,
      sendMessages: sendMessageData,
      signerAddress: sendMessageData[0].value.fromAddress,
      gasBudget,
      explicitSignerData,
    };
  }

  /**
   * Returns a complete explanation for a transfer transaction
   * Currently only supports one message per transfer.
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const outputAmount = this._atomTransaction.sendMessages[0].value.amount[0].amount;
    const outputs: TransactionRecipient[] = [
      {
        address: this._atomTransaction.sendMessages[0].value.toAddress,
        amount: outputAmount,
      },
    ];
    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }
}
