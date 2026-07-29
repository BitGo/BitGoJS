import BigNumber from 'bignumber.js';
import BigNum from 'bn.js';
import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import {
  AuthType,
  BufferReader,
  deserializeTransaction,
  emptyMessageSignature,
  isSingleSig,
  makeSigHashPreSign,
  nextVerification,
  publicKeyFromSignature,
  StacksMessageType,
  PubKeyEncoding,
} from '@stacks/transactions';
import { StacksNetwork, StacksTestnet, StacksMainnet } from '@stacks/network';
import {
  BaseAddress,
  BaseFee,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  InvalidParameterValueError,
  InvalidTransactionError,
  ParseTransactionError,
  SigningError,
  xprvToRawPrv,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { SignatureData } from './iface';
import { isValidAddress, removeHexPrefix, isValidMemo, isValidPublicKey } from './utils';
import { ANCHOR_MODE, DEFAULT_MULTISIG_SIG_NUMBER } from './constants';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  protected _anchorMode: number;
  protected _fee: BaseFee;
  protected _nonce: number;
  protected _memo: string;
  protected _numberSignatures: number;
  protected _multiSignerKeyPairs: KeyPair[];
  protected _signatures: SignatureData[];
  protected _network: StacksNetwork;
  protected _fromPubKeys: string[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._anchorMode = ANCHOR_MODE;
    this._multiSignerKeyPairs = [];
    this._fromPubKeys = [];
    this._signatures = [];
    this._numberSignatures = DEFAULT_MULTISIG_SIG_NUMBER;
    this._network = _coinConfig.network.type === NetworkType.MAINNET ? new StacksMainnet() : new StacksTestnet();
    this._transaction = new Transaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this.transaction = tx;
    // check if it is signed or unsigned tx
    if (tx.stxTransaction.auth.spendingCondition === undefined) {
      throw new InvalidTransactionError('spending condition cannot be undefined');
    }
    const txData = tx.toJson();
    this.fee({ fee: txData.fee.toString() });
    this.nonce(txData.nonce);
    let sigHash = tx.stxTransaction.verifyBegin();

    const authType = tx.stxTransaction.auth.authType ? tx.stxTransaction.auth.authType : AuthType.Standard;
    if (isSingleSig(tx.stxTransaction.auth.spendingCondition)) {
      this._numberSignatures = 1;
      if (tx.stxTransaction.auth.spendingCondition.signature.data !== emptyMessageSignature().data) {
        const signature = tx.stxTransaction.auth.spendingCondition.signature;
        sigHash = makeSigHashPreSign(sigHash, authType, new BigNum(this._fee.fee), new BigNum(this._nonce));
        this._signatures.push({ ...signature, index: 0, sigHash });
        this._fromPubKeys = [publicKeyFromSignature(sigHash, signature)];
      }
    } else {
      this._numberSignatures = tx.stxTransaction.auth.spendingCondition.signaturesRequired;
      tx.stxTransaction.auth.spendingCondition.fields.forEach((field, index) => {
        if (field.contents.type === StacksMessageType.MessageSignature) {
          const signature = field.contents;
          const nextVerify = nextVerification(
            sigHash,
            authType,
            new BigNum(this._fee.fee),
            new BigNum(this._nonce),
            PubKeyEncoding.Compressed, // useless param as Compressed is hardcoded in stacks lib
            signature
          );
          sigHash = nextVerify.nextSigHash;
          this._signatures.push({ ...signature, index, sigHash });
          this._fromPubKeys.push(nextVerify.pubKey.data.toString('hex'));
        } else {
          this._fromPubKeys.push(field.contents.data.toString('hex'));
        }
      });
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    const stackstransaction = deserializeTransaction(
      BufferReader.fromBuffer(Buffer.from(removeHexPrefix(rawTransaction), 'hex'))
    );
    tx.stxTransaction = stackstransaction;
    this.initBuilder(tx);
    return this.transaction;
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const isMultiSig: boolean = this._fromPubKeys.length > 1;
    this._transaction.stxTransaction.setFee(new BigNum(this._fee.fee));
    this._transaction.stxTransaction.setNonce(new BigNum(this._nonce));

    for (let index = 0; index < this._fromPubKeys.length; index++) {
      const pubKey = this._fromPubKeys[index];
      const signature = this.getSignature(pubKey, index);
      if (signature) {
        await this.transaction.signWithSignatures(signature, isMultiSig);
      } else {
        const prvKey = this.getPrivateKey(pubKey, index);
        if (prvKey) {
          await this.transaction.sign(prvKey);
        } else if (isMultiSig) {
          await this.transaction.appendOrigin(pubKey);
        }
      }
    }

    this._transaction.loadInputsAndOutputs();
    return this._transaction;
  }

  private getSignature = (_: string, index: number): SignatureData | undefined =>
    this._signatures.find((s) => s.index === index);
  private getPrivateKey = (pubKey: string, _: number): KeyPair | undefined =>
    this._multiSignerKeyPairs.find((kp) => kp.getKeys(true).pub === pubKey || kp.getKeys().pub === pubKey);

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.checkDuplicatedKeys(key);
    let prv = key.key;
    if (prv.startsWith('xprv')) {
      const rawPrv = xprvToRawPrv(prv);
      prv = new KeyPair({ prv: rawPrv }).getKeys(true).prv;
    }
    const signer = new KeyPair({ prv: prv });

    // Signing the transaction is an operation that relies on all the data being set,
    // so we set the source here and leave the actual signing for the build step
    this._multiSignerKeyPairs.push(signer);
    const publicKey = signer.getKeys(signer.getCompressed()).pub;
    if (!this._fromPubKeys.includes(publicKey)) {
      this._fromPubKeys.push(publicKey);
    }
    return this.transaction;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /**
   * Validates that the given key is not already in this._multiSignerKeyPairs
   *
   * @param {BaseKey} key - The key to check
   */
  private checkDuplicatedKeys(key: BaseKey) {
    this._multiSignerKeyPairs.forEach((_sourceKeyPair) => {
      if (_sourceKeyPair.getKeys().prv === key.key) {
        throw new SigningError('Repeated sign: ' + key.key);
      }
    });
  }

  /**
   * Set the transaction fees
   *
   * @param {BaseFee} fee The maximum gas to pay
   * @returns {TransactionBuilder} This transaction builder
   */
  fee(fee: BaseFee): this {
    this.validateValue(new BigNumber(fee.fee));
    this._fee = fee;
    return this;
  }

  nonce(n: number): this {
    this._nonce = n;
    return this;
  }

  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this._fromPubKeys = [];
    pubKeys.forEach((key) => {
      if (isValidPublicKey(key)) {
        this._fromPubKeys.push(key);
      } else {
        throw new InvalidParameterValueError('Invalid public key');
      }
    });
    return this;
  }

  /**
   *  Set the memo
   *
   * @param {string} memo
   * @returns {TransactionBuilder} This transaction builder
   */
  memo(memo: string): this {
    if (!isValidMemo(memo)) {
      throw new BuildTransactionError('Memo is too long');
    }
    this._memo = memo;
    return this;
  }

  /**
   *  Set the number of signatures for multi-sig
   *
   * @param {number} numSigns
   * @returns {TransactionBuilder} This transaction builder
   */
  numberSignatures(numSigns: number): this {
    this.validateValue(new BigNumber(numSigns));
    this._numberSignatures = numSigns;
    return this;
  }

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    const keyPair = new KeyPair({ prv: key.key });
    if (!keyPair.getKeys().prv) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    try {
      deserializeTransaction(BufferReader.fromBuffer(Buffer.from(removeHexPrefix(rawTransaction), 'hex')));
    } catch (e) {
      throw new ParseTransactionError('There was an error parsing the raw transaction');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateFee();
    this.validateNonce();
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /**
   * Validates that the fee field is defined
   */
  private validateFee(): void {
    if (this._fee === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing fee');
    }
    try {
      this.validateValue(new BigNumber(this._fee.fee));
    } catch (e) {
      throw new BuildTransactionError('Invalid fee');
    }
  }

  /**
   * Validates that nonce is defined
   */
  private validateNonce(): void {
    if (this._nonce === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing nonce');
    }
    try {
      this.validateValue(new BigNumber(this._nonce));
    } catch (e) {
      throw new BuildTransactionError(`Invalid nonce ${this._nonce}`);
    }
  }
}
