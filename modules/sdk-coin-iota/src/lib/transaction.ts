import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  PublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  TransactionData as IotaTransactionData,
  Transaction as IotaTransaction,
  TransactionDataBuilder as IotaTransactionDataBuilder,
} from '@iota/iota-sdk/transactions';
import { TxData, TransactionObjectInput, TransactionExplanation } from './iface';
import { toBase64 } from '@iota/iota-sdk/utils';
import blake2b from '@bitgo/blake2b';
import {
  MAX_GAS_BUDGET,
  MAX_GAS_PAYMENT_OBJECTS,
  MAX_GAS_PRICE,
  IOTA_KEY_BYTES_LENGTH,
  IOTA_SIGNATURE_LENGTH,
} from './constants';
import utils from './utils';

export abstract class Transaction extends BaseTransaction {
  static EMPTY_PUBLIC_KEY = Buffer.alloc(IOTA_KEY_BYTES_LENGTH);
  static EMPTY_SIGNATURE = Buffer.alloc(IOTA_SIGNATURE_LENGTH);

  protected _rebuildRequired: boolean;
  protected _type: TransactionType;
  protected _iotaTransaction: IotaTransaction;

  private _gasBudget?: number;
  private _gasPaymentObjects?: TransactionObjectInput[];
  private _gasPrice?: number;
  private _gasSponsor?: string;
  private _sender: string;
  private _signature?: Signature;
  private _serializedSignature?: string;
  private _gasSponsorSignature?: Signature;
  private _serializedGasSponsorSignature?: string;
  private _txDataBytes?: Uint8Array<ArrayBufferLike>;
  private _isSimulateTx: boolean;

