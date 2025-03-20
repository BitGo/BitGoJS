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
  CborUnsignedTransaction,
  HttpCanisterUpdate,
  ParsedTransaction,
  IcpOperation,
  IcpAccount,
  MAX_INGRESS_TTL,
  PERMITTED_DRIFT,
  RawTransaction,
} from './iface';
import { Utils } from './utils';

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

  async fromRawTransaction(rawTransaction: string): Promise<void> {
    try {
      const jsonRawTransaction: RawTransaction = JSON.parse(rawTransaction);
      const parsedTx = await this.parseUnsignedTransaction(jsonRawTransaction.serializedTxHex);
      const senderPublicKeyHex = jsonRawTransaction.publicKey;
      const transactionType = parsedTx.operations[0].type;
      switch (transactionType) {
        case OperationType.TRANSACTION:
          this._icpTransactionData = {
            senderAddress: parsedTx.operations[0].account.address,
            receiverAddress: parsedTx.operations[1].account.address,
            amount: parsedTx.operations[1].amount.value,
            fee: parsedTx.operations[2].amount.value,
            senderPublicKeyHex: senderPublicKeyHex,
            memo: parsedTx.metadata.memo,
            transactionType: transactionType,
            expiryTime: Number(parsedTx.metadata.created_at_time + (MAX_INGRESS_TTL - PERMITTED_DRIFT)),
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

  async parseUnsignedTransaction(rawTransaction: string): Promise<ParsedTransaction> {
    const unsignedTransaction = this._utils.cborDecode(
      this._utils.blobFromHex(rawTransaction)
    ) as CborUnsignedTransaction;
    const update = unsignedTransaction.updates[0];
    const httpCanisterUpdate = update[1] as HttpCanisterUpdate;
    return await this.getParsedTransactionFromUpdate(httpCanisterUpdate, false);
  }

  private async getParsedTransactionFromUpdate(
    httpCanisterUpdate: HttpCanisterUpdate,
    isSigned: boolean
  ): Promise<ParsedTransaction> {
    const senderPrincipal = this._utils.convertSenderBlobToPrincipal(httpCanisterUpdate.sender);
    const ACCOUNT_ID_PREFIX = this._utils.getAccountIdPrefix();
    const subAccount = new Uint8Array(32);
    const senderAccount = this._utils.getAccountIdFromPrincipalBytes(
      ACCOUNT_ID_PREFIX,
      Buffer.from(senderPrincipal.buffer),
      subAccount
    );
    const args = await this._utils.fromArgs(httpCanisterUpdate.arg);
    const senderOperation: IcpOperation = {
      type: OperationType.TRANSACTION,
      account: { address: senderAccount },
      amount: {
        value: `-${args.payment.receiverGets.e8s.toString()}`,
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };
    const receiverOperation: IcpOperation = {
      type: OperationType.TRANSACTION,
      account: { address: args.to.hash.toString('hex') },
      amount: {
        value: args.payment.receiverGets.e8s.toString(),
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const feeOperation: IcpOperation = {
      type: OperationType.FEE,
      account: { address: senderAccount },
      amount: {
        value: `-${args.maxFee.e8s.toString()}`,
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };
    const accountIdentifierSigners: IcpAccount[] = [];
    if (isSigned) {
      accountIdentifierSigners.push({ address: senderAccount });
    }
    const parsedTxn: ParsedTransaction = {
      operations: [senderOperation, receiverOperation, feeOperation],
      metadata: {
        created_at_time: args.createdAtTime.timestampNanos,
        memo: Number(args.memo.memo),
      },
      account_identifier_signers: accountIdentifierSigners,
    };
    return parsedTxn;
  }

  async parseSignedTransaction(rawTransaction: string): Promise<ParsedTransaction> {
    const signedTransaction = this._utils.cborDecode(this._utils.blobFromHex(rawTransaction));
    const signedTransactionTyped = signedTransaction as { requests: any[] };
    const envelopes = signedTransactionTyped.requests[0][1];
    const updates = envelopes.map((envelope) => envelope.update);
    const httpCanisterUpdate = updates[0].content as HttpCanisterUpdate;
    return await this.getParsedTransactionFromUpdate(httpCanisterUpdate, true);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }
}
