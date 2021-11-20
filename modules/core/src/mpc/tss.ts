const assert = require('assert');
import { randomBytes as cryptoRandomBytes } from 'crypto';
import { Ed25519Curve, UnaryOperation, BinaryOperation } from './curves';
import * as BigNum from 'bn.js';
import { sha512 } from 'js-sha512';
const sodium = require('libsodium-wrappers-sumo');
import { split as shamirSplit, combine as shamirCombine } from './shamir';

export default class Eddsa {

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  public static async keyShare(index: number, threshold, numShares) {
    assert(index > 0 && index <= numShares);
    await sodium.ready;

    const randomNumber = new BigNum(500);
    const sk = randomNumber.toBuffer('be', Math.floor((randomNumber.bitLength() + 7) / 8));
    const h = new BigNum(sha512.digest(sk)).toBuffer('be');
    const zeroBuffer = Buffer.alloc(64 - h.length);
    const combinedBuffer = Buffer.concat([zeroBuffer, h]);

    let uBuffer = combinedBuffer.slice(0, 32);
    uBuffer[0] &= 248;
    uBuffer[31] &= 63;
    uBuffer[31] |= 64;

    // using big endian
    const zeroBuffer32 = Buffer.alloc(32);
    uBuffer = Buffer.concat([zeroBuffer32, uBuffer]);
    uBuffer.reverse();
    const u = Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(uBuffer));
    const y = Buffer.from(sodium.crypto_scalarmult_ed25519_base_noclamp(u));
    const split_u = await shamirSplit(u, threshold, numShares);
    
    // using big endian
    let prefixBuffer = combinedBuffer.subarray(32, combinedBuffer.length);
    prefixBuffer = Buffer.concat([zeroBuffer32, prefixBuffer]);
    prefixBuffer.reverse();
    const prefix = Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(prefixBuffer));

    const P_i = {
      i: index,
      y: y,
      u: split_u[index.toString()],
      prefix: prefix,
    };
    const shares: any = {
      [index]: P_i,
    };

    for (const ind in split_u) {
      if (ind === index.toString()) {
        continue;
      }
      shares[ind] = {
        i: ind,
        j: P_i['i'],
        y: y,
        u: split_u[ind],
      };
    }
    return shares;
  }

  /**
   * Combine data shared during the key generation protocol. 
   * @param shares 
   */
  public static async keyCombine(shares) {
    await sodium.ready;

    let P_i = shares.filter((share) => {
      return !('j' in share);
    });
    const keys = Object.keys(P_i);
    P_i = P_i[keys[0]];

    const yShares = shares.map(share => share['y']);
    const uShares = shares.map(share => share['u']);
    let y: Buffer = yShares[0];
    let x: Buffer = uShares[0];
    for (let ind = 1; ind < yShares.length; ind ++) {
      const share = yShares[ind];
      y = sodium.crypto_core_ed25519_add(y, share);
    }
    for (let ind = 1; ind < uShares.length; ind ++) {
      const share = uShares[ind];
      x = sodium.crypto_core_ed25519_scalar_add(x, share);
    }
    x = Buffer.from(x);
    y = Buffer.from(y);

    P_i = {
      i: P_i['i'],
      y: y,
      x: x,
      prefix: P_i['prefix'],
    };
    const i = P_i['i'];
    const players = {
      [i]: P_i,
    };

    for (let ind = 0; ind < shares.length; ind++) {
      const P_j = shares[ind];
      if ('j' in P_j) {
        players[P_j['j']] = {
          i: P_j['j'],
          j: P_i['i'],
        };
      }
    }
    return players;
  }


  public static async signShare(message: Buffer, shares, threshold, numShares) {
    await sodium.ready;
    let S_i = shares.filter((share) => {
      return !('j' in share);
    });
    const keys = Object.keys(S_i);
    S_i = S_i[keys[0]];
    const indices = shares.map((share) => share['i']);

    const randomBuffer = new BigNum(500).toBuffer('be', 32);
    const prefix_reference = Buffer.from(S_i['prefix']);
    prefix_reference.reverse();
    const combinedBuffer = Buffer.concat([prefix_reference, message, randomBuffer]);

    // using big endian
    const digest = Buffer.from(sha512.digest(combinedBuffer));
    digest.reverse();

    const r = Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(digest));
    const R = Buffer.from(sodium.crypto_scalarmult_ed25519_base_noclamp(r));

    const split_r = await shamirSplit(r, shares.length, shares.length, indices);

    const resultShares: any = {
      [S_i['i']]: {
        i: S_i['i'],
        y: S_i['y'],
        x: S_i['x'],
        r: split_r[S_i['i']],
        R: R,
      },
    };

    for (let ind = 0; ind < shares.length; ind++) {
      const S_j = shares[ind];
      if ('j' in S_j) {
        resultShares[S_j['i']] = {
          i: S_j['i'],
          j: S_i['i'],
          r: split_r[S_j['i']],
          R: R,
        };
      }
    }
    return resultShares;
  }

  public static async sign(message: Buffer, shares) {
    await sodium.ready;
    let S_i = shares.filter((share) => {
      return !('j' in share);
    });
    const keys = Object.keys(S_i);
    S_i = S_i[keys[0]];

    const rShares = shares.map(share => share['R']);
    const littleRShares = shares.map(share => share['r']);

    let R = rShares[0];
    for (let ind = 1; ind < rShares.length; ind ++) {
      const share = rShares[ind];
      R = sodium.crypto_core_ed25519_add(R, share);
    }
    R = Buffer.from(R);

    const combinedBuffer = Buffer.concat([R, S_i['y'], message]);
    const digest = Buffer.from(sha512.digest(combinedBuffer));
    const k = Buffer.from(sodium.crypto_core_ed25519_scalar_reduce(digest));
    let r = littleRShares[0];
    for (let ind = 1; ind < littleRShares.length; ind ++) {
      const share = littleRShares[ind];
      r = sodium.crypto_core_ed25519_scalar_add(r, share);
    }
    r = Buffer.from(r);
    const gamma = Buffer.from(sodium.crypto_core_ed25519_scalar_add(r,
      sodium.crypto_core_ed25519_scalar_mul(k, S_i['x'])));
    const result = {
      i: S_i['i'],
      y: S_i['y'],
      gamma: gamma,
      R: R,
    };
    return result;
  }

  public static async signCombine(shares) {
    await sodium.ready;
    const keys = Object.keys(shares);
    const y = shares[keys[0]]['y'];
    const R = shares[keys[0]]['R'];

    const resultShares = {};
    for (const ind in shares) {
      const S_i = shares[ind];
      resultShares[S_i['i']] = S_i['gamma'];
    }
    let sigma: any = await shamirCombine(resultShares);
    sigma = Buffer.from(sigma);
    const result = {
      y: y,
      R: R,
      sigma: sigma,
    };
    return result;
  }

  public static async verify(message: Buffer, signature) {
    await sodium.ready;
    const publicKey = signature['y'];
    const signedMessage = Buffer.concat([signature['R'], signature['sigma'], message]);
    return sodium.crypto_sign_open(signedMessage, publicKey);
  }
}
