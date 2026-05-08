import { createHmac } from 'crypto';

import { PrivateKeychain, PublicKeychain } from './types';
import { Secp256k1Curve } from './secp256k1';
import { bigIntFromBufferBE, bigIntToBufferBE } from '../util';
import { pathToIndices } from './util';

export class Secp256k1Bip32HdTree {
  static curve: Secp256k1Curve = new Secp256k1Curve();

  publicDerive(keychain: PublicKeychain, path: string): PublicKeychain {
    const indices = pathToIndices(path);
    function deriveIndex(acc: bigint[], index: number | undefined): bigint[] {
      const [pk, chaincode] = acc;
      const I = deriveSecp256k1Helper(index, chaincode, pk);
      const il = bigIntFromBufferBE(I.slice(0, 32));
      const ir = bigIntFromBufferBE(I.slice(32));
      const left_pk = Secp256k1Bip32HdTree.curve.pointAdd(pk, Secp256k1Bip32HdTree.curve.basePointMult(il));
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
      const left_pk = Secp256k1Bip32HdTree.curve.pointAdd(pk, Secp256k1Bip32HdTree.curve.basePointMult(il));
      const left_sk = Secp256k1Bip32HdTree.curve.scalarAdd(sk, il);
      return [left_pk, left_sk, ir];
    }
    const [pk, sk, chaincode] = indices.reduce(
      deriveIndex,
      deriveIndex([keychain.pk, keychain.sk, keychain.chaincode], indices.shift())
    );
    return { pk, sk, chaincode };
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
