import { BaseCoin } from "../baseCoin";
import { Network, BaseTransaction, BaseSignature, BaseKey, TransactionType } from "../..";
import { coins } from '@bitgo/statics';
import BigNumber from "bignumber.js";
import { Transaction } from './transaction';
import TronHelpers, { RawTransaction } from "./helpers";
import { DecodedTransaction, ContractType } from "./iface";
import { AssertionError } from "assert";
import { Key } from "./key";
import { stringify } from "querystring";
import { Signature } from "./signature";

const tronweb = require('tronweb');
const tronproto = require('../../../resources/trx/protobuf/tron_pb');
const contractproto = require('../../../resources/trx/protobuf/Contract_pb');

export default class Trx extends BaseCoin {
  public buildTransaction(transaction: BaseTransaction): BaseTransaction {
    throw new Error("Method not implemented.");
  }

  public parseTransaction(rawTransaction: any, transactionType: TransactionType): Transaction {
    const tx = new Transaction();

    if (typeof rawTransaction !== 'string') {
      throw new Error('Raw transaction needs to be a base64 encoded string.');
    }

    // store our transaction
    tx.rawTx = rawTransaction;
    tx.transactionType = transactionType;

    // try to parse our transaction
    let parsedTx: DecodedTransaction;
    try {
      parsedTx = TronHelpers.decodeTransaction(rawTransaction);
    } catch (e) {
      tx.failedParse = true;
      throw e;
    }

    switch (parsedTx.contractType) {
      case ContractType.Transfer: 
        tx.parsedTx = parsedTx;
        break;
      default:
        throw new Error('This contract type is undefined or unsupported.');
    }

    return tx;
  }

  public sign(privateKey: Key, address: string, transaction: Transaction): Signature {
    if (!transaction.txID) {
      throw new Error('txID needs to be set to sign.');
    }

    let rawTx: RawTransaction = { txID: transaction.txID, signature: [] };
    let signedTx: RawTransaction;
    let sig = new Signature();
    try {
      signedTx = TronHelpers.signTransaction(privateKey.key, rawTx);

      if (signedTx.signature && signedTx.signature.length > 0) {
        sig.signature = signedTx.signature[0];
      } else {
        throw new Error('Failed to sign transaction.');
      }
    } catch (e) {
      sig.failedSigning = true;
    }

    return sig;
  }
  
  public validateValue(value: BigNumber) {
    if (value.isLessThanOrEqualTo(0)) {
      throw new Error('Value cannot be below zero.');
    }

    // TODO: is there a max value for Tron sending?
  }

  public validateAddress(address: string) {
    // assumes a base 58 address
    if (!TronHelpers.isBase58Address(address)) {
      throw new Error(address + ' is not a valid base58 address.');
    }
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

  constructor(networkType: Network) {
    super(networkType);

    if (networkType === Network.Main) {
      this.staticsCoin = coins.get('TRX');
    } else if (networkType === Network.Test) {
      this.staticsCoin = coins.get('TTRX');
    }
  }
}
