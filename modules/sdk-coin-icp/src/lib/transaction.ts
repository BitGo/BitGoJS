import {
  BaseKey,
  BaseTransaction,
  TransactionRecipient,
  TransactionType,
  InvalidTransactionError,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  IcpTransaction,
  IcpTransactionData,
  PayloadsData,
  OperationType,
  Signatures,
  TxData,
  IcpTransactionExplanation,
  SignedTransactionRequest,
  Network,
} from './iface';
import { Utils } from './utils';
import { KeyPair } from './keyPair';

export class Transaction extends BaseTransaction {
  protected _icpTransactionData: IcpTransactionData;
  protected _icpTransaction: IcpTransaction;
  protected _payloadsData: PayloadsData;
  protected _signedTransaction: string;
  protected _signaturePayload: Signatures[];
  protected _utils: Utils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig);
    this._utils = utils;
  }

  get icpTransactionData(): IcpTransactionData {
    return this._icpTransactionData;
  }

  set icpTransactionData(icpTransactionData: IcpTransactionData) {
    this._icpTransactionData = icpTransactionData;
  }

  get icpTransaction(): IcpTransaction {
    return this._icpTransaction;
  }

  set icpTransaction(icpTransaction: IcpTransaction) {
    this._icpTransaction = icpTransaction;
  }

  get unsignedTransaction(): string {
    return this._payloadsData.unsigned_transaction;
  }

  get signaturePayload(): Signatures[] {
    return this._signaturePayload;
  }

  set signedTransaction(signature: string) {
    this._signedTransaction = signature;
  }

  get signedTransaction(): string {
    return this._signedTransaction;
  }

  set payloadsData(payloadsData: PayloadsData) {
    this._payloadsData = payloadsData;
  }

  get payloadsData(): PayloadsData {
    return this._payloadsData;
  }

  fromRawTransaction(rawTransaction: string): void {
    try {
      const parsedTx = JSON.parse(rawTransaction);
      switch (parsedTx.type) {
        case OperationType.TRANSACTION:
          this._icpTransactionData = {
            senderAddress: parsedTx.address,
            receiverAddress: parsedTx.externalOutputs[0].address,
            amount: parsedTx.spendAmountString,
            fee: parsedTx.fee,
            senderPublicKeyHex: parsedTx.senderKey,
            memo: parsedTx.seqno,
            transactionType: parsedTx.type,
            expiryTime: parsedTx.expiryTime,
          };
          this._utils.validateRawTransaction(this._icpTransactionData);
          break;
        default:
          throw new Error('Invalid transaction type');
      }
    } catch (error) {
      throw new InvalidTransactionError('Invalid raw transaction');
    }
  }

  addSignature(signaturePayloads: Signatures[]): void {
    if (!signaturePayloads) {
      throw new Error('signatures not provided');
    }
    if (signaturePayloads.length !== this._payloadsData.payloads.length) {
      throw new Error('signatures length is not matching');
    }
    this._signaturePayload = signaturePayloads;
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._icpTransactionData) {
      throw new InvalidTransactionError('Empty transaction');
    }
    switch (this._icpTransactionData.transactionType) {
      case OperationType.TRANSACTION:
        return {
          id: this._id,
          sender: this._icpTransactionData.senderAddress,
          senderPublicKey: this._icpTransactionData.senderPublicKeyHex,
          recipient: this._icpTransactionData.receiverAddress,
          memo: this._icpTransactionData.memo,
          feeAmount: this._icpTransactionData.fee,
          expirationTime: this._icpTransactionData.expiryTime,
          type: BitGoTransactionType.Send,
        };
      default:
        throw new Error('Unsupported transaction type');
    }
  }

  /** @inheritDoc */
  explainTransaction(): IcpTransactionExplanation {
    const result = this.toJson();
    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];
    const outputs: TransactionRecipient[] = [];

    const explanationResult = {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount: '0',
      fee: { fee: '0' },
      type: result.type,
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account based does not make change
    };

    switch (explanationResult.type) {
      case TransactionType.Send:
        return this.explainTransferTransaction(explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  /**
   * Explains a transfer transaction by providing details about the recipients and the total output amount.
   *
   * @param {IcpTransactionExplanation} explanationResult - The initial explanation result to be extended.
   * @returns {IcpTransactionExplanation} The extended explanation result including the output amount and recipients.
   */
  explainTransferTransaction(explanationResult: IcpTransactionExplanation): IcpTransactionExplanation {
    explanationResult.fee = { fee: this.icpTransactionData.fee };
    const recipients = this._utils.getRecipients(this.icpTransactionData);
    const outputs: TransactionRecipient[] = [recipients];
    const outputAmountBN = recipients.amount;
    const outputAmount = outputAmountBN.toString();

    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._signedTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  serialize(): string {
    const transaction: SignedTransactionRequest = {
      signed_transaction: this._signedTransaction,
      network_identifier: {
        blockchain: this._coinConfig.fullName,
        network: Network.ID,
      },
    };
    return JSON.stringify(transaction);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    try {
      const keyPair = new KeyPair({ prv: key.key });
      const publicKeyHex = keyPair.getPublicKey({ compressed: true }).toString('hex');
      const uncompressedPublicKeyHex = keyPair.getPublicKey({ compressed: false }).toString('hex');
      return (
        this.icpTransactionData.senderPublicKeyHex === publicKeyHex ||
        this.icpTransactionData.senderPublicKeyHex === uncompressedPublicKeyHex
      );
    } catch (error) {
      return false;
    }
  }
}
