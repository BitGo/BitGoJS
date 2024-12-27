import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  PublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { TransactionExplanation, TxData } from '../iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  AccountAddress,
  AccountAuthenticatorEd25519,
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  generateUserTransactionHash,
  Hex,
  RawTransaction,
  SignedTransaction,
  SimpleTransaction,
  TransactionAuthenticatorEd25519,
} from '@aptos-labs/ts-sdk';
import { UNAVAILABLE_TEXT } from '../constants';
import utils from '../utils';

export abstract class Transaction extends BaseTransaction {
  protected _rawTransaction: RawTransaction;
  protected _signature: Signature;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritDoc **/
  public get id(): string {
    return this._id ?? UNAVAILABLE_TEXT;
  }

  set transactionType(transactionType: TransactionType) {
    this._type = transactionType;
  }

  public get signablePayload(): Buffer {
    const rawTxnHex = this._rawTransaction.bcsToHex().toString();
    return Buffer.from(rawTxnHex, 'hex');
  }

  public get sender(): string {
    return this._rawTransaction.sender.toString();
  }

  set sender(senderAddress: string) {
    this._rawTransaction.sender = AccountAddress.fromString(senderAddress);
  }

  public get recipient(): TransactionRecipient {
    return utils.getRecipientFromTransactionPayload(this._rawTransaction.payload);
  }

  canSign(_key: BaseKey): boolean {
    return false;
  }

  toBroadcastFormat(): string {
    if (!this._rawTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  serialize(): string {
    if (!this._signature || !this._signature.publicKey || !this._signature.signature) {
      return this._rawTransaction.bcsToHex().toString();
    }
    const publicKey = new Ed25519PublicKey(Buffer.from(this._signature.publicKey.pub, 'hex'));
    const signature = new Ed25519Signature(this._signature.signature);
    const txnAuthenticator = new TransactionAuthenticatorEd25519(publicKey, signature);
    const signedTxn = new SignedTransaction(this._rawTransaction, txnAuthenticator);
    return signedTxn.bcsToHex().toString();
  }

  abstract toJson(): TxData;

  addSignature(publicKey: PublicKey, signature: Buffer): void {
    this._signatures.push(signature.toString('hex'));
    this._signature = { publicKey, signature };
    this.serialize();
  }

  async build(): Promise<void> {
    this.loadInputsAndOutputs();
    if (this._signature) {
      const publicKey = new Ed25519PublicKey(Buffer.from(this._signature.publicKey.pub, 'hex'));
      const signature = new Ed25519Signature(this._signature.signature);

      this._id = generateUserTransactionHash({
        transaction: new SimpleTransaction(this._rawTransaction),
        senderAuthenticator: new AccountAuthenticatorEd25519(publicKey, signature),
      });
    }
  }

  loadInputsAndOutputs(): void {
    const txRecipient = this.recipient;
    this._inputs = [
      {
        address: this.sender,
        value: txRecipient.amount as string,
        coin: this._coinConfig.name,
      },
    ];
    this._outputs = [
      {
        address: txRecipient.address,
        value: txRecipient.amount as string,
        coin: this._coinConfig.name,
      },
    ];
  }

  fromRawTransaction(rawTransaction: string): void {
    try {
      const txnBytes = Hex.fromHexString(rawTransaction).toUint8Array();
      const deserializer = new Deserializer(txnBytes);
      this._rawTransaction = deserializer.deserialize(RawTransaction);

      this.loadInputsAndOutputs();
    } catch (e) {
      console.error('invalid raw transaction', e);
      throw new Error('invalid raw transaction');
    }
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const displayOrder = ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'];

    const outputs: TransactionRecipient[] = [this.recipient];
    const outputAmount = outputs[0].amount;
    return {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount,
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: 'UNKNOWN' },
    };
  }

  static deserializeRawTransaction(rawTransaction: string): RawTransaction {
    try {
      const txnBytes = Hex.fromHexString(rawTransaction).toUint8Array();
      const deserializer = new Deserializer(txnBytes);
      return deserializer.deserialize(RawTransaction);
    } catch (e) {
      console.error('invalid raw transaction', e);
      throw new Error('invalid raw transaction');
    }
  }
}
