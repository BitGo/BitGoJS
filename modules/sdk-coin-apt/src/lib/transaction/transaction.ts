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
  AccountAuthenticatorEd25519,
  Aptos,
  APTOS_COIN,
  AptosConfig,
  DEFAULT_MAX_GAS_AMOUNT,
  Ed25519PublicKey,
  Ed25519Signature,
  generateUserTransactionHash,
  Hex,
  Network,
  RawTransaction,
  SignedTransaction,
  SimpleTransaction,
  TransactionAuthenticatorEd25519,
} from '@aptos-labs/ts-sdk';
import { DEFAULT_GAS_UNIT_PRICE, SECONDS_PER_WEEK, UNAVAILABLE_TEXT } from '../constants';
import utils from '../utils';
import BigNumber from 'bignumber.js';

export abstract class Transaction extends BaseTransaction {
  protected _rawTransaction: RawTransaction;
  protected _signature: Signature;
  protected _sender: string;
  protected _recipient: TransactionRecipient;
  protected _sequenceNumber: number;
  protected _maxGasAmount: number;
  protected _gasUnitPrice: number;
  protected _gasUsed: number;
  protected _expirationTime: number;

  static EMPTY_PUBLIC_KEY = Buffer.alloc(32);
  static EMPTY_SIGNATURE = Buffer.alloc(64);

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._maxGasAmount = DEFAULT_MAX_GAS_AMOUNT;
    this._gasUnitPrice = DEFAULT_GAS_UNIT_PRICE;
    this._gasUsed = 0;
    this._expirationTime = Math.floor(Date.now() / 1e3) + SECONDS_PER_WEEK;
    this._sequenceNumber = 0;
    this._signature = {
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

  get recipient(): TransactionRecipient {
    return this._recipient;
  }

  set recipient(value: TransactionRecipient) {
    this._recipient = value;
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

  set transactionType(transactionType: TransactionType) {
    this._type = transactionType;
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
    const publicKeyBuffer = utils.getBufferFromHexString(this._signature.publicKey.pub);
    const publicKey = new Ed25519PublicKey(publicKeyBuffer);

    const signature = new Ed25519Signature(this._signature.signature);

    const txnAuthenticator = new TransactionAuthenticatorEd25519(publicKey, signature);
    const signedTxn = new SignedTransaction(this._rawTransaction, txnAuthenticator);
    return signedTxn.toString();
  }

  addSignature(publicKey: PublicKey, signature: Buffer): void {
    this._signatures = [signature.toString('hex')];
    this._signature = { publicKey, signature };
  }

  async build(): Promise<void> {
    await this.buildRawTransaction();
    this.generateTxnId();
    this.loadInputsAndOutputs();
  }

  loadInputsAndOutputs(): void {
    this._inputs = [
      {
        address: this.sender,
        value: this.recipient.amount as string,
        coin: this._coinConfig.name,
      },
    ];
    this._outputs = [
      {
        address: this.recipient.address,
        value: this.recipient.amount as string,
        coin: this._coinConfig.name,
      },
    ];
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

  fromDeserializedSignedTransaction(signedTxn: SignedTransaction): void {
    try {
      const rawTxn = signedTxn.raw_txn;
      this._sender = rawTxn.sender.toString();
      this._recipient = utils.getRecipientFromTransactionPayload(rawTxn.payload);
      this._sequenceNumber = utils.castToNumber(rawTxn.sequence_number);
      this._maxGasAmount = utils.castToNumber(rawTxn.max_gas_amount);
      this._gasUnitPrice = utils.castToNumber(rawTxn.gas_unit_price);
      this._expirationTime = utils.castToNumber(rawTxn.expiration_timestamp_secs);
      this._rawTransaction = rawTxn;

      this.loadInputsAndOutputs();
      const authenticator = signedTxn.authenticator as TransactionAuthenticatorEd25519;
      const signature = Buffer.from(authenticator.signature.toUint8Array());
      this.addSignature({ pub: authenticator.public_key.toString() }, signature);
    } catch (e) {
      console.error('invalid signed transaction', e);
      throw new Error('invalid signed transaction');
    }
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

  protected async buildRawTransaction() {
    const network: Network = this._coinConfig.network.type === NetworkType.MAINNET ? Network.MAINNET : Network.TESTNET;
    const aptos = new Aptos(new AptosConfig({ network }));
    const senderAddress = AccountAddress.fromString(this._sender);
    const recipientAddress = AccountAddress.fromString(this._recipient.address);

    const simpleTxn = await aptos.transaction.build.simple({
      sender: senderAddress,
      data: {
        function: '0x1::coin::transfer',
        typeArguments: [APTOS_COIN],
        functionArguments: [recipientAddress, this.recipient.amount],
      },
      options: {
        maxGasAmount: this.maxGasAmount,
        gasUnitPrice: this.gasUnitPrice,
        expireTimestamp: this.expirationTime,
        accountSequenceNumber: this.sequenceNumber,
      },
    });
    this._rawTransaction = simpleTxn.rawTransaction;
  }

  public getFee(): string {
    return new BigNumber(this.gasUsed).multipliedBy(this.gasUnitPrice).toString();
  }

  private generateTxnId() {
    if (!this._signature || !this._signature.publicKey || !this._signature.signature) {
      return;
    }
    const transaction = new SimpleTransaction(this._rawTransaction);
    const publicKey = new Ed25519PublicKey(utils.getBufferFromHexString(this._signature.publicKey.pub));
    const signature = new Ed25519Signature(this._signature.signature);
    const senderAuthenticator = new AccountAuthenticatorEd25519(publicKey, signature);
    this._id = generateUserTransactionHash({ transaction, senderAuthenticator });
  }
}
