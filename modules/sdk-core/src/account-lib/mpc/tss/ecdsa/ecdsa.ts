import * as paillierBigint from 'paillier-bigint';
import * as bigintCryptoUtils from 'bigint-crypto-utils';
import * as secp from '@noble/secp256k1';
import HDTree, { BIP32, chaincodeBase } from '../../hdTree';
import { randomBytes, createHash, Hash } from 'crypto';
import { hexToBigInt } from '../../../util/crypto';
import { bigIntFromBufferBE, bigIntToBufferBE, bigIntFromU8ABE, getPaillierPublicKey } from '../../util';
import { Secp256k1Curve } from '../../curves';
import Shamir from '../../shamir';
import {
  NShare,
  PShare,
  KeyShare,
  KeyCombined,
  SubkeyShare,
  BShare,
  AShare,
  Signature,
  SignConvertRT,
  SignConvert,
  GShare,
  MUShare,
  SignCombine,
  SignCombineRT,
  DShare,
  OShare,
  SShare,
  SignShareRT,
  KShare,
  XShare,
  YShare,
} from './types';

const _1n = BigInt(1);
const _3n = BigInt(3);

/**
 * ECDSA TSS implementation supporting 2:n Threshold
 */
export default class Ecdsa {
  static curve: Secp256k1Curve = new Secp256k1Curve();
  static hdTree: HDTree = new BIP32();
  static shamir: Shamir = new Shamir(Ecdsa.curve);
  /**
   * Generate shares for participant at index and split keys `(threshold,numShares)` ways.
   * @param {number} index participant index
   * @param {number} threshold Signing threshold
   * @param {number} numShares  Number of shares
   * @param {Buffer} seed optional seed to use for key generation
   * @returns {Promise<KeyShare>} Returns the private p-share
   * and n-shares to be distributed to participants at their corresponding index.
   */
  async keyShare(index: number, threshold: number, numShares: number, seed?: Buffer): Promise<KeyShare> {
    if (!(index > 0 && index <= numShares && threshold <= numShares && threshold === 2)) {
      throw 'Invalid KeyShare Config';
    }

    if (seed && seed.length !== 72) {
      throw new Error('Seed must have length 72');
    }
    // Generate additively homomorphic encryption key.
    const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(3072, true);
    const u = (seed && bigIntFromU8ABE(secp.utils.hashToPrivateKey(seed.slice(0, 40)))) ?? Ecdsa.curve.scalarRandom();
    const y = Ecdsa.curve.basePointMult(u);
    const chaincode = seed?.slice(40) ?? randomBytes(32);
    // Compute secret shares of the private key
    const { shares: uShares, v } = Ecdsa.shamir.split(u, threshold, numShares);
    const currentParticipant: PShare = {
      i: index,
      t: threshold,
      c: numShares,
      l: bigIntToBufferBE(privateKey.lambda, 192).toString('hex'),
      m: bigIntToBufferBE(privateKey.mu, 192).toString('hex'),
      n: bigIntToBufferBE(publicKey.n, 384).toString('hex'),
      y: bigIntToBufferBE(y, 33).toString('hex'),
      u: bigIntToBufferBE(uShares[index], 32).toString('hex'),
      uu: u.toString(),
      chaincode: chaincode.toString('hex'),
    };
    const keyShare: KeyShare = {
      pShare: currentParticipant,
      nShares: {},
    };

    for (const share in uShares) {
      const participantIndex = parseInt(share, 10);
      if (participantIndex !== index) {
        keyShare.nShares[participantIndex] = {
          i: participantIndex,
          j: currentParticipant['i'],
          n: publicKey.n.toString(16),
          y: bigIntToBufferBE(y, 33).toString('hex'),
          v: bigIntToBufferBE(v[0], 33).toString('hex'),
          u: bigIntToBufferBE(uShares[participantIndex], 32).toString('hex'),
          chaincode: chaincode.toString('hex'),
        } as NShare;
      }
    }
    return keyShare;
  }

