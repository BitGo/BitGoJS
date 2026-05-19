/**
 * Two-party BIP-340 Schnorr threshold signing (SchnorrDsg).
 *
 * Works with the Shamir keyshares produced by `DklsDkg` (DKLS23 key generation).
 * No new WASM is required: key material is read directly from the CBOR-encoded
 * keyshare, Lagrange interpolation is computed in TypeScript, and BIP-340 Schnorr
 * algebra is performed with `@noble/curves/secp256k1`.
 *
 * Protocol (2 broadcast rounds):
 *
 *   Round 1  init()
 *     • Each party generates a random nonce scalar k_i.
 *     • Broadcasts the nonce point R_i = k_i * G  (33-byte compressed).
 *
 *   Round 2  handleIncomingMessages([R_j])
 *     • Compute combined nonce R = R_i + R_j.
 *     • If R.y is odd, negate k_i  (BIP-340 requires even-y R).
 *     • Compute BIP-340 challenge  e = H("BIP0340/challenge", R.x ‖ P.x ‖ msg).
 *     • Compute partial signature  s_i = k_i + e · λ_i · priv_i   (mod n).
 *     • Broadcasts s_i as 32-byte big-endian scalar.
 *
 *   Combine  handleIncomingMessages([s_j])
 *     • s = s_i + s_j  mod n.
 *     • signature = Buffer.concat([R.x_32, s_32])  — 64-byte BIP-340 Schnorr.
 *
 * BIP-32 non-hardened derivation is supported.  For path `m/a/b/...`, the total
 * IL scalar (sum of per-level HMAC-SHA512 left halves) is computed from the
 * shared public key / chaincode.  The party with the smallest index in
 * `signingPartyIndices` absorbs the entire IL adjustment so that Lagrange
 * interpolation still reconstructs the correct child private key.
 *
 * References:
 *   BIP-340  https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
 *   FROST    https://eprint.iacr.org/2020/852
 */

import { secp256k1 as nobleSecp } from '@noble/curves/secp256k1';
import { createHmac, randomBytes, createHash } from 'crypto';
import { decode } from 'cbor-x';
import { DeserializedBroadcastMessage, DeserializedMessages } from '../ecdsa-dkls/types';

// ── Curve constants ────────────────────────────────────────────────────────────

const N = nobleSecp.CURVE.n; // secp256k1 order
const G = nobleSecp.ProjectivePoint.BASE;

// ── Scalar arithmetic helpers ──────────────────────────────────────────────────

/** Reduce `x` into [0, N). */
function scalarMod(x: bigint): bigint {
  return ((x % N) + N) % N;
}

/** Modular inverse via extended Euclidean algorithm. */
function scalarInvert(a: bigint): bigint {
  let [r, rp] = [N, scalarMod(a)];
  let [s, sp] = [BigInt(0), BigInt(1)];
  while (rp !== BigInt(0)) {
    const q = r / rp;
    [r, rp] = [rp, r - q * rp];
    [s, sp] = [sp, s - q * sp];
  }
  if (r !== BigInt(1)) throw new Error('scalarInvert: input has no inverse mod N');
  return scalarMod(s);
}

/** Big-endian `Buffer | Uint8Array` → `bigint`. */
function bigFromBuf(b: Buffer | Uint8Array): bigint {
  const hex = Buffer.from(b).toString('hex');
  return hex ? BigInt('0x' + hex) : BigInt(0);
}

/** `bigint` → 32-byte big-endian `Buffer`. */
function buf32(n: bigint): Buffer {
  return Buffer.from(scalarMod(n).toString(16).padStart(64, '0'), 'hex');
}

// ── BIP-340 tagged hash ────────────────────────────────────────────────────────

/**
 * H_tag(data...) = SHA256( SHA256(tag) ‖ SHA256(tag) ‖ data... )
 * as specified in BIP-340.
 */
