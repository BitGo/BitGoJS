import { publicKeyToAddress } from '@stacks/encryption';
import { DefaultKeys, isPrivateKey, isPublicKey, KeyPairOptions } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import { hexPrefixString } from './utils';

export class KeyPair extends Secp256k1ExtendedKeyPair {
  constructor(source?: KeyPairOptions) {
    super(source);
    if (source) {
      if (isPrivateKey(source)) {
        super.recordKeysFromPrivateKey(source.prv);
      } else if (isPublicKey(source)) {
        super.recordKeysFromPublicKey(source.pub);
      } else {
        throw new Error('Invalid key pair options');
      }
    } else {
      throw new Error('Invalid key pair options');
    }
  }

  getKeys(): DefaultKeys {
    return {
      pub: this.keyPair.Q.getEncoded(true)
        .toString('hex')
        .toUpperCase(),
      prv: this.keyPair.d
        ? this.keyPair.d
          .toBuffer(32)
          .toString('hex')
          .toUpperCase()
        : undefined,
    };
  }

  getAddress(): string {
    return hexPrefixString(publicKeyToAddress(this.getKeys().pub));
  }
}
