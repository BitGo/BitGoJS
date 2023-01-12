import { Buffer as BufferAvax } from 'avalanche';
import { Constructor } from '../iface';
import utils from '../utils';

export interface IToBuilder {
  _to: BufferAvax[];

  /**
   * Export tx target P wallet.
   *
   * @param pAddresses
   */
  to(pAddresses: string | string[]): this;
}

function To<T extends Constructor>(targetBuilder: T): Constructor<IToBuilder> & T {
  return class ToBuilder extends targetBuilder implements IToBuilder {
    _to: BufferAvax[];

    /**
     * Export tx target P wallet.
     *
     * @param pAddresses
     */
    to(pAddresses: string | string[]): this {
      const pubKeys = pAddresses instanceof Array ? pAddresses : pAddresses.split('~');
      this._to = pubKeys.map(utils.parseAddress);
      return this;
    }
  };
}

export default To;
