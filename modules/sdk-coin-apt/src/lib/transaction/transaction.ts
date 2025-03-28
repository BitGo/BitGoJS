import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  PublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import {
  AccountAddress,
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  AccountAuthenticatorNoAccountAuthenticator,
  Aptos,
  AptosConfig,
  DEFAULT_MAX_GAS_AMOUNT,
  Ed25519PublicKey,
  Ed25519Signature,
  FeePayerRawTransaction,
  generateSigningMessage,
  generateUserTransactionHash,
  Hex,
  InputGenerateTransactionPayloadData,
  Network,
  RAW_TRANSACTION_SALT,
  RAW_TRANSACTION_WITH_DATA_SALT,
  RawTransaction,
  SignedTransaction,
  SimpleTransaction,
  TransactionAuthenticatorFeePayer,
  TransactionPayload,
} from '@aptos-labs/ts-sdk';
import { DEFAULT_GAS_UNIT_PRICE, UNAVAILABLE_TEXT } from '../constants';
import utils from '../utils';
import BigNumber from 'bignumber.js';
import { AptTransactionExplanation, TxData } from '../iface';
import assert from 'assert';

export abstract class Transaction extends BaseTransaction {
  protected _rawTransaction: RawTransaction;
  protected _senderSignature: Signature;
  protected _feePayerSignature: Signature;
  protected _sender: string;
  protected _recipients: TransactionRecipient[];
  protected _sequenceNumber: number;
  protected _maxGasAmount: number;
  protected _gasUnitPrice: number;
  protected _gasUsed: number;
  protected _expirationTime: number;
  protected _feePayerAddress: string;
  protected _assetId: string;
  protected _isSimulateTxn: boolean;