function taggedHash(tag: string, ...data: Buffer[]): Buffer {
  const tagHash = createHash('sha256').update(tag).digest();
  const h = createHash('sha256');
  h.update(tagHash);
  h.update(tagHash);
  for (const d of data) h.update(d);
  return h.digest();
}

// ── Lagrange coefficient ────────────────────────────────────────────────────────

/**
 * Compute the Lagrange coefficient λ_i for party `partyIdx` evaluated at x=0,
 * using only the x-coordinates of the parties in `signingPartyIndices`.
 *
 * λ_i = ∏_{j≠i, j∈S}  x_j / (x_j − x_i)   mod N
 *
 * @param xList       Full `x_i_list` from the DKLS keyshare (one 32-byte array per party).
 * @param partyIdx    This party's index (0-based in the global party list).
 * @param signingPartyIndices  Indices of ALL parties participating in this signing session.
 */
function computeLagrangeCoeff(xList: number[][], partyIdx: number, signingPartyIndices: number[]): bigint {
  const xi = bigFromBuf(Buffer.from(xList[partyIdx]));
  let num = BigInt(1);
  let den = BigInt(1);
  for (const j of signingPartyIndices) {
    if (j === partyIdx) continue;
    const xj = bigFromBuf(Buffer.from(xList[j]));
    num = scalarMod(num * xj);
    den = scalarMod(den * scalarMod(xj - xi));
  }
  return scalarMod(num * scalarInvert(den));
}

// ── BIP-32 non-hardened derivation ─────────────────────────────────────────────

/**
 * Parse a derivation path string (`'m/0/1/2'`) into an array of child indices.
 * Hardened paths (`'m/44'/0'`) are not supported.
 */
function parsePath(path: string): number[] {
  if (path === 'm' || path === '') return [];
  const parts = path.replace(/^m\/?/, '').split('/');
  return parts.map((p) => {
    if (p.endsWith("'")) throw new Error('Hardened derivation is not supported for Schnorr threshold signing.');
    const idx = parseInt(p, 10);
    if (isNaN(idx) || idx < 0 || idx >= 0x80000000) throw new Error(`Invalid path component: ${p}`);
    return idx;
  });
}

/**
 * Derive the total IL scalar and final chaincode for a non-hardened BIP-32 path.
 *
 * BIP-32 non-hardened child key update:
 *   I = HMAC-SHA512(key=chainCode, data=compressedPubKey ‖ ser32(index))
 *   childPriv    = parentPriv + IL   (mod N)
 *   childPubKey  = parentPubKey + IL * G
 *   childChainCode = IR
 *
 * For threshold signing, the IL scalars are additive, so the total private-key
 * adjustment is `totalIL = Σ IL_k`.  The caller is responsible for applying this
 * to the right party's share.
 *
 * @returns `{ totalIL, finalChainCode, finalPubKey }` for the derived child.
 */
function derivePath(
  rootPubKey: Buffer,
  rootChainCode: Buffer,
  path: number[]
): { totalIL: bigint; finalChainCode: Buffer; finalPubKey: Buffer } {
  let pub = rootPubKey; // 33-byte compressed
  let cc = rootChainCode; // 32-byte chaincode
  let totalIL = BigInt(0);

  for (const index of path) {
    const indexBuf = Buffer.alloc(4);
    indexBuf.writeUInt32BE(index, 0);

    const I = Buffer.from(createHmac('sha512', cc).update(pub).update(indexBuf).digest());
    const IL = bigFromBuf(I.slice(0, 32));
    const IR = I.slice(32);

    if (IL >= N) throw new Error('BIP-32 derived IL >= N; this path is invalid (astronomically unlikely).');

    totalIL = scalarMod(totalIL + IL);
    cc = IR;

    // Advance the public key to the child level.
    const pubPoint = nobleSecp.ProjectivePoint.fromHex(pub.toString('hex'));
    const childPoint = pubPoint.add(G.multiply(IL));
    pub = Buffer.from(childPoint.toRawBytes(true));
  }

  return { totalIL, finalChainCode: cc, finalPubKey: pub };
}

