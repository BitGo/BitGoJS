/**
 * Module provides functions for MPC using threshold signature scheme (TSS). It contains
 * functions for key generation and message signing with EdDSA.
 *
 *
 * ======================
 * EdDSA Key Generation
 * ======================
 * 1. Each signer generates their own key share, which involves a private u-share and a public y-share.
 * 2. Signers distribute their y-share to other signers.
 * 3. After exchanging y-shares the next phase is to combine key shares. Each signer combines their u-share
 *    with the y-shares received from other signers in order to generate a p-share for themselves. We
 *    also save j-shares for other signers.
 * 4. At this point the players do not distribute any shares and the first phase of the
 *    signing protocol is complete.
 *
 * ======================
 * EdDSA Signing
 * ======================
 * 1. The parties from key generation decide they want to sign something. They begin the signing protocol
 *    by generating shares of an ephemeral key.
 *
 *    a) Each signer uses his p-share and the j-shares stored for other players to generate his signing share.
 *    b) This results in each signer having a private x-share and public r-shares.
 *
 * 2. Signers distribute their r-shares to other signers.
 * 3. After exchanging r-shares, each signer signs their share of the ephemeral key using their private
 *    x-share with the r-shares from other signers.
 * 4. This results in each signer having a public g-share which they send to the other signers.
 * 5. After the signers broadcast their g-shares, the final signature can be re-constructed independently.
 */
const assert = require('assert');
import Ed25519Curve from './curves';
import { sha512 } from 'js-sha512';
import Shamir from './shamir';
import { randomBytes as cryptoRandomBytes } from 'crypto';

const convertObjectHexToBuffer = (object: Record<string, any>, keys: string[]) => {
  const result: any = object;
  keys.forEach((key) => {
    result[key] = Buffer.from(object[key], 'hex');
  });
  return result;
};

interface UShare {
  i: string;
  y: string;
  u: string;
  prefix: string;
}

interface YShare {
  i: string;
  j: string;
  y: string;
  u: string;
}

export interface KeyShare {
  uShare: UShare;
  yShares: Record<string, YShare>;
}

interface PShare {
  i: string;
  x: string;
  y: string;
  prefix: string;
}

interface JShare {
  i: string;
  j: string;
}

interface KeyCombine {
  pShare: PShare;
  jShares: Record<string, JShare>;
}

interface XShare {
  i: string;
  y: string;
  x: string;
  r: string;
  R: string;
}

interface RShare {
  i: string;
  j: string;
  r: string;
  R: string;
}

interface SignShare {
  xShare: XShare;
  rShares: Record<string, RShare>;
}

interface GShare {
  i: string;
  y: string;
  gamma: string;
  R: string;
}

interface Signature {
  y: string;
  R: string;
  sigma: string;
}