  /**
   * Combine data shared during the key generation protocol.
   * @param {KeyShare} participantShares private p-share and
   * n-shares received from all other participants.
   * @returns {KeyCombined} Returns the participant private x-share
   * and y-shares to be used when generating signing shares.
   */
  keyCombine(pShare: PShare, nShares: NShare[]): KeyCombined {
    const allShares = [pShare, ...nShares];
    // Compute the public key.
    const y = allShares.map((participant) => hexToBigInt(participant['y'])).reduce(Ecdsa.curve.pointAdd);
    // Add secret shares
    const x = allShares.map((participant) => hexToBigInt(participant['u'])).reduce(Ecdsa.curve.scalarAdd);

    // Verify shares.
    for (const share of nShares) {
      if (share.v) {
        try {
          Ecdsa.shamir.verify(hexToBigInt(share.u), [hexToBigInt(share.y), hexToBigInt(share.v!)], pShare.i);
        } catch (err) {
          throw new Error(`Could not verify share from participant ${share.j}. Verification error: ${err}`);
        }
      }
    }

    // Chaincode will be used in future when we add support for key derivation for ecdsa
    const chaincodes = [pShare, ...nShares].map(({ chaincode }) => bigIntFromBufferBE(Buffer.from(chaincode, 'hex')));
    const chaincode = chaincodes.reduce(
      (acc, chaincode) =>
        (acc + chaincode) % BigInt('0x010000000000000000000000000000000000000000000000000000000000000000') // 2^256
    );

    const participants: KeyCombined = {
      xShare: {
        i: pShare.i,
        l: pShare.l,
        m: pShare.m,
        n: pShare.n,
        y: bigIntToBufferBE(y, 33).toString('hex'),
        x: bigIntToBufferBE(x, 32).toString('hex'),
        chaincode: bigIntToBufferBE(chaincode, 32).toString('hex'),
      },
      yShares: {},
    };

    for (const share in nShares) {
      const participantIndex = nShares[share]['j'];
      participants.yShares[participantIndex] = {
        i: pShare.i,
        j: nShares[share]['j'],
        n: nShares[share]['n'],
      };
    }
    return participants;
  }

  /**
   * Derive shares for a BIP-32 subkey.
   * @param {PShare} The user's p-share.
   * @param {NShare[]} The n-shares received from the other participants.
   * @param {string} The BIP-32 path to derive.
   * @returns {SubkeyShare} Returns the private x-share and n-shares to
   * be distributed to participants at their corresponding index.
   */
  keyDerive(pShare: PShare, nShares: NShare[], path: string): SubkeyShare {
    const yValues = [pShare, ...nShares].map((share) => hexToBigInt(share.y));
    const y = yValues.reduce((partial, share) => Ecdsa.curve.pointAdd(partial, share));
    const u = BigInt(pShare.uu);
    let contribChaincode = hexToBigInt(pShare.chaincode);
    const chaincodes = [contribChaincode, ...nShares.map(({ chaincode }) => hexToBigInt(chaincode))];
    const chaincode = chaincodes.reduce((acc, chaincode) => (acc + chaincode) % chaincodeBase);

    // Verify shares.
    for (const share of nShares) {
      if (share.v) {
        try {
          Ecdsa.shamir.verify(hexToBigInt(share.u), [hexToBigInt(share.y), hexToBigInt(share.v!)], pShare.i);
        } catch (err) {
          throw new Error(`Could not verify share from participant ${share.j}. Verification error: ${err}`);
        }
      }
    }

    // Derive subkey.
    const subkey = Ecdsa.hdTree.privateDerive({ pk: y, sk: u, chaincode }, path);

    // Calculate new public key contribution.
    const contribY = Ecdsa.curve.basePointMult(subkey.sk);

    // Calculate new chaincode contribution.
    const chaincodeDelta = (chaincodeBase + subkey.chaincode - chaincode) % chaincodeBase;
    contribChaincode = (contribChaincode + chaincodeDelta) % chaincodeBase;

    // Calculate new u values.
    const { shares: split_u, v } = Ecdsa.shamir.split(subkey.sk, pShare.t || 2, pShare.c || 3);

    // Calculate new signing key.
    const x = [split_u[pShare.i], ...nShares.map(({ u }) => hexToBigInt(u))].reduce(Ecdsa.curve.scalarAdd);

    const P_i: XShare = {
      i: pShare.i,
      l: pShare.l,
      m: pShare.m,
      n: pShare.n,
      y: bigIntToBufferBE(subkey.pk, 33).toString('hex'),
      x: bigIntToBufferBE(x, 32).toString('hex'),
      chaincode: bigIntToBufferBE(subkey.chaincode, 32).toString('hex'),
    };

    const shares: SubkeyShare = {
      xShare: P_i,
      nShares: {},
    };

    for (let ind = 0; ind < nShares.length; ind++) {
      const P_j = nShares[ind];
      shares.nShares[P_j.j] = {
        i: P_j.j,
        j: P_i.i,
        n: P_j.n,
        u: bigIntToBufferBE(split_u[P_j.j], 32).toString('hex'),
        y: bigIntToBufferBE(contribY, 32).toString('hex'),
        v: bigIntToBufferBE(v[0], 32).toString('hex'),
        chaincode: bigIntToBufferBE(contribChaincode, 32).toString('hex'),
      };
    }

    return shares;
  }

