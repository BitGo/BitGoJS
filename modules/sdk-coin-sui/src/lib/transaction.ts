import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { PayTx, TransactionExplanation, TxData } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { bcs, decodeStr, encodeStr } from '@mysten/bcs';
import * as sha3 from 'js-sha3';

bcs
  .registerVectorType('vector<u8>', 'u8')
  .registerVectorType('vector<u64>', 'u64')
  .registerVectorType('vector<u128>', 'u128')
  .registerVectorType('vector<vector<u8>>', 'vector<u8>')
  .registerAddressType('ObjectID', 20)
  .registerAddressType('SuiAddress', 20)
  .registerAddressType('address', 20)
  .registerType(
    'utf8string',
    (writer, str) => {
      const bytes = Array.from(Buffer.from(str));
      return writer.writeVec(bytes, (writer, el) => writer.write8(el));
    },
    (reader) => {
      const bytes = reader.readVec((reader) => reader.read8());
      return Buffer.from(bytes).toString('utf-8');
    }
  )
  .registerType(
    'ObjectDigest',
    (writer, str) => {
      const bytes = Array.from(decodeStr(str, 'base64'));
      return writer.writeVec(bytes, (writer, el) => writer.write8(el));
    },
    (reader) => {
      const bytes = reader.readVec((reader) => reader.read8());
      return encodeStr(new Uint8Array(bytes), 'base64');
    }
  );

bcs.registerStructType('SuiObjectRef', {
  objectId: 'ObjectID',
  version: 'u64',
  digest: 'ObjectDigest',
});

bcs
  .registerVectorType('vector<SuiAddress>', 'SuiAddress')
  .registerVectorType('vector<SuiObjectRef>', 'SuiObjectRef')
  .registerStructType('PayTx', {
    coins: 'vector<SuiObjectRef>',
    recipients: 'vector<SuiAddress>',
    amounts: 'vector<u64>',
  });

bcs.registerEnumType('Transaction', {
  TransferObject: 'TransferObjectTx',
  Publish: 'PublishTx',
  Call: 'MoveCallTx',
  TransferSui: 'TransferSuiTx',
  Pay: 'PayTx',
});

bcs.registerVectorType('vector<Transaction>', 'Transaction').registerEnumType('TransactionKind', {
  Single: 'Transaction',
  Batch: 'vector<Transaction>',
});

bcs.registerStructType('TransactionData', {
  kind: 'TransactionKind',
  sender: 'SuiAddress',
  gasPayment: 'SuiObjectRef',
  gasPrice: 'u64',
  gasBudget: 'u64',
});

bcs.registerStructType('SenderSignedData', {
  data: 'TransactionData',
  txSignature: 'vector<u8>',
});

const UNAVAILABLE_TEXT = 'UNAVAILABLE';
export const TYPE_TAG = Array.from('TransactionData::').map((e) => e.charCodeAt(0));

export type SuiObjectRef = {
  /** Hex code as string representing the object id */
  objectId: string;
  /** Object version */
  version: number;
  /** Base64 string representing the object digest */
  digest: string;
};

export type SuiTransaction = {
  sender: string;
  payTx: PayTx;
  gasBudget: number;
  gasPrice: number;
  gasPayment: SuiObjectRef;
};

