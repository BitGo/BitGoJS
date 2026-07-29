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
import { MAX_GAS_BUDGET, MAX_GAS_PAYMENT_OBJECTS, MAX_GAS_PRICE } from './constants';
import utils from './utils';

/**
 * Base class for IOTA transactions.
 * Manages transaction state, gas data, signatures, and building/serialization.
 */
export abstract class Transaction extends BaseTransaction {
  // Transaction state management
  protected _rebuildRequired: boolean;
  protected _type: TransactionType;
  protected _iotaTransaction: IotaTransaction;

  // Gas and payment data
  private _gasBudget?: number;
  private _gasPaymentObjects?: TransactionObjectInput[];
  private _gasPrice?: number;
  private _gasSponsor?: string;

  // Transaction identifiers and data
  private _sender: string;
  private _txDataBytes?: Uint8Array<ArrayBufferLike>;
  private _isSimulateTx: boolean;

  // Signature data
  private _signature?: Signature;
  private _serializedSignature?: string;
  private _gasSponsorSignature?: Signature;
  private _serializedGasSponsorSignature?: string;

  protected constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._sender = '';
    this._rebuildRequired = false;
    this._isSimulateTx = true;
  }

  // Gas budget getter/setter - marks rebuild required when changed
  get gasBudget(): number | undefined {
    return this._gasBudget;
  }

  set gasBudget(value: number | undefined) {
    this._gasBudget = value;
    this.markRebuildRequired();
  }

  // Gas payment objects getter/setter - marks rebuild required when changed
  get gasPaymentObjects(): TransactionObjectInput[] | undefined {
    return this._gasPaymentObjects;
  }

  set gasPaymentObjects(value: TransactionObjectInput[] | undefined) {
    this._gasPaymentObjects = value;
    this.markRebuildRequired();
  }

  // Gas price getter/setter - marks rebuild required when changed
  get gasPrice(): number | undefined {
    return this._gasPrice;
  }

  set gasPrice(value: number | undefined) {
    this._gasPrice = value;
    this.markRebuildRequired();
  }

  // Gas sponsor getter/setter - marks rebuild required when changed
  get gasSponsor(): string | undefined {
    return this._gasSponsor;
  }

  set gasSponsor(value: string | undefined) {
    this._gasSponsor = value;
    this.markRebuildRequired();
  }

  // Transaction sender getter/setter - marks rebuild required when changed
  get sender(): string {
    return this._sender;
  }

  set sender(value: string) {
    this._sender = value;
    this.markRebuildRequired();
  }

  /**
   * Indicates whether this is a simulate transaction (dry run) or a real transaction.
   * Simulate transactions use maximum gas values for estimation purposes.
   */
  get isSimulateTx(): boolean {
    return this._isSimulateTx;
  }

  set isSimulateTx(value: boolean) {
    if (!value) {
      this.validateTxDataForRealTransaction();
      this.markRebuildRequired();
    }
    this._isSimulateTx = value;
  }

  /**
   * Marks that the transaction needs to be rebuilt before it can be signed or broadcast.
   */
  private markRebuildRequired(): void {
    this._rebuildRequired = true;
  }

  /**
   * Validates transaction data when switching from simulate to real transaction mode.
   */
  private validateTxDataForRealTransaction(): void {
    try {
      this.validateTxData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Tx data validation failed: ${errorMessage}. {Cause: ${error}}`);
    }
  }

  /**
   * Returns the signable payload for this transaction.
   * This is the Blake2b hash of the transaction data with intent message.
   * @throws Error if transaction is in simulate mode or not built
   */
  get signablePayload(): Buffer {
    if (this.isSimulateTx) {
      throw new Error('Cannot sign a simulate tx');
    }
    this.ensureTransactionIsBuilt();

    const intentMessage = this.messageWithIntent(this._txDataBytes as Uint8Array<ArrayBufferLike>);
    return Buffer.from(blake2b(32).update(intentMessage).digest('binary'));
  }

  /**
   * Returns the transaction digest (ID).
   * @throws Error if transaction is not built or needs rebuilding
   */
  get id(): string {
    this.ensureTransactionIsBuilt();
    return IotaTransactionDataBuilder.getDigestFromBytes(this._txDataBytes as Uint8Array<ArrayBufferLike>);
  }

  /**
   * Ensures the transaction is built and doesn't need rebuilding.
   * @throws Error if transaction is not built or rebuild is required
   */
  private ensureTransactionIsBuilt(): void {
    if (this._txDataBytes === undefined || this._rebuildRequired) {
      throw new Error('Tx not built or a rebuild is required');
    }
  }

  /**
   * Adds a signature from the transaction sender.
   */
  addSignature(publicKey: PublicKey, signature: Buffer): void {
    this._signature = { publicKey, signature };
  }

  /**
   * Adds a signature from the gas sponsor (if different from sender).
   */
  addGasSponsorSignature(publicKey: PublicKey, signature: Buffer): void {
    this._gasSponsorSignature = { publicKey, signature };
  }

  /**
   * Checks if this transaction can be signed.
   * Only real transactions (not simulate) can be signed.
   */
  canSign(_key: BaseKey): boolean {
    return !this.isSimulateTx;
  }

  /**
   * Returns the transaction fee (gas budget).
   */
  getFee(): string | undefined {
    return this.gasBudget?.toString();
  }

  get serializedGasSponsorSignature(): string | undefined {
    return this._serializedGasSponsorSignature;
  }

  get serializedSignature(): string | undefined {
    return this._serializedSignature;
  }

  /**
   * Serializes all signatures for the transaction.
   * Includes both sender signature and gas sponsor signature if present.
   */
  serializeSignatures(): void {
    this._signatures = [];

    if (this._signature) {
      this._serializedSignature = this.serializeSignature(this._signature);
      this._signatures.push(this._serializedSignature);
    }

    if (this._gasSponsorSignature) {
      this._serializedGasSponsorSignature = this.serializeSignature(this._gasSponsorSignature);
      this._signatures.push(this._serializedGasSponsorSignature);
    }
  }

  /**
   * Converts the transaction to broadcast format (base64 encoded).
   */
  async toBroadcastFormat(): Promise<string> {
    const txDataBytes = await this.build();
    return toBase64(txDataBytes);
  }

  /**
   * Builds the transaction bytes.
   * If in simulate mode, builds a dry run transaction with max gas values.
   * Otherwise, builds a real transaction with actual gas data.
   */
  async build(): Promise<Uint8Array<ArrayBufferLike>> {
    if (this.isSimulateTx) {
      return this.buildDryRunTransaction();
    }
    return this.buildRealTransaction();
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

  /**
   * Parses transaction data from its broadcast format (base64 or raw bytes).
   * Extracts sender, gas data, and gas sponsor information.
   */
  parseFromBroadcastTx(tx: string | Uint8Array): void {
    const txData = IotaTransaction.from(tx).getData();

    this.parseSender(txData);
    this.parseGasData(txData);
  }

  /**
   * Parses the sender address from transaction data.
   */
  private parseSender(txData: ReturnType<IotaTransaction['getData']>): void {
    if (txData.sender) {
      this.sender = txData.sender;
    }
  }

  /**
   * Parses gas-related data from transaction data.
   */
  private parseGasData(txData: ReturnType<IotaTransaction['getData']>): void {
    const gasData = txData.gasData;

    if (!gasData) {
      this.gasBudget = undefined;
      this.gasPrice = undefined;
      this.gasPaymentObjects = undefined;
      this.gasSponsor = undefined;
      return;
    }

    this.gasBudget = gasData.budget ? Number(gasData.budget) : undefined;
    this.gasPrice = gasData.price ? Number(gasData.price) : undefined;

    this.gasPaymentObjects =
      gasData.payment && gasData.payment.length > 0
        ? gasData.payment.map((payment) => payment as TransactionObjectInput)
        : undefined;

    this.gasSponsor = gasData.owner || undefined;
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

  /**
   * Updates the simulate transaction flag based on gas data availability.
   * If all gas data is present, switches to real transaction mode.
   */
  protected updateIsSimulateTx(): void {
    const hasAllGasData =
      this.gasBudget && this.gasPrice && this.gasPaymentObjects && this.gasPaymentObjects.length > 0;

    this.isSimulateTx = !hasAllGasData;
  }

  // Abstract methods to be implemented by child classes
  protected abstract messageWithIntent(message: Uint8Array): Uint8Array;
  protected abstract populateTxInputsAndCommands(): void;
  protected abstract validateTxDataImplementation(): void;
  abstract addInputsAndOutputs(): void;
  protected abstract explainTransactionImplementation(
    json: TxData,
    explanationResult: TransactionExplanation
  ): TransactionExplanation;

  /**
   * Builds a dry run (simulate) transaction with maximum gas values.
   * Used for gas estimation without committing the transaction.
   */
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

  /**
   * Builds a real transaction with actual gas data.
   * Only builds if necessary (first time or rebuild required).
   */
  private async buildRealTransaction(): Promise<Uint8Array<ArrayBufferLike>> {
    if (this._txDataBytes === undefined || this._rebuildRequired) {
      this.validateTxData();
      await this.populateTxData();
      this.setGasDataOnTransaction();
      this._txDataBytes = await this._iotaTransaction.build();
      this._rebuildRequired = false;
    }

    this.serializeSignatures();
    return this._txDataBytes;
  }

  /**
   * Sets gas data on the IOTA transaction object.
   */
  private setGasDataOnTransaction(): void {
    this._iotaTransaction.setGasPrice(this.gasPrice!);
    this._iotaTransaction.setGasBudget(this.gasBudget!);
    this._iotaTransaction.setGasPayment(
      this.gasPaymentObjects!.slice(0, MAX_GAS_PAYMENT_OBJECTS - 1) as TransactionObjectInput[]
    );
  }

  /**
   * Populates the IOTA transaction with inputs, commands, and gas sponsor if applicable.
   */
  private async populateTxData(): Promise<void> {
    this._iotaTransaction = new IotaTransaction();
    this.populateTxInputsAndCommands();

    // If gas sponsor is different from sender, set up sponsored transaction
    if (this.hasDifferentGasSponsor()) {
      await this.setupGasSponsoredTransaction();
    }

    this._iotaTransaction.setSender(this.sender);
  }

  /**
   * Checks if the transaction has a gas sponsor different from the sender.
   */
  private hasDifferentGasSponsor(): boolean {
    return Boolean(this.gasSponsor && this._sender !== this.gasSponsor);
  }

  /**
   * Sets up a gas-sponsored transaction by building the transaction kind
   * and setting the gas owner.
   */
  private async setupGasSponsoredTransaction(): Promise<void> {
    const transactionKind = await this._iotaTransaction.build({ onlyTransactionKind: true });
    this._iotaTransaction = IotaTransaction.fromKind(transactionKind);
    this._iotaTransaction.setGasOwner(this._gasSponsor!);
  }

  /**
   * Serializes a signature into IOTA's expected format.
   * Format: [signature_scheme_flag (1 byte), signature, public_key]
   * Currently hardcoded to EDDSA (0x00) as IOTA only supports this scheme.
   */
  private serializeSignature(signature: Signature): string {
    const SIGNATURE_SCHEME_EDDSA = 0x00;
    const pubKey = Buffer.from(signature.publicKey.pub, 'hex');
    const serializedSignature = new Uint8Array(1 + signature.signature.length + pubKey.length);

    serializedSignature.set([SIGNATURE_SCHEME_EDDSA]);
    serializedSignature.set(signature.signature, 1);
    serializedSignature.set(pubKey, 1 + signature.signature.length);

    return toBase64(serializedSignature);
  }

  /**
   * Validates all transaction data required for a real (non-simulate) transaction.
   */
  private validateTxData(): void {
    this.validateTxDataImplementation();
    this.validateCommonTxData();
    this.validateSignatures();
  }

  /**
   * Validates common transaction data (sender, gas data).
   */
  private validateCommonTxData(): void {
    if (!this.sender) {
      throw new InvalidTransactionError('Transaction sender is required');
    }

    if (!this.gasPrice) {
      throw new InvalidTransactionError('Gas price is required');
    }

    if (!this.gasBudget) {
      throw new InvalidTransactionError('Gas budget is required');
    }

    if (!this.gasPaymentObjects || this.gasPaymentObjects.length === 0) {
      throw new InvalidTransactionError('Gas payment objects are required');
    }
  }

  /**
   * Validates sender and gas sponsor signatures if present.
   */
  private validateSignatures(): void {
    if (this._signature && !this.isValidSignature(this._signature)) {
      throw new InvalidTransactionError('Invalid sender signature');
    }

    if (this._gasSponsorSignature && !this.isValidSignature(this._gasSponsorSignature)) {
      throw new InvalidTransactionError('Invalid gas sponsor signature');
    }
  }

  /**
   * Checks if a signature has valid public key and signature data.
   */
  private isValidSignature(signature: Signature): boolean {
    return utils.isValidPublicKey(signature.publicKey.pub) && utils.isValidSignature(toBase64(signature.signature));
  }
}
