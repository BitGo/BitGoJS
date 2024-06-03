import * as paillierBigint from 'paillier-bigint';
import * as bigintCryptoUtils from 'bigint-crypto-utils';
import * as secp from '@noble/secp256k1';
import { createHash, Hash, randomBytes } from 'crypto';
import { bip32 } from '@bitgo/utxo-lib';
import { bigIntFromBufferBE, bigIntFromU8ABE, bigIntToBufferBE, getPaillierPublicKey } from '../../util';
import { Secp256k1Curve } from '../../curves';
import {
  EcdsaPaillierProof,
  EcdsaRangeProof,
  EcdsaTypes,
  EcdsaZkVProof,
  HashCommitment,
  Schnorr,
  randomPositiveCoPrimeTo,
  hexToBigInt,
  minModulusBitLength,
  HDTree,
  Secp256k1Bip32HdTree,
  chaincodeBase,
  Shamir,
  SchnorrProof,
} from '@bitgo/sdk-lib-mpc';
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
  PublicUTShare,
  RangeProofWithCheckShare,
  Signature,
  SignCombine,
  SignCombineRT,
  SignConvert,
  SignConvertRT,
  SignConvertStep1,
  SignConvertStep1Response,
  SignConvertStep2,
  SignConvertStep2Response,
  SignConvertStep3,
  SignConvertStep3Response,
  SignShareRT,
  SShare,
  SubkeyShare,
  UTShare,
  VAShareWithProofs,
  VAShare,
  WShare,
  XShare,
  XShareWithChallenges,
  YShareWithChallenges,
  PublicVAShareWithProofs,
} from './types';

const _5n = BigInt(5);
// Size of alpha and mu shares in bytes expected by the implementation of the protocol
const ALPHAMUSIZE = 768;

/**
 * ECDSA TSS implementation supporting 2:n Threshold
 */
