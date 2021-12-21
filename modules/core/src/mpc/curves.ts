const sodium = require('libsodium-wrappers-sumo');
import * as BigNum from 'bn.js';
import { randomBytes as cryptoRandomBytes } from 'crypto';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const Ed25519Curve = async () => {
  // sodium requires await for ready within block scope
  await sodium.ready;

  const scalarRandom = (): BigNum => {
    const random_buffer = cryptoRandomBytes(64);
    return new BigNum(sodium.crypto_core_ed25519_scalar_reduce(random_buffer));
  };

  const scalarReduce = (s: BigNum): BigNum => {
    return new BigNum(sodium.crypto_core_ed25519_scalar_reduce(s.toBuffer('le', 64)));
  };

  const scalarNegate = (s: BigNum): BigNum => {
    return new BigNum(sodium.crypto_core_ed25519_scalar_negate(s.toBuffer('le', 32)));
  };

  const scalarInvert = (s: BigNum): BigNum => {
    return new BigNum(sodium.crypto_core_ed25519_scalar_invert(s.toBuffer('le', 32)));
  };

  const scalarAdd = (x: BigNum, y: BigNum): BigNum => {
    return new BigNum(sodium.crypto_core_ed25519_scalar_add(x.toBuffer('le', 32), y.toBuffer('le', 32)));
  };

  const scalarSub = (x: BigNum, y: BigNum): BigNum => {
    return new BigNum(sodium.crypto_core_ed25519_scalar_sub(x.toBuffer('le', 32), y.toBuffer('le', 32)));
  };

  const scalarMult = (x: BigNum, y: BigNum): BigNum => {
    return new BigNum(sodium.crypto_core_ed25519_scalar_mul(x.toBuffer('le', 32), y.toBuffer('le', 32)));
  };

  const basePointMult = (n: BigNum): BigNum => {
    return new BigNum(sodium.crypto_scalarmult_ed25519_base_noclamp(n.toBuffer('le', 32)));
  };

  const pointAdd = (p: BigNum, q: BigNum): BigNum => {
    return new BigNum(sodium.crypto_core_ed25519_add(p.toBuffer('le', 32), q.toBuffer('le', 32)));
  };

  const verify = (y: BigNum, signedMessage: Uint8Array): Uint8Array => {
    return sodium.crypto_sign_open(signedMessage, y.toBuffer('le', 32));
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