// ── Types ──────────────────────────────────────────────────────────────────────

/** 64-byte BIP-340 Schnorr signature `(R.x_32 ‖ s_32)`. */
export type SchnorrDklsSignature = {
  /** 32-byte x-coordinate of the nonce point R. */
  R: Uint8Array;
  /** 32-byte Schnorr scalar s. */
  S: Uint8Array;
};

export enum SchnorrDsgState {
  Uninitialized = 0,
  Round1, // waiting to receive the other party's nonce point R_j
  Round2, // waiting to receive the other party's partial scalar s_j
  Complete,
}

// ── SchnorrDsg ─────────────────────────────────────────────────────────────────

/**
 * Two-party BIP-340 Schnorr threshold signing session.
 *
 * Compatible with keyshares produced by `DklsDkg.Dkg` (DKLS23 key generation).
 *
 * @example
 * ```ts
 * // Party 0 (HSM / BitGo) and party 1 (user), 2-of-2 DKG keyshares.
 * const party0 = new SchnorrDsg(ks0, 0, [0, 1], 'm/0', hash32);
 * const party1 = new SchnorrDsg(ks1, 1, [0, 1], 'm/0', hash32);
 *
 * const r0 = await party0.init();                         // Round 1
 * const r1 = await party1.init();
 *
 * const s0 = party0.handleIncomingMessages({ broadcastMessages: [r1], p2pMessages: [] }); // Round 2
 * const s1 = party1.handleIncomingMessages({ broadcastMessages: [r0], p2pMessages: [] });
 *
 * party0.handleIncomingMessages({ broadcastMessages: s1.broadcastMessages, p2pMessages: [] }); // Combine
 * // party0.signature  ← 64-byte BIP-340 Schnorr sig
 * ```
 */
export class SchnorrDsg {
  private readonly partyIdx: number;
  private readonly signingPartyIndices: number[];
  private readonly messageHash: Buffer;
  private readonly derivationPath: string;
  private state: SchnorrDsgState = SchnorrDsgState.Uninitialized;
  private _signature: SchnorrDklsSignature | undefined;

  // Computed in constructor
  private readonly effectivePriv: bigint; // λ_i · priv_i (parity-adjusted, derivation-adjusted)
  private readonly pubKeyX: Buffer; // 32-byte x-only final public key (for challenge hash)

  // Set in init()
  private ki = BigInt(0); // ephemeral nonce scalar
  private Ri: ReturnType<typeof nobleSecp.ProjectivePoint.fromHex> | undefined;

  // Set in round-1 handler
  private R_combined: ReturnType<typeof nobleSecp.ProjectivePoint.fromHex> | undefined;
  private si = BigInt(0); // partial signature scalar

