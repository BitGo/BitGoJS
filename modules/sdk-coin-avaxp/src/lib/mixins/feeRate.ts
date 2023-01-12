import { BN } from 'avalanche';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Constructor } from '../iface';

export interface IFeeRateBuilder {
  _feeRate: number;

  /**
   * C-Chain base fee with decimal places converted form 18 to 9.
   *
   * @param {string | number} baseFee
   */
  feeRate(baseFee: string | number): this;

  /**
   * Check that fee is grater than 0.
   * @param {BN} fee
   */
  validateFee(fee: BN): void;
}

function FeeRate<T extends Constructor>(targetBuilder: T): Constructor<IFeeRateBuilder> & T {
  return class FeeRateBuilder extends targetBuilder implements IFeeRateBuilder {
    _feeRate: number;

    /**
     * C-Chain base fee with decimal places converted form 18 to 9.
     *
     * @param {string | number} baseFee
     */
    feeRate(baseFee: string | number): this {
      const bnValue = new BN(baseFee);
      this.validateFee(bnValue);
      this._feeRate = bnValue.toNumber();
      return this;
    }

    /**
     * Check that fee is grater than 0.
     * @param {BN} fee
     */
    validateFee(fee: BN): void {
      if (fee.lten(0)) {
        throw new BuildTransactionError('Fee must be greater than 0');
      }
    }
  };
}

export default FeeRate;
