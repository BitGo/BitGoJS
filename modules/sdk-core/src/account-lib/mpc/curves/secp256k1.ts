import { bigIntFromU8ABE, bigIntToBufferBE } from '../util';
import BaseCurve from './baseCurve';
import * as secp from '@noble/secp256k1';

const order = secp.CURVE.n;

export class Secp256k1Curve implements BaseCurve {
  scalarRandom(): bigint {
    return bigIntFromU8ABE(secp.utils.randomPrivateKey());
  }

  scalarAdd(x: bigint, y: bigint): bigint {
    return bigIntFromU8ABE(secp.utils.privateAdd(x, bigIntToBufferBE(y)));
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
    const pointA = secp.Point.fromHex(bigIntToBufferBE(a));
    const pointB = secp.Point.fromHex(bigIntToBufferBE(b));
    return bigIntFromU8ABE(pointA.add(pointB).toRawBytes(true));
  }

  pointMultiply(p: bigint, s: bigint): bigint {
    const pointA = secp.Point.fromHex(bigIntToBufferBE(p));
    return bigIntFromU8ABE(pointA.multiply(s).toRawBytes(true));
  }

  basePointMult(n: bigint): bigint {
    const point = bigIntToBufferBE(n);
    return bigIntFromU8ABE(secp.getPublicKey(point, true));
  }

  verify(message: Buffer, signature: Buffer, publicKey: bigint): boolean {
    return secp.verify(signature, message, bigIntToBufferBE(publicKey));
  }

  order(): bigint {
    return order;
  }
}
