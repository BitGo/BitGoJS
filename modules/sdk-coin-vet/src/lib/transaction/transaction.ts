import BigNumber from 'bignumber.js';
import {
  BaseTransaction,
  TransactionType,
  InvalidTransactionError,
  TransactionRecipient,
  PublicKey,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  TransactionBody,
  TransactionClause,
  Transaction as VetTransaction,
  Secp256k1,
  HexUInt,
} from '@vechain/sdk-core';
import * as nc_utils from '@noble/curves/abstract/utils';
import utils from '../utils';
import { VetTransactionExplanation } from '../iface';

export interface VetTransactionData {
  id: string;
  chainTag: number;
  blockRef: string;
  expiration: number;
  gasPriceCoef: number;
  gas: number;
  dependsOn: string | null;
  nonce: number;
  sender: string;
  feePayer: string;
  recipients: TransactionRecipient[];
}

const gasPrice = 1e13;

export class Transaction extends BaseTransaction {
  protected _rawTransaction: VetTransaction;
  protected _type: TransactionType;
  protected _recipients: TransactionRecipient[];
  private _chainTag: number;
  private _blockRef: string;
  private _expiration: number;
  private _clauses: TransactionClause[];
  private _gasPriceCoef: number;
  private _gas: number;
  private _dependsOn: string | null;
  private _nonce: number;
  private _sender: string;
  private _senderSignature: Buffer;
  private _feePayerAddress: string;
  private _feePayerSignature: Buffer;
  private _feePayerPubKey: PublicKey;