  /**
   * Derives a child common keychain from common keychain
   *
   * @param {commonKeychain} The common keychain as a hex string.
   * @param {path} The BIP-32 path to derive.
   * @return {string} The derived common keychain as a hex string.
   */
  deriveUnhardened(commonKeychain: string, path: string): string {
    if (Ecdsa.hdTree === undefined) {
      throw new Error("Can't derive key without HDTree implementation");
    }

    const keychain = Buffer.from(commonKeychain, 'hex');

    const derivedPublicKeychain = Ecdsa.hdTree.publicDerive(
      {
        pk: bigIntFromBufferBE(keychain.slice(0, 33)),
        chaincode: bigIntFromBufferBE(keychain.slice(33)),
      },
      path
    );

    const derivedPk = bigIntToBufferBE(derivedPublicKeychain.pk, 33).toString('hex');
    const derivedChaincode = bigIntToBufferBE(derivedPublicKeychain.chaincode, 32).toString('hex');

    return derivedPk + derivedChaincode;
  }

  /**
   * Create signing shares.
   * @param {xShare} xShare Private xShare of current participant signer
   * @param {YShare} yShare yShare corresponding to the other participant signer
   * @returns {SignShareRT} Returns the participant private w-share
   * and k-share to be distributed to other participant signer
   */
  signShare(xShare: XShare, yShare: YShare): SignShareRT {
    const pk = getPaillierPublicKey(hexToBigInt(xShare.n));

    const k = Ecdsa.curve.scalarRandom();
    const gamma = Ecdsa.curve.scalarRandom();

    const d = Ecdsa.curve.scalarMult(Ecdsa.curve.scalarSub(BigInt(yShare.j), BigInt(xShare.i)), BigInt(xShare.i));

    const w = [
      Ecdsa.curve.scalarMult(BigInt(yShare.j), BigInt(xShare.i)),
      hexToBigInt(xShare['x']),
      Ecdsa.curve.scalarInvert(d),
    ].reduce(Ecdsa.curve.scalarMult);

    const signers: SignShareRT = {
      wShare: {
        i: xShare.i,
        l: xShare.l,
        m: xShare.m,
        n: xShare.n,
        y: xShare.y,
        k: bigIntToBufferBE(k, 32).toString('hex'),
        w: bigIntToBufferBE(w, 32).toString('hex'),
        gamma: bigIntToBufferBE(gamma, 32).toString('hex'),
      },
      kShare: {} as KShare,
    };

    signers.kShare = {
      i: yShare.j,
      j: xShare.i,
      n: pk.n.toString(16),
      k: bigIntToBufferBE(pk.encrypt(k), 32).toString('hex'),
    };

    return signers;
  }

