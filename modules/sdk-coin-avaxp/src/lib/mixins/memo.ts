import { Buffer as BufferAvax } from 'avalanche';
import { Constructor } from '../iface';
import utils from '../utils';

export interface IMemoBuilder {
  _memo: BufferAvax;

  /**
   *
   * @param value Optional Buffer for the memo
   * @returns value Buffer for the memo
   * set using Buffer.from("message")
   */
  memo(value: string): this;
}

function Memo<T extends Constructor>(targetBuilder: T): Constructor<IMemoBuilder> & T {
  return class MemoBuilder extends targetBuilder implements IMemoBuilder {
    _memo: BufferAvax;

    /**
     *
     * @param value Optional Buffer for the memo
     * @returns value Buffer for the memo
     * set using Buffer.from("message")
     */
    memo(value: string): this {
      this._memo = utils.binTools.stringToBuffer(value);
      return this;
    }
  };
}

export default Memo;
