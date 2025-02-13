import { BaseUtils } from '@bitgo/sdk-core';
import elliptic from 'elliptic';
import { Principal as DfinityPrincipal } from '@dfinity/principal';
import * as agent from '@dfinity/agent';
import crypto from 'crypto';
import crc32 from 'crc-32';
import { KeyPair as IcpKeyPair } from './keyPair';

const Secp256k1Curve = new elliptic.ec('secp256k1');

export class Utils implements BaseUtils {
  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidTransactionId(txId: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidPublicKey(key: string): boolean {
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(key)) return false;

    const length = key.length;
    if (length !== 130) return false;

    return true;
  }

  isValidPrivateKey(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented.');
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  getNetworkIdentifier(): Record<string, string> {
    return {
      blockchain: 'Internet Computer',
      network: '00000000000000020101',
    };
  }

  compressPublicKey(uncompressedKey: string): string {
    if (!uncompressedKey.startsWith('04')) {
      throw new Error('Invalid uncompressed public key format');
    }
    const xHex = uncompressedKey.slice(2, 66);
    const yHex = uncompressedKey.slice(66);
    const y = BigInt(`0x${yHex}`);
    const prefix = y % 2n === 0n ? '02' : '03';
    return prefix + xHex;
  }

  getCurveType(): string {
    return 'secp256k1';
  }

  derivePrincipalFromPublicKey(publicKeyHex: string): DfinityPrincipal {
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');

    try {
      const ellipticKey = Secp256k1Curve.keyFromPublic(publicKeyBuffer);
      const uncompressedPublicKeyHex = ellipticKey.getPublic(false, 'hex');
      const derEncodedKey = agent.wrapDER(Buffer.from(uncompressedPublicKeyHex, 'hex'), agent.SECP256K1_OID);
      const principalId = DfinityPrincipal.selfAuthenticating(Buffer.from(derEncodedKey));
      const principal = DfinityPrincipal.fromUint8Array(principalId.toUint8Array());
      return principal;
    } catch (error) {
      throw new Error(`Failed to process the public key: ${error.message}`);
    }
  }

  fromPrincipal(principal: DfinityPrincipal, subAccount: Uint8Array = new Uint8Array(32)): string {
    const ACCOUNT_ID_PREFIX = new Uint8Array([0x0a, ...Buffer.from('account-id')]);
    const principalBytes = principal.toUint8Array();
    const combinedBytes = new Uint8Array(ACCOUNT_ID_PREFIX.length + principalBytes.length + subAccount.length);

    combinedBytes.set(ACCOUNT_ID_PREFIX, 0);
    combinedBytes.set(principalBytes, ACCOUNT_ID_PREFIX.length);
    combinedBytes.set(subAccount, ACCOUNT_ID_PREFIX.length + principalBytes.length);

    const sha224Hash = crypto.createHash('sha224').update(combinedBytes).digest();
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32.buf(sha224Hash) >>> 0, 0);

    const accountIdBytes = Buffer.concat([checksum, sha224Hash]);
    return accountIdBytes.toString('hex');
  }

  async getAddressFromPublicKey(hexEncodedPublicKey: string): Promise<string> {
    const isKeyValid = this.isValidPublicKey(hexEncodedPublicKey);
    if (!isKeyValid) {
      throw new Error('Public Key is not in a valid Hex Encoded Format');
    }
    const compressedKey = this.compressPublicKey(hexEncodedPublicKey);
    const KeyPair = new IcpKeyPair({ pub: compressedKey });
    return KeyPair.getAddress();
  }
}

const utils = new Utils();
export default utils;
