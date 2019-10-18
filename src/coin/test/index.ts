import { BaseCoin } from "../baseCoin";
import { Network, TransactionType, Transaction, Signature, Key } from "../..";
import BigNumber from "bignumber.js";

/**
 * The purpose of this coin is a mock to use for the test runner. Its capable of returning what we want under any circumstance.
 */
export default class TestCoin extends BaseCoin {
  constructor(network: Network) {
    super(network);
  }

  _from: number;
  _dests: number;
  _validateAddress: boolean; 
  _validateValue: boolean;
  _parseTransaction: Transaction; 
  _buildTransaction: Transaction;
  _sign: Signature;

  public setVariable(tcParams: TestCoinParams) {
      this._from = tcParams.from === undefined ? this._from : tcParams.from;
      this._dests = tcParams.dests === undefined ? this._dests : tcParams.dests;
      this._validateAddress = tcParams.validateAddress === undefined ? this._validateAddress : tcParams.validateAddress;
      this._validateValue = tcParams.validateValue === undefined ? this._validateValue : tcParams.validateValue;
      this._parseTransaction = tcParams.parseTransaction === undefined ? this._parseTransaction : tcParams.parseTransaction;
      this._buildTransaction = tcParams.buildTransaction === undefined ? this._buildTransaction : tcParams.buildTransaction;
      this._sign = tcParams.sign === undefined ? this._sign : tcParams.sign;
  }

  get displayName(): string {
    return "Test";
  }  
  
  get maxFrom(): number {
    return this._from;
  }

  get maxDestinations(): number {
    return this._dests;
  }

  public validateAddress(address: string): boolean {
    return this._validateAddress;
  }

  public validateValue(value: BigNumber): boolean {
    return this._validateValue;
  }

  public parseTransaction(rawTransaction: any, transactionType: TransactionType): Transaction {
    return this._parseTransaction;
  }

  public buildTransaction(transaction: Transaction): Transaction {
    return this._buildTransaction;
  }

  public sign(privateKey: Key, address: string, transaction: Transaction): Signature {
    return this._sign;
  }
}

interface TestCoinParams {
  from?: number;
  dests?: number; 
  validateAddress?: boolean;
  validateValue?: boolean;
  parseTransaction?: Transaction;
  buildTransaction?: Transaction;
  sign?: Signature;
}
