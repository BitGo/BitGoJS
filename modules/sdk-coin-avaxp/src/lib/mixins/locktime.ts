import { BN } from 'avalanche';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Constructor } from '../iface';

export interface ILocktimeBuilder {
  _locktime: BN;

  /**
   * Locktime is a long that contains the unix timestamp that this output can be spent after.
   * The unix timestamp is specific to the second.
   * @param value
   */
  locktime(value: string | number): this;

  /**
   * Validates locktime
   * @param locktime
   */
  validateLocktime(locktime: BN): void;
}

function Locktime<T extends Constructor>(targetBuilder: T): Constructor<ILocktimeBuilder> & T {
  return class LocktimeBuilder extends targetBuilder implements ILocktimeBuilder {
    _locktime: BN;

    /**
     * Locktime is a long that contains the unix timestamp that this output can be spent after.
     * The unix timestamp is specific to the second.
     * @param value
     */
    locktime(value: string | number): this {
      this.validateLocktime(new BN(value));
      this._locktime = new BN(value);
      return this;
    }

    /**
     * Validates locktime
     * @param locktime
     */
    validateLocktime(locktime: BN): void {
      if (!locktime || locktime.lt(new BN(0))) {
        throw new BuildTransactionError('Invalid transaction: locktime must be 0 or higher');
      }
    }
  };
}

export default Locktime;
