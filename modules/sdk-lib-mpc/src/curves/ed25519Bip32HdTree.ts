import { createHmac } from 'crypto';
import { bigIntFromBufferBE, bigIntFromBufferLE, bigIntToBufferBE, bigIntToBufferLE } from '../util';
import { Ed25519Curve } from './ed25519';
import { PrivateKeychain, PublicKeychain } from './types';
import { pathToIndices } from './util';
import { chaincodeBase } from './constant';

export class Ed25519Bip32HdTree {
  static curve: Ed25519Curve = new Ed25519Curve();
  static initialized = false;

  static async initialize(): Promise<Ed25519Bip32HdTree> {
    if (!Ed25519Bip32HdTree.initialized) {
      await Ed25519Curve.initialize();
      Ed25519Bip32HdTree.initialized = true;
    }

    return new Ed25519Bip32HdTree();
  }

  publicDerive(keychain: PublicKeychain, path: string): PublicKeychain {
    const indices = pathToIndices(path);
    function deriveIndex(acc: bigint[], index: number | undefined): bigint[] {
      const [pk, chaincode] = acc;
      const [zout, iout] = deriveEd25519Helper(index, chaincode, pk);
      const zl = zout.slice(0, 32);
      // left = kl + 8 * trunc28(zl)
      const t = BigInt(8) * bigIntFromBufferLE(zl.slice(0, 28));
      const left = Ed25519Bip32HdTree.curve.pointAdd(pk, Ed25519Bip32HdTree.curve.basePointMult(t));
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
      const left_pk = Ed25519Bip32HdTree.curve.pointAdd(pk, Ed25519Bip32HdTree.curve.basePointMult(t));
      const left_sk = Ed25519Bip32HdTree.curve.scalarAdd(sk, t);
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
