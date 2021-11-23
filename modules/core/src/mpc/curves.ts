const sodium = require('libsodium-wrappers-sumo');
import { randomBytes as cryptoRandomBytes } from 'crypto';


const Ed25519Curve = async () => {
  // sodium requires await for ready within block scope
  await sodium.ready;

  const scalarRandom = () => {
    const random_buffer = cryptoRandomBytes(64);
    return sodium.crypto_core_ed25519_scalar_reduce(random_buffer);
  };

  const scalarReduce = (s: Uint8Array): Uint8Array => {
    return sodium.crypto_core_ed25519_scalar_reduce(s);
  };

  const scalarNegate = (s) => {
    return sodium.crypto_core_ed25519_scalar_negate(s);
  };

  const scalarInvert = (s) => {
    return sodium.crypto_core_ed25519_scalar_invert(s);
  };

  const scalarAdd = (x, y) => {
    return sodium.crypto_core_ed25519_scalar_add(x, y);
  };

  const scalarSub = (x, y) => {
    return sodium.crypto_core_ed25519_scalar_sub(x, y);
  };

  const scalarMult = (x, y) => {
    return sodium.crypto_core_ed25519_scalar_mul(x, y);
  };

  const basePointMult = (n) => {
    return sodium.crypto_scalarmult_ed25519_base_noclamp(n);
  };

  const pointAdd = (p, q) => {
    return sodium.crypto_core_ed25519_add(p, q);
  };

  const verify = (y: Buffer, signedMessage: Uint8Array): Uint8Array => {
    return sodium.crypto_sign_open(signedMessage, y);
  };

  return { scalarRandom, scalarReduce, scalarNegate, scalarInvert,
    scalarAdd, scalarSub, scalarMult, basePointMult, pointAdd, verify };
};

export default Ed25519Curve;
  