  static EMPTY_PUBLIC_KEY = Buffer.alloc(32);
  static EMPTY_SIGNATURE = Buffer.alloc(64);

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._maxGasAmount = DEFAULT_MAX_GAS_AMOUNT;
    this._gasUnitPrice = DEFAULT_GAS_UNIT_PRICE;
    this._gasUsed = 0;
    this._expirationTime = utils.getTxnExpirationTimestamp();
    this._sequenceNumber = 0;
    this._sender = AccountAddress.ZERO.toString();
    this._recipients = [];
    this._assetId = AccountAddress.ZERO.toString();
    this._isSimulateTxn = false;
    this._senderSignature = {
      publicKey: {
        pub: Hex.fromHexInput(Transaction.EMPTY_PUBLIC_KEY).toString(),
      },
      signature: Transaction.EMPTY_SIGNATURE,
    };
    this._feePayerAddress = AccountAddress.ZERO.toString();
    this._feePayerSignature = {
      publicKey: {
        pub: Hex.fromHexInput(Transaction.EMPTY_PUBLIC_KEY).toString(),
      },
      signature: Transaction.EMPTY_SIGNATURE,
    };
  }

  /** @inheritDoc **/
  public get id(): string {
    this.generateTxnId();
    return this._id ?? UNAVAILABLE_TEXT;
  }

  get sender(): string {
    return this._sender;
  }

  set sender(value: string) {
    this._sender = value;
  }

  /**
   * @deprecated - use `recipients()`.
   */
  get recipient(): TransactionRecipient {
    assert(this._recipients.length > 0, 'No recipients available');
    return this._recipients[0];
  }

  /**
   * @deprecated - use `recipients()`.
   */
  set recipient(value: TransactionRecipient) {
    this.recipients = [value];
  }

  get recipients(): TransactionRecipient[] {
    return this._recipients;
  }

  set recipients(value: TransactionRecipient[]) {
    this._recipients = value;
  }

  get sequenceNumber(): number {
    return this._sequenceNumber;
  }

  set sequenceNumber(value: number) {
    this._sequenceNumber = value;
  }

  get maxGasAmount(): number {
    return this._maxGasAmount;
  }

  set maxGasAmount(value: number) {
    this._maxGasAmount = value;
  }

  get gasUnitPrice(): number {
    return this._gasUnitPrice;
  }

  set gasUnitPrice(value: number) {
    this._gasUnitPrice = value;
  }

  get gasUsed(): number {
    return this._gasUsed;
  }

  set gasUsed(value: number) {
    this._gasUsed = value;
  }

  get expirationTime(): number {
    return this._expirationTime;
  }

  set expirationTime(value: number) {
    this._expirationTime = value;
  }

  get feePayerAddress(): string {
    return this._feePayerAddress;
  }

  set transactionType(transactionType: TransactionType) {
    this._type = transactionType;
  }

  get assetId(): string {
    return this._assetId;
  }

  set assetId(value: string) {
    this._assetId = value;
  }

  get isSimulateTxn(): boolean {
    return this._isSimulateTxn;
  }

  set isSimulateTxn(value: boolean) {
    this._isSimulateTxn = value;
  }

  protected abstract getTransactionPayloadData(): InputGenerateTransactionPayloadData;

  protected abstract parseTransactionPayload(payload: TransactionPayload): void;

  fromDeserializedSignedTransaction(signedTxn: SignedTransaction): void {
    try {
      const rawTxn = signedTxn.raw_txn;
      this.parseTransactionPayload(rawTxn.payload);
      this._sender = rawTxn.sender.toString();
      this._sequenceNumber = utils.castToNumber(rawTxn.sequence_number);
      this._maxGasAmount = utils.castToNumber(rawTxn.max_gas_amount);
      this._gasUnitPrice = utils.castToNumber(rawTxn.gas_unit_price);
      this._expirationTime = utils.castToNumber(rawTxn.expiration_timestamp_secs);
      this._rawTransaction = rawTxn;

      this.loadInputsAndOutputs();
      const authenticator = signedTxn.authenticator as TransactionAuthenticatorFeePayer;
      this._feePayerAddress = authenticator.fee_payer.address.toString();
      const senderAuthenticator = authenticator.sender as AccountAuthenticatorEd25519;
      const senderSignature = Buffer.from(senderAuthenticator.signature.toUint8Array());
      this.addSenderSignature({ pub: senderAuthenticator.public_key.toString() }, senderSignature);

      const feePayerAuthenticator = authenticator.fee_payer.authenticator as AccountAuthenticatorEd25519;
      const feePayerSignature = Buffer.from(feePayerAuthenticator.signature.toUint8Array());
      this.addFeePayerSignature(
        { pub: utils.stripHexPrefix(feePayerAuthenticator.public_key.toString()) },
        feePayerSignature
      );
    } catch (e) {
      console.error('invalid signed transaction', e);
      throw new Error('invalid signed transaction');
    }
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
    let senderAuthenticator: AccountAuthenticator;
    let feePayerAuthenticator: AccountAuthenticator;
    if (this.isSimulateTxn) {
      senderAuthenticator = new AccountAuthenticatorNoAccountAuthenticator();
      feePayerAuthenticator = new AccountAuthenticatorNoAccountAuthenticator();
    } else {
      const senderPublicKeyBuffer = utils.getBufferFromHexString(this._senderSignature.publicKey.pub);
      const senderPublicKey = new Ed25519PublicKey(senderPublicKeyBuffer);
      const senderSignature = new Ed25519Signature(this._senderSignature.signature);
      senderAuthenticator = new AccountAuthenticatorEd25519(senderPublicKey, senderSignature);

      const feePayerPublicKeyBuffer = utils.getBufferFromHexString(this._feePayerSignature.publicKey.pub);
      const feePayerPublicKey = new Ed25519PublicKey(feePayerPublicKeyBuffer);
      const feePayerSignature = new Ed25519Signature(this._feePayerSignature.signature);
      feePayerAuthenticator = new AccountAuthenticatorEd25519(feePayerPublicKey, feePayerSignature);
    }

    const txnAuthenticator = new TransactionAuthenticatorFeePayer(senderAuthenticator, [], [], {
      address: AccountAddress.fromString(this._feePayerAddress),
      authenticator: feePayerAuthenticator,
    });

    const signedTxn = new SignedTransaction(this._rawTransaction, txnAuthenticator);
    return signedTxn.toString();
  }

  addSenderSignature(publicKey: PublicKey, signature: Buffer): void {
    this._signatures = [signature.toString('hex')];
    this._senderSignature = { publicKey, signature };
  }

  getFeePayerPubKey(): string {
    return this._feePayerSignature.publicKey.pub;
  }

  addFeePayerSignature(publicKey: PublicKey, signature: Buffer): void {
    this._feePayerSignature = { publicKey, signature };
  }

  addFeePayerAddress(address: string): void {
    this._feePayerAddress = address;
  }

  async build(): Promise<void> {
    await this.buildRawTransaction();
    this.generateTxnId();
    this.loadInputsAndOutputs();
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
    let signedTxn: SignedTransaction;
    try {
      signedTxn = utils.deserializeSignedTransaction(rawTransaction);
    } catch (e) {
      console.error('invalid raw transaction', e);
      throw new Error('invalid raw transaction');
    }
    this.fromDeserializedSignedTransaction(signedTxn);
  }
  /**
   * Deserializes a signed transaction hex string
   * @param {string} signedRawTransaction
   * @returns {SignedTransaction} the aptos signed transaction
   */
  static deserializeSignedTransaction(signedRawTransaction: string): SignedTransaction {
    try {
      return utils.deserializeSignedTransaction(signedRawTransaction);
    } catch (e) {
      console.error('invalid raw transaction', e);
      throw new Error('invalid raw transaction');
    }
  }

  toJson(): TxData {
    return {
      id: this.id,
      sender: this.sender,
      recipient: this.recipient,
      recipients: this.recipients,
      sequenceNumber: this.sequenceNumber,
      maxGasAmount: this.maxGasAmount,
      gasUnitPrice: this.gasUnitPrice,
      gasUsed: this.gasUsed,
      expirationTime: this.expirationTime,
      feePayer: this.feePayerAddress,
      assetId: this.assetId,
    };
  }

  public getFee(): string {
    return new BigNumber(this.gasUsed).multipliedBy(this.gasUnitPrice).toString();
  }

  public get signablePayload(): Buffer {
    return this.feePayerAddress ? this.getSignablePayloadWithFeePayer() : this.getSignablePayloadWithoutFeePayer();
  }

  /** @inheritDoc */
  explainTransaction(): AptTransactionExplanation {
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

  protected async buildRawTransaction(): Promise<void> {
    const network: Network = this._coinConfig.network.type === NetworkType.MAINNET ? Network.MAINNET : Network.TESTNET;
    const aptos = new Aptos(new AptosConfig({ network }));
    const senderAddress = AccountAddress.fromString(this._sender);

    const simpleTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: this.getTransactionPayloadData() as InputGenerateTransactionPayloadData,
      options: {
        maxGasAmount: this.maxGasAmount,
        gasUnitPrice: this.gasUnitPrice,
        expireTimestamp: this.expirationTime,
        accountSequenceNumber: this.sequenceNumber,
      },
    });
    this._rawTransaction = simpleTxn.rawTransaction;
  }

  private getSignablePayloadWithFeePayer(): Buffer {
    const feePayerRawTxn = new FeePayerRawTransaction(
      this._rawTransaction,
      [],
      AccountAddress.fromString(this._feePayerAddress)
    );
    return Buffer.from(generateSigningMessage(feePayerRawTxn.bcsToBytes(), RAW_TRANSACTION_WITH_DATA_SALT));
  }

  private getSignablePayloadWithoutFeePayer(): Buffer {
    return Buffer.from(generateSigningMessage(this._rawTransaction.bcsToBytes(), RAW_TRANSACTION_SALT));
  }

  private generateTxnId() {
    if (
      !this._senderSignature ||
      !this._senderSignature.publicKey ||
      !this._senderSignature.signature ||
      !this._feePayerSignature ||
      !this._feePayerSignature.publicKey ||
      !this._feePayerSignature.signature ||
      !this._feePayerAddress
    ) {
      return;
    }
    const transaction = new SimpleTransaction(this._rawTransaction, AccountAddress.fromString(this._feePayerAddress));
    const senderPublicKey = new Ed25519PublicKey(utils.getBufferFromHexString(this._senderSignature.publicKey.pub));
    const senderSignature = new Ed25519Signature(this._senderSignature.signature);
    const senderAuthenticator = new AccountAuthenticatorEd25519(senderPublicKey, senderSignature);
    const feePayerPublicKey = new Ed25519PublicKey(utils.getBufferFromHexString(this._feePayerSignature.publicKey.pub));
    const feePayerSignature = new Ed25519Signature(this._feePayerSignature.signature);
    const feePayerAuthenticator = new AccountAuthenticatorEd25519(feePayerPublicKey, feePayerSignature);
    this._id = generateUserTransactionHash({ transaction, senderAuthenticator, feePayerAuthenticator });
  }
}
