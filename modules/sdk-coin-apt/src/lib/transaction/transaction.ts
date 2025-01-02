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
  Ed25519PublicKey,
  Ed25519Signature,
  generateUserTransactionHash,
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

  static DEFAULT_PUBLIC_KEY = Buffer.alloc(32);
  static DEFAULT_SIGNATURE = Buffer.alloc(64);

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
    // Cannot assign to 'sender' because it is a read-only property in RawTransaction.
    const { sequence_number, payload, max_gas_amount, gas_unit_price, expiration_timestamp_secs, chain_id } =
      this._rawTransaction;
    this._rawTransaction = new RawTransaction(
      AccountAddress.fromString(senderAddress),
      sequence_number,
      payload,
      max_gas_amount,
      gas_unit_price,
      expiration_timestamp_secs,
      chain_id
    );
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
    let publicKeyBuffer = Transaction.DEFAULT_PUBLIC_KEY;
    let signatureBuffer = Transaction.DEFAULT_SIGNATURE;
    if (this._signature && this._signature.publicKey && this._signature.signature) {
      publicKeyBuffer = Buffer.from(this._signature.publicKey.pub, 'hex');
      signatureBuffer = this._signature.signature;
    }
    const publicKey = new Ed25519PublicKey(publicKeyBuffer);
    const signature = new Ed25519Signature(signatureBuffer);
    const txnAuthenticator = new TransactionAuthenticatorEd25519(publicKey, signature);
    const signedTxn = new SignedTransaction(this._rawTransaction, txnAuthenticator);
    return signedTxn.toString();
  }

  abstract toJson(): TxData;

  addSignature(publicKey: PublicKey, signature: Buffer): void {
    const publicKeyBuffer = Buffer.from(publicKey.pub, 'hex');
    if (!Transaction.DEFAULT_PUBLIC_KEY.equals(publicKeyBuffer) && !Transaction.DEFAULT_SIGNATURE.equals(signature)) {
      this._signatures.push(signature.toString('hex'));
      this._signature = { publicKey, signature };
      this.serialize();
    }
  }

  async build(): Promise<void> {
    this.loadInputsAndOutputs();
    if (this._signature && this._signature.publicKey && this._signature.signature) {
      const transaction = new SimpleTransaction(this._rawTransaction);
      const publicKey = new Ed25519PublicKey(Buffer.from(this._signature.publicKey.pub, 'hex'));
      const signature = new Ed25519Signature(this._signature.signature);
      const senderAuthenticator = new AccountAuthenticatorEd25519(publicKey, signature);
      this._id = generateUserTransactionHash({ transaction, senderAuthenticator });
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
      const signedTxn = utils.deserializeSignedTransaction(rawTransaction);
      this._rawTransaction = signedTxn.raw_txn;

      this.loadInputsAndOutputs();

      const authenticator = signedTxn.authenticator as TransactionAuthenticatorEd25519;
      const publicKey = Buffer.from(authenticator.public_key.toUint8Array());
      const signature = Buffer.from(authenticator.signature.toUint8Array());
      this.addSignature({ pub: publicKey.toString() }, signature);
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
      return utils.deserializeRawTransaction(rawTransaction);
    } catch (e) {
      console.error('invalid raw transaction', e);
      throw new Error('invalid raw transaction');
    }
  }
}
