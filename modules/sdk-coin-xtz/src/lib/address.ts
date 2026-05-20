import { BaseAddress } from '@bitgo/sdk-core';

/**
 * Base 58 address with tz2 prefix (secp256k1)
 */
export class Address implements BaseAddress {
  // the base58 representation
  address: string;
}