  static EMPTY_PUBLIC_KEY = Buffer.alloc(32);
  static EMPTY_SIGNATURE = Buffer.alloc(64);

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.Send;
    this._chainTag = 0x27; // Initialize to 39 (0x27)
    this._blockRef = '0x0';
    this._expiration = 64;
    this._clauses = [];
    this._gasPriceCoef = 128;
    this._gas = 0;
    this._dependsOn = null;
    this._nonce = 0x0;
    this._recipients = [];
    this._feePayerPubKey = {
      pub: HexUInt.of(Transaction.EMPTY_PUBLIC_KEY).toString(),
    };
    this._senderSignature = Transaction.EMPTY_SIGNATURE;
    this._feePayerSignature = Transaction.EMPTY_SIGNATURE;
  }

  public get id(): string {
    this.generateTxnId();
    return this._id ?? 'UNAVAILABLE';
  }

  get rawTransaction(): VetTransaction {
    return this._rawTransaction;
  }

  set rawTransaction(rawTx: VetTransaction) {
    this._rawTransaction = rawTx;
  }

  get type(): TransactionType {
    return this._type;
  }

  set type(type: TransactionType) {
    this._type = type;
  }

  get sender(): string {
    return this._sender;
  }

  set sender(address: string) {
    this._sender = address;
  }

  get senderSignature(): Uint8Array | undefined {
    return this._senderSignature;
  }

  set senderSignature(sig: Buffer) {
    this._senderSignature = sig;
  }

  get feePayerAddress(): string {
    return this._feePayerAddress;
  }

  set feePayerAddress(address: string) {
    this._feePayerAddress = address;
  }

  get feePayerSignature(): Uint8Array {
    return this._feePayerSignature;
  }

  set feePayerSignature(sig: Buffer) {
    this._feePayerSignature = sig;
  }

  get chainTag(): number {
    return this._chainTag;
  }

  set chainTag(tag: number) {
    this._chainTag = tag;
  }

  get blockRef(): string {
    return this._blockRef;
  }

  set blockRef(ref: string) {
    this._blockRef = ref;
  }

  get expiration(): number {
    return this._expiration;
  }

  set expiration(exp: number) {
    this._expiration = exp;
  }

  get recipients(): TransactionRecipient[] {
    return this._recipients;
  }

  set recipients(recipients: TransactionRecipient[]) {
    this._recipients = recipients;
  }

  get clauses(): TransactionClause[] {
    return this._clauses;
  }

  set clauses(clauses: TransactionClause[]) {
    this._clauses = clauses;
  }

  get gasPriceCoef(): number {
    return this._gasPriceCoef;
  }

  set gasPriceCoef(coef: number) {
    this._gasPriceCoef = coef;
  }

  get gas(): number {
    return this._gas;
  }

  set gas(g: number) {
    this._gas = g;
  }

  get dependsOn(): string | null {
    return this._dependsOn;
  }

  set dependsOn(dep: string | null) {
    this._dependsOn = dep;
  }

  get nonce(): number {
    return this._nonce;
  }

  set nonce(n: number) {
    this._nonce = n;
  }

  get feePayerPubKey(): PublicKey {
    return this._feePayerPubKey;
  }

  set feePayerPubKey(pubKey: PublicKey) {
    this._feePayerPubKey = pubKey;
  }

  /**
   * Get all signatures associated with this transaction
   * Required by BaseTransaction
   */
  get signature(): string[] {
    const sigs: string[] = [];
    if (this._senderSignature) {
      sigs.push(Buffer.from(this._senderSignature).toString('hex'));
    }
    if (this._feePayerSignature) {
      sigs.push(Buffer.from(this._feePayerSignature).toString('hex'));
    }
    return sigs;
  }

  /**
   * Set signatures for this transaction
   * Required by BaseTransaction
   * Note: This is mainly for compatibility with the base class.
   * Prefer using senderSignature and feePayerSignature directly.
   */
  set signature(sigs: string[]) {
    if (sigs.length > 0) {
      this._senderSignature = Buffer.from(sigs[0], 'hex');
    }
    if (sigs.length > 1) {
      this._feePayerSignature = Buffer.from(sigs[1], 'hex');
    }
  }

  /** @inheritdoc */
  canSign(): boolean {
    return true;
  }

  /**
   * Check if this is a fee delegated transaction
   */
  isFeeDelegated(): boolean {
    return !!this._feePayerAddress;
  }

  addRecipients(clauses: TransactionClause[]): void {
    this._recipients = clauses.map((clause) => ({
      address: (clause.to || '0x0').toString().toLowerCase(),
      amount: (clause.value || '0').toString(),
    }));
  }

  buildClauses(): void {
    this._clauses = this._recipients.map((recipient) => ({
      to: recipient.address,
      value: recipient.amount,
      data: '0x',
    }));
  }

  /**
   * Populates the transaction object with data from a deserialized VeChain transaction
   * @param signedTx - The deserialized VeChain transaction containing body, signatures, and other transaction data
   * @throws {InvalidTransactionError} When the transaction is invalid or missing required data
   */
  fromDeserializedSignedTransaction(signedTx: VetTransaction): void {
    try {
      if (!signedTx || !signedTx.body) {
        throw new InvalidTransactionError('Invalid transaction: missing transaction body');
      }

      // Store the raw transaction
      this.rawTransaction = signedTx;

      // Set transaction body properties
      const body = signedTx.body;
      this.chainTag = typeof body.chainTag === 'number' ? body.chainTag : 0;
      this.blockRef = body.blockRef || '0x0';
      this.expiration = typeof body.expiration === 'number' ? body.expiration : 64;
      this.clauses = body.clauses || [];
      this.gasPriceCoef = typeof body.gasPriceCoef === 'number' ? body.gasPriceCoef : 128;
      this.gas = typeof body.gas === 'number' ? body.gas : Number(body.gas) || 0;
      this.dependsOn = body.dependsOn || null;
      this.nonce = typeof body.nonce === 'number' ? body.nonce : Number(body.nonce) || 0;
      // Set recipients from clauses
      this.recipients = body.clauses.map((clause) => ({
        address: (clause.to || '0x0').toString().toLowerCase(),
        amount: Number(clause.value).toString(),
      }));
      this.loadInputsAndOutputs();

      // Set sender address
      if (signedTx.origin) {
        this.sender = signedTx.origin.toString().toLowerCase();
      }

      // Set signatures if present
      if (signedTx.signature) {
        // First signature is sender's signature
        this.senderSignature = Buffer.from(signedTx.signature.slice(0, Secp256k1.SIGNATURE_LENGTH));

        // If there's additional signature data, it's the fee payer's signature
        if (signedTx.signature.length > Secp256k1.SIGNATURE_LENGTH) {
          this.feePayerSignature = Buffer.from(signedTx.signature.slice(Secp256k1.SIGNATURE_LENGTH));
        }
      }
    } catch (e) {
      throw new InvalidTransactionError(`Failed to deserialize transaction: ${e.message}`);
    }
  }

  addSenderSignature(signature: Buffer): void {
    this.senderSignature = signature;
  }

  getFeePayerPubKey(): string {
    return this.feePayerPubKey.pub;
  }

  addFeePayerSignature(publicKey: PublicKey, signature: Buffer): void {
    this.feePayerPubKey = publicKey;
    this.feePayerSignature = signature;
  }

  async build(): Promise<void> {
    this.buildClauses();
    await this.buildRawTransaction();
    this.generateTxnId();
    this.loadInputsAndOutputs();
  }

  /**
   * Sets the transaction ID from the raw transaction if it is signed
   * @private
   */
  private generateTxnId(): void {
    // Check if we have a raw transaction
    if (!this.rawTransaction) {
      return;
    }

    // Check if the transaction is signed by verifying signature exists
    if (!this.senderSignature || !this.feePayerSignature) {
      return;
    }

    const halfSignedTransaction: VetTransaction = VetTransaction.of(this.rawTransaction.body, this.senderSignature);
    if (!halfSignedTransaction.signature) {
      return;
    }
    const fullSignedTransaction: VetTransaction = VetTransaction.of(
      halfSignedTransaction.body,
      nc_utils.concatBytes(
        // Drop any previous gas payer signature.
        halfSignedTransaction.signature.slice(0, Secp256k1.SIGNATURE_LENGTH),
        this.feePayerSignature
      )
    );
    if (!fullSignedTransaction.signature) {
      return;
    }
    try {
      this._id = fullSignedTransaction.id.toString();
    } catch (e) {
      return;
    }
  }

  protected async buildRawTransaction(): Promise<void> {
    const transactionBody: TransactionBody = {
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: 64, //move this value to constants
      clauses: this.clauses,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: null,
      nonce: this.nonce,
      reserved: {
        features: 1, // mark transaction as delegated i.e. will use gas payer
      },
    };

    this.rawTransaction = VetTransaction.of(transactionBody);
  }

  loadInputsAndOutputs(): void {
    const totalAmount = this._recipients.reduce(
      (accumulator, current) => accumulator.plus(current.amount),
      new BigNumber('0')
    );
    this._inputs = [
      {
        address: this.sender,
        value: totalAmount.toString(),
        coin: this._coinConfig.name,
      },
    ];
    this._outputs = this._recipients.map((recipient) => {
      return {
        address: recipient.address,
        value: recipient.amount as string,
        coin: this._coinConfig.name,
      };
    });
  }

  fromRawTransaction(rawTransaction: string): void {
    let signedTxn: VetTransaction;
    try {
      signedTxn = utils.deserializeTransaction(rawTransaction);
    } catch (e) {
      throw new Error('invalid raw transaction');
    }
    this.fromDeserializedSignedTransaction(signedTxn);
  }

  /** @inheritdoc */
  toJson(): VetTransactionData {
    const json: VetTransactionData = {
      id: this.id,
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: this.expiration,
      recipients: this.recipients,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: this.dependsOn,
      nonce: this.nonce,
      sender: this.sender,
      feePayer: this.feePayerAddress,
    };

    return json;
  }

  public getFee(): string {
    return new BigNumber(this.gas)
      .multipliedBy(gasPrice)
      .multipliedBy(new BigNumber(this.gasPriceCoef).dividedBy(255).plus(1))
      .toString()
      .slice(0, 18);
  }

  public get signablePayload(): Buffer {
    return Buffer.from(this.rawTransaction.getTransactionHash().bytes);
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this.rawTransaction) {
      throw new InvalidTransactionError('Empty Transaction');
    }
    return this.serialize();
  }

  serialize(): string {
    const halfSignedTransaction: VetTransaction = VetTransaction.of(this.rawTransaction.body, this.senderSignature);
    if (!halfSignedTransaction.signature) {
      throw new InvalidTransactionError('Invalid sender signature in half-signed transaction');
    }
    if (!this.feePayerSignature) {
      throw new InvalidTransactionError('Missing fee payer signature');
    }
    const fullSignedTransaction: VetTransaction = VetTransaction.of(
      halfSignedTransaction.body,
      nc_utils.concatBytes(
        // Drop any previous gas payer signature.
        halfSignedTransaction.signature.slice(0, Secp256k1.SIGNATURE_LENGTH),
        this.feePayerSignature
      )
    );
    return HexUInt.of(fullSignedTransaction.encoded).toString();
  }

  static deserializeTransaction(rawTx: string): VetTransaction {
    try {
      if (!rawTx) {
        throw new InvalidTransactionError('Raw transaction string cannot be empty');
      }
      return utils.deserializeTransaction(rawTx);
    } catch (e) {
      if (e instanceof InvalidTransactionError) {
        throw e;
      }
      throw new InvalidTransactionError(`Failed to deserialize transaction: ${e.message}`);
    }
  }

  explainTransaction(): VetTransactionExplanation {
    const displayOrder = [
      'id',
      'outputs',
      'outputAmount',
      'changeOutputs',
      'changeAmount',
      'fee',
      'withdrawAmount',
      'sender',
      'type',
    ];

    const outputs: TransactionRecipient[] = this._recipients;
    const outputAmount = outputs
      .reduce((accumulator, current) => accumulator.plus(current.amount), new BigNumber('0'))
      .toString();
    return {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount,
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this.getFee() },
      sender: this.sender,
      type: this.type,
    };
  }
}
