import { KeyPairOptions } from '@bitgo/sdk-core';
import { CosmosKeyPair } from '@bitgo/abstract-cosmos';

/**
 * Fetch keys and address management.
 */
export class KeyPair extends CosmosKeyPair {
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /** @inheritdoc */
  getAddress(): string {
    throw new Error('Method not implemented.');
  }
}
