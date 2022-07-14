import BigNumber from 'bignumber.js';
import { InvalidParameterValueError } from '@bitgo/sdk-core';
import { FunctionCall } from './iface';

/**
 * Contains parameters to call a Near Function Call action
 */
export class ContractCallWrapper {
  private _methodName: string;
  private _args: Record<string, unknown>;
  private _gas: string;
  private _deposit: string;

  /** Set method contract name */
  public set methodName(methodName: string) {
    this._methodName = methodName;
  }

  /** Get method contract name */
  public get methodName(): string {
    return this._methodName;
  }

  /** Set gas, expresed on yocto */
  public set gas(gas: string) {
    if (!this.isValidAmount(new BigNumber(gas))) {
      throw new InvalidParameterValueError('Invalid gas value');
    }
    this._gas = gas;
  }

  /** Get gas, expresed on yocto*/
  public get gas(): string {
    return this._gas;
  }

  /** Set deposit, expresed on yocto */
  public set deposit(deposit: string) {
    if (!this.isValidAmount(new BigNumber(deposit))) {
      throw new InvalidParameterValueError('Invalid deposit value');
    }
    this._deposit = deposit;
  }

  /** Get deposit, expresed on yocto */
  public get deposit(): string {
    return this._deposit;
  }

  /** Get args, which are the parameters of a method */
  public set args(args: Record<string, unknown>) {
    this._args = args;
  }

  /** Set args, which are the parameters of a method */
  public get args(): Record<string, unknown> {
    return this._args;
  }

  /**
   * Get all parameters of the contractCallWrapper
   * @returns {FunctionCall}
   */
  getParams(): FunctionCall {
    return {
      methodName: this._methodName,
      args: this._args,
      gas: this._gas,
      deposit: this._deposit,
    };
  }

  private isValidAmount(value: BigNumber): boolean {
    return !value.isLessThan(0);
  }
}
