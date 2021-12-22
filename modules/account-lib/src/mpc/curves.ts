const sodium = require('libsodium-wrappers-sumo');
import { randomBytes as cryptoRandomBytes } from 'crypto';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const Ed25519Curve = async () => {
  // sodium requires await for ready within block scope
  await sodium.ready;

  const scalarRandom = (): Uint8Array => {
    const random_buffer = cryptoRandomBytes(64);
    return sodium.crypto_core_ed25519_scalar_reduce(random_buffer);
  };

  const scalarReduce = (s: Uint8Array): Uint8Array => {
    return sodium.crypto_core_ed25519_scalar_reduce(s);
  };

  const scalarNegate = (s: Uint8Array): Uint8Array => {
    return sodium.crypto_core_ed25519_scalar_negate(s);
  };

  const scalarInvert = (s: Uint8Array): Uint8Array => {
    return sodium.crypto_core_ed25519_scalar_invert(s);
  };

  const scalarAdd = (x: Uint8Array, y: Uint8Array): Uint8Array => {
    return sodium.crypto_core_ed25519_scalar_add(x, y);
  };

  const scalarSub = (x: Uint8Array, y: Uint8Array): Uint8Array => {
    return sodium.crypto_core_ed25519_scalar_sub(x, y);
  };

  const scalarMult = (x: Uint8Array, y: Uint8Array): Uint8Array => {
    return sodium.crypto_core_ed25519_scalar_mul(x, y);
  };

  const basePointMult = (n: Uint8Array): Uint8Array => {
    return sodium.crypto_scalarmult_ed25519_base_noclamp(n);
  };

  const pointAdd = (p: Uint8Array, q: Uint8Array): Uint8Array => {
    return sodium.crypto_core_ed25519_add(p, q);
  };

  const verify = (y: Uint8Array, signedMessage: Uint8Array): Uint8Array => {
    return sodium.crypto_sign_open(signedMessage, y);
  };

  return {
    scalarRandom,
    scalarReduce,
    scalarNegate,
    scalarInvert,
    scalarAdd,
    scalarSub,
    scalarMult,
    basePointMult,
    pointAdd,
    verify,
  };
};

export default Ed25519Curve;
