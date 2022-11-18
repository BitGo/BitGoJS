/**
 * An interface for calculating a subkey in an HD key scheme.
 */
import { createHmac } from 'crypto';
import { Ed25519Curve, Secp256k1Curve } from './curves';
import { bigIntFromBufferBE, bigIntToBufferBE, bigIntFromBufferLE, bigIntToBufferLE } from './util';

// 2^256
export const chaincodeBase = BigInt('0x010000000000000000000000000000000000000000000000000000000000000000');

interface PrivateKeychain {
  pk: bigint;
  sk: bigint;
  prefix?: bigint;
  chaincode: bigint;
}

export interface PublicKeychain {
  pk: bigint;
  chaincode: bigint;
}

interface HDTree {
  publicDerive(keychain: PublicKeychain, path: string): PublicKeychain;

  privateDerive(keychain: PrivateKeychain, path: string): PrivateKeychain;
}

export default HDTree;

function deriveEd25519Helper(index: number | undefined = 0, chaincode: bigint, pk: bigint, sk?: bigint): Buffer[] {
  const zmac = createHmac('sha512', bigIntToBufferBE(chaincode, 32));
  const imac = createHmac('sha512', bigIntToBufferBE(chaincode, 32));
  const seri = Buffer.alloc(4);
  seri.writeUInt32LE(index, 0);
  if (((index >>> 0) & 0x80000000) === 0) {
    // Normal derivation:
    // Z = HMAC-SHA512(Key = cpar, Data = 0x02 || serP(point(kpar)) || ser32(i)).
    // I = HMAC-SHA512(Key = cpar, Data = 0x03 || serP(point(kpar)) || ser32(i)).
    zmac.update('\x02');
    zmac.update(bigIntToBufferLE(pk, 32));
    zmac.update(seri);
    imac.update('\x03');
    imac.update(bigIntToBufferLE(pk, 32));
    imac.update(seri);
  } else {
    if (sk === undefined) {
      throw new Error("Can't performed hardened derivation without private key");
    }
    // Hardened derivation:
    // Z = HMAC-SHA512(Key = cpar, Data = 0x00 || ser256(left(kpar)) || ser32(i)).
    // I = HMAC-SHA512(Key = cpar, Data = 0x01 || ser256(left(kpar)) || ser32(i)).
    zmac.update('\x00');
    zmac.update(bigIntToBufferLE(sk, 32));
    zmac.update(seri);
    imac.update('\x01');
    imac.update(bigIntToBufferLE(sk, 32));
    imac.update(seri);
  }
  return [zmac.digest(), imac.digest()];
}

