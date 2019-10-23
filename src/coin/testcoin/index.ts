import { BaseCoin } from "../baseCoin";
import BigNumber from "bignumber.js";
import { BaseTransaction, BaseSignature, BaseAddress, BaseKey } from "../baseCoin/iface";
import { TransactionType } from "../baseCoin/enum";
import { NetworkType } from "@bitgo/statics";

/**
 * The purpose of this coin is a mock to use for the test runner. Its capable of returning what we want under any circumstance.
 */
export class TestCoin extends BaseCoin {
  constructor() {
    super(NetworkType.TESTNET);
  }

  _from: number;
  _dests: number;
  _validateAddress: boolean = true; 
  _validateValue: boolean;
  _validateKey: boolean = true;
  _parseTransaction: BaseTransaction; 
  _buildTransaction: BaseTransaction;
  _sign: BaseTransaction;

  public setVariable(tcParams: TestCoinParams) {
      this._from = tcParams.from === undefined ? this._from : tcParams.from;
      this._dests = tcParams.dests === undefined ? this._dests : tcParams.dests;
      this._validateAddress = tcParams.validateAddress === undefined ? this._validateAddress : tcParams.validateAddress;
      this._validateValue = tcParams.validateValue === undefined ? this._validateValue : tcParams.validateValue;
      this._validateKey = tcParams.validateKey === undefined ? this._validateKey : tcParams.validateKey;
      this._parseTransaction = tcParams.parseTransaction === undefined ? this._parseTransaction : tcParams.parseTransaction;
      this._buildTransaction = tcParams.buildTransaction === undefined ? this._buildTransaction : tcParams.buildTransaction;
      this._sign = tcParams.sign === undefined ? this._sign : tcParams.sign;
  }

  get displayName(): string {
    return "Test";
  }  

  public validateAddress(address: BaseAddress, addressFormat?: string) {
    return this._validateAddress;
  }

  public validateValue(value: BigNumber): boolean {
    return this._validateValue;
  }

  public validateKey(key: BaseKey) {
    return this._validateKey;
  }

  public parseTransaction(rawTransaction: any, transactionType: TransactionType): BaseTransaction {
    return this._parseTransaction;
  }

  public buildTransaction(transaction: BaseTransaction): BaseTransaction {
    return this._buildTransaction;
  }

  public sign(privateKey: BaseKey, address: BaseAddress, transaction: BaseTransaction): BaseTransaction {
    return this._sign;
  }
}

interface TestCoinParams {
  from?: number;
  dests?: number; 
  validateAddress?: boolean;
  validateValue?: boolean;
  validateKey?: boolean;
  parseTransaction?: BaseTransaction;
  buildTransaction?: BaseTransaction;
  sign?: BaseTransaction;
}

export class Address implements BaseAddress {
  address: string;
}