import { ECPair, HDNode } from '@bitgo/utxo-lib';
import { deriveAddress, deriveKeypair, generateSeed } from 'ripple-keypairs';
import { DefaultKeys, isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import { isValidXprv, isValidXpub } from '../../utils/crypto';

export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
    if (!source) {
      const seed = generateSeed();
      const keypair = deriveKeypair(seed);
      this.keyPair = this.generateECPair(keypair.privateKey);
    } else if (isSeed(source)) {
      const seed = generateSeed({ entropy: source.seed });
      const keypair = deriveKeypair(seed);
      this.keyPair = this.generateECPair(keypair.privateKey);
    } else if (isPrivateKey(source)) {
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      this.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }

    if (this.hdNode) {
      this.keyPair = this.hdNode.keyPair;
      this.keyPair.compressed = this.hdNode.compressed;
    }
  }

  generateECPair(prv: string): ECPair {
    return ECPair.fromPrivateKeyBuffer(Buffer.from(prv.slice(2), 'hex'));
  }

  /**
   * Build a keypair from a protocol private key or extended private key.
   *
   * The protocol private key is either 32 or 33 bytes long (64 or 66
   * characters hex).  If it is 32 bytes long, set the keypair's "compressed"
   * field to false to later generate uncompressed public keys (the default).
   * A 33 byte key has 0x00 as the first byte.
   *
   * @param {string} prv A raw private key
   */

  recordKeysFromPrivateKey(prv: string): void {
    if (isValidXprv(prv)) {
      this.hdNode = HDNode.fromBase58(prv);
      this.hdNode.keyPair.compressed = false;
    } else {
      try {
        this.keyPair = this.generateECPair(prv);
        this.keyPair.compressed = prv.length === 66;
      } catch (e) {
        throw new Error('Unsupported private key');
      }
    }
  }

  /**
   * Build an ECPair from a protocol public key or extended public key.
   *
   * The protocol public key is either 32 bytes or 64 bytes long, with a
   * one-byte prefix (a total of 66 or 130 characters in hex).  If the
   * prefix is 0x02 or 0x03, it is a compressed public key. A prefix of 0x04
   * denotes an uncompressed public key.
   *
   * @param {string} pub A raw public key
   */
  recordKeysFromPublicKey(pub: string): void {
    if (isValidXpub(pub)) {
      this.hdNode = HDNode.fromBase58(pub);
      this.hdNode.keyPair.compressed = false;
    } else {
      try {
        this.keyPair = ECPair.fromPublicKeyBuffer(Buffer.from(pub, 'hex'));
        this.keyPair.compressed = pub.length === 66;
      } catch (e) {
        throw new Error('Unsupported public key');
      }
    }
  }

  /**
   * Xrp default keys format is 33-byte compressed form
   *
   * @returns {DefaultKeys} The keys in the protocol default key format
   */
  getKeys(): DefaultKeys {
    let prv;
    if (this.hdNode) {
      const { xprv, xpub } = this.getExtendedKeys();
      prv = xprv
        ? '00' + HDNode.fromBase58(xprv).keyPair.getPrivateKeyBuffer().toString('hex').toUpperCase()
        : undefined;
      return {
        pub: HDNode.fromBase58(xpub).keyPair.getPublicKeyBuffer().toString('hex').toUpperCase(),
        prv: prv,
      };
    } else {
      prv = this.keyPair.d ? '00' + this.keyPair.d.toBuffer(32).toString('hex').toUpperCase() : undefined;
      return {
        pub: this.keyPair.Q.getEncoded(true).toString('hex').toUpperCase(),
        prv: prv,
      };
    }
  }

  getCompressed(): boolean {
    return this.keyPair.compressed;
  }

  /**
   * Get a public address of a public key.
   *
   * @returns {string} The public address
   */
  getAddress(): string {
    return deriveAddress(this.getKeys().pub);
  }
}
