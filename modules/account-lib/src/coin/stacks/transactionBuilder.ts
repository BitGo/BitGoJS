import BigNumber from 'bignumber.js';
import BigNum from 'bn.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder } from '../baseCoin';
import { BaseAddress, BaseKey, BaseFee } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { SignatureData } from './iface';
import { StacksNetwork, StacksTestnet } from '@stacks/network';
import {
  BuildTransactionError,
  ParseTransactionError,
  SigningError,
  InvalidTransactionError,
} from '../baseCoin/errors';
import {
  BufferReader,
  deserializeTransaction,
  emptyMessageSignature,
  isSingleSig,
  makeSigHashPreSign,
  publicKeyFromSignature,
} from '@stacks/transactions';
import { isValidAddress, removeHexPrefix } from './utils';
import { KeyPair } from './keyPair';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  protected _fee: BaseFee;
  protected _nonce: number;
  protected _source: BaseAddress;
  protected _memo: string;
  protected _multiSignerKeyPairs: KeyPair[];
  protected _signatures: SignatureData[];
  protected _senderPubKey: string[];
  protected _network: StacksNetwork;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._multiSignerKeyPairs = [];
    this._signatures = [];
    this._senderPubKey = [];
    this._network = new StacksTestnet();
    this.transaction = new Transaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this.transaction = tx;
    const txData = tx.toJson();
    this.fee({ fee: txData.fee.toString() });
    this.source({ address: txData.from });
    if (txData.payload.memo) {
      this.memo(txData.payload.memo);
    }
    // check if it is signed or unsigned tx
    if (isSingleSig(tx.stxTransaction.auth.spendingCondition!)) {
      if (tx.stxTransaction.auth.spendingCondition.signature.data == emptyMessageSignature().data) {
        // unsigned transaction
      } else {
        const sigHashPreSign = makeSigHashPreSign(
          tx.stxTransaction.verifyBegin(),
          tx.stxTransaction.auth.authType!,
          new BigNum(this._fee.fee),
          new BigNum(this._nonce),
        );
        this._signatures.push(tx.stxTransaction.auth.spendingCondition.signature);
        this._senderPubKey.push(publicKeyFromSignature(sigHashPreSign, this._signatures[0]));
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    const stackstransaction = deserializeTransaction(BufferReader.fromBuffer(Buffer.from(rawTransaction)));
    tx.stxTransaction = stackstransaction;
    this.initBuilder(tx);
    return this.transaction;
  }


  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._transaction.stxTransaction.setFee(new BigNum(this._fee.fee));
    this._transaction.stxTransaction.setNonce(new BigNum(this._nonce));
    if (this._multiSignerKeyPairs.length == 0) {
      for (const s of this._signatures) {
        await this.transaction.signWithSignatures(s);
      }
    } else {
      for (const kp of this._multiSignerKeyPairs) {
        await this.transaction.sign(kp);
      }
    }
    this._transaction.loadInputsAndOutputs();
    return this._transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.checkDuplicatedKeys(key);
    const signer = new KeyPair({ prv: key.key });

    // Signing the transaction is an operation that relies on all the data being set,
    // so we set the source here and leave the actual signing for the build step
    this._multiSignerKeyPairs.push(signer);
    return this.transaction;
  }

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
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


  senderPubKey(pubKey: string[]): this {
    this._senderPubKey = pubKey;
    return this;
  }

  network(stacksNetwork: StacksNetwork): this {
    this._network = stacksNetwork;
    return this;
  }

  nonce(n: number): this {
    this._nonce = n;
    return this;
  }

  /**
  *  Set the memo
  *
  * @param {string} memo
  * @returns {TransactionBuilder} This transaction builder
  */
  memo(memo: string): this {
    this._memo = memo;
    return this;
  }

  /**
   * Set the transaction source
   *
   * @param {BaseAddress} address The source account
   * @returns {TransactionBuilder} This transaction builder
   */
  source(address: BaseAddress): this {
    this.validateAddress(address);
    this._source = address;
    return this;
  }

  // endregion

  /**
 * Validates that the given key is not already in this._multiSignerKeyPairs
 *
 * @param {BaseKey} key - The key to check
 */
  private checkDuplicatedKeys(key: BaseKey) {
    this._multiSignerKeyPairs.forEach(_sourceKeyPair => {
      if (_sourceKeyPair.getKeys().prv === key.key) {
        throw new SigningError('Repeated sign: ' + key.key);
      }
    });
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
  validateRawTransaction(rawTransaction: any): void {
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
    this.validateSource();
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
    if (!this._fee.fee) {
      throw new BuildTransactionError('Invalid transaction: missing gas limit');
    }
    try {
      this.validateValue(new BigNumber(this._fee.fee));
    } catch (e) {
      throw new BuildTransactionError('Invalid gas limit');
    }
  }

  /**
 * Validates that the source field is defined
 */
  private validateSource(): void {
    if (this._source === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing source');
    }
    this.validateAddress(this._source);
  }
  // endregion
}
