import { HDNode } from '@bitgo/utxo-lib';
import { addHexPrefix, pubToAddress } from 'ethereumjs-util';
import { ecc } from 'eosjs-ecc';
import { DefaultKeys, isPrivateKey, isPublicKey, KeyPairOptions } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import { BuildTransactionError } from '../baseCoin/errors';

/**
 * Eos keys and address management.
 */
export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key (extended or raw), or a public key
   *     (extended, compressed, or uncompressed)
   */
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
    const { xpub, xprv } = this.getExtendedKeys();

    const hdNode = HDNode.fromBase58(xpub);
    console.log('HD Node', hdNode); // this shows a buffer was created
    return ecc.PublicKey.fromBuffer(hdNode.getPublicKeyBuffer()).toString();
    // console.log('pub key', pubKey)
    // return pubKey;

    /**
     * Ethereum default keys format is raw private and uncompressed public key
     *
     * @returns { DefaultKeys } The keys in the protocol default key format
     */
  }
}
