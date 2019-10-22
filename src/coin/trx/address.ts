import { BaseAddress } from "../baseCoin/iface";

/**
 * Addresses can be encoded in three varieties:
 * 1) ByteArray - this is a UIntArray8. Typically used for signing.
 * 2) Hex - hex encoded string
 * 3) Base58 - base58 encoded string. Typically used for display.
 */
export class Address implements BaseAddress {
  // the base58 representation
  address: string; 
}
