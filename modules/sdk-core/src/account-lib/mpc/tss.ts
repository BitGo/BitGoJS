const assert = require('assert');
import { randomBytes, createHash } from 'crypto';
import { Ed25519Curve } from './curves';
import Shamir from './shamir';
import { HDTree } from './hdTree';
import { bigIntFromBufferLE, bigIntToBufferLE, bigIntFromBufferBE, bigIntToBufferBE, clamp } from './util';

// 2^256
const base = BigInt('0x010000000000000000000000000000000000000000000000000000000000000000');

export interface UShare {
  i: number;
  t: number;
  n: number;
  y: string;
  seed: string;
  chaincode: string;
}

export interface YShare {
  i: number;
  j: number;
  y: string;
  u: string;
  chaincode: string;
}

export interface KeyShare {
  uShare: UShare;
  yShares: Record<number, YShare>;
}

export interface PShare {
  i: number;
  t: number;
  n: number;
  y: string;
  u: string;
  prefix: string;
  chaincode: string;
}

export interface JShare {
  i: number;
  j: number;
}

interface KeyCombine {
  pShare: PShare;
  jShares: Record<number, JShare>;
}

interface SubkeyShare {
  pShare: PShare;
  yShares: Record<number, YShare>;
}

export interface XShare {
  i: number;
  y: string;
  u: string;
  r: string;
  R: string;
}

export interface RShare {
  i: number;
  j: number;
  u: string;
  r: string;
  R: string;
}

export interface SignShare {
  xShare: XShare;
  rShares: Record<number, RShare>;
}

export interface GShare {
  i: number;
  y: string;
  gamma: string;
  R: string;
}

interface Signature {
  y: string;
  R: string;
  sigma: string;
}

export interface IEddsa {
  initialize(hdTree: HDTree): Promise<IEddsa>;
  keyShare(index: number, threshold: number, numShares: number, seed: Buffer): KeyShare;
  keyCombine(uShare: UShare, yShares: YShare[]): KeyCombine;
  deriveUnhardened(commonKeychain: string, path: string): string;
  keyDerive(uShare: UShare, yShares: YShare[], path: string): SubkeyShare;
  signShare(message: Buffer, pShare: PShare, jShares: JShare[]): SignShare;
  sign(message: Buffer, playerShare: XShare, rShares: RShare[], yShares: YShare[]): GShare;
  signCombine(shares: GShare[]): Signature;
  verify(message: Buffer, signature: Signature): Buffer;
}

export default class Eddsa {
  static curve: Ed25519Curve = new Ed25519Curve();
  static shamir: Shamir = new Shamir(Eddsa.curve);
  static initialized = false;

  static async initialize(hdTree?: HDTree): Promise<Eddsa> {
    if (!Eddsa.initialized) {
      await Ed25519Curve.initialize();
      Eddsa.initialized = true;
    }

    return new Eddsa(hdTree);
  }

  hdTree?: HDTree;

  constructor(hdTree?: HDTree) {
    this.hdTree = hdTree;
  }

  keyShare(index: number, threshold: number, numShares: number, seed?: Buffer): KeyShare {
    assert(index > 0 && index <= numShares);
    if (seed && seed.length != 64) {
      throw new Error('Seed must have length 64');
    }

    const seedchain = seed ?? randomBytes(64);
    const actualSeed = seedchain.slice(0, 32);
    const chaincode = seedchain.slice(32);
    const h = createHash('sha512').update(actualSeed).digest();
    const u = clamp(bigIntFromBufferLE(h.slice(0, 32)));
    const y = Eddsa.curve.basePointMult(u);
    const split_u = Eddsa.shamir.split(u, threshold, numShares);

    const P_i: UShare = {
      i: index,
      t: threshold,
      n: numShares,
      y: bigIntToBufferLE(y, 32).toString('hex'),
      seed: actualSeed.toString('hex'),
      chaincode: chaincode.toString('hex'),
    };
    const shares: KeyShare = {
      uShare: P_i,
      yShares: {},
    };

    for (const ind in split_u) {
      const i = parseInt(ind, 10);
      if (i === index) {
        continue;
      }
      shares.yShares[i] = {
        i,
        j: P_i.i,
        y: bigIntToBufferLE(y, 32).toString('hex'),
        u: bigIntToBufferLE(split_u[ind], 32).toString('hex'),
        chaincode: chaincode.toString('hex'),
      };
    }
    return shares;
  }

