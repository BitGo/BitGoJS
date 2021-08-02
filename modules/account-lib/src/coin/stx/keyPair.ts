import { randomBytes } from 'crypto';
import { ECPair, HDNode } from '@bitgo/utxo-lib';
import { getAddressFromPublicKey, TransactionVersion } from '@stacks/transactions';
import { DefaultKeys, isPrivateKey, isPublicKey, isSeed, KeyPairOptions } from '../baseCoin/iface';
import { Secp256k1ExtendedKeyPair } from '../baseCoin/secp256k1ExtendedKeyPair';
import { isValidXprv, isValidXpub } from '../../utils/crypto';
import { isValidPrivateKey, isValidPublicKey } from './utils';

const DEFAULT_SEED_SIZE_BYTES = 64;

export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key, or a public key
   */
  constructor(source?: KeyPairOptions) {
    super(source);
    if (!source) {
      const seed = randomBytes(DEFAULT_SEED_SIZE_BYTES);
      this.hdNode = HDNode.fromSeedBuffer(seed);
      this.hdNode.keyPair.compressed = false;
    } else if (isSeed(source)) {
      this.hdNode = HDNode.fromSeedBuffer(source.seed);
      this.hdNode.keyPair.compressed = false;
    } else if (isPrivateKey(source)) {
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      this.recordKeysFromPublicKey(source.pub);
    } else {
      throw new Error('Invalid key pair options');
    }

    if (this.hdNode) {
      this.keyPair = this.hdNode.keyPair;
    }
  }

  /**
   * Build a keypair from a protocol private key or extended private key.
   *
   * The protocol private key is either 32 or 33 bytes long (64 or 66
   * characters hex).  If it is 32 bytes long, set the keypair's "compressed"
   * field to false to later generate uncompressed public keys (the default).
   * A 33 byte key has 0x01 as the last byte.
   *
   * @param {string} prv A raw private key
   */
  recordKeysFromPrivateKey(prv: string): void {
    if (!isValidPrivateKey(prv)) {
      throw new Error('Unsupported private key');
    }

    if (isValidXprv(prv)) {
      this.hdNode = HDNode.fromBase58(prv);
      this.hdNode.keyPair.compressed = false;
    } else {
      this.keyPair = ECPair.fromPrivateKeyBuffer(Buffer.from(prv.slice(0, 64), 'hex'));
      this.keyPair.compressed = prv.length === 66;
    }
  }

  /**
   * Build an ECPair from a protocol public key or extended public key.
   *
   * The protocol public key is either 32 bytes or 64 bytes long, with a
   * one-byte prefix (a total of 66 or 130 characters in hex).  If the
   * prefix is 0x02 or 0x03, it is a compressed public key.  A prefix of 0x04
   * denotes an uncompressed public key.
   *
   * @param {string} pub A raw public key
   */
  recordKeysFromPublicKey(pub: string): void {
    if (!isValidPublicKey(pub)) {
      throw new Error('Unsupported public key');
    }

    if (isValidXpub(pub)) {
      this.hdNode = HDNode.fromBase58(pub);
      this.hdNode.keyPair.compressed = false;
    } else {
      this.keyPair = ECPair.fromPublicKeyBuffer(Buffer.from(pub, 'hex'));
      this.keyPair.compressed = pub.length === 66;
    }
  }

  /**
   * Stacks default keys format is raw private and uncompressed public key
   *
   * @param {boolean} compressed - Compress public key (defaults to false)
   * @returns {DefaultKeys} The keys in the protocol default key format
   */
  getKeys(compressed = false): DefaultKeys {
    let prv;

    if (this.hdNode) {
      const { xpub, xprv } = this.getExtendedKeys();
      prv = xprv ? HDNode.fromBase58(xprv).keyPair.getPrivateKeyBuffer().toString('hex') : undefined;
      prv = prv && compressed ? prv + '01' : prv;

      const kp = HDNode.fromBase58(xpub);
      kp.keyPair.compressed = compressed;

      return {
        pub: kp.getPublicKeyBuffer().toString('hex'),
        prv: prv,
      };
    } else {
      prv = this.keyPair.d ? this.keyPair.d.toBuffer(32).toString('hex') : undefined;
      prv = prv && compressed ? prv + '01' : prv;

      return {
        pub: this.keyPair.Q.getEncoded(compressed).toString('hex'),
        prv: prv,
      };
    }
  }

  getCompressed(): boolean {
    return this.keyPair.compressed;
  }

  /**
   * Get a public address of an uncompressed public key.
   *
   * @returns {string} The public address
   */
  getAddress(): string {
    return this.getSTXAddress(false, TransactionVersion.Mainnet);
  }

  /**
   * Get a public address of an uncompressed public key.
   *
   * @param {boolean} compressed - Compress public key (defaults to false)
   * @param {TransactionVersion} network - select Mainnet or Testnet for the address
   * @returns {string} The public address
   */
  getSTXAddress(compressed = false, network: TransactionVersion = TransactionVersion.Mainnet): string {
    return getAddressFromPublicKey(this.getKeys(compressed).pub, network);
  }
}
