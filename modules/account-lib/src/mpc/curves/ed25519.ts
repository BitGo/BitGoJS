const sodium = require('libsodium-wrappers-sumo');
import { randomBytes } from 'crypto';
import { bigIntFromBufferLE, bigIntToBufferLE } from '../util';
import BaseCurve from './baseCurve';

export class Ed25519Curve implements BaseCurve {
  static initialized = false;

  static async initialize(): Promise<Ed25519Curve> {
    if (!Ed25519Curve.initialized) {
      await sodium.ready;
      Ed25519Curve.initialized = true;
    }

    return new Ed25519Curve();
  }

  scalarRandom(): bigint {
    return bigIntFromBufferLE(
      Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(bigIntFromBufferLE(randomBytes(64)))),
    );
  }

  scalarReduce(s: bigint): bigint {
    return bigIntFromBufferLE(Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(bigIntToBufferLE(s, 64))));
  }

  scalarNegate(s: bigint): bigint {
    return bigIntFromBufferLE(Buffer.from(sodium.crypto_core_ed25519_scalar_negate(bigIntToBufferLE(s, 32))));
  }

  scalarInvert(s: bigint): bigint {
    return bigIntFromBufferLE(Buffer.from(sodium.crypto_core_ed25519_scalar_invert(bigIntToBufferLE(s, 32))));
  }

  scalarAdd(x: bigint, y: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(sodium.crypto_core_ed25519_scalar_add(bigIntToBufferLE(x, 32), bigIntToBufferLE(y, 32))),
    );
  }

  scalarSub(x: bigint, y: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(sodium.crypto_core_ed25519_scalar_sub(bigIntToBufferLE(x, 32), bigIntToBufferLE(y, 32))),
    );
  }

  scalarMult(x: bigint, y: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(sodium.crypto_core_ed25519_scalar_mul(bigIntToBufferLE(x, 32), bigIntToBufferLE(y, 32))),
    );
  }

  basePointMult(n: bigint): bigint {
    return bigIntFromBufferLE(Buffer.from(sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(n, 32))));
  }

  pointAdd(p: bigint, q: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(sodium.crypto_core_ed25519_add(bigIntToBufferLE(p, 32), bigIntToBufferLE(q, 32))),
    );
  }

  verify(y: bigint, signedMessage: Buffer): Buffer {
    return Buffer.from(sodium.crypto_sign_open(signedMessage, bigIntToBufferLE(y, 32)));
  }
}
