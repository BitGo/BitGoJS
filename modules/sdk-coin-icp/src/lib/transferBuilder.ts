import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { BaseTransaction } from '@bitgo/sdk-core';
import { TransferTransaction } from './transferTransaction';
import { IcpCombineApiPayload, IcpSignature, IcpTransaction, IcpUnsignedTransaction } from './iface';
import request from 'superagent';
import { Utils } from './utils';
import { KeyPair } from './keyPair';
import { ec as EC } from 'elliptic';
import crypto from 'crypto';

const PAYLOADS_API_PATH = '/construction/payloads';
const COMBINE_API_PATH = '/construction/combine';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new TransferTransaction(_coinConfig);
  }

  /** @inheritdoc */
  sign(): IcpSignature[] {
    const unsignedTransaction = this.getIcpUnsignedTransaction();
    const senderPublicKeyHex = this._transaction.icpTransaction.public_keys[0].hex_bytes;
    const compressedKey = Utils.compressPublicKey(senderPublicKeyHex);
    const keyPair = new KeyPair({ pub: compressedKey });
    const senderPrivateKey = keyPair.getKeys().prv;
    if (!senderPrivateKey) {
      throw new Error('Sender private key is undefined');
    }
    const signatures: IcpSignature[] = unsignedTransaction.payloads.map((payload) => ({
      signing_payload: payload,
      signature_type: payload.signature_type,
      public_key: {
        hex_bytes: senderPublicKeyHex,
        curve_type: Utils.getCurveType(),
      },
      hex_bytes: this.signPayload(payload.hex_bytes, senderPrivateKey),
    }));
    return signatures;
  }

  signPayload = (payloadHex: string, privateKey: string): string => {
    const ec = new EC('secp256k1');
    const key = ec.keyFromPrivate(privateKey);
    const payloadHash = crypto.createHash('sha256').update(Buffer.from(payloadHex, 'hex')).digest('hex');
    const signature = key.sign(payloadHash);
    const r = signature.r.toArray('be', 32);
    const s = signature.s.toArray('be', 32);
    return Buffer.concat([Buffer.from(r), Buffer.from(s)]).toString('hex');
  };

  /** @inheritdoc */
  protected async buildImplementation(): Promise<BaseTransaction> {
    throw new Error('method not implemented');
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   */
  initBuilder(): void {
    throw new Error('method not implemented');
  }

  /**
   * Build transfer programmable transaction
   *
   * @protected
   */
  protected async buildIcpTransaction(): Promise<void> {
    this.validateTransactionFields();
    const response = await this.consumePayloadsApi(this._transaction.icpTransaction);
    const parsedResponse: IcpUnsignedTransaction = response.body;
    this._unsignedTransaction = parsedResponse;
    const combineApiPayload = this.getIcpCombineApiPayload();
    const signedTransaction = await this.consumeCombineApi(combineApiPayload);
    return signedTransaction.body;
  }

  protected getIcpCombineApiPayload(): IcpCombineApiPayload {
    const signatures = this.sign();
    const combineApiPayload: IcpCombineApiPayload = {
      network_identifier: Utils.getNetworkIdentifier(),
      unsigned_transaction: this.getIcpUnsignedTransaction().unsigned_transaction,
      signatures,
    };
    this._combineApiPayload = combineApiPayload;
    return combineApiPayload;
  }

  private validateTransactionFields(): void {
    const senderAmount = this._transaction.icpTransaction.operations[0].amount.value;
    const receiverAmount = this._transaction.icpTransaction.operations[1].amount.value;
    if (senderAmount === receiverAmount) {
      throw new Error('Sender and receiver amounts are the same');
    }
  }

  private getIcpUnsignedTransaction(): IcpUnsignedTransaction {
    return this._unsignedTransaction;
  }

  /** @inheritdoc */
  fromImplementation(): BaseTransaction {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  get transaction(): BaseTransaction {
    throw new Error('method not implemented');
  }

  protected async consumePayloadsApi(payload: IcpTransaction): Promise<request.Response> {
    try {
      const apiUrl = Utils.getRosettaBaseUrl() + PAYLOADS_API_PATH;
      const response = await request.post(apiUrl).send(payload).set(Utils.getHeaders());
      if (response.status !== 200) {
        throw new Error(`Payloads API failed status ${response.status}: ${response.text}`);
      }
      return response;
    } catch (error) {
      throw new Error(`Error consuming Payloads API: ${error.message || error}`);
    }
  }

  protected async consumeCombineApi(payload: IcpCombineApiPayload): Promise<request.Response> {
    try {
      const apiUrl = Utils.getRosettaBaseUrl() + COMBINE_API_PATH;
      const response = await request.post(apiUrl).send(payload).set(Utils.getHeaders());
      if (response.status !== 200) {
        throw new Error(`Combine API failed status ${response.status}: ${response.text}`);
      }
      return response;
    } catch (error) {
      throw new Error(`Error consuming Combine API: ${error.message || error}`);
    }
  }
}
