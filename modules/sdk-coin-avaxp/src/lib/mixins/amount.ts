import { BN } from 'avalanche';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Constructor } from '../iface';

export interface IAmountBuilder {
  _amount: BN;

  /**
   * Amount is a long that specifies the quantity of the asset that this output owns. Must be positive.
   * The transaction output amount add a fixed fee that will be paid upon import.
   *
   * @param {BN | string} amount The withdrawal amount
   */
  amount(amount: BN | string): this;

  /**
   * Check the amount is positive.
   * @param amount
   */
  validateAmount(amount: BN): void;
}

function Amount<T extends Constructor>(targetBuilder: T): Constructor<IAmountBuilder> & T {
  return class AmountBuilder extends targetBuilder implements IAmountBuilder {
    _amount: BN;

    /**
     * Amount is a long that specifies the quantity of the asset that this output owns. Must be positive.
     * The transaction output amount add a fixed fee that will be paid upon import.
     *
     * @param {BN | string} amount The withdrawal amount
     */
    amount(amount: BN | string): this {
      const amountBN = BN.isBN(amount) ? amount : new BN(amount);
      this.validateAmount(amountBN);
      this._amount = amountBN;
      return this;
    }

    /**
     * Check the amount is positive.
     * @param amount
     */
    validateAmount(amount: BN): void {
      if (amount.lten(0)) {
        throw new BuildTransactionError('Amount must be greater than 0');
      }
    }
  };
}

export default Amount;
