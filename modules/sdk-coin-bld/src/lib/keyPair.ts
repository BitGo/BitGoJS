import { KeyPairOptions } from '@bitgo/sdk-core';
import { pubkeyToAddress } from '@cosmjs/amino';

import { CosmosKeyPair } from '@bitgo/abstract-cosmos';

/**
 * Agoric keys and address management.
 */
export class KeyPair extends CosmosKeyPair {
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /** @inheritdoc */
  getAddress(): string {
    const base64String = Buffer.from(this.getKeys().pub.slice(0, 66), 'hex').toString('base64');
    return pubkeyToAddress(
      {
        type: 'tendermint/PubKeySecp256k1',
        value: base64String,
      },
      'agoric'
    );
  }
}