function pathToIndices(path: string): number[] {
  return path
    .replace(/^m?\//, '')
    .split('/')
    .map((index) => parseInt(index, 10));
}

export class Ed25519BIP32 {
  static curve: Ed25519Curve = new Ed25519Curve();
  static initialized = false;

  static async initialize(): Promise<Ed25519BIP32> {
    if (!Ed25519BIP32.initialized) {
      await Ed25519Curve.initialize();
      Ed25519BIP32.initialized = true;
    }

    return new Ed25519BIP32();
  }

  publicDerive(keychain: PublicKeychain, path: string): PublicKeychain {
    const indices = pathToIndices(path);
    function deriveIndex(acc: bigint[], index: number | undefined): bigint[] {
      const [pk, chaincode] = acc;
      const [zout, iout] = deriveEd25519Helper(index, chaincode, pk);
      const zl = zout.slice(0, 32);
      // left = kl + 8 * trunc28(zl)
      const t = BigInt(8) * bigIntFromBufferLE(zl.slice(0, 28));
      const left = Ed25519BIP32.curve.pointAdd(pk, Ed25519BIP32.curve.basePointMult(t));
      return [left, bigIntFromBufferBE(iout.slice(32))];
    }
    const subkey = indices.reduce(deriveIndex, deriveIndex([keychain.pk, keychain.chaincode], indices.shift()));
    return { pk: subkey[0], chaincode: subkey[1] };
  }

  privateDerive(keychain: PrivateKeychain, path: string): PrivateKeychain {
    const indices = pathToIndices(path);
    function deriveIndex(acc: bigint[], index: number | undefined): bigint[] {
      const [pk, sk, prefix, chaincode] = acc;
      const [zout, iout] = deriveEd25519Helper(index, chaincode, pk, sk);
      const zl = zout.slice(0, 32);
      const zr = zout.slice(32);
      // left = kl + 8 * trunc28(zl)
      const t = BigInt(8) * bigIntFromBufferLE(zl.slice(0, 28));
      const left_pk = Ed25519BIP32.curve.pointAdd(pk, Ed25519BIP32.curve.basePointMult(t));
      const left_sk = Ed25519BIP32.curve.scalarAdd(sk, t);
      // right = zr + kr
      const right = (prefix + bigIntFromBufferBE(zr)) % chaincodeBase;
      return [left_pk, left_sk, right, bigIntFromBufferBE(iout.slice(32))];
    }
    const [pk, sk, prefix, chaincode] = indices.reduce(
      deriveIndex,
      deriveIndex([keychain.pk, keychain.sk, keychain.prefix!, keychain.chaincode], indices.shift())
    );
    return { pk, sk, prefix, chaincode };
  }
}

function deriveSecp256k1Helper(index: number | undefined = 0, chaincode: bigint, pk: bigint, sk?: bigint): Buffer {
  const data = Buffer.alloc(33 + 4);
  if (((index >>> 0) & 0x80000000) === 0) {
    bigIntToBufferBE(pk, 33).copy(data);
  } else {
    if (sk === undefined) {
      throw new Error("Can't performed hardened derivation without private key");
    }
    data[0] = 0;
    bigIntToBufferBE(sk, 32).copy(data, 1);
  }
  data.writeUInt32BE(index, 33);
  return createHmac('sha512', bigIntToBufferBE(chaincode, 32)).update(data).digest();
}

export class BIP32 {
  static curve: Secp256k1Curve = new Secp256k1Curve();

  publicDerive(keychain: PublicKeychain, path: string): PublicKeychain {
    const indices = pathToIndices(path);
    function deriveIndex(acc: bigint[], index: number | undefined): bigint[] {
      const [pk, chaincode] = acc;
      const I = deriveSecp256k1Helper(index, chaincode, pk);
      const il = bigIntFromBufferBE(I.slice(0, 32));
      const ir = bigIntFromBufferBE(I.slice(32));
      const left_pk = BIP32.curve.pointAdd(pk, BIP32.curve.basePointMult(il));
      return [left_pk, ir];
    }
    const [pk, chaincode] = indices.reduce(
      deriveIndex,
      deriveIndex([keychain.pk, keychain.chaincode], indices.shift())
    );
    return { pk, chaincode };
  }

  privateDerive(keychain: PrivateKeychain, path: string): PrivateKeychain {
    const indices = pathToIndices(path);
    function deriveIndex(acc: bigint[], index: number | undefined): bigint[] {
      const [pk, sk, chaincode] = acc;
      const I = deriveSecp256k1Helper(index, chaincode, pk, sk);
      const il = bigIntFromBufferBE(I.slice(0, 32));
      const ir = bigIntFromBufferBE(I.slice(32));
      const left_pk = BIP32.curve.pointAdd(pk, BIP32.curve.basePointMult(il));
      const left_sk = BIP32.curve.scalarAdd(sk, il);
      return [left_pk, left_sk, ir];
    }
    const [pk, sk, chaincode] = indices.reduce(
      deriveIndex,
      deriveIndex([keychain.pk, keychain.sk, keychain.chaincode], indices.shift())
    );
    return { pk, sk, chaincode };
  }
}
