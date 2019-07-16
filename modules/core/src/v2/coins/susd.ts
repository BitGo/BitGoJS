/**
 * @prettier
 */
import { BaseCoin } from '../baseCoin';
import { MethodNotImplementedError } from '../../errors';

export class Susd extends BaseCoin {
  static createInstance(bitgo: any): BaseCoin {
    return new Susd(bitgo);
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor() {
    return 1e2;
  }

  getChain() {
    return 'susd';
  }

  getFamily() {
    return 'susd';
  }

  getFullName() {
    return 'Silvergate USD';
  }

  /**
   * Return whether the given m of n wallet signers/ key amounts are valid for the coin
   */
  isValidMofNSetup({ m, n }) {
    return m === 0 && n === 0;
  }

  isValidAddress(address: string): boolean {
    throw new MethodNotImplementedError();
  }
}
