import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { BaseKey, BaseTransaction, BaseTransactionBuilder, BuildTransactionError, SigningError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { CurveType, IcpMetadata, IcpOperation, IcpPublicKey, IcpTransaction, OperationType } from './iface';
import utils from './utils';
import { UnsignedTransactionBuilder } from './unsignedTransactionBuilder';
import { SignedTransactionBuilder } from './signedTransactionBuilder';
import { KeyPair } from './keyPair';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _sender: string;
  private _publicKey: string;
  private _memo: number | BigInt;
  private _receiverId: string;
  private _amount: string;

  protected constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig, utils);
  }

  /**
   * Sets the public key and the address of the sender of this transaction.
   *
   * @param {string} address the account that is sending this transaction
   * @param {string} pubKey the public key that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public sender(address: string, pubKey: string): this {
    if (!address || !utils.isValidAddress(address.toString())) {
      throw new BuildTransactionError('Invalid or missing address, got: ' + address);
    }
    if (!pubKey || !utils.isValidPublicKey(pubKey)) {
      throw new BuildTransactionError('Invalid or missing pubKey, got: ' + pubKey);
    }
    this._sender = address;
    this._publicKey = pubKey;
    return this;
  }

  /**
   * Set the memo
   *
   * @param {number} memo - number that to be used as memo
   * @returns {TransactionBuilder} This transaction builder
   */
  public memo(memo: number): this {
    if (memo < 0) {
      throw new BuildTransactionError(`Invalid memo: ${memo}`);
    }
    this._memo = memo;
    return this;
  }

  /**
   * Sets the account Id of the receiver of this transaction.
   *
   * @param {string} accountId the account id of the account that is receiving this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public receiverId(accountId: string): this {
    if (!accountId || !utils.isValidAddress(accountId)) {
      throw new BuildTransactionError('Invalid or missing accountId for receiver, got: ' + accountId);
    }
    this._receiverId = accountId;
    return this;
  }

  /**
   * Sets the amount of this transaction.
   *
   * @param {string} value the amount to be sent in e8s (1 ICP = 1e8 e8s)
   * @returns {TransactionBuilder} This transaction builder
   */
  public amount(value: string): this {
    utils.validateValue(new BigNumber(value));
    this._amount = value;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    if (!utils.isValidAddress(transaction.icpTransactionData.senderAddress)) {
      throw new BuildTransactionError('Invalid sender address');
    }
    if (!utils.isValidAddress(transaction.icpTransactionData.receiverAddress)) {
      throw new BuildTransactionError('Invalid receiver address');
    }
    if (!utils.isValidPublicKey(transaction.icpTransactionData.senderPublicKeyHex)) {
      throw new BuildTransactionError('Invalid sender public key');
    }
    utils.validateValue(new BigNumber(transaction.icpTransactionData.amount));
    utils.validateFee(transaction.icpTransactionData.fee);
    utils.validateMemo(transaction.icpTransactionData.memo);
    utils.validateExpireTime(transaction.icpTransactionData.expiryTime);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.validateTransaction(this._transaction);
    this.buildIcpTransactionData();
    const unsignedTransactionBuilder = new UnsignedTransactionBuilder(this._transaction.icpTransaction);
    const payloadsData = await unsignedTransactionBuilder.getUnsignedTransaction();
    this._transaction.payloadsData = payloadsData;
    return this._transaction;
  }

  protected buildIcpTransactionData(): void {
    const publicKey: IcpPublicKey = {
      hex_bytes: this._publicKey,
      curve_type: CurveType.SECP256K1,
    };

    const senderOperation: IcpOperation = {
      type: OperationType.TRANSACTION,
      account: { address: this._sender },
      amount: {
        value: `-this._amount`,
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const receiverOperation: IcpOperation = {
      type: OperationType.TRANSACTION,
      account: { address: this._receiverId },
      amount: {
        value: this._amount,
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const feeOperation: IcpOperation = {
      type: OperationType.FEE,
      account: { address: this._sender },
      amount: {
        value: utils.gasData(),
        currency: {
          symbol: this._coinConfig.family,
          decimals: this._coinConfig.decimalPlaces,
        },
      },
    };

    const currentTime = Date.now() * 1000_000;
    const ingressStartTime = currentTime;
    const ingressEndTime = ingressStartTime + 5 * 60 * 1000_000_000; // 5 mins in nanoseconds
    const metaData: IcpMetadata = {
      created_at_time: currentTime,
      memo: this._memo,
      ingress_start: ingressStartTime,
      ingress_end: ingressEndTime,
    };

    const icpTransactionData: IcpTransaction = {
      public_keys: [publicKey],
      operations: [senderOperation, receiverOperation, feeOperation],
      metadata: metaData,
    };
    this._transaction.icpTransaction = icpTransactionData;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this._transaction = tx;
    const icpTransactionData = tx.icpTransactionData;
    this._sender = icpTransactionData.senderAddress;
    this._memo = icpTransactionData.memo;
    this._receiverId = icpTransactionData.receiverAddress;
    this._publicKey = icpTransactionData.senderPublicKeyHex;
    this._amount = icpTransactionData.amount;
  }

  /** @inheritdoc */
  sign(key: BaseKey): void {
    this.validateKey(key);
    if (!this.transaction.canSign(key)) {
      throw new SigningError('Private key cannot sign the transaction');
    }

    this.transaction = this.signImplementation(key);
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): BaseTransaction {
    const keyPair = new KeyPair({ prv: key.key });
    const keys = keyPair.getKeys();
    if (!keys.prv || this._publicKey !== keys.pub) {
      throw new SigningError('invalid private key');
    }
    const signedTransactionBuilder = new SignedTransactionBuilder(
      this._transaction.unsignedTransaction,
      this._transaction.signaturePayload
    );
    this._transaction.signedTransaction = signedTransactionBuilder.getSignTransaction();
    return this._transaction;
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    if (!key || !key.key) {
      throw new SigningError('Key is required');
    }
    if (!utils.isValidPrivateKey(key.key)) {
      throw new SigningError('Invalid private key');
    }
  }
}
