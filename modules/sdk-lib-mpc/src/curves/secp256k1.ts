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
    return bigIntFromU8ABE(
      secp.etc.numberToBytesBE(
        secp.etc.mod(secp.utils.normPrivateKeyToScalar(x) + secp.utils.normPrivateKeyToScalar(y), secp.CURVE.n)
      )
    );
  }

  scalarSub(x: bigint, y: bigint): bigint {
    const negatedY = secp.etc.numberToBytesBE(secp.etc.mod(-secp.utils.normPrivateKeyToScalar(y), secp.CURVE.n));
    return bigIntFromU8ABE(
      secp.etc.numberToBytesBE(
        secp.etc.mod(secp.utils.normPrivateKeyToScalar(x) + secp.utils.normPrivateKeyToScalar(negatedY), secp.CURVE.n)
      )
    );
  }

  scalarMult(x: bigint, y: bigint): bigint {
    return secp.etc.mod(x * y, order);
  }

  scalarReduce(s: bigint): bigint {
    return secp.etc.mod(s, order);
  }

  scalarNegate(s: bigint): bigint {
    return bigIntFromU8ABE(secp.etc.numberToBytesBE(secp.etc.mod(-secp.utils.normPrivateKeyToScalar(s), secp.CURVE.n)));
  }

  scalarInvert(s: bigint): bigint {
    return secp.etc.invert(s, order);
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
    return Buffer.from(secp.Signature.fromCompact(signature).recoverPublicKey(message).toRawBytes()).equals(
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
