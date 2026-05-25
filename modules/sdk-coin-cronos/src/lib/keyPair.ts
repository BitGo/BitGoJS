import { AddressFormat, KeyPairOptions } from '@bitgo/sdk-core';
import { pubkeyToAddress } from '@cosmjs/amino';

import { CosmosKeyPair } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

/**
 * Cronos keys and address management.
 */
export class KeyPair extends CosmosKeyPair {
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /** @inheritdoc */
  getAddress(format: AddressFormat = AddressFormat.mainnet): string {
    const base64String = Buffer.from(this.getKeys().pub.slice(0, 66), 'hex').toString('base64');
    const address_prefix =
      format === AddressFormat.testnet ? Networks.test.cronos.addressPrefix : Networks.main.cronos.addressPrefix;
    return pubkeyToAddress(
      {
        type: 'tendermint/PubKeySecp256k1',
        value: base64String,
      },
      address_prefix
    );
  }
}
