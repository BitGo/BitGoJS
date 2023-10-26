import { KeyPairOptions, AddressFormat } from '@bitgo/sdk-core';
import { pubkeyToAddress } from '@cosmjs/amino';

import { CosmosKeyPair } from '@bitgo/abstract-cosmos';
import { MAINNET_ADDRESS_PREFIX, TESTNET_ADDRESS_PREFIX } from './constants';

/**
 * Coreum keys and address management.
 */
export class KeyPair extends CosmosKeyPair {
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /** @inheritdoc */
  getAddress(format: AddressFormat = AddressFormat.mainnet): string {
    const base64String = Buffer.from(this.getKeys().pub.slice(0, 66), 'hex').toString('base64');
    const address_prefix = format === AddressFormat.testnet ? TESTNET_ADDRESS_PREFIX : MAINNET_ADDRESS_PREFIX;
    return pubkeyToAddress(
      {
        type: 'tendermint/PubKeySecp256k1',
        value: base64String,
      },
      address_prefix
    );
  }
}