  /**
   * @param keyShare            CBOR-encoded DKLS keyshare (full or reduced format).
   * @param partyIdx            This party's index in the DKG (0-based, must be in `signingPartyIndices`).
   * @param signingPartyIndices Indices of ALL parties participating in this signing session.
   *                            Must contain `partyIdx`.  The Lagrange coefficients are computed
   *                            for this subset.
   * @param derivationPath      BIP-32 non-hardened path (e.g. `'m/0'`).  Defaults to root `'m'`.
   * @param messageHash         32-byte message hash to sign.
   */
  constructor(
    keyShare: Buffer,
    partyIdx: number,
    signingPartyIndices: number[],
    derivationPath: string,
    messageHash: Buffer
  ) {
    if (messageHash.length !== 32) {
      throw new Error(`messageHash must be 32 bytes, got ${messageHash.length}`);
    }
    if (!signingPartyIndices.includes(partyIdx)) {
      throw new Error(`partyIdx ${partyIdx} must be included in signingPartyIndices`);
    }
    if (signingPartyIndices.length < 2) {
      throw new Error('signingPartyIndices must contain at least 2 parties');
    }

    this.partyIdx = partyIdx;
    this.signingPartyIndices = signingPartyIndices;
    this.messageHash = messageHash;
    this.derivationPath = derivationPath;

    const ks = decode(keyShare);

    // Support both full keyshare (s_i / x_i_list / public_key / root_chain_code)
    // and reduced keyshare (prv / xList / pub) as produced by Dkg.getReducedKeyShare().
    const privBytes: number[] = ks.s_i ?? ks.prv;
    const pubBytes: number[] = ks.public_key ?? ks.pub;
    const ccBytes: number[] = ks.root_chain_code ?? ks.rootChainCode;
    const xList: number[][] = ks.x_i_list ?? ks.xList;

    const si = bigFromBuf(Buffer.from(privBytes));
    const rootPub = Buffer.from(pubBytes); // 33-byte compressed
    const rootCC = Buffer.from(ccBytes); // 32-byte chaincode

    // ── BIP-32 derivation ──────────────────────────────────────────────────
    const path = parsePath(derivationPath);
    let finalPubKey = rootPub;
    let totalIL = BigInt(0);

    if (path.length > 0) {
      const derived = derivePath(rootPub, rootCC, path);
      totalIL = derived.totalIL;
      finalPubKey = derived.finalPubKey;
    }

    // ── Lagrange coefficient ───────────────────────────────────────────────
    const li = computeLagrangeCoeff(xList, partyIdx, signingPartyIndices);

    // ── BIP-340 public key parity adjustment ───────────────────────────────
    // BIP-340 uses the x-only public key; the "canonical" key has even y.
    // If the final derived public key has odd y, negate the private key.
    const pYIsOdd = finalPubKey[0] === 0x03;
    this.pubKeyX = finalPubKey.slice(1); // 32-byte x-only

    // ── Effective private share ────────────────────────────────────────────
    // Base share contribution: λ_i · s_i
    let eff = scalarMod(li * si);

    // BIP-32 IL adjustment: the party with the smallest index in the signing
    // set absorbs the entire totalIL so that Lagrange interpolation over the
    // adjusted shares reconstructs the correct child private key.
    //
    //   sum_{k∈S} λ_k · s_k_adj = d_root + totalIL  (= d_child)
    //
    // where s_min_adj = s_min + totalIL · λ_min^{-1},  s_k_adj = s_k  (k≠min).
    //
    // From this party's perspective, the effective contribution is:
    //   if this is the min party: λ_min · s_min_adj = λ_min·s_min + totalIL
    //   otherwise:                λ_k · s_k         (unchanged)
    const isMinParty = partyIdx === Math.min(...signingPartyIndices);
    if (isMinParty && totalIL !== BigInt(0)) {
      eff = scalarMod(eff + totalIL);
    }

    // If P.y is odd, negate the effective contribution.
    if (pYIsOdd) {
      eff = scalarMod(N - eff);
    }

    this.effectivePriv = eff;
  }

  /** The combined 64-byte BIP-340 Schnorr signature `(R.x_32 ‖ s_32)`. Available after `Complete`. */
  get signature(): SchnorrDklsSignature {
    if (!this._signature) {
      throw new Error('Signature not produced yet.');
    }
    return this._signature;
  }

  get dsgState(): SchnorrDsgState {
    return this.state;
  }

  /**
   * Round 1: generate a fresh ephemeral nonce and broadcast the nonce point R_i.
   * @returns Broadcast message containing the 33-byte compressed nonce point.
   */
  async init(): Promise<DeserializedBroadcastMessage> {
    if (this.state !== SchnorrDsgState.Uninitialized) {
      throw new Error('SchnorrDsg session already initialized.');
    }

    // Sample a random nonce scalar k_i in [1, N).
    let kiBuf: Buffer;
    do {
      kiBuf = Buffer.from(randomBytes(32));
      this.ki = bigFromBuf(kiBuf);
    } while (this.ki === BigInt(0) || this.ki >= N);

    this.Ri = G.multiply(this.ki);
    this.state = SchnorrDsgState.Round1;

    return {
      payload: new Uint8Array(Buffer.from(this.Ri.toRawBytes(true))), // 33 bytes compressed
      from: this.partyIdx,
    };
  }