  keyCombine(uShare: UShare, yShares: YShare[]): KeyCombine {
    const h = createHash('sha512').update(Buffer.from(uShare.seed, 'hex')).digest();
    const u = clamp(bigIntFromBufferLE(h.slice(0, 32)));
    const yValues = [uShare, ...yShares].map((share) => bigIntFromBufferLE(Buffer.from(share.y, 'hex')));
    const y = yValues.reduce((partial, share) => Eddsa.curve.pointAdd(partial, share));
    const chaincodes = [uShare, ...yShares].map(({ chaincode }) => bigIntFromBufferBE(Buffer.from(chaincode, 'hex')));
    const chaincode = chaincodes.reduce((acc, chaincode) => (acc + chaincode) % base);

    const P_i: PShare = {
      i: uShare.i,
      t: uShare.t,
      n: uShare.n,
      y: bigIntToBufferLE(y, 32).toString('hex'),
      u: bigIntToBufferLE(u, 32).toString('hex'),
      prefix: h.slice(32).toString('hex'),
      chaincode: bigIntToBufferBE(chaincode, 32).toString('hex'),
    };
    const players: KeyCombine = {
      pShare: P_i,
      jShares: {},
    };

    for (let ind = 0; ind < yShares.length; ind++) {
      const P_j = yShares[ind];
      players.jShares[P_j.j] = {
        i: P_j.j,
        j: P_i.i,
      };
    }
    return players;
  }

  /**
   * Derives a child common keychain from common keychain
   *
   * @param commonKeychain - common keychain as a hex string
   * @param path - bip32 path
   * @return {string} derived common keychain as a hex string
   */
  deriveUnhardened(commonKeychain: string, path: string): string {
    if (this.hdTree === undefined) {
      throw new Error("Can't derive key without HDTree implementation");
    }

    const keychain = Buffer.from(commonKeychain, 'hex');

    const derivedPublicKeychain = this.hdTree.publicDerive(
      {
        pk: bigIntFromBufferLE(keychain.slice(0, 32)),
        chaincode: bigIntFromBufferBE(keychain.slice(32)),
      },
      path
    );

    const derivedPk = bigIntToBufferLE(derivedPublicKeychain.pk, 32).toString('hex');
    const derivedChaincode = bigIntToBufferBE(derivedPublicKeychain.chaincode, 32).toString('hex');

    return derivedPk + derivedChaincode;
  }

  keyDerive(uShare: UShare, yShares: YShare[], path: string): SubkeyShare {
    if (this.hdTree === undefined) {
      throw new Error("Can't derive key without HDTree implementation");
    }
    const h = createHash('sha512').update(Buffer.from(uShare.seed, 'hex')).digest();
    const yValues = [uShare, ...yShares].map((share) => bigIntFromBufferLE(Buffer.from(share.y, 'hex')));
    const y = yValues.reduce((partial, share) => Eddsa.curve.pointAdd(partial, share));
    const u = clamp(bigIntFromBufferLE(h.slice(0, 32)));
    const prefix = bigIntFromBufferBE(h.slice(32));
    let contribChaincode = bigIntFromBufferBE(Buffer.from(uShare.chaincode, 'hex'));
    const chaincodes = [
      contribChaincode,
      ...yShares.map(({ chaincode }) => bigIntFromBufferBE(Buffer.from(chaincode, 'hex'))),
    ];
    const chaincode = chaincodes.reduce((acc, chaincode) => (acc + chaincode) % base);

    // Derive subkey.
    const subkey = this.hdTree.privateDerive({ pk: y, sk: u, prefix, chaincode }, path);

    // Calculate new public key contribution.
    const contribY = Eddsa.curve.basePointMult(subkey.sk);

    // Calculate new chaincode contribution.
    const chaincodeDelta = (base + subkey.chaincode - chaincode) % base;
    contribChaincode = (contribChaincode + chaincodeDelta) % base;

    // Calculate new u values.
    const split_u = Eddsa.shamir.split(subkey.sk, uShare.t, uShare.n);

    const P_i: PShare = {
      i: uShare.i,
      t: uShare.t,
      n: uShare.n,
      y: bigIntToBufferLE(subkey.pk, 32).toString('hex'),
      u: bigIntToBufferLE(subkey.sk, 32).toString('hex'),
      prefix: bigIntToBufferBE(subkey.prefix, 32).toString('hex'),
      chaincode: bigIntToBufferBE(subkey.chaincode, 32).toString('hex'),
    };

    const shares: SubkeyShare = {
      pShare: P_i,
      yShares: {},
    };

    for (let ind = 0; ind < yShares.length; ind++) {
      const P_j = yShares[ind];
      shares.yShares[P_j.j] = {
        i: P_j.j,
        j: P_i.i,
        y: bigIntToBufferLE(contribY, 32).toString('hex'),
        u: bigIntToBufferLE(split_u[P_j.j], 32).toString('hex'),
        chaincode: bigIntToBufferBE(contribChaincode, 32).toString('hex'),
      };
    }

    return shares;
  }

