import { decodeAddress, encodeAddress, Keyring } from '@polkadot/keyring';
import { decodePair } from '@polkadot/keyring/pair/decode';
import { KeyringPair } from '@polkadot/keyring/types';
import { EXTRINSIC_VERSION } from '@polkadot/types/extrinsic/v4/Extrinsic';
import { hexToU8a, isHex, u8aToHex, u8aToU8a } from '@polkadot/util';
import { base64Decode, signatureVerify } from '@polkadot/util-crypto';
import { isValidEd25519PublicKey } from '../../utils/crypto';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import { DecodedSignedTx, DecodedSigningPayload, TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { construct, createMetadata } from '@substrate/txwrapper-polkadot';
import base32 from 'hi-base32';
import { KeyPair } from '.';
import { BaseUtils } from '../baseCoin';
import { Seed } from '../baseCoin/iface';
import { Material, ProxyCallArgs, TransferArgs } from './iface';
import nacl from 'tweetnacl';
import { BaseCoin as CoinConfig, DotNetwork } from '@bitgo/statics';
const polkaUtils = require('@polkadot/util');
const { createTypeUnsafe } = require('@polkadot/types');

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

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    const signatureU8a = u8aToU8a(signature);
    return [64, 65, 66].includes(signatureU8a.length);
  }

  /**
   * Verifies the signature on a given message
   *
   * @param {string} signedMessage the signed message for the signature
   * @param {string} signature the signature to verify
   * @param {string} address the address of the signer
   * @returns {boolean} whether the signature is valid or not
   */
  verifySignature(signedMessage: string, signature: string, address: string): boolean {
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
   * Retrieves the txHash of a signed txHex
   *
   * @param txHex signed transaction hex
   * @returns {string}
   */
  getTxHash(txHex: string): string {
    return construct.txHash(txHex);
  }

  getMaterial(coinConfig: Readonly<CoinConfig>): Material {
    const networkConfig = coinConfig.network as DotNetwork;
    const { specName, specVersion, chainName, txVersion, genesisHash } = networkConfig;

    return {
      specName,
      specVersion,
      chainName,
      metadata: networkConfig.metadataRpc,
      txVersion,
      genesisHash,
    } as Material;
  }

  isSigningPayload(payload: DecodedSigningPayload | DecodedSignedTx): payload is DecodedSigningPayload {
    return (payload as DecodedSigningPayload).blockHash !== undefined;
  }
}

const utils = new Utils();

export default utils;