  protected constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._sender = '';
    this._rebuildRequired = false;
    this._isSimulateTx = true;
  }

  get gasBudget(): number | undefined {
    return this._gasBudget;
  }

  set gasBudget(value: number | undefined) {
    this._gasBudget = value;
    this._rebuildRequired = true;
  }

  get gasPaymentObjects(): TransactionObjectInput[] | undefined {
    return this._gasPaymentObjects;
  }

  set gasPaymentObjects(value: TransactionObjectInput[] | undefined) {
    this._gasPaymentObjects = value;
    this._rebuildRequired = true;
  }

  get gasPrice(): number | undefined {
    return this._gasPrice;
  }

  set gasPrice(value: number | undefined) {
    this._gasPrice = value;
    this._rebuildRequired = true;
  }

  get gasSponsor(): string | undefined {
    return this._gasSponsor;
  }

  set gasSponsor(value: string | undefined) {
    this._gasSponsor = value;
    this._rebuildRequired = true;
  }

  get sender(): string {
    return this._sender;
  }

  set sender(value: string) {
    this._sender = value;
    this._rebuildRequired = true;
  }

  get isSimulateTx(): boolean {
    return this._isSimulateTx;
  }

  set isSimulateTx(value: boolean) {
    if (!value) {
      try {
        this.validateTxData();
        this._rebuildRequired = true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Tx data validation failed: ${errorMessage}. {Cause: ${error}}`);
      }
    }
    this._isSimulateTx = value;
  }

  get signablePayload(): Buffer {
    if (this.isSimulateTx) {
      throw new Error('Cannot sign a simulate tx');
    }
    if (this._txDataBytes === undefined || this._rebuildRequired) {
      throw new Error('Tx not built or a rebuild is required');
    }
    const intentMessage = this.messageWithIntent(this._txDataBytes);
    return Buffer.from(blake2b(32).update(intentMessage).digest('binary'));
  }

  /** @inheritDoc **/
  get id(): string {
    if (this._txDataBytes === undefined || this._rebuildRequired) {
      throw new Error('Tx not built or a rebuild is required');
    }
    return IotaTransactionDataBuilder.getDigestFromBytes(this._txDataBytes);
  }

  addSignature(publicKey: PublicKey, signature: Buffer): void {
    this._signature = { publicKey, signature };
  }

  addGasSponsorSignature(publicKey: PublicKey, signature: Buffer): void {
    this._gasSponsorSignature = { publicKey, signature };
  }

  canSign(_key: BaseKey): boolean {
    return !this.isSimulateTx;
  }

  getFee(): string | undefined {
    return this.gasBudget?.toString();
  }

  get serializedGasSponsorSignature(): string | undefined {
    return this._serializedGasSponsorSignature;
  }

  get serializedSignature(): string | undefined {
    return this._serializedSignature;
  }

  serializeSignatures(): void {
    this._signatures = [];
    if (this._signature) {
      this._serializedSignature = this.serializeSignature(this._signature as Signature);
      this._signatures.push(this._serializedSignature);
    }
    if (this._gasSponsorSignature) {
      this._serializedGasSponsorSignature = this.serializeSignature(this._gasSponsorSignature as Signature);
      this._signatures.push(this._serializedGasSponsorSignature);
    }
  }

  async toBroadcastFormat(): Promise<string> {
    const txDataBytes: Uint8Array<ArrayBufferLike> = await this.build();
    return toBase64(txDataBytes);
  }

  async build(): Promise<Uint8Array<ArrayBufferLike>> {
    if (this.isSimulateTx) {
      return this.buildDryRunTransaction();
    }
    return this.buildTransaction();
  }

  toJson(): TxData {
    return {
      sender: this.sender,
      gasBudget: this.gasBudget,
      gasPrice: this.gasPrice,
      gasPaymentObjects: this.gasPaymentObjects,
      gasSponsor: this.gasSponsor,
      type: this.type,
    };
  }

  parseFromJSON(txData: TxData): void {
    this.sender = txData.sender;
    this.gasBudget = txData.gasBudget;
    this.gasPrice = txData.gasPrice;
    this.gasPaymentObjects = txData.gasPaymentObjects;
    if (txData.gasSponsor !== undefined) {
      this.gasSponsor = txData.gasSponsor;
    }
  }

  parseFromBroadcastTx(tx: string | Uint8Array): void {
    const txData = IotaTransaction.from(tx).getData();
    if (txData.sender) {
      this.sender = txData.sender;
    }
    if (txData.gasData?.budget) {
      this.gasBudget = Number(txData.gasData.budget);
    } else {
      this.gasBudget = undefined;
    }
    if (txData.gasData?.price) {
      this.gasPrice = Number(txData.gasData.price);
    } else {
      this.gasPrice = undefined;
    }
    if (txData.gasData?.payment && txData.gasData.payment.length > 0) {
      this.gasPaymentObjects = txData.gasData.payment.map((payment) => payment as TransactionObjectInput);
    } else {
      this.gasPaymentObjects = undefined;
    }
    if (txData.gasData?.owner) {
      this.gasSponsor = txData.gasData.owner;
    } else {
      this.gasSponsor = undefined;
    }
  }

  /**
   * @inheritDoc
   */
  explainTransaction(): any {
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
      fee: { fee: this.gasBudget ? this.gasBudget.toString() : '' },
      sender: this.sender,
      sponsor: this.gasSponsor,
      type: this.type,
    };

    return this.explainTransactionImplementation(result, explanationResult);
  }

  protected updateIsSimulateTx(): void {
    if (this.gasBudget && this.gasPrice && this.gasPaymentObjects && this.gasPaymentObjects?.length > 0) {
      this.isSimulateTx = false;
    } else {
      this.isSimulateTx = true;
    }
  }

  protected abstract messageWithIntent(message: Uint8Array): Uint8Array;
  protected abstract populateTxInputsAndCommands(): void;
  protected abstract validateTxDataImplementation(): void;

  /**
   * Add the input and output entries for this transaction.
   */
  abstract addInputsAndOutputs(): void;

  /**
   * Returns a complete explanation for a transfer transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  protected abstract explainTransactionImplementation(
    json: TxData,
    explanationResult: TransactionExplanation
  ): TransactionExplanation;

  private async buildDryRunTransaction(): Promise<Uint8Array<ArrayBufferLike>> {
    this.validateTxDataImplementation();
    await this.populateTxData();
    const txDataBuilder = new IotaTransactionDataBuilder(this._iotaTransaction.getData() as IotaTransactionData);
    return txDataBuilder.build({
      overrides: {
        gasData: {
          budget: MAX_GAS_BUDGET.toString(),
          price: MAX_GAS_PRICE.toString(),
          payment: [],
        },
      },
    });
  }

  private async buildTransaction(): Promise<Uint8Array<ArrayBufferLike>> {
    if (this._txDataBytes === undefined || this._rebuildRequired) {
      this.validateTxData();
      await this.populateTxData();
      this._iotaTransaction.setGasPrice(this.gasPrice as number);
      this._iotaTransaction.setGasBudget(this.gasBudget as number);
      this._iotaTransaction.setGasPayment(this.gasPaymentObjects as TransactionObjectInput[]);
      this._txDataBytes = await this._iotaTransaction.build();
      this._rebuildRequired = false;
    }
    this.serializeSignatures();
    return this._txDataBytes;
  }

  private async populateTxData(): Promise<void> {
    this._iotaTransaction = new IotaTransaction();
    this.populateTxInputsAndCommands();
    if (this.gasSponsor && this._sender !== this.gasSponsor) {
      this._iotaTransaction = IotaTransaction.fromKind(
        await this._iotaTransaction.build({ onlyTransactionKind: true })
      );
      this._iotaTransaction.setGasOwner(this._gasSponsor as string);
    }
    this._iotaTransaction.setSender(this.sender);
  }

  private serializeSignature(signature: Signature): string {
    const pubKey = Buffer.from(signature.publicKey.pub, 'hex');
    const serialized_sig = new Uint8Array(1 + signature.signature.length + pubKey.length);
    serialized_sig.set([0x00]); //Hardcoding the signature scheme flag since we only support EDDSA for iota
    serialized_sig.set(signature.signature, 1);
    serialized_sig.set(pubKey, 1 + signature.signature.length);
    return toBase64(serialized_sig);
  }

  private validateTxData(): void {
    this.validateTxDataImplementation();
    if (!this.sender || this.sender === '') {
      throw new InvalidTransactionError('Transaction sender is required');
    }

    if (!this.gasPrice) {
      throw new InvalidTransactionError('Gas price is required');
    }

    if (!this.gasBudget) {
      throw new InvalidTransactionError('Gas budget is required');
    }

    if (!this.gasPaymentObjects || this.gasPaymentObjects?.length === 0) {
      throw new InvalidTransactionError('Gas payment objects are required');
    }

    if (this.gasPaymentObjects.length > MAX_GAS_PAYMENT_OBJECTS) {
      throw new InvalidTransactionError(
        `Gas payment objects count (${this.gasPaymentObjects.length}) exceeds maximum allowed (${MAX_GAS_PAYMENT_OBJECTS})`
      );
    }

    if (
      this._signature &&
      !(
        utils.isValidPublicKey(this._signature.publicKey.pub) &&
        utils.isValidSignature(toBase64(this._signature.signature))
      )
    ) {
      throw new InvalidTransactionError('Invalid sender signature');
    }

    if (
      this._gasSponsorSignature &&
      !(
        utils.isValidPublicKey(this._gasSponsorSignature.publicKey.pub) &&
        utils.isValidSignature(toBase64(this._gasSponsorSignature.signature))
      )
    ) {
      throw new InvalidTransactionError('Invalid gas sponsor signature');
    }
  }
}
