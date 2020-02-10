import { localForger, CODEC } from '@taquito/local-forging';
import { BaseTransaction } from '../baseCoin';
import BigNumber from 'bignumber.js';
import { InvalidTransactionError, ParseTransactionError, SigningError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin/';
import { BaseKey } from '../baseCoin/iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { KeyPair } from './keyPair';
import { InMemorySigner } from '@taquito/signer';
import { isValidSignature} from './utils';
import { Operation, ParsedTransaction } from './iface';

/**
 * Tezos transaction model.
 */
export class Transaction extends BaseTransaction {
  private _parsedTransaction?: ParsedTransaction; // transaction in JSON format
  private _encodedTransaction?: string;  // transaction in hex format

  /**
   * Public constructor.
   *
   * @param {Readonly<CoinConfig>} coinConfig
   * @param parsedTransaction A Tezos transaction object
   */
  constructor(coinConfig: Readonly<CoinConfig>, parsedTransaction?: ParsedTransaction) {
    super(coinConfig);
    if (parsedTransaction) {
      this.recordRawDataFields(parsedTransaction);
    }
  }

  /**
   * Initialize the transaction fields based on a serialized transaction.
   *
   * @param serializedTransaction Transaction in broadcast format.
   */
  async init(serializedTransaction: string): Promise<void> {
    this._encodedTransaction = serializedTransaction;
    try {
      const parsedTransaction = await localForger.parse(serializedTransaction);
      this.recordRawDataFields(parsedTransaction);
    } catch (e) {
      // If it throws, it is possible the serialized transaction is signed, which is not supported
      // by local-forging. Try extracting the last 64 bytes and parse it again.
      const unsignedSerializedTransaction = serializedTransaction.slice(0, -128);
      const signature = serializedTransaction.slice(-128);
      if (isValidSignature(signature)) {
        throw new ParseTransactionError('Invalid transaction');
      }
      // TODO: encode the signature and save it in _signature
      const parsedTransaction = await localForger.parse(unsignedSerializedTransaction);
      this.recordRawDataFields(parsedTransaction);
    }
  }

  /**
   * Record the most important fields from the parsed transaction.
   *
   * @param parsedTransaction A Tezos transaction object
   */
  private recordRawDataFields(parsedTransaction: ParsedTransaction): void {
    // TODO: make sure transaction ids cannot be calculated offline
    this._id = '';
    this._parsedTransaction = parsedTransaction;
    parsedTransaction.contents.forEach(operation => {
      switch (operation.kind) {
        case CODEC.OP_ORIGINATION:
          this.recordOriginationOpFields(operation);
          break;
        default:
          throw new ParseTransactionError('Unsupported contract type');
      }
    });
  }

  /**
   * Record the most important fields from an origination operation.
   *
   * @param operation An operation object from a Tezos transaction
   */
  private recordOriginationOpFields(operation: Operation): void {
    this._type = TransactionType.WalletInitialization;
    this._outputs.push({
      // TODO: use the function in eztz to calculate the originated account address and assign it to
      // this._id (https://github.com/TezTech/eztz/blob/cfdc4fcfc891f4f4f077c3056f414476dde3610b/src/main.js#L768)
      address: '',
      // Balance
      value: new BigNumber(operation.balance),
    });
    this._inputs.push({
      address: operation.source,
      // Balance + fees + max gas + max storage are paid by the source account
      value: new BigNumber(operation.balance).plus(operation.fee)
    });
  }

  /**
   * Sign the transaction with the provided key. It does not check if the signer is allowed to sign
   * it or not.
   *
   * @param {KeyPair} keyPair The key to sign the transaction with
   */
  async sign(keyPair: KeyPair): Promise<void> {
    // TODO: fail if the transaction is already signed
    if (!keyPair.getKeys().prv) {
      throw new SigningError('Missing private key');
    }
    // Check if there is a transaction to sign
    if (!this._parsedTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    // Get the transaction body to sign
    const encodedTransaction = await localForger.forge(this._parsedTransaction);

    // Sign the transaction offline
    const signer = new InMemorySigner(keyPair.getKeys().prv!);
    // TODO: remove after https://github.com/ecadlabs/taquito/issues/252 is closed
    await signer.publicKeyHash();

    const signedTransaction = await signer.sign(encodedTransaction, new Uint8Array([3]));
    this._encodedTransaction = signedTransaction.sbytes;
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
