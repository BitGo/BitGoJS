import { KeyPairOptions } from '@bitgo-beta/sdk-core';
import { CosmosKeyPair } from '@bitgo-beta/abstract-cosmos';
import { ADDRESS_PREFIX } from './constants';
import { toBech32, fromHex } from '@cosmjs/encoding';
import { computeAddress } from 'ethers/lib/utils';

/**
 * Islm keys and address management.
 */
export class KeyPair extends CosmosKeyPair {
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /** @inheritdoc */
  getAddress(): string {
    return toBech32(ADDRESS_PREFIX, fromHex(computeAddress('0x' + this.getKeys().pub).slice(2)));
  }
}
