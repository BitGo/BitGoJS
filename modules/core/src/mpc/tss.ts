const assert = require('assert');
import Ed25519Curve from './curves';
import * as BigNum from 'bn.js';
import { sha512 } from 'js-sha512';
import Shamir from './shamir';


const Eddsa = async () => {
  const ed25519 = await Ed25519Curve();
  const shamir = Shamir(ed25519);

  const keyShare = (index: number, threshold: number, numShares: number) => {
    assert(index > 0 && index <= numShares);

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
    const u = Buffer.from(ed25519.scalarReduce(uBuffer));
    const y = Buffer.from(ed25519.basePointMult(u));
    const split_u = shamir.split(u, threshold, numShares);
    
    // using big endian
    let prefixBuffer = combinedBuffer.subarray(32, combinedBuffer.length);
    prefixBuffer = Buffer.concat([zeroBuffer32, prefixBuffer]);
    prefixBuffer.reverse();
    const prefix = Buffer.from(ed25519.scalarReduce(prefixBuffer));

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
  };
  const keyCombine = (shares) => {
    let P_i = shares.filter((share) => {
      return !('j' in share);
    });
    const keys = Object.keys(P_i);
    P_i = P_i[keys[0]];

    const yShares = shares.map(share => share['y']);
    const uShares = shares.map(share => share['u']);
    let y = yShares.reduce((partial, share) => {
      return ed25519.pointAdd(partial, share);
    });
    let x = uShares.reduce((partial, share) => {
      return ed25519.scalarAdd(partial, share);
    });
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
  };

  const signShare = (message: Buffer, shares) => {
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

    const r = Buffer.from(ed25519.scalarReduce(digest));
    const R = Buffer.from(ed25519.basePointMult(r));

    const split_r = shamir.split(r, shares.length, shares.length, indices);

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
  };

  const sign = (message: Buffer, shares) => {
    let S_i = shares.filter((share) => {
      return !('j' in share);
    });
    const keys = Object.keys(S_i);
    S_i = S_i[keys[0]];

    const rShares = shares.map(share => share['R']);
    const littleRShares = shares.map(share => share['r']);

    let R = rShares.reduce((partial, share) => {
      return ed25519.pointAdd(partial, share);
    });
    R = Buffer.from(R);

    const combinedBuffer = Buffer.concat([R, S_i['y'], message]);
    const digest = Buffer.from(sha512.digest(combinedBuffer));
    const k = Buffer.from(ed25519.scalarReduce(digest));
    let r = littleRShares[0];
    for (let ind = 1; ind < littleRShares.length; ind ++) {
      const share = littleRShares[ind];
      r = ed25519.scalarAdd(r, share);
    }
    r = Buffer.from(r);
    const gamma = Buffer.from(ed25519.scalarAdd(r,
      ed25519.scalarMult(k, S_i['x'])));
    const result = {
      i: S_i['i'],
      y: S_i['y'],
      gamma: gamma,
      R: R,
    };
    return result;
  };

  const signCombine = (shares) => {
    const keys = Object.keys(shares);
    const y = shares[keys[0]]['y'];
    const R = shares[keys[0]]['R'];

    const resultShares = {};
    for (const ind in shares) {
      const S_i = shares[ind];
      resultShares[S_i['i']] = S_i['gamma'];
    }
    let sigma: any = shamir.combine(resultShares);
    sigma = Buffer.from(sigma);
    const result = {
      y: y,
      R: R,
      sigma: sigma,
    };
    return result;
  };

  const verify = (message: Buffer, signature) => {
    const publicKey = signature['y'];
    const signedMessage = Buffer.concat([signature['R'], signature['sigma'], message]);
    return ed25519.verify(publicKey, signedMessage);
  };

  return { keyShare, keyCombine, signShare, sign, signCombine, verify };
};

export default Eddsa;
