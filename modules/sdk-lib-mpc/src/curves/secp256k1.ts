import { bigIntFromU8ABE, bigIntToBufferBE } from '../util';
import { BaseCurve } from './types';
import * as secp from '@noble/secp256k1';

const order = secp.CURVE.n;
const privateKeySize = 32;
const publicKeySize = 33;

export class Secp256k1Curve implements BaseCurve {
  scalarRandom(): bigint {
    return bigIntFromU8ABE(secp.utils.randomPrivateKey());
  }

  scalarAdd(x: bigint, y: bigint): bigint {
    return bigIntFromU8ABE(secp.utils.privateAdd(x, bigIntToBufferBE(y, privateKeySize)));
  }

  scalarSub(x: bigint, y: bigint): bigint {
    const negatedY = secp.utils.privateNegate(y);
    return bigIntFromU8ABE(secp.utils.privateAdd(x, negatedY));
  }

  scalarMult(x: bigint, y: bigint): bigint {
    return secp.utils.mod(x * y, order);
  }

  scalarReduce(s: bigint): bigint {
    return secp.utils.mod(s, order);
  }

  scalarNegate(s: bigint): bigint {
    return bigIntFromU8ABE(secp.utils.privateNegate(s));
  }

  scalarInvert(s: bigint): bigint {
    return secp.utils.invert(s, order);
  }

  pointAdd(a: bigint, b: bigint): bigint {
    const pointA = secp.Point.fromHex(bigIntToBufferBE(a, privateKeySize));
    const pointB = secp.Point.fromHex(bigIntToBufferBE(b, privateKeySize));
    return bigIntFromU8ABE(pointA.add(pointB).toRawBytes(true));
  }

  pointMultiply(p: bigint, s: bigint): bigint {
    const pointA = secp.Point.fromHex(bigIntToBufferBE(p, privateKeySize));
    return bigIntFromU8ABE(pointA.multiply(s).toRawBytes(true));
  }

  basePointMult(n: bigint): bigint {
    const point = bigIntToBufferBE(n, privateKeySize);
    return bigIntFromU8ABE(secp.getPublicKey(point, true));
  }

  verify(message: Buffer, signature: Buffer, publicKey: bigint): boolean {
    return Buffer.from(secp.recoverPublicKey(message, signature.subarray(1), signature[0], true)).equals(
      bigIntToBufferBE(publicKey, publicKeySize)
    );
  }

  order(): bigint {
    return order;
  }

  scalarBytes = privateKeySize;

  // Always use compressed points.
  pointBytes = publicKeySize;
}
