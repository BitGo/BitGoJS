import BigNumber from 'bignumber.js';
import { BaseKeyPair, BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BufferReader,
  PayloadType,
  StacksTransaction,
  TransactionSigner,
  createStacksPrivateKey,
  deserializeTransaction,
  addressToString,
} from '@stacks/transactions';
import { SignatureData, TxData } from './iface';
import { SigningError } from '../baseCoin/errors';
import { getTxSenderAddress, bufferToHexPrefixString, removeHexPrefix } from './utils';
import { KeyPair } from './';

export class Transaction extends BaseTransaction {

  private _stxTransaction: StacksTransaction;
  protected _type: TransactionType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  async sign(keyPair: KeyPair): Promise<void> {
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    const privKey = createStacksPrivateKey(keys.prv);
    const signer = new TransactionSigner(this._stxTransaction);
    signer.signOrigin(privKey);
  }

  async signWithSignatures(signature: SignatureData): Promise<void> {
    if (!signature) {
      throw new SigningError('Missing signatures');
    }
    this._stxTransaction = this._stxTransaction.createTxWithSignature(signature.data);
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    return bufferToHexPrefixString(this._stxTransaction.serialize());
  }

  /** @inheritdoc */
  toJson(): any {
    const result: TxData = {
      id: this._stxTransaction.txid(),
      fee: new BigNumber(this._stxTransaction.auth.getFee().toString()).toNumber(),
      from: getTxSenderAddress(this._stxTransaction),
      payload: { payloadType: this._stxTransaction.payload.payloadType },
    };

    if (this._stxTransaction.payload.payloadType == PayloadType.TokenTransfer) {
      const payload = this._stxTransaction.payload;
      result.payload.memo = payload.memo.content;
      result.payload.to = addressToString({
        type: 0,
        version: payload.recipient.address.version,
        hash160: payload.recipient.address.hash160.toString(),
      });
      result.payload.amount = payload.amount.toString();
    }
  }

  get stxTransaction(): StacksTransaction {
    return this._stxTransaction;
  }

  set stxTransaction(t: StacksTransaction) {
    this._stxTransaction = t;
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   * @param {Payload} payload transaction payload
   */
  fromRawTransaction(rawTransaction: string) {
    const raw = removeHexPrefix(rawTransaction);
    this._stxTransaction = deserializeTransaction(BufferReader.fromBuffer(Buffer.from(raw, 'hex')));
    this.loadInputsAndOutputs();
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Load the input and output data on this transaction using the transaction json
   * if there are outputs.
   */
  loadInputsAndOutputs(): void {
    const txJson = this.toJson();
    if (txJson.payload.to && txJson.payload.amount) {
      this._outputs = [
        {
          address: txJson.payload.to,
          value: txJson.payload.amount,
          coin: this._coinConfig.name,
        },
      ];

      this._inputs = [
        {
          address: txJson.from,
          value: txJson.payload.amount,
          coin: this._coinConfig.name,
        },
      ];
    }
  }
}
