import { localForger, CODEC } from '@taquito/local-forging';
import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction } from '../baseCoin';
import { InvalidTransactionError, ParseTransactionError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin/';
import { BaseKey } from '../baseCoin/iface';
import { getTransferDataFromOperation } from '../../../resources/xtz/multisig';
import { KeyPair } from './keyPair';
import { Operation, OriginationOp, ParsedTransaction, RevealOp, TransactionOp } from './iface';
import * as Utils from './utils';

/**
 * Tezos transaction model.
 */
export class Transaction extends BaseTransaction {
  private _parsedTransaction?: ParsedTransaction; // transaction in JSON format
  private _encodedTransaction?: string; // transaction in hex format

  /**
   * Public constructor.
   *
   * @param {Readonly<CoinConfig>} coinConfig
   */
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Initialize the transaction fields based on another serialized transaction.
   *
   * @param serializedTransaction Transaction in broadcast format.
   */
  async initFromSerializedTransaction(serializedTransaction: string): Promise<void> {
    this._encodedTransaction = serializedTransaction;
    try {
      const parsedTransaction = await localForger.parse(serializedTransaction);
      await this.initFromParsedTransaction(parsedTransaction);
    } catch (e) {
      // If it throws, it is possible the serialized transaction is signed, which is not supported
      // by local-forging. Try extracting the last 64 bytes and parse it again.
      const unsignedSerializedTransaction = serializedTransaction.slice(0, -128);
      const signature = serializedTransaction.slice(-128);
      if (Utils.isValidSignature(signature)) {
        throw new ParseTransactionError('Invalid transaction');
      }
      // TODO: encode the signature and save it in _signature
      const parsedTransaction = await localForger.parse(unsignedSerializedTransaction);
      const transactionId = await Utils.calculateTransactionId(serializedTransaction);
      await this.initFromParsedTransaction(parsedTransaction, transactionId);
    }
  }

  /**
   * Initialize the transaction fields based on another parsed transaction.
   *
   * @param {ParsedTransaction} parsedTransaction A Tezos transaction object
   * @param {string} transactionId The transaction id of the parsedTransaction if it is signed
   */
  async initFromParsedTransaction(parsedTransaction: ParsedTransaction, transactionId?: string): Promise<void> {
    if (transactionId) {
      // If the transaction id is passed, save it and clean up the entries since they will be
      // recalculated
      this._id = transactionId;
      this._inputs = [];
      this._outputs = [];
    } else {
      this._id = '';
    }
    this._parsedTransaction = parsedTransaction;
    let operationIndex = 0;
    parsedTransaction.contents.forEach(async operation => {
      switch (operation.kind) {
        case CODEC.OP_ORIGINATION:
          await this.recordOriginationOpFields(operation as OriginationOp, operationIndex);
          operationIndex++;
          break;
        case CODEC.OP_REVEAL:
          this.recordRevealOpFields(operation as RevealOp);
          break;
        case CODEC.OP_TRANSACTION:
          this.recordTransactionOpFields(operation as TransactionOp);
          break;
        default:
          break;
      }
    });
  }

  /**
   * Record the most important fields from an origination operation.
   *
   * @param {Operation} operation An operation object from a Tezos transaction
   * @param {number} index The origination operation index in the transaction. Used to calculate the
   *      originated address
   */
  private async recordOriginationOpFields(operation: OriginationOp, index: number): Promise<void> {
    this._type = TransactionType.WalletInitialization;
    this._outputs.push({
      // Kt addresses can only be calculated for signed transactions with an id
      address: this._id ? await Utils.calculateOriginatedAddress(this._id, index) : '',
      // Balance
      amount: operation.balance,
    });
    this._inputs.push({
      address: operation.source,
      // Balance + fees + max gas + max storage are paid by the source account
      amount: new BigNumber(operation.balance).plus(operation.fee).toString(),
    });
  }

  /**
   * Record the most important fields from a reveal operation.
   *
   * @param {RevealOp} operation A reveal operation object from a Tezos transaction
   */
  private recordRevealOpFields(operation: RevealOp): void {
    this._type = TransactionType.AddressInitialization;
    this._inputs.push({
      address: operation.source,
      // Balance + fees + max gas + max storage are paid by the source account
      amount: operation.fee,
    });
  }

  /**
   * Record the most important fields for a Transaction operation.
   *
   * @param {TransactionOp} operation A transaction object from a Tezos operation
   */
  private recordTransactionOpFields(operation: TransactionOp): void {
    this._type = TransactionType.Send;
    // Fees are paid by the source account, same as the amount
    this._inputs.push({
      address: operation.source,
      amount: new BigNumber(operation.amount).plus(operation.fee).toString(),
    });

    const transferData = getTransferDataFromOperation(operation);
    if (transferData.coin === 'mutez') {
      this._outputs.push({
        // Kt addresses can only be calculated for signed transactions with an id
        address: transferData.address,
        // Balance
        amount: transferData.amount,
      });
      // The funds being transferred from the wallet
      this._inputs.push({
        address: operation.destination,
        // Balance + fees + max gas + max storage are paid by the source account
        amount: transferData.amount,
      });
    }
  }

  /**
   * Sign the transaction with the provided key. It does not check if the signer is allowed to sign
   * it or not.
   *
   * @param {KeyPair} keyPair The key to sign the transaction with
   */
  async sign(keyPair: KeyPair): Promise<void> {
    // TODO: fail if the transaction is already signed
    // Check if there is a transaction to sign
    if (!this._parsedTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    // Get the transaction body to sign
    const encodedTransaction = await localForger.forge(this._parsedTransaction);

    const signedTransaction = await Utils.sign(keyPair, encodedTransaction);
    this._encodedTransaction = signedTransaction.sbytes;

    // The transaction id can only be calculated for signed transactions
    this._id = await Utils.calculateTransactionId(this._encodedTransaction);
    await this.initFromParsedTransaction(this._parsedTransaction, this._id);

    this._signatures.push(signedTransaction.sig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    // TODO: check the key belongs to the _source account in _parsedTransaction
    return true;
  }

  /** @inheritdoc */
  toJson(): ParsedTransaction {
    if (!this._parsedTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this._parsedTransaction;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._encodedTransaction) {
      throw new InvalidTransactionError('Missing encoded transaction');
    }
    return this._encodedTransaction;
  }
}
