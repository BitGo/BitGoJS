const assert = require('assert');
import Ed25519Curve from './curves';
import * as BigNum from 'bn.js';
import { sha512 } from 'js-sha512';
import Shamir from './shamir';
import { randomBytes as cryptoRandomBytes } from 'crypto';

const convertObjectHexToBuffer = (object: Record<string, string>, keys: string[]) => {
  const result: any = object;
  keys.forEach(key => {
    result[key] = Buffer.from(object[key], 'hex');
  });
  return result;
};

interface PrivateShare {
  i: string,
  y: string,
  u: string,
  prefix: string,
}

interface PublicShare {
  i: string,
  j: string,
  y: string,
  u: string,
}

interface KeyShare {
  private: PrivateShare,
  public: Record<string, PublicShare>
}

interface PrivateCombine {
  i: string,
  x: string,
  y: string,
  prefix: string,
}

interface PublicCombine {
  i: string,
  j: string,
}

interface KeyCombine {
  private: PrivateCombine,
  public: Record<string, PublicCombine>
}

interface PrivateSignShare {
  i: string,
  y: string,
  x: string,
  r: string,
  R: string,
}

interface PublicSignShare {
  i: string,
  j: string,
  r: string,
  R: string,
}

interface SignShare {
  private: PrivateSignShare,
  public: Record<string, PublicSignShare>,
}

const Eddsa = async () => {
  const ed25519 = await Ed25519Curve();
  const shamir = Shamir(ed25519);

  const keyShare = (index: number, threshold: number, numShares: number) => {
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

    const P_i: PrivateShare = {
      i: index.toString(),
      y: y.toString('hex'),
      u: split_u[index.toString()].toString('hex'),
      prefix: prefix.toString('hex'),
    };
    const shares: KeyShare = {
      private: P_i,
      public: {},
    };

    for (const ind in split_u) {
      if (ind === index.toString()) {
        continue;
      }
      shares['public'][ind] = {
        i: ind,
        j: P_i['i'],
        y: y.toString('hex'),
        u: split_u[ind].toString('hex'),
      };
    }
    return shares;
  };
  const keyCombine = (privateShare: PrivateShare, publicShares) => {
    // u-shares and y-shares required buffer format for curve functions
    const shares = [privateShare, ...publicShares].map(share => convertObjectHexToBuffer(share, ['y', 'u']));
    const yShares = shares.map(share => share['y']);
    const uShares = shares.map(share => share['u']);
    const y = Buffer.from(yShares.reduce((partial, share) => ed25519.pointAdd(partial, share)));
    const x = Buffer.from(uShares.reduce((partial, share) => ed25519.scalarAdd(partial, share)));

    const P_i: PrivateCombine = {
      i: privateShare['i'],
      y: y.toString('hex'),
      x: x.toString('hex'),
      prefix: privateShare['prefix'],
    };
    const players: KeyCombine = {
      private: P_i,
      public: {},
    };

    for (let ind = 0; ind < publicShares.length; ind++) {
      const P_j = publicShares[ind];
      players.public[P_j['j']] = {
        i: P_j['j'],
        j: P_i['i'],
      };
    }
    return players;
  };

  const signShare = (message: Buffer, privateShare, publicShares) => {
    // x-shares and y-shares required buffer format for curve functions
    privateShare = convertObjectHexToBuffer(privateShare, ['x', 'y']);
    const shares = [privateShare, ...publicShares];
    const S_i = privateShare;
    const indices = shares.map((share) => share['i']);

    const randomBuffer = new BigNum(cryptoRandomBytes(32)).toBuffer('be', 32);
    const prefix_reference = Buffer.from(S_i['prefix'], 'hex');
    prefix_reference.reverse();
    const combinedBuffer = Buffer.concat([prefix_reference, message, randomBuffer]);

    // using big endian
    const digest = Buffer.from(sha512.digest(combinedBuffer));
    digest.reverse();

    const r = Buffer.from(ed25519.scalarReduce(digest));
    const R = Buffer.from(ed25519.basePointMult(r));
    const split_r = shamir.split(r, shares.length, shares.length, indices);

    const P_i: PrivateSignShare = {
      i: S_i['i'],
      y: S_i['y'].toString('hex'),
      x: S_i['x'].toString('hex'),
      r: split_r[S_i['i']].toString('hex'),
      R: R.toString('hex'),
    };

    const resultShares: SignShare = {
      private: P_i,
      public: {},
    };

    for (let ind = 0; ind < publicShares.length; ind++) {
      const S_j = publicShares[ind];
      resultShares['public'][S_j['i']] = {
        i: S_j['i'],
        j: S_i['i'],
        r: split_r[S_j['i']].toString('hex'),
        R: R.toString('hex'),
      };
    }
    return resultShares;
  };

  const sign = (message: Buffer, privateShare, publicShares) => {
    // x, y, r, R required buffer format for curve functions
    privateShare = convertObjectHexToBuffer(privateShare, ['x', 'y']);
    const shares = [privateShare, ...publicShares].map(share => convertObjectHexToBuffer(share, ['R', 'r']));
    const S_i = privateShare;

    const rShares = shares.map(share => share['R']);
    const littleRShares = shares.map(share => share['r']);

    const R = Buffer.from(rShares.reduce((partial, share) => ed25519.pointAdd(partial, share)));
    const r = Buffer.from(littleRShares.reduce((partial, share) => ed25519.scalarAdd(partial, share)));

    const combinedBuffer = Buffer.concat([R, S_i['y'], message]);
    const digest = Buffer.from(sha512.digest(combinedBuffer));
    const k = Buffer.from(ed25519.scalarReduce(digest));

    const gamma = Buffer.from(ed25519.scalarAdd(r,
      ed25519.scalarMult(k, S_i['x'])));
    const result = {
      i: S_i['i'],
      y: S_i['y'].toString('hex'),
      gamma: gamma.toString('hex'),
      R: R.toString('hex'),
    };
    return result;
  };

  const signCombine = (shares) => {
    shares = shares.map(share => convertObjectHexToBuffer(share, ['y', 'gamma', 'R']));
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
      y: y.toString('hex'),
      R: R.toString('hex'),
      sigma: sigma.toString('hex'),
    };
    return result;
  };

  const verify = (message: Buffer, signature) => {
    signature = convertObjectHexToBuffer(signature, ['y', 'R', 'sigma']);
    const publicKey = signature['y'];
    const signedMessage = Buffer.concat([signature['R'], signature['sigma'], message]);
    return ed25519.verify(publicKey, signedMessage);
  };

  return { keyShare, keyCombine, signShare, sign, signCombine, verify };
};

export default Eddsa;
