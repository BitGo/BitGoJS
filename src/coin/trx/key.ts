import { BaseKey } from "../baseCoin/iface";

export class Key implements BaseKey {
  /**
   * Note: this can also be represented for signing as a byte array.
   */
  key: string;
}
