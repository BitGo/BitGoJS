import { BaseUtils, DotAddressFormat, DotAssetTypes, isBase58, isValidEd25519PublicKey, Seed } from '@bitgo/sdk-core';
import { AcalaNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { decodeAddress, encodeAddress, Keyring } from '@polkadot/keyring';
import { decodePair } from '@polkadot/keyring/pair/decode';
import { KeyringPair } from '@polkadot/keyring/types';
import { EXTRINSIC_VERSION } from '@polkadot/types/extrinsic/v4/Extrinsic';
import { hexToU8a, isHex, u8aToHex, u8aToU8a } from '@polkadot/util';
import { base64Decode, signatureVerify } from '@polkadot/util-crypto';
import {
  construct,
  DecodedSignedTx,
  DecodedSigningPayload,
  TokenSymbol,
  TypeRegistry,
  UnsignedTransaction,
} from '@acala-network/txwrapper-acala';
import bs58 from 'bs58';
import base32 from 'hi-base32';
import nacl from 'tweetnacl';
import { HexString, Material, TransferArgs, TxMethod, TokenTransferArgs } from './iface';
import { KeyPair } from '.';

// map to retrieve the address encoding format when the key is the asset name
const coinToAddressMap = new Map<DotAssetTypes, DotAddressFormat>([
  ['aca', DotAddressFormat.acala],
  ['dot', DotAddressFormat.polkadot],
  ['tdot', DotAddressFormat.substrate],
  ['taca', DotAddressFormat.substrate],
]);

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
    let pubKey = key;

    // convert base58 pub key to hex format
    // tss common pub is in base58 format and decodes to length of 32
    if (isBase58(pubKey, 32)) {
      const base58Decode = bs58.decode(pubKey);
      pubKey = base58Decode.toString();
    }

    return isValidEd25519PublicKey(pubKey);
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
   * Returns whether or not it is a valid token
   *
   * @param {TokenSymbol} token - the token to be validated
   * @returns {boolean} - the validation result
   */
  isValidToken(token: TokenSymbol): boolean {
    return token === TokenSymbol.AUSD || token === TokenSymbol.LDOT;
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
   * @param {UnsignedTransaction} transaction - raw transaction to sign
   * @param {Object} options
   * @param {HexString} options.metadataRpc - metadata that is needed for dot to sign
   * @param {TypeRegistry} options.registry - metadata that is needed for dot to sign
   */
  createSignedTx(
    pair: KeyringPair,
    signingPayload: string,
    transaction: UnsignedTransaction,
    options: { metadataRpc: HexString; registry: TypeRegistry }
  ): string {
    const { registry, metadataRpc } = options;
    const { signature } = registry
      .createType('ExtrinsicPayload', signingPayload, {
        version: EXTRINSIC_VERSION,
      })
      .sign(pair);

    // Serialize a signed transaction.
    return this.serializeSignedTransaction(transaction, signature, metadataRpc, registry);
  }

  /**
   * Serializes the signed transaction
   *
   * @param transaction Transaction to serialize
   * @param signature Signature of the message
   * @param metadataRpc Network metadata
   * @param registry Transaction registry
   * @returns string Serialized transaction
   */
  serializeSignedTransaction(transaction, signature, metadataRpc: `0x${string}`, registry): string {
    return construct.signedTx(transaction, signature, {
      metadataRpc,
      registry,
    });
  }

  /**
   * Decodes the dot address from the given format
   *
   * @param {string} address
   * @param {number} [ss58Format]
   * @returns {string}
   */
  decodeDotAddress(address: string, ss58Format: number): string {
    const keypair = new KeyPair({ pub: Buffer.from(decodeAddress(address, undefined, ss58Format)).toString('hex') });
    return keypair.getAddress(ss58Format);
  }

  /**
   * Decodes the dot address from the given format
   *
   * @param {string} address
   * @param {number} [ss58Format]
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
    const networkConfig = coinConfig.network as AcalaNetwork;
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

  isTransfer(arg: TxMethod['args']): arg is TransferArgs {
    return (arg as TransferArgs).dest?.id !== undefined && (arg as TransferArgs).amount !== undefined;
  }

  isTokenTransfer(arg: TxMethod['args']): arg is TransferArgs {
    return (
      (arg as TokenTransferArgs).dest?.id !== undefined &&
      (arg as TokenTransferArgs).amount !== undefined &&
      (arg as TokenTransferArgs).currencyId?.token !== undefined
    );
  }

  /**
   * extracts and returns the signature in hex format given a raw signed transaction
   *
   * @param {string} rawTx signed raw transaction
   * @param options registry dot registry used to retrieve the signature
   */
  recoverSignatureFromRawTx(rawTx: string, options: { registry: TypeRegistry }): string {
    const { registry } = options;
    const methodCall = registry.createType('Extrinsic', rawTx, {
      isSigned: true,
    });
    let signature = u8aToHex(methodCall.signature) as string;

    // remove 0x from the signature since this is how it's returned from TSS signing
    if (signature.startsWith('0x')) {
      signature = signature.substr(2);
    }
    return signature;
  }

  /**
   * Decodes the dot address from the given format
   *
   * @param {string} address
   * @param {number} [ss58Format]
   * @returns {KeyPair}
   */
  decodeDotAddressToKeyPair(address: string, ss58Format?: number): KeyPair {
    return new KeyPair({ pub: Buffer.from(decodeAddress(address, undefined, ss58Format)).toString('hex') });
  }

  /**
   * Checks whether the given input is a hex string with with 0 value
   * used to check whether a given transaction is immortal or mortal
   * @param hexValue
   */
  isZeroHex(hexValue: string): boolean {
    return hexValue === '0x00';
  }

  /**
   * Takes an asset name and returns the respective address to format to
   * since polkadot addresses differ depending on the network
   * ref: https://wiki.polkadot.network/docs/learn-accounts
   * @param networkCoinName
   */
  getAddressFormat(networkCoinName: DotAssetTypes): DotAddressFormat {
    return coinToAddressMap.get(networkCoinName) as DotAddressFormat;
  }
}

const utils = new Utils();

export default utils;