  /**
   * Process incoming messages for the current round:
   *
   * - Round 1 → receives nonce point `R_j` → returns partial scalar `s_i`.
   * - Round 2 → receives partial scalar `s_j` → produces final signature.
   */
  handleIncomingMessages(messages: DeserializedMessages): DeserializedMessages {
    if (this.state === SchnorrDsgState.Round1) {
      return this._handleRound1(messages);
    }
    if (this.state === SchnorrDsgState.Round2) {
      return this._handleRound2(messages);
    }
    throw new Error(`handleIncomingMessages called in unexpected state: ${SchnorrDsgState[this.state]}`);
  }

  // ── Private round handlers ────────────────────────────────────────────────────

  /**
   * Round 1: receive R_j, compute combined R, apply BIP-340 parity, compute s_i.
   */
  private _handleRound1(messages: DeserializedMessages): DeserializedMessages {
    if (messages.broadcastMessages.length !== 1) {
      throw new Error(`Round 1: expected 1 broadcast message (R_j), got ${messages.broadcastMessages.length}`);
    }
    if (!this.Ri) throw new Error('Nonce point not set — call init() first.');

    const Rj = nobleSecp.ProjectivePoint.fromHex(Buffer.from(messages.broadcastMessages[0].payload).toString('hex'));

    // Combine: R = R_i + R_j
    const R_raw = this.Ri.add(Rj);

    // BIP-340: R.y must be even. If odd, negate k_i  (both parties will agree on
    // the sign since they both see the same R = R_i + R_j).
    const R_yIsOdd = R_raw.y % BigInt(2) === BigInt(1);
    if (R_yIsOdd) {
      this.ki = scalarMod(N - this.ki);
    }
    // Store the parity-normalised R (even y).
    this.R_combined = R_yIsOdd ? R_raw.negate() : R_raw;

    // BIP-340 challenge: e = H_tag("BIP0340/challenge", R.x_32 ‖ P.x_32 ‖ msg)
    const Rx = buf32(this.R_combined.x);
    const e = bigFromBuf(taggedHash('BIP0340/challenge', Rx, this.pubKeyX, this.messageHash));

    // Partial signature: s_i = k_i + e · effectivePriv_i  (mod N)
    this.si = scalarMod(this.ki + scalarMod(e * this.effectivePriv));
    this.state = SchnorrDsgState.Round2;

    return {
      broadcastMessages: [
        {
          payload: new Uint8Array(buf32(this.si)), // 32 bytes
          from: this.partyIdx,
        },
      ],
      p2pMessages: [],
    };
  }

  /**
   * Round 2 (combine): receive s_j, produce the final BIP-340 Schnorr signature.
   */
  private _handleRound2(messages: DeserializedMessages): DeserializedMessages {
    if (messages.broadcastMessages.length !== 1) {
      throw new Error(`Round 2: expected 1 broadcast message (s_j), got ${messages.broadcastMessages.length}`);
    }
    if (!this.R_combined) throw new Error('R_combined not set — handleRound1 must run first.');

    const sj = bigFromBuf(Buffer.from(messages.broadcastMessages[0].payload));
    const s = scalarMod(this.si + sj);

    this._signature = {
      R: new Uint8Array(buf32(this.R_combined.x)),
      S: new Uint8Array(buf32(s)),
    };
    this.state = SchnorrDsgState.Complete;

    return { broadcastMessages: [], p2pMessages: [] };
  }
}
