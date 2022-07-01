import * as paillierBigint from 'paillier-bigint';
import * as secp from '@noble/secp256k1';
import { randomBytes, createHash } from 'crypto';
import { hexToBigInt } from '../../../util/crypto';
import { bigIntFromBufferBE, bigIntToBufferBE, bigIntFromU8ABE, getPaillierPublicKey } from '../../util';
import { Secp256k1Curve } from '../../curves';
import Shamir from '../../shamir';
import {
  NShare,
  PShare,
  KeyShare,
  KeyCombined,
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
  SignRT,
  SShare,
  SignShareRT,
  KShare,
  XShare,
  YShare,
} from './types';

/**
 * ECDSA TSS implementation supporting 2:n Threshold
 */
export default class Ecdsa {
  static curve: Secp256k1Curve = new Secp256k1Curve();
  static shamir: Shamir = new Shamir(Ecdsa.curve);
  /**
   * Generate shares for participant at index and split keys `(threshold,numShares)` ways.
   * @param {number} index participant index
   * @param {number} threshold Signing threshold
   * @param {number} numShares  Number of shares
   * @returns {Promise<KeyShare>} Returns the private p-share
   * and n-shares to be distributed to participants at their corresponding index.
   */
  async keyShare(index: number, threshold: number, numShares: number): Promise<KeyShare> {
    if (!(index > 0 && index <= numShares && threshold <= numShares && threshold === 2)) {
      throw 'Invalid KeyShare Config';
    }
    // Generate additively homomorphic encryption key.
    const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(3072, true);
    const u = Ecdsa.curve.scalarRandom();
    const y = Ecdsa.curve.basePointMult(u);
    const chaincode = randomBytes(32);
    // Compute secret shares of the private key
    const uShares = Ecdsa.shamir.split(u, threshold, numShares);
    const currentParticipant: PShare = {
      i: index,
      l: privateKey.lambda.toString(16),
      m: privateKey.mu.toString(16),
      n: publicKey.n.toString(16),
      y: y.toString(16),
      u: uShares[index].toString(16),
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
          y: y.toString(16),
          u: uShares[participantIndex].toString(16),
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
        y: y.toString(16),
        x: x.toString(16),
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
        k: k.toString(16),
        w: w.toString(16),
        gamma: gamma.toString(16),
      },
      kShare: {} as KShare,
    };

    signers.kShare = {
      i: yShare.j,
      j: xShare.i,
      n: pk.n.toString(16),
      k: pk.encrypt(k).toString(16),
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
      shareParticipant['alpha'] = Ecdsa.curve.scalarReduce(alpha).toString(16);
      const mu = sk.decrypt(hexToBigInt(shareToBeSend.mu as string)); // recheck encrypted number
      shareParticipant['mu'] = Ecdsa.curve.scalarReduce(mu).toString(16);
      delete shareParticipant['l'];
      delete shareParticipant['m'];
      delete shareToBeSend['alpha'];
      delete shareToBeSend['mu'];
    }
    if (shareToBeSend['k']) {
      const n = hexToBigInt(shareToBeSend['n']); // Pallier pub from other signer
      let pk = getPaillierPublicKey(n);
      const k = hexToBigInt(shareToBeSend['k']);

      const beta0 = Ecdsa.curve.scalarRandom();
      shareParticipant.beta = Ecdsa.curve.scalarNegate(beta0).toString(16);
      const alpha = pk.addition(pk.multiply(k, hexToBigInt(shareParticipant.gamma)), pk.encrypt(beta0));
      shareToBeSend.alpha = alpha.toString(16);

      const nu0 = Ecdsa.curve.scalarRandom();
      shareParticipant.nu = Ecdsa.curve.scalarNegate(nu0).toString(16);
      const mu = pk.addition(pk.multiply(k, hexToBigInt(shareParticipant.w)), pk.encrypt(nu0));
      shareToBeSend.mu = mu.toString(16);
      if (shareParticipant['alpha']) {
        delete shareToBeSend['n'];
        delete shareToBeSend['k'];
      } else {
        pk = getPaillierPublicKey(hexToBigInt(shareParticipant.n));
        shareToBeSend['n'] = pk.n.toString(16);
        shareToBeSend['k'] = pk.encrypt(hexToBigInt(shareParticipant.k)).toString(16);
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
    const gShare = shares.gShares;
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
        k: k.toString(16),
        omicron: omicron.toString(16),
        delta: delta.toString(16),
        Gamma: Gamma.toString(16),
      },
      dShare: {
        i: S.i,
        j: gShare.i,
        delta: delta.toString(16),
        Gamma: Gamma.toString(16),
      },
    };
  }

  /**
   * Sign a message.
   * @param {Buffer} M Message to be signed
   * @param {OShare} oShare private omicron share of current participant
   * @param {DShare} dShare delta share received from the other participant
   * @returns {SignRT}
   */
  sign(M: Buffer, oShare: OShare, dShare: DShare): SignRT {
    const m = createHash('sha256').update(M).digest();

    const delta = Ecdsa.curve.scalarAdd(hexToBigInt(oShare.delta), hexToBigInt(dShare.delta));

    const R = Ecdsa.curve.pointMultiply(
      Ecdsa.curve.pointAdd(hexToBigInt(oShare.Gamma), hexToBigInt(dShare.Gamma)),
      Ecdsa.curve.scalarInvert(delta)
    );
    const pointR = secp.Point.fromHex(bigIntToBufferBE(R));
    const r = pointR.x;

    const s = Ecdsa.curve.scalarAdd(
      Ecdsa.curve.scalarMult(bigIntFromU8ABE(m), hexToBigInt(oShare.k)),
      Ecdsa.curve.scalarMult(r, hexToBigInt(oShare.omicron))
    );
    return {
      i: oShare.i,
      y: oShare.y,
      r: r.toString(16),
      s: s.toString(16),
    };
  }

  /**
   * Construct full signature by combining Sign Shares
   * @param {SShare[]} shares
   * @returns {Signature}
   */
  constructSignature(shares: SShare[]): Signature {
    // Every r must match.
    const r = shares[0]['r'];
    const isRMatching = shares.map((share) => share['r'] === r).reduce((a, b) => a && b);
    if (!isRMatching) {
      throw new Error('r value should be consistent across all shares');
    }

    let s = shares.map((share) => hexToBigInt(share['s'])).reduce(Ecdsa.curve.scalarAdd);

    // Normalize s.
    s = s > Ecdsa.curve.order() / BigInt(2) ? Ecdsa.curve.order() - s : s;
    return {
      y: shares[0]['y'],
      r: r,
      s: s.toString(16),
    };
  }

  /**
   * Verify ecdsa signatures
   * @param {Buffer} message
   * @param {Signature } signature
   * @returns {boolean} True if signature is valid; False otherwise
   */
  verify(message: Buffer, signature: Signature): boolean {
    return Ecdsa.curve.verify(
      createHash('sha256').update(message).digest(),
      Buffer.concat([
        bigIntToBufferBE(hexToBigInt(signature['r']), 32),
        bigIntToBufferBE(hexToBigInt(signature['s']), 32),
      ]),
      hexToBigInt(signature['y'])
    );
  }
}
