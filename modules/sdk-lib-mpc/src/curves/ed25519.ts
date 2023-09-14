import sodium from 'libsodium-wrappers-sumo';
import { randomBytes } from 'crypto';
import { bigIntFromBufferLE, bigIntToBufferLE } from '../util';
import { BaseCurve } from './types';

const privateKeySize = 32;
const publicKeySize = 32;

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
      Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(bigIntFromBufferLE(randomBytes(64))))
    );
  }

  scalarReduce(s: bigint): bigint {
    return bigIntFromBufferLE(Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(bigIntToBufferLE(s, 64))));
  }

  scalarNegate(s: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(sodium.crypto_core_ed25519_scalar_negate(bigIntToBufferLE(s, privateKeySize)))
    );
  }

  scalarInvert(s: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(sodium.crypto_core_ed25519_scalar_invert(bigIntToBufferLE(s, privateKeySize)))
    );
  }

  scalarAdd(x: bigint, y: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(
        sodium.crypto_core_ed25519_scalar_add(bigIntToBufferLE(x, privateKeySize), bigIntToBufferLE(y, privateKeySize))
      )
    );
  }

  scalarSub(x: bigint, y: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(
        sodium.crypto_core_ed25519_scalar_sub(bigIntToBufferLE(x, privateKeySize), bigIntToBufferLE(y, privateKeySize))
      )
    );
  }

  scalarMult(x: bigint, y: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(
        sodium.crypto_core_ed25519_scalar_mul(bigIntToBufferLE(x, privateKeySize), bigIntToBufferLE(y, privateKeySize))
      )
    );
  }

  basePointMult(n: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(sodium.crypto_scalarmult_ed25519_base_noclamp(bigIntToBufferLE(n, privateKeySize)))
    );
  }

  pointAdd(p: bigint, q: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(
        sodium.crypto_core_ed25519_add(bigIntToBufferLE(p, publicKeySize), bigIntToBufferLE(q, publicKeySize))
      )
    );
  }

  pointMultiply(p: bigint, s: bigint): bigint {
    return bigIntFromBufferLE(
      Buffer.from(
        sodium.crypto_scalarmult_ed25519_noclamp(bigIntToBufferLE(s, publicKeySize), bigIntToBufferLE(p, publicKeySize))
      )
    );
  }

  verify(message: Buffer, signature: Buffer, publicKey: bigint): boolean {
    const signedMessage = Buffer.concat([signature, message]);
    try {
      // Returns the message which was signed if the signature is valid
      const result = Buffer.from(sodium.crypto_sign_open(signedMessage, bigIntToBufferLE(publicKey, publicKeySize)));
      return Buffer.compare(message, result) === 0;
    } catch (error) {
      // Invalid signature causes an exception
      return false;
    }
  }

  order(): bigint {
    return BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed') * BigInt('0x08');
  }

  scalarBytes = privateKeySize;

  pointBytes = publicKeySize;
}
