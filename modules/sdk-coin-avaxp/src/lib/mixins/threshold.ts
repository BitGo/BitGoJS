import { BuildTransactionError } from '@bitgo/sdk-core';
import { Constructor } from '../iface';

export interface IThresholdBuilder {
  _threshold: number;

  /**
   * Threshold is an int that names the number of unique signatures required to spend the output.
   * Must be less than or equal to the length of Addresses.
   * @param {number}
   */
  threshold(value: number): this;

  /**
   * Validates the threshold
   * @param threshold
   */
  validateThreshold(threshold: number): void;
}

function Threshold<T extends Constructor>(targetBuilder: T): Constructor<IThresholdBuilder> & T {
  return class ThresholdBuilder extends targetBuilder implements IThresholdBuilder {
    _threshold: number;

    /**
     * Threshold is an int that names the number of unique signatures required to spend the output.
     * Must be less than or equal to the length of Addresses.
     * @param {number}
     */
    threshold(value: number): this {
      this.validateThreshold(value);
      this._threshold = value;
      return this;
    }

    /**
     * Validates the threshold
     * @param threshold
     */
    validateThreshold(threshold: number): void {
      if (!threshold || threshold !== 2) {
        throw new BuildTransactionError('Invalid transaction: threshold must be set to 2');
      }
    }
  };
}

export default Threshold;
