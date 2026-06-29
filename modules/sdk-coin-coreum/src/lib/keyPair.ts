import { KeyPairOptions, AddressFormat } from '@bitgo/sdk-core';
import { pubkeyToAddress } from '@cosmjs/amino';

import { CosmosKeyPair } from '@bitgo/abstract-cosmos';
import { Networks } from '@bitgo/statics';

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
    const address_prefix =
      format === AddressFormat.testnet ? Networks.test.coreum.addressPrefix : Networks.main.coreum.addressPrefix;
    return pubkeyToAddress(
      {
        type: 'tendermint/PubKeySecp256k1',
        value: base64String,
      },
      address_prefix
    );
  }
}