export default class Ecdsa {
  static curve: Secp256k1Curve = new Secp256k1Curve();
  static hdTree: HDTree = new Secp256k1Bip32HdTree();
  static shamir: Shamir = new Shamir(Ecdsa.curve);
  /**
   * Generate shares for participant at index and split keys `(threshold,numShares)` ways.
   * @param {number} index participant index
   * @param {number} threshold Signing threshold
   * @param {number} numShares  Number of shares
   * @param {Buffer} seed optional 64 byte seed to use for key generation
   * @param sync optional sync flag, if true then a synchronous version of Paillier key generation is used that does not spawn Worker threads.
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
      paillierKeyPair = await paillierBigint.generateRandomKeys(minModulusBitLength, true);
    } else {
      // eslint-disable-next-line no-sync
      paillierKeyPair = paillierBigint.generateRandomKeysSync(minModulusBitLength, true);
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
          Ecdsa.shamir.verify(hexToBigInt(share.u), [hexToBigInt(share.y), hexToBigInt(share.v)], pShare.i);
        } catch (err) {
          throw new Error(`Could not verify share from participant ${share.j}. Verification error: ${err}`);
        }
      }
    }

    // Generate Schnorr proof of knowledge of the discrete log of X = xG.
    const X = Ecdsa.curve.basePointMult(x);

    const proofContext = createHash('sha256').update(bigIntToBufferBE(y, Ecdsa.curve.pointBytes)).digest();

    const schnorrProofX = Schnorr.createSchnorrProof(X, x, Ecdsa.curve, proofContext);

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
        schnorrProofX: schnorrProofX,
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
          Ecdsa.shamir.verify(hexToBigInt(share.u), [hexToBigInt(share.y), hexToBigInt(share.v)], pShare.i);
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

    // Generate Schnorr proof of knowledge of the discrete log of X = xG.
    const X = Ecdsa.curve.basePointMult(x);

    const proofContext = createHash('sha256').update(bigIntToBufferBE(subkey.pk, Ecdsa.curve.pointBytes)).digest();

    const schnorrProofX = Schnorr.createSchnorrProof(X, x, Ecdsa.curve, proofContext);

    const P_i: XShare = {
      i: pShare.i,
      l: pShare.l,
      m: pShare.m,
      n: pShare.n,
      y: bigIntToBufferBE(subkey.pk, 33).toString('hex'),
      x: bigIntToBufferBE(x, 32).toString('hex'),
      schnorrProofX: schnorrProofX,
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
        n: P_i.n,
        u: bigIntToBufferBE(split_u[P_j.j], 32).toString('hex'),
        y: bigIntToBufferBE(contribY, 32).toString('hex'),
        v: bigIntToBufferBE(v[0], 32).toString('hex'),
        chaincode: bigIntToBufferBE(contribChaincode, 32).toString('hex'),
      };
    }

    return shares;
  }

  /**
   * Verify Schnorr proof of knowledge of the discrete log of X_i = x_i * G.
   * @param Y The combined public key.
   * @param VSSs The VSS shares received from all participants.
   * @param index The i of X_i.
   * @param proof The schnorr proof.
   * @returns True if it's a valid proof with regards to Y and VSSs.
   */
  verifySchnorrProofX(Y: bigint, VSSs: bigint[][], index: number, proof: SchnorrProof): boolean {
    if (index < 1 || index > VSSs.length) {
      throw new Error('Invalid value supplied for index');
    }

    // Calculate X_i from public information.
    let X_i = Y;
    VSSs.forEach((VSS) => {
      VSS.forEach((v) => {
        X_i = Ecdsa.curve.pointAdd(X_i, Ecdsa.curve.pointMultiply(v, BigInt(index)));
      });
    });

    const proofContext = createHash('sha256').update(bigIntToBufferBE(Y, Ecdsa.curve.pointBytes)).digest();
    return Schnorr.verifySchnorrProof(X_i, proof, Ecdsa.curve, proofContext);
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
   * @param paillierProofChallenge
   * @returns {KeyCombined} The share with amended challenge values
   */
  appendChallenge<T>(
    share: T,
    rangeProofChallenge: EcdsaTypes.SerializedNtilde,
    paillierProofChallenge: EcdsaTypes.SerializedPaillierChallenge
  ): T & EcdsaTypes.SerializedEcdsaChallenges {
    const { ntilde, h1, h2 } = rangeProofChallenge;
    return {
      ...share,
      ntilde,
      h1,
      h2,
      p: paillierProofChallenge.p,
    };
  }

  /**
   * Create signing shares.
   * @param {xShare} xShare Private xShare of current participant signer
   * @param {YShare} yShare yShare corresponding to the other participant signer
   * @returns {SignShareRT} Returns the participant private w-share
   * and k-share to be distributed to other participant signer
   */
  async signShare(xShare: XShareWithChallenges, yShare: YShareWithChallenges): Promise<SignShareRT> {
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

    const { ntilde: ntildea, h1: h1a, h2: h2a } = xShare;

    const wShare: WShare = {
      i: xShare.i,
      l: xShare.l,
      m: xShare.m,
      n: xShare.n,
      y: xShare.y,
      ntilde: ntildea,
      h1: h1a,
      h2: h2a,
      p: xShare.p,
      k: bigIntToBufferBE(k, 32).toString('hex'),
      ck: bigIntToBufferBE(ck, 768).toString('hex'),
      w: bigIntToBufferBE(w, 32).toString('hex'),
      gamma: bigIntToBufferBE(gamma, 32).toString('hex'),
    };

    const { ntilde: ntildeb, h1: h1b, h2: h2b } = yShare;
    const proof = await EcdsaRangeProof.prove(
      Ecdsa.curve,
      minModulusBitLength,
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

    // create paillier challenge proof based on the other signers challenge
    // only send sigma if we also send challenge p
    const sigma = EcdsaPaillierProof.prove(
      hexToBigInt(xShare.n),
      hexToBigInt(xShare.l),
      EcdsaTypes.deserializePaillierChallenge({ p: yShare.p }).p
    );

    const proofShare = {
      z: bigIntToBufferBE(proof.z, 384).toString('hex'),
      u: bigIntToBufferBE(proof.u, 768).toString('hex'),
      w: bigIntToBufferBE(proof.w, 384).toString('hex'),
      s: bigIntToBufferBE(proof.s, 384).toString('hex'),
      s1: bigIntToBufferBE(proof.s1, 96).toString('hex'),
      s2: bigIntToBufferBE(proof.s2, 480).toString('hex'),
    };

    const kShare: KShare = {
      // this share will be sent to the other participant,
      // so we need to swap the i and j values here
      // so that they know it's their kShare, produced by us
      i: yShare.j,
      j: xShare.i,
      n: pk.n.toString(16),
      ntilde: ntildea,
      h1: h1a,
      h2: h2a,
      p: xShare.p,
      k: bigIntToBufferBE(ck, 768).toString('hex'),
      sigma: EcdsaTypes.serializePaillierChallengeProofs({ sigma: sigma }).sigma,
      proof: proofShare,
    };

    return {
      wShare,
      kShare,
    };
  }

  /**
   * Perform multiplicitive-to-additive (MtA) share conversion with another signer.
   * Connection 1.2 in https://lucid.app/lucidchart/7061785b-bc5c-4002-b546-3f4a3612fc62/edit?page=IAVmvYO4FvKc#
   * If signer A completed signShare initially (input to this fn), then this step is completed by signer B.
   * @param {SignConvert} shares
   * @returns {SignConvertRT}
   */
  async signConvertStep1(shares: SignConvertStep1): Promise<SignConvertStep1Response> {
    const receivedKShare = shares.kShare;
    const xShare = shares.xShare; // currentParticipant secret xShare
    const yShare: YShareWithChallenges = {
      ...shares.yShare,
      ntilde: receivedKShare.ntilde,
      h1: receivedKShare.h1,
      h2: receivedKShare.h2,
      p: receivedKShare.p,
    };
    const signShare = await this.signShare(xShare, yShare);
    const shareParticipant = signShare.wShare;

    if (shareParticipant.i !== receivedKShare.i) {
      throw new Error('Shares from same participant');
    }
    if (!receivedKShare.proof) {
      throw new Error('Unexpected missing proof on aShareToBeSent');
    }

    // the other participants paillier public key
    const n = hexToBigInt(receivedKShare.n);
    const pka = getPaillierPublicKey(n);
    // the other participant's range proof challenge
    const ntildea = hexToBigInt(receivedKShare.ntilde);
    const h1a = hexToBigInt(receivedKShare.h1);
    const h2a = hexToBigInt(receivedKShare.h2);

    // the current participant's range proof challenge
    const ntildeb = hexToBigInt(shareParticipant.ntilde);
    const h1b = hexToBigInt(shareParticipant.h1);
    const h2b = hexToBigInt(shareParticipant.h2);

    const k = hexToBigInt(receivedKShare.k);

    // the current participants paillier proof challenge
    const shareParticipantPaillierChallenge = EcdsaTypes.deserializePaillierChallenge({ p: shareParticipant.p });
    // the other signing parties proof to the current participants paillier proof challenge
    const receivedPaillierChallengeProof = EcdsaTypes.deserializePaillierChallengeProofs({
      sigma: receivedKShare.sigma,
    });
    if (
      !(await EcdsaPaillierProof.verify(n, shareParticipantPaillierChallenge.p, receivedPaillierChallengeProof.sigma))
    ) {
      throw new Error('Could not verify signing A share paillier proof');
    }

    if (
      !EcdsaRangeProof.verify(
        Ecdsa.curve,
        minModulusBitLength,
        pka,
        {
          ntilde: ntildeb,
          h1: h1b,
          h2: h2b,
        },
        {
          z: hexToBigInt(receivedKShare.proof.z),
          u: hexToBigInt(receivedKShare.proof.u),
          w: hexToBigInt(receivedKShare.proof.w),
          s: hexToBigInt(receivedKShare.proof.s),
          s1: hexToBigInt(receivedKShare.proof.s1),
          s2: hexToBigInt(receivedKShare.proof.s2),
        },
        k
      )
    ) {
      throw new Error('Could not verify signing A share proof');
    }
    // MtA $k_j, \gamma_i$.
    const beta0 = bigintCryptoUtils.randBetween(Ecdsa.curve.order() ** _5n);
    const beta = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(beta0)), 32).toString('hex');
    const g = hexToBigInt(shareParticipant.gamma);
    const rb = await randomPositiveCoPrimeTo(pka.n);
    const cb = pka.encrypt(beta0, rb);
    const alpha = pka.addition(pka.multiply(k, g), cb);
    const alphaToBeSent = bigIntToBufferBE(alpha, ALPHAMUSIZE).toString('hex');
    // Prove $\gamma_i \in Z_{N^2}$.
    const gx = Ecdsa.curve.basePointMult(g);
    let proof = await EcdsaRangeProof.proveWithCheck(
      Ecdsa.curve,
      minModulusBitLength,
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
    const gammaProofToBeSent: RangeProofWithCheckShare = {
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
    };
    // MtA $k_j, w_i$.
    const nu0 = bigintCryptoUtils.randBetween(Ecdsa.curve.order() ** _5n);
    const nu = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(nu0)), 32).toString('hex');
    const w = hexToBigInt(shareParticipant.w);
    const rn = await randomPositiveCoPrimeTo(pka.n);
    const cn = pka.encrypt(nu0, rn);
    const mu = pka.addition(pka.multiply(k, w), cn);
    const muToBeSent = bigIntToBufferBE(mu, ALPHAMUSIZE).toString('hex');
    // Prove $\w_i \in Z_{N^2}$.
    const wx = Ecdsa.curve.basePointMult(w);
    proof = await EcdsaRangeProof.proveWithCheck(
      Ecdsa.curve,
      minModulusBitLength,
      pka,
      {
        ntilde: ntildea,
        h1: h1a,
        h2: h2a,
      },
      k,
      hexToBigInt(muToBeSent),
      w,
      nu0,
      rn,
      wx
    );
    const wProofToBeSent: RangeProofWithCheckShare = {
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
    };

