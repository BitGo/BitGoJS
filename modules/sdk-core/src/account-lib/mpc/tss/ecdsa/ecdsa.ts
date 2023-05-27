import * as paillierBigint from 'paillier-bigint';
import * as bigintCryptoUtils from 'bigint-crypto-utils';
import * as secp from '@noble/secp256k1';
import HDTree, { BIP32, chaincodeBase } from '../../hdTree';
import { createHash, Hash, randomBytes } from 'crypto';
import { bip32 } from '@bitgo/utxo-lib';
import { bigIntFromBufferBE, bigIntFromU8ABE, bigIntToBufferBE, getPaillierPublicKey } from '../../util';
import { Secp256k1Curve } from '../../curves';
import Shamir from '../../shamir';
import { EcdsaRangeProof, EcdsaTypes, randomPositiveCoPrimeTo, hexToBigInt } from '@bitgo/sdk-lib-mpc';
import {
  AShare,
  BShare,
  DShare,
  GShare,
  KeyCombined,
  KeyShare,
  KShare,
  MUShare,
  NShare,
  OShare,
  PShare,
  Signature,
  SignCombine,
  SignCombineRT,
  SignConvert,
  SignConvertRT,
  SignShareRT,
  SShare,
  SubkeyShare,
  XShare,
  XShareWithNtilde,
  YShare,
  YShareWithNtilde,
} from './types';

