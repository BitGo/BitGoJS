import { avmSerial, pvmSerial, UnsignedTx } from '@bitgo-forks/avalanchejs';
import { BaseTransactionBuilder, BuildTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedUtxoObj, Tx } from './iface';
import { KeyPair } from './keyPair';
import { Transaction } from './transaction';
import utils from './utils';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected recoverSigner = false;
  public _signer: KeyPair[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   * @returns itself
   */
  initBuilder(tx: Tx): this {
    const baseTx = ((tx as UnsignedTx).tx as pvmSerial.AddPermissionlessValidatorTx).baseTx;
    if (
      baseTx.NetworkId.value() !== this._transaction._networkID ||
      baseTx.BlockchainId.value() !== this._transaction._blockchainID
    ) {
      throw new Error('Network or blockchain is not equals');
    }
    this._transaction.setTransaction(tx);
    return this;
  }

  // region Validators
  /**
   * Validates the threshold
   * @param threshold
   */
  validateThreshold(threshold: number): void {
    if (!threshold || threshold !== 2) {
      throw new BuildTransactionError('Invalid transaction: threshold must be set to 2');
    }
  }

  /**
   * Check the UTXO has expected fields.
   * @param UTXO
   */
  validateUtxo(value: DecodedUtxoObj): void {
    ['outputID', 'amount', 'txid', 'outputidx'].forEach((field) => {
      if (!value.hasOwnProperty(field)) throw new BuildTransactionError(`Utxos required ${field}`);
    });
  }

  /**
   * Check the list of UTXOS is empty and check each UTXO.
   * @param values
   */
  validateUtxos(values: DecodedUtxoObj[]): void {
    if (values.length === 0) {
      throw new BuildTransactionError("Utxos can't be empty array");
    }
    values.forEach(this.validateUtxo);
  }

  /**
   * Validates locktime
   * @param locktime
   */
  validateLocktime(locktime: bigint): void {
    if (!locktime || locktime < BigInt(0)) {
      throw new BuildTransactionError('Invalid transaction: locktime must be 0 or higher');
    }
  }
  // endregion

  /**
   * Threshold is an int that names the number of unique signatures required to spend the output.
   * Must be less than or equal to the length of Addresses.
   * @param {number} value
   */
  threshold(value: number): this {
    this.validateThreshold(value);
    this._transaction._threshold = value;
    return this;
  }

  /**
   * Locktime is a long that contains the unix timestamp that this output can be spent after.
   * The unix timestamp is specific to the second.
   * @param value
   */
  locktime(value: string | number): this {
    this.validateLocktime(BigInt(value));
    this._transaction._locktime = BigInt(value);
    return this;
  }

  /**
   * When using recovery key must be set here
   * TODO: STLX-17317 recovery key signing
   * @param {boolean}[recoverSigner=true] whether it's recovery signer
   */
  recoverMode(recoverSigner = true): this {
    this.recoverSigner = recoverSigner;
    return this;
  }

  /**
   * fromPubKey is a list of unique addresses that correspond to the private keys that can be used to spend this output
   * @param {string | string[]} senderPubKey
   */
  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this._transaction._fromAddresses = pubKeys.map(utils.parseAddress);
    return this;
  }

  /**
   * List of UTXO required as inputs.
   * A UTXO is a standalone representation of a transaction output.
   *
   * @param {DecodedUtxoObj[]} list of UTXOS
   */
  utxos(value: DecodedUtxoObj[]): this {
    this.validateUtxos(value);
    this._transaction._utxos = value;
    return this;
  }

  // TODO(CR-1073):
  // Implement:
  //  buildImplementation
  //  signImplementation
  //  get transaction
  //  set transaction
  //  validateRawTransaction

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const [tx] = pvmSerial.AddPermissionlessValidatorTx.fromBytes(
      Buffer.from(rawTransaction, 'hex'),
      avmSerial.getAVMManager().getDefaultCodec()
    );
    // TODO(CR-1073): check if initBuilder can only use UnsignedTx and pvmSerial.BaseTx is not required
    this.initBuilder(tx);
    return this._transaction;
  }
}
