import { BaseUtils, isBase58, isValidEd25519PublicKey, Seed } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import { decodeAddress, encodeAddress, Keyring } from '@polkadot/keyring';
import { decodePair } from '@polkadot/keyring/pair/decode';
import { KeyringPair } from '@polkadot/keyring/types';
import { EXTRINSIC_VERSION } from '@polkadot/types/extrinsic/v4/Extrinsic';
import { hexToU8a, isHex, u8aToHex, u8aToU8a } from '@polkadot/util';
import { base64Decode } from '@polkadot/util-crypto';
import { Args, BaseTxInfo, defineMethod, OptionsWithMeta, UnsignedTransaction } from '@substrate/txwrapper-core';
import { DecodedSignedTx, DecodedSigningPayload, TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { construct } from '@substrate/txwrapper-polkadot';
import bs58 from 'bs58';
import base32 from 'hi-base32';
import nacl from 'tweetnacl';
import { Material, TransferAllArgs, TransferArgs, TxMethod } from './iface';
import { KeyPair } from '.';
import { HexString } from '@polkadot/util/types';

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
      pubKey = base58Decode.toString('hex');
    }

    return isValidEd25519PublicKey(pubKey);
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    const signatureU8a = u8aToU8a(signature);
    return [64, 65, 66].includes(signatureU8a.length);
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return isHex(txId, 256);
  }

  isValidAmount(amount: string | number | bigint): boolean {
    try {
      if (BigInt(amount) < 0n) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * decodeSeed decodes a substrate seed
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
   * keyPairFromSeed generates an object with secretKey and publicKey using the substrate sdk
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
   * @param {HexString} options.metadataRpc - metadata that is needed for substrate to sign
   * @param {TypeRegistry} options.registry - metadata that is needed for substrate to sign
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
   * Decodes the substrate address from the given format
   *
   * @param {string} address
   * @param {number} [ss58Format]
   * @returns {string}
   */
  encodeSubstrateAddress(address: string, ss58Format?: number): string {
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

  isSigningPayload(payload: DecodedSigningPayload | DecodedSignedTx): payload is DecodedSigningPayload {
    return (payload as DecodedSigningPayload).blockHash !== undefined;
  }

  isTransfer(arg: TxMethod['args']): arg is TransferArgs {
    return (arg as TransferArgs).dest?.id !== undefined && (arg as TransferArgs).value !== undefined;
  }

  isTransferAll(arg: TxMethod['args']): arg is TransferAllArgs {
    return (arg as TransferAllArgs).dest?.id !== undefined && (arg as TransferAllArgs).keepAlive !== undefined;
  }

  /**
   * extracts and returns the signature in hex format given a raw signed transaction
   *
   * @param {string} rawTx signed raw transaction
   * @param options registry substrate registry used to retrieve the signature
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
  decodeSubstrateAddressToKeyPair(address: string, ss58Format?: number): KeyPair {
    return new KeyPair({ pub: Buffer.from(decodeAddress(address, undefined, ss58Format)).toString('hex') });
  }

  getMaterial(coinConfig: Readonly<CoinConfig>): Material {
    throw new Error('Method not implemented.');
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
   * since substrate addresses differ depending on the network
   * @param networkCoinName
   */
  getAddressFormat(network: NetworkType): number {
    return 42;
  }

  /**
   * Creates a pure proxy extrinsic. Substrate has renamed anonymous proxies to pure proxies, but
   * the libraries we are using to build transactions have not been updated, as a stop gap we are
   * defining the pure proxy extrinsic here.
   *
   * @param args Arguments to the createPure extrinsic.
   * @param info Common information to all transactions.
   * @param options Chain registry and metadata.
   */
  pureProxy(args: PureProxyArgs, info: BaseTxInfo, options: OptionsWithMeta): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'createPure',
          pallet: 'proxy',
        },
        ...info,
      },
      options
    );
  }

  /**
   * Removes '0x' from a given `string` if present.
   *
   * @param {string} str the string value.
   *
   * @return {string} a string without a '0x' prefix.
   */
  stripHexPrefix(str: string): string {
    return this.isHexPrefixed(str) ? str.slice(2) : str;
  }

  /**
   * Returns true if a string starts with '0x', false otherwise.
   *
   * @param {string} str the string value.
   *
   * @return {boolean} true if a string starts with '0x', false otherwise.
   */
  isHexPrefixed(str: string): boolean {
    return str.slice(0, 2) === '0x';
  }

  /**
   * Decodes the dot address from the given format
   *
   * @param {string} address
   * @param {number} [ss58Format]
   * @returns {string}
   */
  decodeDotAddress(address: string, ss58Format: number): string {
    // TODO: fix
    return Buffer.from(decodeAddress(address, undefined, ss58Format)).toString('hex');
  }
}

interface PureProxyArgs extends Args {
  proxyType: string;
  delay: number;
  index: number;
}

const utils = new Utils();

export default utils;