export class Transaction extends BaseTransaction {
  private _suiTransaction: SuiTransaction;
  private _signature: Signature;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): SuiTransaction {
    return this._suiTransaction;
  }

  setSuiTransaction(value: SuiTransaction): void {
    this._suiTransaction = value;
  }

  /** @inheritDoc **/
  get id(): string {
    return this._id || UNAVAILABLE_TEXT;
  }

  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push(signature.toString('hex'));
    this._signature = { publicKey, signature };
    this.serializeSignedTx(publicKey, signature);
  }

  get suiSignature(): Signature {
    return this._signature;
  }

  getInputCoins(): SuiObjectRef[] {
    return this.suiTransaction.payTx.coins;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._suiTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }

    return {
      id: this._id,
      gasBudget: this._suiTransaction.gasBudget,
      gasPrice: this._suiTransaction.gasPrice,
      payTx: this._suiTransaction.payTx,
      sender: this._suiTransaction.sender,
      gasPayment: this._suiTransaction.gasPayment,
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
      fee: { fee: this.suiTransaction.gasBudget.toString() },
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
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this.suiTransaction) {
      return;
    }

    const tx = this.suiTransaction;
    const payTx = tx.payTx;
    const recipients = payTx.recipients;
    const amounts = payTx.amounts;
    if (recipients.length !== amounts.length) {
      throw new Error('The length of recipients does not equal to the length of amounts');
    }

    const outputs: Entry[] = recipients.map((recipient, index) => ({
      address: recipient,
      value: amounts[index].toString(),
      coin: this._coinConfig.name,
    }));

    const totalAmount = amounts.reduce((accumulator, current) => accumulator + current, 0);
    this._inputs = [
      {
        address: tx.sender,
        value: totalAmount.toString(),
        coin: this._coinConfig.name,
      },
    ];
    this._outputs = outputs;
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      utils.isValidRawTransaction(rawTransaction);
      this._suiTransaction = Transaction.deserializeSuiTransaction(rawTransaction);
      this._type = TransactionType.Send;
      this.loadInputsAndOutputs();
    } catch (e) {
      throw e;
    }
  }

  private serializeSignedTx(publicKey: BasePublicKey, signature: Buffer): void {
    const suiTx = this._suiTransaction;
    const txData = {
      kind: { Single: { Pay: suiTx.payTx } },
      gasPayment: suiTx.gasPayment,
      gasPrice: suiTx.gasPrice,
      gasBudget: suiTx.gasBudget,
      sender: suiTx.sender,
    };
    const scheme = new Uint8Array([0x00]);
    const signatureBuffer = Buffer.concat([scheme, signature, Buffer.from(publicKey.pub)]);
    const signedTx = {
      data: txData,
      txSignature: signatureBuffer,
    };

    const serialized = bcs.ser('SenderSignedData', signedTx).toBytes();
    const typeTag = Array.from('SenderSignedData::').map((e) => e.charCodeAt(0));
    const serializedFinal = new Uint8Array(typeTag.length + serialized.length);
    serializedFinal.set(typeTag);
    serializedFinal.set(serialized, typeTag.length);
    this._id = Buffer.from(sha3.sha3_256(serializedFinal), 'hex').toString('base64');
  }

  serialize(): string {
    const suiTx = this._suiTransaction;
    const txData = {
      kind: { Single: { Pay: suiTx.payTx } },
      gasPayment: suiTx.gasPayment,
      gasPrice: suiTx.gasPrice,
      gasBudget: suiTx.gasBudget,
      sender: suiTx.sender,
    };

    const dataBytes = bcs.ser('TransactionData', txData).toBytes();
    const serialized = new Uint8Array(TYPE_TAG.length + dataBytes.length);
    serialized.set(TYPE_TAG);
    serialized.set(dataBytes, TYPE_TAG.length);
    if (this._signature !== undefined) {
      this.serializeSignedTx(this._signature.publicKey, this._signature.signature);
    }
    return Buffer.from(serialized).toString('hex');
  }

  static deserializeSuiTransaction(serializedHex: string): SuiTransaction {
    const data = Buffer.from(serializedHex, 'hex');
    const trimmedData = new Uint8Array(data.subarray(TYPE_TAG.length));
    const k = bcs.de('TransactionData', trimmedData);
    this.updateProperTransactionData(k);

    return {
      sender: k.sender,
      payTx: k.kind.Single.Pay,
      gasBudget: k.gasBudget.toNumber(),
      gasPrice: k.gasPrice.toNumber(),
      gasPayment: k.gasPayment,
    };
  }

  static updateProperTransactionData(k: any): void {
    // bcs deserialized number into Big Number and removed '0x' prefix from addresses, needs to convert them back
    k.kind.Single.Pay.amounts = k.kind.Single.Pay.amounts.map((amount) => amount.toNumber());
    k.kind.Single.Pay.coins = k.kind.Single.Pay.coins.map((coin): SuiObjectRef => {
      return {
        objectId: utils.normalizeHexId(coin.objectId),
        version: coin.version.toNumber(),
        digest: coin.digest,
      };
    });
    k.kind.Single.Pay.recipients = k.kind.Single.Pay.recipients.map((recipient) => utils.normalizeHexId(recipient));
    k.gasPayment.objectId = utils.normalizeHexId(k.gasPayment.objectId);
    k.gasPayment.version = k.gasPayment.version.toNumber();
    k.sender = utils.normalizeHexId(k.sender);
  }

  /**
   * Returns a complete explanation for a transfer transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const recipients = this.suiTransaction.payTx.recipients;
    const amounts = this.suiTransaction.payTx.amounts;

    const outputs: TransactionRecipient[] = recipients.map((recipient, index) => ({
      address: recipient,
      amount: amounts[index].toString(),
    }));
    const outputAmount = amounts.reduce((accumulator, current) => accumulator + current, 0);

    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }
}
