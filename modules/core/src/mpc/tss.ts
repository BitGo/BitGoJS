const assert = require('assert');
import { randomBytes as cryptoRandomBytes } from 'crypto';
import { Ed25519Curve, UnaryOperation, BinaryOperation } from './curves';
import * as BigNum from 'bn.js';
import { sha512 } from 'js-sha512';
import { split as shamirSplit, combine as shamirCombine } from './shamir';

export default class Eddsa {

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  public static async keyShare(index: number, threshold, numShares) {
    assert(index > 0 && index <= numShares);
    const randomNumber = new BigNum(cryptoRandomBytes(32));
    const sk = randomNumber.toBuffer('be', Math.floor((randomNumber.bitLength() + 7) / 8));
    const h = new BigNum(sha512.digest(sk)).toBuffer('be');
    const zeroBuffer = Buffer.alloc(64 - h.length);
    const combinedBuffer = Buffer.concat([zeroBuffer, h]);

    let uBuffer = combinedBuffer.slice(0, 32);
    uBuffer[0] &= 248;
    uBuffer[31] &= 63;
    uBuffer[31] |= 64;

    const zeroBuffer32 = Buffer.alloc(32);
    uBuffer = Buffer.concat([zeroBuffer32, uBuffer]);
    const originU = new BigNum(uBuffer, 'be');
    const u = await Ed25519Curve.scalarReduce(originU);
    const y = await Ed25519Curve.unaryOperation(u, UnaryOperation.pointBaseMultiply);

    const split_u: Record<any, any> = await shamirSplit(u, threshold, numShares);
    let prefixBuffer = combinedBuffer.subarray(32, combinedBuffer.length);
    prefixBuffer = Buffer.concat([zeroBuffer32, prefixBuffer]);
    const prefix = await Ed25519Curve.scalarReduce(new BigNum(prefixBuffer, 'be'));

    const P_i = {
      i: index,
      y: y,
      u: split_u[index],
      prefix: prefix,
    };
    const shares: any = {
      [index]: P_i,
    };
    for (const ind in split_u) {
      // object keys are string values
      if (ind === index.toString()) {
        continue;
      }
      shares[ind] = {
        i: parseInt(ind, 10),
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
    let P_i = shares.filter((share) => {
      return !('j' in share);
    });
    const keys = Object.keys(P_i);
    P_i = P_i[keys[0]];

    const yShares = shares.map(share => share['y']);
    const uShares = shares.map(share => share['u']);
    const y = await yShares.reduce(async (partial, yShare) => {
      return await Ed25519Curve.pointAdd(partial, yShare);
    });
    const x = await uShares.reduce(async (partial, share) => {
      return await Ed25519Curve.binaryOperation(partial, share, BinaryOperation.scalarAdd);
    });

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

    for (let ind = 0; ind < Object.keys(P_i).length; ind++) {
      const P_j = P_i[ind];
      if ('j' in P_j) {

        players[P_j['j']] = {
          i: P_j['j'],
          j: P_i['i'],
        };
      }
    }
    return players;
  }


  public static async signShare(message: Buffer, shares) {
    let S_i = shares.filter((share) => {
      return !('j' in share);
    });
    S_i = Object.keys(S_i)[0];

    const indices = shares.map(share => share['i']);
    const prefixBuffer = Buffer.alloc(32);
    const randomBuffer = Buffer.alloc(32);
    prefixBuffer.writeInt32BE(S_i['prefxi'], 0);
    randomBuffer.writeInt32BE(await Ed25519Curve.scalarRandom(), 0);

    const combinedBuffer = Buffer.concat([prefixBuffer, message, randomBuffer]);
    const digest = sha512.digest(combinedBuffer);
    const L = new BigNum(digest);
    const r = await Ed25519Curve.scalarReduce(L);
    const R = await Ed25519Curve.unaryOperation(r, UnaryOperation.pointBaseMultiply);
    const split_r = shamirSplit(r, shares.length, shares.length, indices);

    const resultShares: any = {
      [S_i['i']]: {
        i: S_i['i'],
        y: S_i['y'],
        x: S_i['x'],
        r: split_r[S_i['i']],
        R: R,
      },
    };

    for (let ind = 0; ind < Object.keys(shares).length; ind++) {
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
    let S_i = shares.filter((share) => {
      return !('j' in share);
    });
    S_i = Object.keys(S_i)[0];

    const rShares = shares.map(share => share['R']);
    const R = rShares.reduce(async (partial, share) => {
      return await Ed25519Curve.pointAdd(partial, share);
    });

    const r_buffer = Buffer.alloc(32);
    const si_buffer = Buffer.alloc(32);
    r_buffer.writeInt32LE(R, 0);
    si_buffer.writeInt32LE(S_i['y'], 0);
    const combinedBuffer = Buffer.concat([r_buffer, si_buffer, message]);
    const digest = sha512.digest(combinedBuffer);
    const L = new BigNum(digest);
    const k = await Ed25519Curve.scalarReduce(L);

    const little_r_shares = shares.map(share => share['r']);
    const r = little_r_shares.reduce((partial, share) => {
      return Ed25519Curve.binaryOperation(partial, share, BinaryOperation.scalarAdd);
    });
    const gamma = await Ed25519Curve.binaryOperation(r,
      await Ed25519Curve.binaryOperation(k, S_i['x'], BinaryOperation.scalarMultiply),
      BinaryOperation.scalarAdd
    );

    return {
      i: S_i['i'],
      y: S_i['y'],
      gamma: gamma,
      R: R,
    };
  }

  public static async signCombine(shares) {
    const y = Object.keys(shares)[0]['y'];
    const R = Object.keys(shares)[0]['R'];

    const resultShares = {};
    for (let ind = 0; ind < Object.keys(shares).length; ind++) {
      const S_i = shares[ind];
      resultShares[S_i['i']] = S_i['gamma'];
    }
    const sigma = shamirCombine(resultShares);
    return {
      y: y,
      R: R,
      sigma: sigma,
    };
  }

  public static async verify(message, signature): Promise<boolean> {
    const y_buffer = Buffer.alloc(32);
    const r_buffer = Buffer.alloc(32);
    const sigma_buffer = Buffer.alloc(32);
    y_buffer.writeUInt32LE(signature['y'], 0);
    r_buffer.writeUInt32LE(signature['R'], 0);
    sigma_buffer.writeUInt32LE(signature['sigma'], 0);

    const combinedBuffer = Buffer.concat([r_buffer, sigma_buffer]);
    return await Ed25519Curve.verify(y_buffer, message, combinedBuffer);
  }
}
