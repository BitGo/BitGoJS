import { HDNode } from '@bitgo/utxo-lib';
import { addHexPrefix, pubToAddress } from 'ethereumjs-util';
import { ecc } from 'eosjs-ecc';
import { DefaultKeys, isPrivateKey, isPublicKey, KeyPairOptions } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import { BuildTransactionError } from '../baseCoin/errors';

// const ecc = require('eosjs-ecc');

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

    // getKeys(): DefaultKeys {
    //   // Always use the compressed version to be consistent
    //   const pub = this.keyPair.Q.getEncoded(true);

    //   const result: DefaultKeys = {
    //     pub: Utils.base58encode(Utils.hashTypes.sppk.prefix, pub),
    //   };

    //   if (this.keyPair.d) {
    //     const prv = this.keyPair.getPrivateKeyBuffer();
    //     result.prv = Utils.base58encode(Utils.hashTypes.spsk.prefix, prv);
    //   }
    //   return result;
    // }

    // getKeys(): DefaultKeys {
    //   const pub = bitcoin.HDNode.fromBase58(xpub);

    //   const result:

    //   if (this.hdNode) {
    //     const { xpub, xprv } = this.getExtendedKeys();
    //     return {

    //       const pub = bitcoin.HDNode.fromBase58(xpub);
    //       ecc.PublicKey.fromBuffer(pub.getPublicKeyBuffer()).toString();

    //       const xpubToEOSPubkey = function(xpub) {
    //         const hdNode = bitcoin.HDNode.fromBase58(xpub);
    //         return ecc.PublicKey.fromBuffer(hdNode.getPublicKeyBuffer()).toString();
    //       };

    //       pub: HDNode.fromBase58(xpub)
    //         .getPublicKeyBuffer()
    //         .toString('hex')
    //         .toUpperCase(),
    //       prv: xprv
    //         ? HDNode.fromBase58(xprv)
    //             .keyPair.getPrivateKeyBuffer()
    //             .toString('hex')
    //             .toUpperCase()
    //         : undefined,
    //     };
    //   } else {
    //     return {
    //       pub: this.keyPair.Q.getEncoded(false)
    //         .toString('hex')
    //         .toUpperCase(),
    //       prv: this.keyPair.d
    //         ? this.keyPair.d
    //             .toBuffer(32)
    //             .toString('hex')
    //             .toUpperCase()
    //         : undefined,
    //     };
    //   }
    // }
  }
}
// /**
//  * Take an xpub and return the EOS pubkey version of it
//  * @param {String} xpub The xpub to turn into an EOS pubkey
//  * @return The EOS style public key
//  */
// const xpubToEOSPubkey = function(xpub) {
//   const hdNode = bitcoin.HDNode.fromBase58(xpub);
//   return ecc.PublicKey.fromBuffer(hdNode.getPublicKeyBuffer()).toString();
// };

//   /**
//    * Get an Eos public address
//    *
//    * @returns {string} The address derived from the public key
//    */
//   getAddress(): string {
//     const publicKey = Buffer.from(this.getKeys().pub, 'hex'); // first two characters identify a public key
//     return addHexPrefix(pubToAddress(publicKey, true).toString('hex'));
//   }
// }

//   /**
//    * Return Tezos default keys with the respective prefixes
//    *
//    * @returns {DefaultKeys} The keys in the protocol default key format
//    */
//   getKeys(): DefaultKeys {
//     // Always use the compressed version to be consistent
//     const pub = this.keyPair.Q.getEncoded(true);
//     const result: DefaultKeys = {
//       pub: Utils.base58encode(Utils.hashTypes.sppk.prefix, pub),
//     };
//     if (this.keyPair.d) {
//       const prv = this.keyPair.getPrivateKeyBuffer();
//       result.prv = Utils.base58encode(Utils.hashTypes.spsk.prefix, prv);
//     }
//     return result;
//   }

// let re = new RegExp("1-5","a-z")
