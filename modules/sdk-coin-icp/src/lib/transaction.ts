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
  CborUnsignedTransaction,
  HttpCanisterUpdate,
  ParsedTransaction,
  IcpOperation,
  UpdateEnvelope,
  IcpAccount,
  MAX_INGRESS_TTL,
  PERMITTED_DRIFT,
  RawTransaction,
} from './iface';
import utils from './utils';

export class Transaction extends BaseTransaction {
  protected _icpTransactionData: IcpTransactionData;
  protected _icpTransaction: IcpTransaction;
  protected _payloadsData: PayloadsData;
  protected _signedTransaction: string;
  protected _signaturePayload: Signatures[];
  protected _createdTimestamp: number | bigint | undefined;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
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

  set createdTimestamp(createdTimestamp: number) {
    this._createdTimestamp = createdTimestamp;
  }

  get createdTimestamp(): number | bigint | undefined {
    return this._createdTimestamp;
  }

  async fromRawTransaction(rawTransaction: string): Promise<void> {
    try {
      const serializedTxFormatBuffer = Buffer.from(rawTransaction, 'hex');
      const serializedTxFormatJsonString = serializedTxFormatBuffer.toString('utf-8');
      const jsonRawTransaction: RawTransaction = JSON.parse(serializedTxFormatJsonString);
      const payloadsData = jsonRawTransaction.serializedTxHex;
      this._payloadsData = payloadsData;
      const parsedTx = await this.parseUnsignedTransaction(payloadsData.unsigned_transaction);
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
            transactionType: transactionType,
            expiryTime: Number(parsedTx.metadata.ingress_end ?? parsedTx.metadata.created_at_time + MAX_INGRESS_TTL),
            memo: parsedTx.metadata.memo,
          };

          utils.validateRawTransaction(this._icpTransactionData);
          this._id = this.generateTransactionId();
          break;
        default:
          throw new Error('Invalid transaction type');
      }
    } catch (error) {
      throw new InvalidTransactionError(`Invalid transaction: ${error.message}`);
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
    if (this._id === undefined || this._id === null) {
      this._id = this.generateTransactionId();
    }
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._icpTransactionData) {
      throw new InvalidTransactionError('Empty transaction');
    }
    switch (this._icpTransactionData.transactionType) {
      case OperationType.TRANSACTION:
        const txData: TxData = {
          id: this._id,
          sender: this._icpTransactionData.senderAddress,
          senderPublicKey: this._icpTransactionData.senderPublicKeyHex,
          recipient: this._icpTransactionData.receiverAddress,
          memo: this._icpTransactionData.memo,
          feeAmount: this._icpTransactionData.fee,
          expirationTime: this._icpTransactionData.expiryTime,
          type: BitGoTransactionType.Send,
        };
        if (this._icpTransactionData.memo !== undefined) {
          txData.memo = this._icpTransactionData.memo;
        }
        return txData;
      default:
        throw new Error(`Unsupported transaction type: ${this._icpTransactionData.transactionType}`);
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
    const recipients = utils.getRecipients(this.icpTransactionData);
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
    return this._signedTransaction;
  }

  async parseUnsignedTransaction(rawTransaction: string): Promise<ParsedTransaction> {
    const unsignedTransaction = utils.cborDecode(utils.blobFromHex(rawTransaction)) as CborUnsignedTransaction;
    const update = unsignedTransaction.updates[0];
    const httpCanisterUpdate = (update as unknown as [string, HttpCanisterUpdate])[1];
    httpCanisterUpdate.ingress_expiry = BigInt(unsignedTransaction.ingress_expiries[0]);
    return await this.getParsedTransactionFromUpdate(httpCanisterUpdate, false);
  }

  private async getParsedTransactionFromUpdate(
    httpCanisterUpdate: HttpCanisterUpdate,
    isSigned: boolean
  ): Promise<ParsedTransaction> {
    const senderPrincipal = utils.convertSenderBlobToPrincipal(httpCanisterUpdate.sender);
    const ACCOUNT_ID_PREFIX = utils.getAccountIdPrefix();
    const subAccount = new Uint8Array(32);
    const senderAccount = utils.getAccountIdFromPrincipalBytes(
      ACCOUNT_ID_PREFIX,
      Buffer.from(senderPrincipal.buffer),
      subAccount
    );
    const args = await utils.fromArgs(httpCanisterUpdate.arg);
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
        ingress_end: Number(httpCanisterUpdate.ingress_expiry) + PERMITTED_DRIFT,
      },
      account_identifier_signers: accountIdentifierSigners,
    };
    this.createdTimestamp = args.createdAtTime.timestampNanos;
    return parsedTxn;
  }

  async parseSignedTransaction(rawTransaction: string): Promise<ParsedTransaction> {
    const signedTransaction = utils.cborDecode(utils.blobFromHex(rawTransaction));
    const httpCanisterUpdate = (signedTransaction as UpdateEnvelope).content as HttpCanisterUpdate;
    httpCanisterUpdate.ingress_expiry = BigInt((signedTransaction as UpdateEnvelope).content.ingress_expiry);
    return await this.getParsedTransactionFromUpdate(httpCanisterUpdate, true);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /**
   * Generates a unique transaction ID for the current transaction.
   * The transaction ID is derived using the unsigned transaction data,
   * the sender's address, and the receiver's address.
   *
   * @returns {string} The generated transaction ID.
   */
  private generateTransactionId(): string {
    const id = utils.getTransactionId(
      this.unsignedTransaction,
      this.icpTransactionData.senderAddress,
      this.icpTransactionData.receiverAddress
    );
    return id;
  }
}