    const nToBeSent = signShare.kShare.n;
    const ntildeToBeSent = bigIntToBufferBE(ntildeb, 384).toString('hex');
    const h1ToBeSent = bigIntToBufferBE(h1b, 384).toString('hex');
    const h2ToBeSent = bigIntToBufferBE(h2b, 384).toString('hex');
    const kToBeSent = signShare.kShare.k;
    const proofToBeSent = signShare.kShare.proof;
    const [iToBeSent, jToBeSent] = [receivedKShare.j, receivedKShare.i];
    return {
      aShare: {
        i: iToBeSent,
        j: jToBeSent,
        ntilde: ntildeToBeSent,
        h1: h1ToBeSent,
        h2: h2ToBeSent,
        n: nToBeSent,
        k: kToBeSent,
        alpha: alphaToBeSent,
        mu: muToBeSent,
        proof: proofToBeSent,
        gammaProof: gammaProofToBeSent,
        wProof: wProofToBeSent,
        // provide the share participants proof
        // to the paillier challenge in the receivedKShare from the other signer
        sigma: signShare.kShare.sigma,
      },
      bShare: {
        ...shareParticipant,
        beta,
        nu,
      },
    };
  }

  /**
   * Perform multiplicitive-to-additive (MtA) share conversion with another
   * signer.
   * Connection 2.1 in https://lucid.app/lucidchart/7061785b-bc5c-4002-b546-3f4a3612fc62/edit?page=IAVmvYO4FvKc#
   * If signer B completed signConvertStep1, then this step is completed by signer A.
   * @param {SignConvert} shares
   * @returns {SignConvertRT}
   */
  async signConvertStep2(shares: SignConvertStep2): Promise<SignConvertStep2Response> {
    const receivedAShare = shares.aShare;
    if (!receivedAShare.gammaProof) {
      throw new Error('Unexpected missing gammaProof on aShareToBeSent');
    }
    if (!receivedAShare.wProof) {
      throw new Error('Unexpected missing wProof on aShareToBeSent');
    }
    const n = hexToBigInt(receivedAShare.n); // Paillier pub from other signer
    // current participant public key
    const pka = getPaillierPublicKey(hexToBigInt(shares.wShare.n));
    const ntildea = hexToBigInt(shares.wShare.ntilde);
    const h1a = hexToBigInt(shares.wShare.h1);
    const h2a = hexToBigInt(shares.wShare.h2);
    const ck = hexToBigInt(shares.wShare.ck);

    const shareParticipantPaillierChallenge = EcdsaTypes.deserializePaillierChallenge({ p: shares.wShare.p });
    const receivedPaillierChallengeProof = EcdsaTypes.deserializePaillierChallengeProofs({
      sigma: shares.aShare.sigma,
    });
    if (!EcdsaPaillierProof.verify(n, shareParticipantPaillierChallenge.p, receivedPaillierChallengeProof.sigma)) {
      throw new Error('could not verify signing share for paillier proof');
    }

    // Verify $\gamma_i \in Z_{N^2}$.
    if (
      !EcdsaRangeProof.verifyWithCheck(
        Ecdsa.curve,
        minModulusBitLength,
        pka,
        {
          ntilde: ntildea,
          h1: h1a,
          h2: h2a,
        },
        {
          z: hexToBigInt(receivedAShare.gammaProof.z),
          zprm: hexToBigInt(receivedAShare.gammaProof.zprm),
          t: hexToBigInt(receivedAShare.gammaProof.t),
          v: hexToBigInt(receivedAShare.gammaProof.v),
          w: hexToBigInt(receivedAShare.gammaProof.w),
          s: hexToBigInt(receivedAShare.gammaProof.s),
          s1: hexToBigInt(receivedAShare.gammaProof.s1),
          s2: hexToBigInt(receivedAShare.gammaProof.s2),
          t1: hexToBigInt(receivedAShare.gammaProof.t1),
          t2: hexToBigInt(receivedAShare.gammaProof.t2),
          u: hexToBigInt(receivedAShare.gammaProof.u),
        },
        ck,
        hexToBigInt(receivedAShare.alpha),
        hexToBigInt(receivedAShare.gammaProof.x)
      )
    ) {
      throw new Error('could not verify signing share for gamma proof');
    }
    // Verify $\w_i \in Z_{N^2}$.
    if (
      !EcdsaRangeProof.verifyWithCheck(
        Ecdsa.curve,
        minModulusBitLength,
        pka,
        {
          ntilde: ntildea,
          h1: h1a,
          h2: h2a,
        },
        {
          z: hexToBigInt(receivedAShare.wProof.z),
          zprm: hexToBigInt(receivedAShare.wProof.zprm),
          t: hexToBigInt(receivedAShare.wProof.t),
          v: hexToBigInt(receivedAShare.wProof.v),
          w: hexToBigInt(receivedAShare.wProof.w),
          s: hexToBigInt(receivedAShare.wProof.s),
          s1: hexToBigInt(receivedAShare.wProof.s1),
          s2: hexToBigInt(receivedAShare.wProof.s2),
          t1: hexToBigInt(receivedAShare.wProof.t1),
          t2: hexToBigInt(receivedAShare.wProof.t2),
          u: hexToBigInt(receivedAShare.wProof.u),
        },
        ck,
        hexToBigInt(receivedAShare.mu),
        hexToBigInt(receivedAShare.wProof.x)
      )
    ) {
      throw new Error('could not verify share for wProof');
    }
    const sk = new paillierBigint.PrivateKey(hexToBigInt(shares.wShare.l), hexToBigInt(shares.wShare.m), pka);

    const gShareAlpha = bigIntToBufferBE(
      Ecdsa.curve.scalarReduce(sk.decrypt(hexToBigInt(receivedAShare.alpha))),
      32
    ).toString('hex');

    const gShareMu = bigIntToBufferBE(
      Ecdsa.curve.scalarReduce(sk.decrypt(hexToBigInt(receivedAShare.mu))), // recheck encrypted number
      32
    ).toString('hex');

    if (!receivedAShare.proof) {
      throw new Error('Unexpected missing proof on aShareToBeSent');
    }
    const pkb = getPaillierPublicKey(n);
    const ntildeb = hexToBigInt(receivedAShare.ntilde);
    const h1b = hexToBigInt(receivedAShare.h1);
    const h2b = hexToBigInt(receivedAShare.h2);
    const k = hexToBigInt(receivedAShare.k);
    if (
      !EcdsaRangeProof.verify(
        Ecdsa.curve,
        minModulusBitLength,
        pkb,
        {
          ntilde: ntildea,
          h1: h1a,
          h2: h2a,
        },
        {
          z: hexToBigInt(receivedAShare.proof.z),
          u: hexToBigInt(receivedAShare.proof.u),
          w: hexToBigInt(receivedAShare.proof.w),
          s: hexToBigInt(receivedAShare.proof.s),
          s1: hexToBigInt(receivedAShare.proof.s1),
          s2: hexToBigInt(receivedAShare.proof.s2),
        },
        k
      )
    ) {
      throw new Error('Could not verify signing A share proof');
    }
    // MtA $k_j, \gamma_i$.
    const beta0 = bigintCryptoUtils.randBetween(Ecdsa.curve.order() ** _5n);
    const gShareBeta = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(beta0)), 32).toString('hex');

    const g = hexToBigInt(shares.wShare.gamma);
    const rb = await randomPositiveCoPrimeTo(pkb.n);
    const cb = pkb.encrypt(beta0, rb);
    const alpha = pkb.addition(pkb.multiply(k, g), cb);
    const alphaToBeSent = bigIntToBufferBE(alpha, ALPHAMUSIZE).toString('hex');
    // Prove $\gamma_i \in Z_{N^2}$.
    const gx = Ecdsa.curve.basePointMult(g);
    let proof = await EcdsaRangeProof.proveWithCheck(
      Ecdsa.curve,
      minModulusBitLength,
      pkb,
      {
        ntilde: ntildeb,
        h1: h1b,
        h2: h2b,
      },
      k,
      alpha,
      g,
      beta0,
      rb,
      gx
    );
    const gammaProofToBeSent: RangeProofWithCheckShare = {
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
    };
    // MtA $k_j, w_i$.
    const nu0 = bigintCryptoUtils.randBetween(Ecdsa.curve.order() ** _5n);
    const gShareNu = bigIntToBufferBE(Ecdsa.curve.scalarNegate(Ecdsa.curve.scalarReduce(nu0)), 32).toString('hex');
    const w = hexToBigInt(shares.wShare.w);
    const rn = await randomPositiveCoPrimeTo(pkb.n);
    const cn = pkb.encrypt(nu0, rn);
    const mu = pkb.addition(pkb.multiply(k, w), cn);
    const muToBeSent = bigIntToBufferBE(mu, ALPHAMUSIZE).toString('hex');
    // Prove $\w_i \in Z_{N^2}$.
    const wx = Ecdsa.curve.basePointMult(w);
    proof = await EcdsaRangeProof.proveWithCheck(
      Ecdsa.curve,
      minModulusBitLength,
      pkb,
      {
        ntilde: ntildeb,
        h1: h1b,
        h2: h2b,
      },
      k,
      hexToBigInt(muToBeSent),
      w,
      nu0,
      rn,
      wx
    );
    const wProofToBeSent: RangeProofWithCheckShare = {
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
    };

    const [iToBeSent, jToBeSent] = [receivedAShare.j, receivedAShare.i];
    return {
      muShare: {
        i: iToBeSent,
        j: jToBeSent,
        alpha: alphaToBeSent,
        mu: muToBeSent,
        gammaProof: gammaProofToBeSent,
        wProof: wProofToBeSent,
      },
      gShare: {
        i: shares.wShare.i,
        n: shares.wShare.n,
        y: shares.wShare.y,
        k: shares.wShare.k,
        w: shares.wShare.w,
        gamma: shares.wShare.gamma,
        alpha: gShareAlpha,
        mu: gShareMu,
        beta: gShareBeta,
        nu: gShareNu,
      },
    };
  }

  /**
   * Perform multiplicitive-to-additive (MtA) share conversion with another signer.
   * Connection 2.2 in https://lucid.app/lucidchart/7061785b-bc5c-4002-b546-3f4a3612fc62/edit?page=IAVmvYO4FvKc#
   * If signer A completed signConvertStep2, then this step is completed by signer B.
   * @param {SignConvert} shares
   * @returns {SignConvertRT}
   */
  async signConvertStep3(shares: SignConvertStep3): Promise<SignConvertStep3Response> {
    const receivedMuShare = shares.muShare;
    if (!receivedMuShare.gammaProof) {
      throw new Error('Unexpected missing gammaProof on aShareToBeSent');
    }
    if (!receivedMuShare.wProof) {
      throw new Error('Unexpected missing wProof on aShareToBeSent');
    }
    const pka = getPaillierPublicKey(hexToBigInt(shares.bShare.n));
    const ntildea = hexToBigInt(shares.bShare.ntilde);
    const h1a = hexToBigInt(shares.bShare.h1);
    const h2a = hexToBigInt(shares.bShare.h2);
    const ck = hexToBigInt(shares.bShare.ck);
    // Verify $\gamma_i \in Z_{N^2}$.
    if (
      !EcdsaRangeProof.verifyWithCheck(
        Ecdsa.curve,
        minModulusBitLength,
        pka,
        {
          ntilde: ntildea,
          h1: h1a,
          h2: h2a,
        },
        {
          z: hexToBigInt(receivedMuShare.gammaProof.z),
          zprm: hexToBigInt(receivedMuShare.gammaProof.zprm),
          t: hexToBigInt(receivedMuShare.gammaProof.t),
          v: hexToBigInt(receivedMuShare.gammaProof.v),
          w: hexToBigInt(receivedMuShare.gammaProof.w),
          s: hexToBigInt(receivedMuShare.gammaProof.s),
          s1: hexToBigInt(receivedMuShare.gammaProof.s1),
          s2: hexToBigInt(receivedMuShare.gammaProof.s2),
          t1: hexToBigInt(receivedMuShare.gammaProof.t1),
          t2: hexToBigInt(receivedMuShare.gammaProof.t2),
          u: hexToBigInt(receivedMuShare.gammaProof.u),
        },
        ck,
        hexToBigInt(receivedMuShare.alpha),
        hexToBigInt(receivedMuShare.gammaProof.x)
      )
    ) {
      throw new Error('could not verify signing share for gamma proof');
    }
    // Verify $\w_i \in Z_{N^2}$.
    if (
      !EcdsaRangeProof.verifyWithCheck(
        Ecdsa.curve,
        minModulusBitLength,
        pka,
        {
          ntilde: ntildea,
          h1: h1a,
          h2: h2a,
        },
        {
          z: hexToBigInt(receivedMuShare.wProof.z),
          zprm: hexToBigInt(receivedMuShare.wProof.zprm),
          t: hexToBigInt(receivedMuShare.wProof.t),
          v: hexToBigInt(receivedMuShare.wProof.v),
          w: hexToBigInt(receivedMuShare.wProof.w),
          s: hexToBigInt(receivedMuShare.wProof.s),
          s1: hexToBigInt(receivedMuShare.wProof.s1),
          s2: hexToBigInt(receivedMuShare.wProof.s2),
          t1: hexToBigInt(receivedMuShare.wProof.t1),
          t2: hexToBigInt(receivedMuShare.wProof.t2),
          u: hexToBigInt(receivedMuShare.wProof.u),
        },
        ck,
        hexToBigInt(receivedMuShare.mu),
        hexToBigInt(receivedMuShare.wProof.x)
      )
    ) {
      throw new Error('could not verify share for wProof');
    }
    const sk = new paillierBigint.PrivateKey(hexToBigInt(shares.bShare.l), hexToBigInt(shares.bShare.m), pka);
    const alpha = sk.decrypt(hexToBigInt(receivedMuShare.alpha));
    const gShareAlpha = bigIntToBufferBE(Ecdsa.curve.scalarReduce(alpha), 32).toString('hex');
    const mu = sk.decrypt(hexToBigInt(receivedMuShare.mu as string)); // recheck encrypted number
    const gShareMu = bigIntToBufferBE(Ecdsa.curve.scalarReduce(mu), 32).toString('hex');

    const [iToBeSent, jToBeSent] = [receivedMuShare.j, receivedMuShare.i];
    return {
      gShare: {
        i: shares.bShare.i,
        n: shares.bShare.n,
        y: shares.bShare.y,
        k: shares.bShare.k,
        w: shares.bShare.w,
        gamma: shares.bShare.gamma,
        alpha: gShareAlpha,
        mu: gShareMu,
        beta: shares.bShare.beta,
        nu: shares.bShare.nu,
      },
      signIndex: {
        i: iToBeSent,
        j: jToBeSent,
      },
    };
  }

  /**
   * Perform multiplicitive-to-additive (MtA) share conversion with another signer.
   * @deprecated - use one of [signConvertStep1, signConvertStep2, signConvertStep3] instead
   * @param {SignConvert} shares
   * @returns {SignConvertRT}
   */
  async signConvert(shares: SignConvert): Promise<SignConvertRT> {
    let shareParticipant: Partial<BShare> | Partial<GShare>, shareToBeSent: Partial<AShare> | MUShare;
    let isGammaShare = false;
    let kShare: Partial<KShare> = {};
    if (shares.xShare && shares.yShare && shares.kShare) {
      const xShare = shares.xShare; // currentParticipant secret xShare
      const yShare: YShareWithChallenges = {
        ...shares.yShare,
        ntilde: shares.kShare.ntilde,
        h1: shares.kShare.h1,
        h2: shares.kShare.h2,
        p: shares.kShare.p,
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
      if (!aShareToBeSent.gammaProof) {
        throw new Error('Unexpected missing gammaProof on aShareToBeSent');
      }
      if (!aShareToBeSent.wProof) {
        throw new Error('Unexpected missing wProof on aShareToBeSent');
      }
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
          minModulusBitLength,
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
          minModulusBitLength,
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
      if (!aShareToBeSent.proof) {
        throw new Error('Unexpected missing proof on aShareToBeSent');
      }
      const n = hexToBigInt(aShareToBeSent.n); // Paillier pub from other signer
      const pka = getPaillierPublicKey(n);
      const ntildea = hexToBigInt(aShareToBeSent.ntilde);
      const h1a = hexToBigInt(aShareToBeSent.h1);
      const h2a = hexToBigInt(aShareToBeSent.h2);
      const ntildeb = hexToBigInt(bShareParticipant.ntilde);
      const h1b = hexToBigInt(bShareParticipant.h1);
      const h2b = hexToBigInt(bShareParticipant.h2);
      const k = hexToBigInt(aShareToBeSent.k);
      if (
        !EcdsaRangeProof.verify(
          Ecdsa.curve,
          minModulusBitLength,
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
        minModulusBitLength,
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
        minModulusBitLength,
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
   * @param shouldHash if true, we hash the provided buffer before signing
   * @returns {VAShare}
   */
  sign(M: Buffer, oShare: OShare, dShare: DShare, hash?: Hash, shouldHash = true): VAShare {
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

    const l = Ecdsa.curve.scalarRandom();
    const rho = Ecdsa.curve.scalarRandom();
    const V = Ecdsa.curve.pointAdd(Ecdsa.curve.pointMultiply(R, s), Ecdsa.curve.basePointMult(l));
    const A = Ecdsa.curve.basePointMult(rho);

    const comDecom_V_A = HashCommitment.createCommitment(
      Buffer.concat([bigIntToBufferBE(V, Ecdsa.curve.pointBytes), bigIntToBufferBE(A, Ecdsa.curve.pointBytes)])
    );

    return {
      i: oShare.i,
      y: oShare.y,
      R: pointR.toHex(true),
      s: bigIntToBufferBE(s, 32).toString('hex'),
      m: m,
      l: l,
      rho: rho,
      V: V,
      A: A,
      comDecomVA: comDecom_V_A,
    };
  }

  /**
   * Generate proofs of V_i and A_i values.
   * @param {Buffer} M Message to commit to as part of the context of the proof.
   *    This doesn't need to be the same message that was signed in the sign function above.
   *    But it should be the same for all participants for the purpose of providing proof context.
   * @param {VAShare} vaShare The VAShare to prove.
   * @returns {VAShareWithProofs}
   */
  generateVAProofs(M: Buffer, vaShare: VAShare): VAShareWithProofs {
    const s = hexToBigInt(vaShare.s);
    const R = bigIntFromU8ABE(secp.Point.fromHex(vaShare.R).toRawBytes(true));

    const proofContext = createHash('sha256').update(M).update(bigIntToBufferBE(R, Ecdsa.curve.pointBytes)).digest();

    const zkVProof = EcdsaZkVProof.createZkVProof(vaShare.V, s, vaShare.l, R, Ecdsa.curve, proofContext);
    const schnorrProof = Schnorr.createSchnorrProof(vaShare.A, vaShare.rho, Ecdsa.curve, proofContext);

    return {
      ...vaShare,
      proofContext: proofContext,
      zkVProofV: zkVProof,
      schnorrProofA: schnorrProof,
    };
  }

  /**
   * Verify V_i and A_i values of all other participants during signing phase 5 steps 5A and 5B.
   * @param {VAShareWithProofs} vaShare V_i, A_i info including SShare values of the currenct participant
   * @param {PublicVAShareWithProofs[]} publicVAShares public V_i, A_i info of all other participants
   * @returns {UTShare} U_i, T_i info of the current participant if all verifications pass
   */
  verifyVAShares(vaShare: VAShareWithProofs, publicVAShares: PublicVAShareWithProofs[]): UTShare {
    publicVAShares.forEach((publicVAShare) => {
      if (
        !HashCommitment.verifyCommitment(publicVAShare.comDecomVA.commitment, {
          secret: Buffer.concat([
            bigIntToBufferBE(publicVAShare.V, Ecdsa.curve.pointBytes),
            bigIntToBufferBE(publicVAShare.A, Ecdsa.curve.pointBytes),
          ]),
          blindingFactor: publicVAShare.comDecomVA.decommitment.blindingFactor,
        })
      ) {
        throw new Error('Could not verify commitment of V_i and A_i');
      }
      if (
        !Schnorr.verifySchnorrProof(publicVAShare.A, publicVAShare.schnorrProofA, Ecdsa.curve, vaShare.proofContext)
      ) {
        throw new Error('Could not verify Schnorr proof of A_i');
      }
      if (
        !EcdsaZkVProof.verifyZkVProof(
          publicVAShare.V,
          publicVAShare.zkVProofV,
          hexToBigInt(vaShare.R),
          Ecdsa.curve,
          vaShare.proofContext
        )
      ) {
        throw new Error('Could not verify ZK proof of V_i');
      }
    });

    const y = hexToBigInt(vaShare.y);
    // r is R's x coordinate.  R is in compressed form, so we need to slice off the first byte.
    const r = hexToBigInt(vaShare.R.slice(2));

    // Calculate aggregation of all V_i and A_i.
    let V = Ecdsa.curve.pointAdd(
      Ecdsa.curve.pointAdd(
        Ecdsa.curve.basePointMult(Ecdsa.curve.scalarNegate(bigIntFromU8ABE(vaShare.m))),
        Ecdsa.curve.pointMultiply(y, Ecdsa.curve.scalarNegate(r))
      ),
      vaShare.V
    );
    let A = vaShare.A;
    publicVAShares.forEach((publicVAShare) => {
      V = Ecdsa.curve.pointAdd(V, publicVAShare.V);
      A = Ecdsa.curve.pointAdd(A, publicVAShare.A);
    });

    // Calculate U_i = rho_i * V and T_i = l_i * A.
    const U = Ecdsa.curve.pointMultiply(V, vaShare.rho);
    const T = Ecdsa.curve.pointMultiply(A, vaShare.l);
    const comDecom_U_T = HashCommitment.createCommitment(
      Buffer.concat([bigIntToBufferBE(U, Ecdsa.curve.pointBytes), bigIntToBufferBE(T, Ecdsa.curve.pointBytes)])
    );

    return {
      ...vaShare,
      U,
      T,
      comDecomUT: comDecom_U_T,
    };
  }

  /**
   * Verify U_i and V_i values of all other participants during signing phase 5 steps 5C and 5D.
   * @param {UTShare} utShare U_i, T_i info including SShare values of the currenct participant
   * @param {PublicUTShare[]} publicUTShares public U_i, T_i info of all other participants
   * @returns {SShare} SShare of the current participant if all verifications pass
   */
  verifyUTShares(utShare: UTShare, publicUTShares: PublicUTShare[]): SShare {
    let sigmaU = utShare.U;
    let sigmaT = utShare.T;

    publicUTShares.forEach((publicUTShare) => {
      if (
        !HashCommitment.verifyCommitment(publicUTShare.comDecomUT.commitment, {
          secret: Buffer.concat([
            bigIntToBufferBE(publicUTShare.U, Ecdsa.curve.pointBytes),
            bigIntToBufferBE(publicUTShare.T, Ecdsa.curve.pointBytes),
          ]),
          blindingFactor: publicUTShare.comDecomUT.decommitment.blindingFactor,
        })
      ) {
        throw new Error('Could not verify commitment of U_i and T_i');
      }

      sigmaU = Ecdsa.curve.pointAdd(sigmaU, publicUTShare.U);
      sigmaT = Ecdsa.curve.pointAdd(sigmaT, publicUTShare.T);
    });

    if (sigmaU !== sigmaT) {
      throw new Error('Sum of all U_i does not match sum of all T_i');
    }

    return { ...utShare };
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