  /**
   * Perform multiplicitive-to-additive (MtA) share conversion with another
   * signer.
   * @param {SignConvert}
   * @returns {SignConvertRT}
   */
  signConvert(shares: SignConvert): SignConvertRT {
    let shareParticipant: BShare | GShare, shareToBeSend: AShare | MUShare;
    let isGammaShare = false;
    if (shares.xShare && shares.yShare && shares.kShare) {
      const xShare = shares.xShare; // currentParticipant secret xShare
      const yShare = shares.yShare;
      const signShare = this.signShare(xShare, yShare);
      shareToBeSend = { ...shares.kShare, alpha: '', mu: '' } as AShare;
      shareParticipant = { ...signShare.wShare, beta: '', nu: '' } as BShare;
    } else if ((shares.bShare && shares.muShare) || (shares.aShare && shares.wShare)) {
      isGammaShare = true;
      shareToBeSend = shares.aShare ? ({ ...shares.aShare } as MUShare) : ({ ...shares.muShare } as MUShare);
      shareParticipant = shares.wShare ? ({ ...shares.wShare } as GShare) : ({ ...shares.bShare } as GShare);
    } else {
      throw new Error('Invalid config for Sign Convert');
    }
    if (shareParticipant.i !== shareToBeSend.i) {
      throw new Error('Shares from same participant');
    }
    if (shareToBeSend['alpha']) {
      const pk = getPaillierPublicKey(hexToBigInt(shareParticipant.n));
      const sk = new paillierBigint.PrivateKey(
        hexToBigInt(shareParticipant.l as string),
        hexToBigInt(shareParticipant.m as string),
        pk
      );
      const alpha = sk.decrypt(hexToBigInt(shareToBeSend.alpha));
      shareParticipant['alpha'] = bigIntToBufferBE(Ecdsa.curve.scalarReduce(alpha), 32).toString('hex');
      const mu = sk.decrypt(hexToBigInt(shareToBeSend.mu as string)); // recheck encrypted number
      shareParticipant['mu'] = bigIntToBufferBE(Ecdsa.curve.scalarReduce(mu), 32).toString('hex');
      delete shareParticipant['l'];
      delete shareParticipant['m'];
      delete shareToBeSend['alpha'];
      delete shareToBeSend['mu'];
    }
    if (shareToBeSend['k']) {
      const n = hexToBigInt(shareToBeSend['n']); // Paillier pub from other signer
      let pk = getPaillierPublicKey(n);
      const k = hexToBigInt(shareToBeSend['k']);

      const beta0 = bigintCryptoUtils.randBetween(n / _3n - _1n);
      shareParticipant.beta = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(beta0)), 32).toString(
        'hex'
      );
      const alpha = pk.addition(pk.multiply(k, hexToBigInt(shareParticipant.gamma)), pk.encrypt(beta0));
      shareToBeSend.alpha = bigIntToBufferBE(alpha, 32).toString('hex');

