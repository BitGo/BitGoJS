import { KeyPairOptions } from '@bitgo/sdk-core';
import { CosmosKeyPair } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';
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
    return toBech32(Networks.main.islm.addressPrefix, fromHex(computeAddress('0x' + this.getKeys().pub).slice(2)));
  }
}
