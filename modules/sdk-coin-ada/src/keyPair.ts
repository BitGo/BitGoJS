import { DefaultKeys, KeyPairOptions, Ed25519KeyPair, toHex, AddressFormat } from '@bitgo/sdk-core';
import {
  PublicKey,
  PrivateKey,
  EnterpriseAddress,
  NetworkInfo,
  StakeCredential,
} from '@emurgo/cardano-serialization-lib-nodejs';

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
   *  @returns { Address }
   */
  getAddress(format): string {
    const bytesFromHex = new Uint8Array(Buffer.from(this.keyPair.pub, 'hex'));
    const pubKey = PublicKey.from_bytes(bytesFromHex);
    let enterpriseAddress;
    if (format === AddressFormat.testnet) {
      enterpriseAddress = EnterpriseAddress.new(
        NetworkInfo.testnet().network_id(),
        StakeCredential.from_keyhash(pubKey.hash())
      );
    } else if (format === AddressFormat.mainnet) {
      enterpriseAddress = EnterpriseAddress.new(
        NetworkInfo.mainnet().network_id(),
        StakeCredential.from_keyhash(pubKey.hash())
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
    const rawPrv = PrivateKey.from_bech32(prv).as_bytes();
    return new KeyPair({ prv: toHex(rawPrv) }).keyPair;
  }

  recordKeysFromPublicKeyInProtocolFormat(pub: string): DefaultKeys {
    const rawPub = PublicKey.from_bech32(pub).as_bytes();
    return { pub: toHex(rawPub) };
  }
}
