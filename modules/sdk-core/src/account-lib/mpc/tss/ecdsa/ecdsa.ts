import * as paillierBigint from 'paillier-bigint';
import { bigIntToHex } from '../../../util/crypto';
import { Secp256k1Curve } from '../../curves';
import Shamir from '../../shamir';
import { NShare, PShare, KeyShare, KeyCombined } from './types';

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
    if (!(index > 0 && index <= numShares && threshold <= numShares && threshold > 0)) {
      throw 'Invalid KeyShare Config';
    }
    // Generate additively homomorphic encryption key.
    const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(3072, true);
    const u = Ecdsa.curve.scalarRandom();
    const y = Ecdsa.curve.basePointMult(u);
    // Compute secret shares of the private key
    const uShares = Ecdsa.shamir.split(u, threshold, numShares);
    const currentParticipant: PShare = {
      i: index,
      l: bigIntToHex(privateKey.lambda),
      m: bigIntToHex(privateKey.mu),
      n: bigIntToHex(publicKey.n),
      y: bigIntToHex(y),
      u: bigIntToHex(uShares[index]),
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
          n: bigIntToHex(publicKey.n),
          y: bigIntToHex(y),
          u: bigIntToHex(uShares[participantIndex]),
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
    const y = allShares.map((participant) => BigInt(participant['y'])).reduce(Ecdsa.curve.pointAdd);
    // Add secret shares
    const x = allShares.map((participant) => BigInt(participant['u'])).reduce(Ecdsa.curve.scalarAdd);

    const participants: KeyCombined = {
      xShare: {
        i: pShare.i,
        l: pShare.l,
        m: pShare.m,
        n: pShare.n,
        y: bigIntToHex(y),
        x: bigIntToHex(x),
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
}
