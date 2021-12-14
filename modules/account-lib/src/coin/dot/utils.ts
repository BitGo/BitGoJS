import { decodeAddress, encodeAddress, Keyring } from '@polkadot/keyring';
import { decodePair } from '@polkadot/keyring/pair/decode';
import { KeyringPair } from '@polkadot/keyring/types';
import { EXTRINSIC_VERSION } from '@polkadot/types/extrinsic/v4/Extrinsic';
import { hexToU8a, isHex, u8aToHex, stringToU8a } from '@polkadot/util';
import { base64Decode, signatureVerify } from '@polkadot/util-crypto';
import { isValidEd25519PublicKey } from '../../utils/crypto';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { construct, createMetadata } from '@substrate/txwrapper-polkadot';
import base32 from 'hi-base32';
import { KeyPair } from '.';
import type { HexString } from '@polkadot/util/types';
import { BaseUtils } from '../baseCoin';
import { Seed } from '../baseCoin/iface';
import { ProxyCallArgs, TransferArgs } from './iface';
import nacl from 'tweetnacl';
const polkaUtils = require('@polkadot/util');
const { createTypeUnsafe } = require('@polkadot/types');

const SIGNATURE_LENGTH = 64; // https://docs.rs/py-sr25519-bindings/latest/sr25519/constant.SIGNATURE_LENGTH.html
const PROXY_METHOD_ARG = 2;
export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    try {
      encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
      return true;
    } catch (error) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return isHex(hash, 256);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    try {
      const decodedPrv = hexToU8a(key);
      return decodedPrv.length === nacl.sign.secretKeyLength / 2;
    } catch (e) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    return isValidEd25519PublicKey(key);
  }

  /**
   * Signs a given message with a given key pair
   *
   * @param {string} key the keypair to sign with
   * @param {string} message the message to sign
   */
  signMessage(key: KeyringPair, message: string): Uint8Array {
    return key.sign(stringToU8a(message));
  }

  /**
   * Verifies the signature on a given message
   *
   * @param {string} signedMessage the signed message for the signature
   * @param {string} signature the signature to verify
   * @param {string} address the address of the signer
   * @returns {boolean} whether the signature is valid or not
   */
  verifySignature(signedMessage: HexString | Uint8Array | string,
                  signature: HexString | Uint8Array | string,
                  address: HexString | Uint8Array | string): boolean {
    const publicKey = decodeAddress(address);
    const hexPublicKey = u8aToHex(publicKey);

    return signatureVerify(signedMessage, signature, hexPublicKey).isValid;
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return isHex(txId, 256);
  }

  /**
   * decodeSeed decodes a dot seed
   *
   * @param {string} seed - the seed to be validated.
   * @returns {Seed} - the object Seed
   */
  decodeSeed(seed: string): Seed {
    const decoded = base32.decode.asBytes(seed);
    return {
      seed: Buffer.from(decoded),
    };
  }

  /**
   * Helper function to capitalize the first letter of a string
   *
   * @param {string} val
   * @returns {string}
   */
  capitalizeFirstLetter(val: string): string {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  /**
   * Helper function to decode the internal method hex in case of a proxy transaction
   *
   * @param {string | UnsignedTransaction} tx
   * @param { metadataRpc: string; registry: TypeRegistry } options
   * @returns {TransferArgs}
   */
  decodeCallMethod(
    tx: string | UnsignedTransaction,
    options: { metadataRpc: string; registry: TypeRegistry },
  ): TransferArgs {
    const { metadataRpc, registry } = options;
    registry.setMetadata(createMetadata(registry, metadataRpc));
    let methodCall: any;
    if (typeof tx === 'string') {
      try {
        const payload = createTypeUnsafe(registry, 'ExtrinsicPayload', [tx, { version: EXTRINSIC_VERSION }]);
        methodCall = createTypeUnsafe(registry, 'Call', [payload.method]);
      } catch (e) {
        methodCall = registry.createType('Extrinsic', polkaUtils.hexToU8a(tx), {
          isSigned: true,
        }).method;
      }
    } else {
      methodCall = registry.createType('Call', tx.method);
    }
    const method = methodCall.args[PROXY_METHOD_ARG];
    const decodedArgs = method.toJSON() as unknown as ProxyCallArgs;
    return decodedArgs.args;
  }

  /**
   * keyPairFromSeed generates an object with secretKey and publicKey using the polkadot sdk
   * @param seed 32 bytes long seed
   * @returns KeyPair
   */
  keyPairFromSeed(seed: Uint8Array): KeyPair {
    const keyring = new Keyring({ type: 'ed25519' });
    const keyringPair = keyring.addFromSeed(seed);
    const pairJson = keyringPair.toJson();
    const decodedKeyPair = decodePair('', base64Decode(pairJson.encoded), pairJson.encoding.type);
    return new KeyPair({ prv: Buffer.from(decodedKeyPair.secretKey).toString('hex') });
  }

  /**
   * Signing function. Implement this on the OFFLINE signing device.
   *
   * @param {KeyringPair} pair - The signing pair.
   * @param {string} signingPayload - Payload to sign.
   */
  createSignedTx(pair: KeyringPair, signingPayload: string, transaction: UnsignedTransaction, options): string {
    const { registry, metadataRpc } = options;
    // Important! The registry needs to be updated with latest metadata, so make
    // sure to run `registry.setMetadata(metadata)` before signing.
    registry.setMetadata(createMetadata(registry, metadataRpc));
    const { signature } = registry
      .createType('ExtrinsicPayload', signingPayload, {
        version: EXTRINSIC_VERSION,
      })
      .sign(pair);

    // Serialize a signed transaction.
    const txHex = construct.signedTx(transaction, signature, {
      metadataRpc,
      registry,
    });
    return txHex;
  }

  /**
   * Decodes the dot address from the given format
   *
   * @param address Decodes
   * @returns {string}
   */
  decodeDotAddress(address: string, ss58Format?: number): string {
    const keypair = new KeyPair({ pub: Buffer.from(decodeAddress(address, undefined, ss58Format)).toString('hex') });
    return keypair.getAddress();
  }

  /**
   * Decodes the dot address from the given format
   *
   * @param address Decodes
   * @returns {string}
   */
  encodeDotAddress(address: string, ss58Format?: number): string {
    return encodeAddress(address, ss58Format);
  }

  /**
   * Checks the validity of the signature submitted
   *
   * @param signature signature
   * @returns {boolean}
   */
  isValidSignature(signature: string): boolean {
    try {
      return !!signature && decodeAddress(signature).length === SIGNATURE_LENGTH;
    } catch (e) {
      return false;
    }
  }
}

const utils = new Utils();

export default utils;