const Eddsa = async () => {
  const ed25519 = await Ed25519Curve();
  const shamir = Shamir(ed25519);

  const keyShare = (index: number, threshold: number, numShares: number): KeyShare => {
    assert(index > 0 && index <= numShares);
    const sk = cryptoRandomBytes(32);
    const h = Buffer.from(sha512.digest(sk));
    const zeroBuffer = Buffer.alloc(64 - h.length);
    const combinedBuffer = Buffer.concat([zeroBuffer, h]);

    let uBuffer = combinedBuffer.slice(0, 32);
    uBuffer[0] &= 248;
    uBuffer[31] &= 63;
    uBuffer[31] |= 64;

    const zeroBuffer32 = Buffer.alloc(32);
    uBuffer = Buffer.concat([uBuffer, zeroBuffer32]);
    const u = Buffer.from(ed25519.scalarReduce(uBuffer));
    const y = Buffer.from(ed25519.basePointMult(u));
    const split_u = shamir.split(u, threshold, numShares);

    let prefixBuffer = combinedBuffer.subarray(32, combinedBuffer.length);
    prefixBuffer = Buffer.concat([zeroBuffer32, prefixBuffer]);
    const prefix = Buffer.from(ed25519.scalarReduce(prefixBuffer));

    const P_i: UShare = {
      i: index.toString(),
      y: y.toString('hex'),
      u: split_u[index.toString()].toString('hex'),
      prefix: prefix.toString('hex'),
    };
    const shares: KeyShare = {
      uShare: P_i,
      yShares: {},
    };

    for (const ind in split_u) {
      if (ind === index.toString()) {
        continue;
      }
      shares.yShares[ind] = {
        i: ind,
        j: P_i['i'],
        y: y.toString('hex'),
        u: split_u[ind].toString('hex'),
      };
    }
    return shares;
  };
  const keyCombine = (uShare: UShare, distributedShares: YShare[]): KeyCombine => {
    // u-shares and y-shares required buffer format for curve functions
    const shares = [uShare, ...distributedShares].map((share) => convertObjectHexToBuffer(share, ['y', 'u']));
    const yShares = shares.map((share) => share['y']);
    const uShares = shares.map((share) => share['u']);
    const y = Buffer.from(yShares.reduce((partial, share) => ed25519.pointAdd(partial, share)));
    const x = Buffer.from(uShares.reduce((partial, share) => ed25519.scalarAdd(partial, share)));

    const P_i: PShare = {
      i: uShare['i'],
      y: y.toString('hex'),
      x: x.toString('hex'),
      prefix: uShare['prefix'],
    };
    const players: KeyCombine = {
      pShare: P_i,
      jShares: {},
    };

    for (let ind = 0; ind < distributedShares.length; ind++) {
      const P_j = distributedShares[ind];
      players.jShares[P_j['j']] = {
        i: P_j['j'],
        j: P_i['i'],
      };
    }
    return players;
  };

  const signShare = (message: Buffer, pShare: PShare, jShares: JShare[]): SignShare => {
    // x-shares and y-shares required buffer format for curve functions
    const shares = [convertObjectHexToBuffer(pShare, ['x', 'y']), ...jShares];
    const indices = shares.map((share) => share['i']);

    // use big endian for prefix
    const randomBuffer = cryptoRandomBytes(32);
    const prefix_reference = Buffer.from(pShare['prefix'], 'hex');
    prefix_reference.reverse();
    const combinedBuffer = Buffer.concat([prefix_reference, message, randomBuffer]);

    // using big endian
    const digest = Buffer.from(sha512.digest(combinedBuffer));
    digest.reverse();

    const r = Buffer.from(ed25519.scalarReduce(digest));
    const R = Buffer.from(ed25519.basePointMult(r));
    const split_r = shamir.split(r, shares.length, shares.length, indices);

    const P_i: XShare = {
      i: pShare['i'],
      y: pShare['y'],
      x: pShare['x'],
      r: split_r[pShare['i']].toString('hex'),
      R: R.toString('hex'),
    };

    const resultShares: SignShare = {
      xShare: P_i,
      rShares: {},
    };

    for (let ind = 0; ind < jShares.length; ind++) {
      const S_j = jShares[ind];
      resultShares.rShares[S_j['i']] = {
        i: S_j['i'],
        j: pShare['i'],
        r: split_r[S_j['i']].toString('hex'),
        R: R.toString('hex'),
      };
    }
    return resultShares;
  };

  const sign = (message: Buffer, playerShare: XShare, distributedShares: RShare[]): GShare => {
    // x, y, r, R required buffer format for curve functions
    const shares = [playerShare, ...distributedShares].map((share) => convertObjectHexToBuffer(share, ['R', 'r']));
    const S_i = playerShare;

    const rShares = shares.map((share) => share['R']);
    const littleRShares = shares.map((share) => share['r']);

    const R = Buffer.from(rShares.reduce((partial, share) => ed25519.pointAdd(partial, share)));
    const r = Buffer.from(littleRShares.reduce((partial, share) => ed25519.scalarAdd(partial, share)));

    const combinedBuffer = Buffer.concat([R, Buffer.from(S_i['y'], 'hex'), message]);
    const digest = Buffer.from(sha512.digest(combinedBuffer));
    const k = Buffer.from(ed25519.scalarReduce(digest));

    const gamma = Buffer.from(ed25519.scalarAdd(r, ed25519.scalarMult(k, Buffer.from(S_i['x'], 'hex'))));
    const result = {
      i: playerShare['i'],
      y: playerShare['y'],
      gamma: gamma.toString('hex'),
      R: R.toString('hex'),
    };
    return result;
  };

  const signCombine = (shares: GShare[]): Signature => {
    shares = shares.map((share) => convertObjectHexToBuffer(share, ['y', 'gamma', 'R']));
    const keys = Object.keys(shares);
    const y = shares[keys[0]]['y'];
    const R = shares[keys[0]]['R'];

    const resultShares = {};
    for (const ind in shares) {
      const S_i = shares[ind];
      resultShares[S_i['i']] = S_i['gamma'];
    }
    let sigma: Buffer = shamir.combine(resultShares);
    sigma = Buffer.from(sigma);
    const result = {
      y: y.toString('hex'),
      R: R.toString('hex'),
      sigma: sigma.toString('hex'),
    };
    return result;
  };

  const verify = (message: Buffer, signature: Signature): Buffer => {
    const publicKey = Buffer.from(signature['y'], 'hex');
    const signedMessage = Buffer.concat([
      Buffer.from(signature['R'], 'hex'),
      Buffer.from(signature['sigma'], 'hex'),
      message,
    ]);
    return Buffer.from(ed25519.verify(publicKey, signedMessage));
  };

  return { keyShare, keyCombine, signShare, sign, signCombine, verify };
};

export default Eddsa;
