import { BaseCoin } from "../baseCoin";
import { coins, NetworkType } from '@bitgo/statics';
import BigNumber from "bignumber.js";
import { Transaction } from './transaction';
import { RawTransaction, TransactionReceipt } from './iface';
import { Key } from './key';
import { Signature } from './signature';
import { ParseTransactionError, SigningError, BuildTransactionError } from '../baseCoin/errors';
import { Address } from './address';
import { BaseKey, BaseTransaction } from '../baseCoin/iface';
import { TransactionType } from '../baseCoin/enum';
import Utils from "./utils";
import { ContractType } from "./enum";

export default class Trx extends BaseCoin {
  public buildTransaction(transaction: Transaction): Transaction {
    if (transaction.transactionType === TransactionType.Recieve) {
      throw new BuildTransactionError('Called build on a recieve transaction.');
    }

    switch (transaction.tx.raw_data.contractType) {
      case ContractType.Transfer:
      case ContractType.AccountPermissionUpdate:
        return transaction;
      default:
        throw new BuildTransactionError('Contract type not implemented.');
    }
  }

  /**
   * Helper function for parsing a transaction's raw_data field.
   * @param rawDataHex Raw data field encoded as hex in tron.proto
   */
  private createRawTransaction(rawDataHex: string): RawTransaction {
    let parsedTx: RawTransaction;
    try {
      parsedTx = Utils.decodeTransaction(rawDataHex);
    } catch (e) {
      throw new ParseTransactionError('Failed to decode transaction.');
    }

    return parsedTx;
  }

  /**
   * Helper function for parsing a transaction.
   * @param rawTransaction Transaction from the node
   */
  private createTransactionReceipt(rawTransaction: string): TransactionReceipt {
    const raw = JSON.parse(rawTransaction);
    
    let txID: string;
    // TODO: need a validation method for txID
    if (raw.txID && Utils.isValidHex(raw.txID)) {
      txID = raw.txID;
    } else {
      throw new ParseTransactionError('Raw transaction needs to have a valid txID.');
    }

    // this is an optional field - its possible signature is an empty array
    let signature: Array<string> = new Array<string>();
    if (raw.signature && Array.isArray(raw.signature)) {
      signature = raw.signature;
    }

    let rawData: RawTransaction;
    if (raw.raw_data_hex && Utils.isValidHex(raw.raw_data_hex)) {
      rawData = this.createRawTransaction(raw.raw_data_hex);
    } else {
      throw new ParseTransactionError('Raw transaction needs to have a valid state.');
    }
    
    return {
      txID,
      raw_data: rawData,
      signature,
    };
  }

  /**
   * Parse transaction takes in raw JSON directly from the node.
   */
  public parseTransaction(rawTransaction: any, transactionType: TransactionType): Transaction {
    const tx = new Transaction(this.network);

    if (typeof rawTransaction !== 'string') {
      throw new ParseTransactionError('Raw transaction needs to be a JSON encoded string.');
    }

    // store our transaction data for later
    tx.rawTx = rawTransaction;
    tx.transactionType = transactionType;
    tx.tx = this.createTransactionReceipt(rawTransaction);

    return tx;
  }

  public sign(privateKey: Key, address: Address, transaction: Transaction): Transaction {
    if (!transaction.tx) {
      throw new SigningError('tx needs to be parsed.');
    }

    if (!transaction.tx.txID) {
      throw new SigningError('txID needs to exist on our transaction.');
    }

    // store our signatures, since we want to compare the new sig to another in a later step
    const oldSigs = transaction.tx.signature;
    let signedTx: TransactionReceipt;
    try {
      signedTx = Utils.signTransaction(privateKey.key, transaction.tx);
    } catch (e) {
      throw new SigningError('Failed to sign transaction via helper.');
    }

    // ensure that we have more signatures than what we started with
    let oldSignatureCount = oldSigs ? oldSigs.length : 0;
    if (!signedTx.signature || oldSignatureCount >= signedTx.signature.length) {
      throw new SigningError('Transaction signing did not return an additional signature.');
    }

    transaction.tx = signedTx;

    return transaction;
  }
  
  /**
   * Validates a passed value. This is TRX units.
   */
  public validateValue(value: BigNumber) {
    if (value.isLessThanOrEqualTo(0)) {
      throw new Error('Value cannot be below zero.');
    }

    // max long in Java - assumed upper limit for a TRX transaction
    if (value.isGreaterThan(new BigNumber("9223372036854775807"))) {
      throw new Error('Value cannot be greater than handled by the javatron node.');
    }
  }

  public validateAddress(address: Address) {
    // assumes a base 58 address for our addresses
    if (!Utils.isBase58Address(address.address)) {
      throw new Error(address + ' is not a valid base58 address.');
    }
  }

  public validateKey(key: BaseKey) {
    // TODO: determine format for key
    return true;
  }

  get displayName(): string {
    return this.staticsCoin.fullName;
  }

  get maxFrom(): number {
    return 1;
  }

  get maxDestinations(): number {
    return 1;
  }

  constructor(network: NetworkType) {
    super(network);

    if (network === NetworkType.MAINNET) {
      this.staticsCoin = coins.get('TRX');
    } else if (network === NetworkType.TESTNET) {
      this.staticsCoin = coins.get('TTRX');
    }
  }
}
