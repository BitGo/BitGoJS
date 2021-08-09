import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { Eth } from '../../index';
import { NotImplementedError } from '../baseCoin/errors';
import { TransferBuilder } from './transferBuilder';

export const DEFAULT_M = 3;
export const DEFAULT_N = 2;
export class TransactionBuilder extends Eth.TransactionBuilder {

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Returns the smart contract encoded data
   *
   * @param {string[]} addresses - the contract signers
   * @returns {string} - the smart contract encoded data
   */
  protected getContractData(addresses: string[]): string {
    throw new NotImplementedError('getContractData not implemented');
  }

  /** @inheritdoc */
  transfer(data?: string): TransferBuilder {
    throw new NotImplementedError('getContractData not implemented');
  }
}
