import { bigIntFromU8ABE, bigIntToBufferBE } from '../util';
import { BaseCurve } from './types';
import { secp256k1 as secp } from '@noble/curves/secp256k1';
import { mod, invert } from '@noble/curves/abstract/modular';

const order = secp.CURVE.n;
const privateKeySize = 32;
const publicKeySize = 33;

export class Secp256k1Curve implements BaseCurve {
  scalarRandom(): bigint {
    return bigIntFromU8ABE(secp.utils.randomPrivateKey());
  }

  scalarAdd(x: bigint, y: bigint): bigint {
    return mod(x + y, order);
  }

  scalarSub(x: bigint, y: bigint): bigint {
    const negatedY = order - y;
    return mod(x + negatedY, order);
  }

  scalarMult(x: bigint, y: bigint): bigint {
    return mod(x * y, order);
  }

  scalarReduce(s: bigint): bigint {
    return mod(s, order);
  }

  scalarNegate(s: bigint): bigint {
    return order - s;
  }

  scalarInvert(s: bigint): bigint {
    return invert(s, order);
  }

  pointAdd(a: bigint, b: bigint): bigint {
    const pointA = secp.ProjectivePoint.fromHex(bigIntToBufferBE(a, privateKeySize));
    const pointB = secp.ProjectivePoint.fromHex(bigIntToBufferBE(b, privateKeySize));
    return bigIntFromU8ABE(pointA.add(pointB).toRawBytes(true));
  }

  pointMultiply(p: bigint, s: bigint): bigint {
    const pointA = secp.ProjectivePoint.fromHex(bigIntToBufferBE(p, privateKeySize));
    return bigIntFromU8ABE(pointA.multiply(s).toRawBytes(true));
  }

  basePointMult(n: bigint): bigint {
    const point = bigIntToBufferBE(n, privateKeySize);
    return bigIntFromU8ABE(secp.getPublicKey(point, true));
  }

  verify(message: Buffer, signature: Buffer, publicKey: bigint): boolean {
    const sig = secp.Signature.fromCompact(Buffer.from(signature.subarray(1))).addRecoveryBit(signature[0]);
    const pubFromSig = sig.recoverPublicKey(message).toRawBytes(true);
    return Buffer.from(pubFromSig).equals(bigIntToBufferBE(publicKey, publicKeySize));
  }

  order(): bigint {
    return order;
  }

  scalarBytes = privateKeySize;

  // Always use compressed points.
  pointBytes = publicKeySize;
}
