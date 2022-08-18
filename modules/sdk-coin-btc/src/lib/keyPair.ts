import { randomBytes } from 'crypto';
import * as bip32 from 'bip32';
import {
  AddressFormat as BaseAddressFormat,
  DefaultKeys,
  isPrivateKey,
  isPublicKey,
  isSeed,
  KeyPairOptions,
  NotImplementedError,
  NotSupported,
  Secp256k1ExtendedKeyPair,
} from '@bitgo/sdk-core';
import { address, crypto, networks } from 'bitcoinjs-lib';

const DEFAULT_SEED_SIZE_BYTES = 16;
const COMPRESSED_PUBLIC_KEY_BYTE_LENGTH = 33;

// TODO: extend the AddressFormat enum in @bitgo/sdk-core with these values
enum ExtendedAddressFormat {
  mainnetBech32 = 'mainnetBech32',
  testnetBech32 = 'testnetBech32',
  mainnetMultisig = 'mainnetBech32',
  testnetMultisig = 'testnetBech32',
}

export type AddressFormatType = BaseAddressFormat | ExtendedAddressFormat;
export const AddressFormat = { ...BaseAddressFormat, ...ExtendedAddressFormat };

/** Bitcoin key management. */
export class KeyPair extends Secp256k1ExtendedKeyPair {
  /**
   * Public constructor. By default, creates a key pair with a random master seed.
   *
   * @param { KeyPairOptions } source Either a master seed, a private key (extended or raw), or a public key
   *     (extended, compressed, or uncompressed)
   */
  constructor(source?: KeyPairOptions) {
    super(source);
    if (!source) {
      const seed = randomBytes(DEFAULT_SEED_SIZE_BYTES);
      this.hdNode = bip32.fromSeed(seed);
    } else if (isSeed(source)) {
      this.hdNode = bip32.fromSeed(source.seed);
    } else if (isPrivateKey(source)) {
      this.recordKeysFromPrivateKey(source.prv);
    } else if (isPublicKey(source)) {
      this.recordKeysFromPublicKey(source.pub);
      // TODO: move this to Secp256k1ExtendedKeyPair
      this.keyPair.compressed = Buffer.from(source.pub, 'hex').length === COMPRESSED_PUBLIC_KEY_BYTE_LENGTH;
    } else {
      throw new Error('Invalid key pair options');
    }

    if (this.hdNode) {
      this.keyPair = Secp256k1ExtendedKeyPair.toKeyPair(this.hdNode);
    }
  }

  /**
   * Bitcoin uncompressed public and private keys in hex format.
   *
   * @returns { DefaultKeys } The keys in the protocol default key format
   */
  getKeys(): DefaultKeys {
    return {
      pub: this.getPublicKey({ compressed: this.keyPair.compressed }).toString('hex'),
      prv: this.getPrivateKey()?.toString('hex'),
    };
  }

  /**
   * Get a bitcoin address in legacy or bech32 format.
   *
   * @param {AddressFormatType} format One of mainnet, testnet, mainnetBech32, or testnetBech32. mainnetMultisig is not
   *    supported since it requires multiple key pairs.
   * @returns {string} The address derived from the public key
   */
  getAddress(format?: AddressFormatType): string {
    const compressed = this.keyPair.compressed;
    const publicKeyHash160 = crypto.ripemd160(crypto.sha256(this.getPublicKey({ compressed })));

    if (!format) {
      // Return mainnet legacy addresses by default
      return address.toBase58Check(publicKeyHash160, networks.bitcoin.pubKeyHash);
    }

    switch (format) {
      case AddressFormat.mainnet:
        return address.toBase58Check(publicKeyHash160, networks.bitcoin.pubKeyHash);
      case AddressFormat.testnet:
        return address.toBase58Check(publicKeyHash160, networks.testnet.pubKeyHash);
      case AddressFormat.mainnetBech32:
        return address.toBech32(publicKeyHash160, 0, networks.bitcoin.bech32);
      case AddressFormat.testnetBech32:
        return address.toBech32(publicKeyHash160, 0, networks.testnet.bech32);
      case AddressFormat.mainnetMultisig:
      case AddressFormat.testnetMultisig:
        throw new NotSupported(
          'Unsupported address format: ' +
            format +
            '. Multisig addresses require multiple key sets and is not supported in the KeyPair class '
        );
      default:
        throw new NotImplementedError('Unsupported address format: ' + format);
    }
  }
}