const _5n = BigInt(5);

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
   * @param {Buffer} seed optional 64 byte seed to use for key generation
   * @param {Boolean} sync optional sync flag, if true then a synchronous version of Paillier key generation is used that does not spawn Worker threads.
   * @returns {Promise<KeyShare>} Returns the private p-share
   * and n-shares to be distributed to participants at their corresponding index.
   */
  async keyShare(index: number, threshold: number, numShares: number, seed?: Buffer, sync = false): Promise<KeyShare> {
    if (!(index > 0 && index <= numShares && threshold <= numShares && threshold === 2)) {
      throw 'Invalid KeyShare Config';
    }

    if (seed && seed.length < 64) {
      throw new Error('Seed must have a length of at least 64 bytes');
    }

    let seedWithValidLength = seed;
    if (seed && seed.length > 64) {
      // if seed length is greater than 64 bytes, hash seed to 64 bytes.
      seedWithValidLength = createHash('sha512').update(seed).digest();
    }

    // Generate additively homomorphic encryption key.
    let paillierKeyPair: paillierBigint.KeyPair;
    if (!sync) {
      paillierKeyPair = await paillierBigint.generateRandomKeys(3072, true);
    } else {
      paillierKeyPair = paillierBigint.generateRandomKeysSync(3072, true);
    }
    const { publicKey, privateKey } = paillierKeyPair;
    // Accept a 64 byte seed and create an extended private key from that seed
    const secretKey = seedWithValidLength && bip32.fromSeed(seedWithValidLength);
    const u =
      (secretKey && secretKey.privateKey && bigIntFromU8ABE(new Uint8Array(secretKey.privateKey))) ??
      Ecdsa.curve.scalarRandom();
    const y = Ecdsa.curve.basePointMult(u);
    const chaincode = (secretKey && secretKey.chainCode) ?? randomBytes(32);
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
   * Appends a given range proof challenge to the shares previously created
   * by #keyCombine. Generates a new challenge if not provided.
   * @param {XShare | YShare} share Private xShare or yShare of the signing operation
   * @param rangeProofChallenge - challenge generated via generateNtilde
   * @returns {KeyCombined} The share with amended challenge values
   */
  async appendChallenge<T extends XShare | YShare>(
    share: T,
    rangeProofChallenge: EcdsaTypes.SerializedNtilde
  ): Promise<T & EcdsaTypes.SerializedNtilde> {
    const { ntilde, h1, h2 } = rangeProofChallenge;
    return {
      ...share,
      ntilde,
      h1,
      h2,
    };
  }

  /**
   * Create signing shares.
   * @param {xShare} xShare Private xShare of current participant signer
   * @param {YShare} yShare yShare corresponding to the other participant signer
   * @returns {SignShareRT} Returns the participant private w-share
   * and k-share to be distributed to other participant signer
   */
  async signShare(xShare: XShareWithNtilde, yShare: YShareWithNtilde): Promise<SignShareRT> {
    const pk = getPaillierPublicKey(hexToBigInt(xShare.n));

    const k = Ecdsa.curve.scalarRandom();
    const rk = await randomPositiveCoPrimeTo(pk.n);
    const ck = pk.encrypt(k, rk);
    const gamma = Ecdsa.curve.scalarRandom();

    const d = Ecdsa.curve.scalarMult(Ecdsa.curve.scalarSub(BigInt(yShare.j), BigInt(xShare.i)), BigInt(xShare.i));

    const w = [
      Ecdsa.curve.scalarMult(BigInt(yShare.j), BigInt(xShare.i)),
      hexToBigInt(xShare['x']),
      Ecdsa.curve.scalarInvert(d),
    ].reduce(Ecdsa.curve.scalarMult);

    const { ntilde: ntildea, h1: h1a, h2: h2a } = xShare as XShareWithNtilde;

    const signers: SignShareRT = {
      wShare: {
        i: xShare.i,
        l: xShare.l,
        m: xShare.m,
        n: xShare.n,
        y: xShare.y,
        ntilde: ntildea,
        h1: h1a,
        h2: h2a,
        k: bigIntToBufferBE(k, 32).toString('hex'),
        ck: bigIntToBufferBE(ck, 768).toString('hex'),
        w: bigIntToBufferBE(w, 32).toString('hex'),
        gamma: bigIntToBufferBE(gamma, 32).toString('hex'),
      },
      kShare: {} as KShare,
    };

    const { ntilde: ntildeb, h1: h1b, h2: h2b } = yShare;
    const proof = await EcdsaRangeProof.prove(
      Ecdsa.curve,
      3072,
      pk,
      {
        ntilde: hexToBigInt(ntildeb),
        h1: hexToBigInt(h1b),
        h2: hexToBigInt(h2b),
      },
      ck,
      k,
      rk
    );
    const proofShare = {
      z: bigIntToBufferBE(proof.z, 384).toString('hex'),
      u: bigIntToBufferBE(proof.u, 768).toString('hex'),
      w: bigIntToBufferBE(proof.w, 384).toString('hex'),
      s: bigIntToBufferBE(proof.s, 384).toString('hex'),
      s1: bigIntToBufferBE(proof.s1, 96).toString('hex'),
      s2: bigIntToBufferBE(proof.s2, 480).toString('hex'),
    };

    signers.kShare = {
      i: yShare.j,
      j: xShare.i,
      n: pk.n.toString(16),
      ntilde: ntildea,
      h1: h1a,
      h2: h2a,
      k: bigIntToBufferBE(ck, 768).toString('hex'),
      proof: proofShare,
    };

    return signers;
  }

  /**
   * Perform multiplicitive-to-additive (MtA) share conversion with another
   * signer.
   * @param {SignConvert} shares
   * @returns {SignConvertRT}
   */
  async signConvert(shares: SignConvert): Promise<SignConvertRT> {
    let shareParticipant: Partial<BShare> | Partial<GShare>, shareToBeSent: Partial<AShare> | MUShare;
    let isGammaShare = false;
    let kShare: Partial<KShare> = {};
    if (shares.xShare && shares.yShare && shares.kShare) {
      const xShare = shares.xShare; // currentParticipant secret xShare
      const yShare = {
        ...shares.yShare,
        ntilde: shares.kShare.ntilde,
        h1: shares.kShare.h1,
        h2: shares.kShare.h2,
      };
      const signShare = await this.signShare(xShare, yShare);
      kShare = signShare.kShare;
      shareToBeSent = { ...shares.kShare } as Partial<AShare>;
      shareParticipant = { ...signShare.wShare } as Partial<BShare>;
    } else if ((shares.bShare && shares.muShare) || (shares.aShare && shares.wShare)) {
      isGammaShare = true;
      shareToBeSent = shares.aShare ? ({ ...shares.aShare } as MUShare) : ({ ...shares.muShare } as MUShare);
      shareParticipant = shares.wShare ? ({ ...shares.wShare } as Partial<GShare>) : ({ ...shares.bShare } as GShare);
    } else {
      throw new Error('Invalid config for Sign Convert');
    }
    if (shareParticipant.i !== shareToBeSent.i) {
      throw new Error('Shares from same participant');
    }
    if ((shareToBeSent as AShare).alpha) {
      const bShareParticipant = shareParticipant as BShare;
      const aShareToBeSent = shareToBeSent as AShare;
      const pka = getPaillierPublicKey(hexToBigInt(bShareParticipant.n));
      let ntildea, h1a, h2a, ck;
      if (bShareParticipant.ntilde) {
        ntildea = hexToBigInt(bShareParticipant.ntilde);
        h1a = hexToBigInt(bShareParticipant.h1);
        h2a = hexToBigInt(bShareParticipant.h2);
        ck = hexToBigInt(bShareParticipant.ck);
      }
      // Verify $\gamma_i \in Z_{N^2}$.
      if (
        !EcdsaRangeProof.verifyWithCheck(
          Ecdsa.curve,
          3072,
          pka,
          {
            ntilde: ntildea,
            h1: h1a,
            h2: h2a,
          },
          {
            z: hexToBigInt(aShareToBeSent.gammaProof.z),
            zprm: hexToBigInt(aShareToBeSent.gammaProof.zprm),
            t: hexToBigInt(aShareToBeSent.gammaProof.t),
            v: hexToBigInt(aShareToBeSent.gammaProof.v),
            w: hexToBigInt(aShareToBeSent.gammaProof.w),
            s: hexToBigInt(aShareToBeSent.gammaProof.s),
            s1: hexToBigInt(aShareToBeSent.gammaProof.s1),
            s2: hexToBigInt(aShareToBeSent.gammaProof.s2),
            t1: hexToBigInt(aShareToBeSent.gammaProof.t1),
            t2: hexToBigInt(aShareToBeSent.gammaProof.t2),
            u: hexToBigInt(aShareToBeSent.gammaProof.u),
          },
          ck,
          hexToBigInt(aShareToBeSent.alpha),
          hexToBigInt(aShareToBeSent.gammaProof.x)
        )
      ) {
        throw new Error('could not verify signing share for gamma proof');
      }
      // Verify $\w_i \in Z_{N^2}$.
      if (
        !EcdsaRangeProof.verifyWithCheck(
          Ecdsa.curve,
          3072,
          pka,
          {
            ntilde: ntildea,
            h1: h1a,
            h2: h2a,
          },
          {
            z: hexToBigInt(aShareToBeSent.wProof.z),
            zprm: hexToBigInt(aShareToBeSent.wProof.zprm),
            t: hexToBigInt(aShareToBeSent.wProof.t),
            v: hexToBigInt(aShareToBeSent.wProof.v),
            w: hexToBigInt(aShareToBeSent.wProof.w),
            s: hexToBigInt(aShareToBeSent.wProof.s),
            s1: hexToBigInt(aShareToBeSent.wProof.s1),
            s2: hexToBigInt(aShareToBeSent.wProof.s2),
            t1: hexToBigInt(aShareToBeSent.wProof.t1),
            t2: hexToBigInt(aShareToBeSent.wProof.t2),
            u: hexToBigInt(aShareToBeSent.wProof.u),
          },
          ck,
          hexToBigInt(aShareToBeSent.mu),
          hexToBigInt(aShareToBeSent.wProof.x)
        )
      ) {
        throw new Error('could not verify share for wProof');
      }
      const sk = new paillierBigint.PrivateKey(
        hexToBigInt(bShareParticipant.l as string),
        hexToBigInt(bShareParticipant.m as string),
        pka
      );
      const gShareParticipant = shareParticipant as GShare;
      const muShareToBeSent = shareToBeSent as MUShare;
      const alpha = sk.decrypt(hexToBigInt(aShareToBeSent.alpha));
      gShareParticipant.alpha = bigIntToBufferBE(Ecdsa.curve.scalarReduce(alpha), 32).toString('hex');
      const mu = sk.decrypt(hexToBigInt(aShareToBeSent.mu as string)); // recheck encrypted number
      gShareParticipant.mu = bigIntToBufferBE(Ecdsa.curve.scalarReduce(mu), 32).toString('hex');
      const partialShareParticipant = shareParticipant as Partial<GShare>;
      const partialShareToBeSent = muShareToBeSent as Partial<MUShare>;
      delete partialShareParticipant.l;
      delete partialShareParticipant.m;
      delete partialShareToBeSent.alpha;
      delete partialShareToBeSent.mu;
    }
    if ((shareToBeSent as AShare).k) {
      const bShareParticipant = shareParticipant as BShare;
      const aShareToBeSent = shareToBeSent as AShare;
      const n = hexToBigInt(aShareToBeSent.n); // Paillier pub from other signer
      const pka = getPaillierPublicKey(n);
      let ntildea, h1a, h2a, ntildeb, h1b, h2b;
      if (aShareToBeSent.ntilde) {
        ntildea = hexToBigInt(aShareToBeSent.ntilde);
        h1a = hexToBigInt(aShareToBeSent.h1);
        h2a = hexToBigInt(aShareToBeSent.h2);
        ntildeb = hexToBigInt(bShareParticipant.ntilde);
        h1b = hexToBigInt(bShareParticipant.h1);
        h2b = hexToBigInt(bShareParticipant.h2);
      }
      const k = hexToBigInt(aShareToBeSent.k);
      if (
        !EcdsaRangeProof.verify(
          Ecdsa.curve,
          3072,
          pka,
          {
            ntilde: ntildeb,
            h1: h1b,
            h2: h2b,
          },
          {
            z: hexToBigInt(aShareToBeSent.proof.z),
            u: hexToBigInt(aShareToBeSent.proof.u),
            w: hexToBigInt(aShareToBeSent.proof.w),
            s: hexToBigInt(aShareToBeSent.proof.s),
            s1: hexToBigInt(aShareToBeSent.proof.s1),
            s2: hexToBigInt(aShareToBeSent.proof.s2),
          },
          k
        )
      ) {
        throw new Error('Could not verify signing A share proof');
      }
      // MtA $k_j, \gamma_i$.
      const beta0 = bigintCryptoUtils.randBetween(Ecdsa.curve.order() ** _5n);
      bShareParticipant.beta = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(beta0)), 32).toString(
        'hex'
      );
      const g = hexToBigInt(bShareParticipant.gamma);
      const rb = await randomPositiveCoPrimeTo(pka.n);
      const cb = pka.encrypt(beta0, rb);
      const alpha = pka.addition(pka.multiply(k, g), cb);
      aShareToBeSent.alpha = bigIntToBufferBE(alpha, 32).toString('hex');
      // Prove $\gamma_i \in Z_{N^2}$.
      const gx = Ecdsa.curve.basePointMult(g);
      let proof = await EcdsaRangeProof.proveWithCheck(
        Ecdsa.curve,
        3072,
        pka,
        {
          ntilde: ntildea,
          h1: h1a,
          h2: h2a,
        },
        k,
        alpha,
        g,
        beta0,
        rb,
        gx
      );
      Object.assign(aShareToBeSent, {
        gammaProof: {
          z: bigIntToBufferBE(proof.z, 384).toString('hex'),
          zprm: bigIntToBufferBE(proof.zprm, 384).toString('hex'),
          t: bigIntToBufferBE(proof.t, 384).toString('hex'),
          v: bigIntToBufferBE(proof.v, 768).toString('hex'),
          w: bigIntToBufferBE(proof.w, 384).toString('hex'),
          s: bigIntToBufferBE(proof.s, 384).toString('hex'),
          s1: bigIntToBufferBE(proof.s1, 96).toString('hex'),
          s2: bigIntToBufferBE(proof.s2, 480).toString('hex'),
          t1: bigIntToBufferBE(proof.t1, 224).toString('hex'),
          t2: bigIntToBufferBE(proof.t2, 480).toString('hex'),
          u: bigIntToBufferBE(proof.u, 33).toString('hex'),
          x: bigIntToBufferBE(gx, 33).toString('hex'),
        },
      });
      // MtA $k_j, w_i$.
      const nu0 = bigintCryptoUtils.randBetween(Ecdsa.curve.order() ** _5n);
      shareParticipant.nu = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(nu0)), 32).toString(
        'hex'
      );
      const w = hexToBigInt(bShareParticipant.w);
      const rn = await randomPositiveCoPrimeTo(pka.n);
      const cn = pka.encrypt(nu0, rn);
      const mu = pka.addition(pka.multiply(k, w), cn);
      shareToBeSent.mu = bigIntToBufferBE(mu, 32).toString('hex');
      // Prove $\w_i \in Z_{N^2}$.
      const wx = Ecdsa.curve.basePointMult(w);
      proof = await EcdsaRangeProof.proveWithCheck(
        Ecdsa.curve,
        3072,
        pka,
        {
          ntilde: ntildea,
          h1: h1a,
          h2: h2a,
        },
        k,
        hexToBigInt(aShareToBeSent.mu),
        w,
        nu0,
        rn,
        wx
      );
      Object.assign(shareToBeSent, {
        wProof: {
          z: bigIntToBufferBE(proof.z, 384).toString('hex'),
          zprm: bigIntToBufferBE(proof.zprm, 384).toString('hex'),
          t: bigIntToBufferBE(proof.t, 384).toString('hex'),
          v: bigIntToBufferBE(proof.v, 768).toString('hex'),
          w: bigIntToBufferBE(proof.w, 384).toString('hex'),
          s: bigIntToBufferBE(proof.s, 384).toString('hex'),
          s1: bigIntToBufferBE(proof.s1, 96).toString('hex'),
          s2: bigIntToBufferBE(proof.s2, 480).toString('hex'),
          t1: bigIntToBufferBE(proof.t1, 224).toString('hex'),
          t2: bigIntToBufferBE(proof.t2, 480).toString('hex'),
          u: bigIntToBufferBE(proof.u, 33).toString('hex'),
          x: bigIntToBufferBE(wx, 33).toString('hex'),
        },
      });
      if ((shareParticipant as GShare).alpha) {
        const partialShareParticipant = shareParticipant as Partial<BShare>;
        const partialShareToBeSent = shareToBeSent as Partial<AShare>;
        delete partialShareParticipant.ntilde;
        delete partialShareParticipant.h1;
        delete partialShareParticipant.h2;
        delete partialShareParticipant.ck;
        delete partialShareToBeSent.n;
        delete partialShareToBeSent.ntilde;
        delete partialShareToBeSent.h1;
        delete partialShareToBeSent.h2;
        delete partialShareToBeSent.k;
        delete partialShareToBeSent.proof;
      } else {
        Object.assign(shareToBeSent, {
          n: kShare.n,
          ntilde: bigIntToBufferBE(ntildeb, 384).toString('hex'),
          h1: bigIntToBufferBE(h1b, 384).toString('hex'),
          h2: bigIntToBufferBE(h2b, 384).toString('hex'),
          k: kShare.k,
          proof: kShare.proof,
        });
      }
    }
    if (!('alpha' in shareToBeSent) && !('k' in shareToBeSent)) {
      const partialShareParticipant = shareParticipant as Partial<BShare>;
      delete partialShareParticipant.ntilde;
      delete partialShareParticipant.h1;
      delete partialShareParticipant.h2;
      delete partialShareParticipant.ck;
      const muShareToBeSent = shareToBeSent as MUShare;
      shareToBeSent = {
        i: muShareToBeSent.i,
        j: muShareToBeSent.j,
      } as MUShare;
    }
    [shareToBeSent.i, shareToBeSent.j] = [shareToBeSent.j, shareToBeSent.i];
    if (isGammaShare) {
      return {
        muShare: shareToBeSent as MUShare,
        gShare: shareParticipant as GShare,
      };
    }
    return {
      aShare: shareToBeSent as AShare,
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

  /**
   * Deserializes a challenge and it's proofs from hex strings to bigint
   * @deprecated use sdk-lib-mpc EcdsaTypes.deserializeNtilde instead
   */
  static deserializeNtilde(challenge: EcdsaTypes.SerializedNtilde): EcdsaTypes.DeserializedNtilde {
    return EcdsaTypes.deserializeNtilde(challenge);
  }

  /**
   * Serializes a challenge and it's proofs from big int to hex strings.
   * @deprecated use sdk-lib-mpc EcdsaTypes.deserializeNtilde instead
   * @param challenge
   */
  static serializeNtilde(challenge: EcdsaTypes.DeserializedNtilde): EcdsaTypes.SerializedNtilde {
    return EcdsaTypes.serializeNtilde(challenge);
  }
}
