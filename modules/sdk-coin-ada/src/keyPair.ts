import { DefaultKeys, KeyPairOptions, Ed25519KeyPair, toHex } from '@bitgo/sdk-core';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

export class KeyPair extends Ed25519KeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   *
   */
  constructor(source?: KeyPairOptions) {
    super(source);
  }

  /**
   *  @param {string} network
   *  @returns { CardanoWasm.Address }
   */
  getAddress(network): string {
    const formattedNetwork = network.toLowerCase().trim();
    if (formattedNetwork !== 'testnet' && formattedNetwork !== 'mainnet') {
      throw new Error('Invalid network option');
    }

    const bytesFromHex = new Uint8Array(Buffer.from(this.keyPair.pub, 'hex'));
    const pubKey = CardanoWasm.PublicKey.from_bytes(bytesFromHex);
    let enterpriseAddress;
    if (formattedNetwork === 'testnet') {
      enterpriseAddress = CardanoWasm.EnterpriseAddress.new(
        CardanoWasm.NetworkInfo.testnet().network_id(),
        CardanoWasm.StakeCredential.from_keyhash(pubKey.hash())
      );
    } else if (formattedNetwork === 'mainnet') {
      enterpriseAddress = CardanoWasm.EnterpriseAddress.new(
        CardanoWasm.NetworkInfo.mainnet().network_id(),
        CardanoWasm.StakeCredential.from_keyhash(pubKey.hash())
      );
    }
    return enterpriseAddress.to_address().to_bech32();
  }

  getKeys(): DefaultKeys {
    const result: DefaultKeys = { pub: this.keyPair.pub };
    if (this.keyPair.prv) {
      result.prv = this.keyPair.prv;
    }
    return result;
  }

  recordKeysFromPrivateKeyInProtocolFormat(prv: string): DefaultKeys {
    const rawPrv = CardanoWasm.PrivateKey.from_bech32(prv).as_bytes();
    return new KeyPair({ prv: toHex(rawPrv) }).keyPair;
  }

  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const rawPub = CardanoWasm.PublicKey.from_bech32(pub).as_bytes();
    return { pub: toHex(rawPub) };
  }
}
