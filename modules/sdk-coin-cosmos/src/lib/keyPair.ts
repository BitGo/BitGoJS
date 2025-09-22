import { KeyPairOptions } from '@bitgo-beta/sdk-core';
import { pubkeyToAddress } from '@cosmjs/amino';
import { CosmosKeyPair } from '@bitgo-beta/abstract-cosmos';
import { BaseCoin, CosmosNetwork } from '@bitgo-beta/statics';

/**
 * Cosmos keys and address management for the shared Cosmos SDK.
 */
export class KeyPair extends CosmosKeyPair {
  private readonly _coin?: Readonly<BaseCoin>;

  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param source Either a master seed, a private key (extended or raw), or a public key
   * @param coin The coin configuration for this key pair
   */
  constructor(source?: KeyPairOptions, coin?: Readonly<BaseCoin>) {
    super(source);
    this._coin = coin;
  }

  /** @inheritdoc */
  getAddress(): string {
    if (!this._coin) {
      throw new Error('Coin configuration is required to derive address');
    }

    const network = this._coin.network as CosmosNetwork;
    if (!network || !network.addressPrefix) {
      throw new Error('Invalid network configuration: missing addressPrefix');
    }

    const addressPrefix = network.addressPrefix;
    const base64String = Buffer.from(this.getKeys().pub.slice(0, 66), 'hex').toString('base64');

    return pubkeyToAddress(
      {
        type: 'tendermint/PubKeySecp256k1',
        value: base64String,
      },
      addressPrefix
    );
  }
}