  signShare(message: Buffer, pShare: PShare, jShares: JShare[]): SignShare {
    const indices = [pShare, ...jShares].map(({ i }) => i);
    const split_u = Eddsa.shamir.split(bigIntFromBufferLE(Buffer.from(pShare.u, 'hex')), pShare.t, pShare.n);

    // Generate nonce contribution.
    const prefix = Buffer.from(pShare.prefix, 'hex');
    const randomBuffer = randomBytes(32);
    const digest = createHash('sha512')
      .update(Buffer.concat([prefix, message, randomBuffer]))
      .digest();

    const r = Eddsa.curve.scalarReduce(bigIntFromBufferLE(digest));
    const R = Eddsa.curve.basePointMult(r);
    const split_r = Eddsa.shamir.split(r, indices.length, indices.length, indices);

    const P_i: XShare = {
      i: pShare.i,
      y: pShare.y,
      u: bigIntToBufferLE(split_u[pShare.i], 32).toString('hex'),
      r: bigIntToBufferLE(split_r[pShare.i], 32).toString('hex'),
      R: bigIntToBufferLE(R, 32).toString('hex'),
    };

    const resultShares: SignShare = {
      xShare: P_i,
      rShares: {},
    };

    for (let ind = 0; ind < jShares.length; ind++) {
      const S_j = jShares[ind];
      resultShares.rShares[S_j.i] = {
        i: S_j.i,
        j: pShare.i,
        u: bigIntToBufferLE(split_u[S_j.i], 32).toString('hex'),
        r: bigIntToBufferLE(split_r[S_j.i], 32).toString('hex'),
        R: bigIntToBufferLE(R, 32).toString('hex'),
      };
    }
    return resultShares;
  }

  sign(message: Buffer, playerShare: XShare, rShares: RShare[], yShares: YShare[] = []): GShare {
    const S_i = playerShare;

    const uValues = [playerShare, ...rShares, ...yShares].map(({ u }) => bigIntFromBufferLE(Buffer.from(u, 'hex')));
    const x = uValues.reduce((acc, u) => Eddsa.curve.scalarAdd(acc, u));

    const RValues = [playerShare, ...rShares].map(({ R }) => bigIntFromBufferLE(Buffer.from(R, 'hex')));
    const R = RValues.reduce((partial, share) => Eddsa.curve.pointAdd(partial, share));

    const rValues = [playerShare, ...rShares].map(({ r }) => bigIntFromBufferLE(Buffer.from(r, 'hex')));
    const r = rValues.reduce((partial, share) => Eddsa.curve.scalarAdd(partial, share));

    const combinedBuffer = Buffer.concat([bigIntToBufferLE(R, 32), Buffer.from(S_i.y, 'hex'), message]);
    const digest = createHash('sha512').update(combinedBuffer).digest();
    const k = Eddsa.curve.scalarReduce(bigIntFromBufferLE(digest));

    const gamma = Eddsa.curve.scalarAdd(r, Eddsa.curve.scalarMult(k, x));
    const result = {
      i: playerShare.i,
      y: playerShare.y,
      gamma: bigIntToBufferLE(gamma, 32).toString('hex'),
      R: bigIntToBufferLE(R, 32).toString('hex'),
    };
    return result;
  }

  signCombine(shares: GShare[]): Signature {
    const y = shares[0].y;
    const R = shares[0].R;

    const resultShares = {};
    for (const ind in shares) {
      const S_i = shares[ind];
      resultShares[S_i.i] = bigIntFromBufferLE(Buffer.from(S_i.gamma, 'hex'));
    }
    const sigma: bigint = Eddsa.shamir.combine(resultShares);
    const result = {
      y,
      R,
      sigma: bigIntToBufferLE(sigma, 32).toString('hex'),
    };
    return result;
  }

  verify(message: Buffer, signature: Signature): Buffer {
    const publicKey = bigIntFromBufferLE(Buffer.from(signature.y, 'hex'));
    const signedMessage = Buffer.concat([
      Buffer.from(signature.R, 'hex'),
      Buffer.from(signature.sigma, 'hex'),
      message,
    ]);
    return Eddsa.curve.verify(publicKey, signedMessage);
  }
}