      const nu0 = bigintCryptoUtils.randBetween(n / _3n - _1n);
      shareParticipant.nu = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(nu0)), 32).toString(
        'hex'
      );
      const mu = pk.addition(pk.multiply(k, hexToBigInt(shareParticipant.w)), pk.encrypt(nu0));
      shareToBeSend.mu = bigIntToBufferBE(mu, 32).toString('hex');
      if (shareParticipant['alpha']) {
        delete shareToBeSend['n'];
        delete shareToBeSend['k'];
      } else {
        pk = getPaillierPublicKey(hexToBigInt(shareParticipant.n));
        shareToBeSend['n'] = pk.n.toString(16);
        shareToBeSend['k'] = bigIntToBufferBE(pk.encrypt(hexToBigInt(shareParticipant.k)), 32).toString('hex');
      }
    }
    if (!('alpha' in shareToBeSend) && !('k' in shareToBeSend)) {
      shareToBeSend = {
        i: shareToBeSend['i'],
        j: shareToBeSend['j'],
      };
    }
    [shareToBeSend['i'], shareToBeSend['j']] = [shareToBeSend['j'], shareToBeSend['i']];
    if (isGammaShare) {
      return {
        muShare: shareToBeSend as MUShare,
        gShare: shareParticipant as GShare,
      };
    }
    return {
      aShare: shareToBeSend,
      bShare: shareParticipant as BShare,
    };
  }

  /**
   * Combine gamma shares to get the private omicron / delta shares
   * @param {SignCombine} shares
   * @returns {SignCombineRT}
   */
  signCombine(shares: SignCombine): SignCombineRT {
    const gShare = shares.gShare;
    const S = shares.signIndex;
    const gamma = hexToBigInt(gShare.gamma);
    const alpha = hexToBigInt(gShare.alpha);
    const beta = hexToBigInt(gShare.beta);
    const mu = hexToBigInt(gShare.mu);
    const nu = hexToBigInt(gShare.nu);
    const k = hexToBigInt(gShare.k);
    const w = hexToBigInt(gShare.w);

    const delta = Ecdsa.curve.scalarAdd(Ecdsa.curve.scalarMult(k, gamma), Ecdsa.curve.scalarAdd(alpha, beta));
    const omicron = Ecdsa.curve.scalarAdd(Ecdsa.curve.scalarMult(k, w), Ecdsa.curve.scalarAdd(mu, nu));
    const Gamma = Ecdsa.curve.basePointMult(gamma);

    return {
      oShare: {
        i: gShare.i,
        y: gShare.y,
        k: bigIntToBufferBE(k, 32).toString('hex'),
        omicron: bigIntToBufferBE(omicron, 32).toString('hex'),
        delta: bigIntToBufferBE(delta, 32).toString('hex'),
        Gamma: bigIntToBufferBE(Gamma, 33).toString('hex'),
      },
      dShare: {
        i: S.i,
        j: gShare.i,
        delta: bigIntToBufferBE(delta, 32).toString('hex'),
        Gamma: bigIntToBufferBE(Gamma, 33).toString('hex'),
      },
    };
  }

  /**
   * Sign a message.
   * @param {Buffer} M Message to be signed
   * @param {OShare} oShare private omicron share of current participant
   * @param {DShare} dShare delta share received from the other participant
   * @param {Hash} hash hashing algorithm implementing Node`s standard crypto hash interface
   * @param {boolean} shouldHash if true, we hash the provided buffer before signing
   * @returns {SShare}
   */
  sign(M: Buffer, oShare: OShare, dShare: DShare, hash?: Hash, shouldHash = true): SShare {
    const m = shouldHash ? (hash || createHash('sha256')).update(M).digest() : M;

    const delta = Ecdsa.curve.scalarAdd(hexToBigInt(oShare.delta), hexToBigInt(dShare.delta));

    const R = Ecdsa.curve.pointMultiply(
      Ecdsa.curve.pointAdd(hexToBigInt(oShare.Gamma), hexToBigInt(dShare.Gamma)),
      Ecdsa.curve.scalarInvert(delta)
    );
    const pointR = secp.Point.fromHex(bigIntToBufferBE(R, 32));
    const r = pointR.x;

    const s = Ecdsa.curve.scalarAdd(
      Ecdsa.curve.scalarMult(bigIntFromU8ABE(m), hexToBigInt(oShare.k)),
      Ecdsa.curve.scalarMult(r, hexToBigInt(oShare.omicron))
    );
    return {
      i: oShare.i,
      y: oShare.y,
      R: pointR.toHex(true),
      s: bigIntToBufferBE(s, 32).toString('hex'),
    };
  }

  /**
   * Construct full signature by combining Sign Shares
   * @param {SShare[]} shares
   * @returns {Signature}
   */
  constructSignature(shares: SShare[]): Signature {
    // Every R must match.
    const R = shares[0]['R'];
    const isRMatching = shares.map((share) => share['R'] === R).reduce((a, b) => a && b);
    if (!isRMatching) {
      throw new Error('R value should be consistent across all shares');
    }

    let s = shares.map((share) => hexToBigInt(share['s'])).reduce(Ecdsa.curve.scalarAdd);
    const recid = (R.slice(0, 2) === '03' ? 1 : 0) ^ (s > Ecdsa.curve.order() / BigInt(2) ? 1 : 0);

    // Normalize s.
    s = s > Ecdsa.curve.order() / BigInt(2) ? Ecdsa.curve.order() - s : s;
    return {
      y: shares[0]['y'],
      r: R.slice(2),
      s: bigIntToBufferBE(s, 32).toString('hex'),
      recid: recid,
    };
  }

  /**
   * Verify ecdsa signatures
   * @param {Buffer} message
   * @param {Signature } signature
   * @param {Hash} hash hashing algorithm implementing Node`s standard crypto hash interface
   * @param {boolean} shouldHash if true, we hash the provided buffer before verifying
   * @returns {boolean} True if signature is valid; False otherwise
   */
  verify(message: Buffer, signature: Signature, hash?: Hash, shouldHash = true): boolean {
    const messageToVerify = shouldHash ? (hash || createHash('sha256')).update(message).digest() : message;
    return Ecdsa.curve.verify(
      messageToVerify,
      Buffer.concat([
        Buffer.from([signature['recid']]),
        bigIntToBufferBE(hexToBigInt(signature['r']), 32),
        bigIntToBufferBE(hexToBigInt(signature['s']), 32),
      ]),
      hexToBigInt(signature['y'])
    );
  }
}
