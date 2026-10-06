/**
 * @prettier
 */
import * as t from 'io-ts';
import Eddsa, { KeyCombine } from '../../../account-lib/mpc/tss';
import { UserSigningMaterial } from '../../tss/eddsa/types';

const HEX_32_BYTES = /^[0-9a-f]{64}$/i;

/** 32-byte hex string; every hex field of genuine MPCv1 signing material is fixed-width 32 bytes. */
const Hex32Bytes = new t.Type<string, string, unknown>(
  'Hex32Bytes',
  (u): u is string => typeof u === 'string' && HEX_32_BYTES.test(u),
  (u, c) => (typeof u === 'string' && HEX_32_BYTES.test(u) ? t.success(u) : t.failure(u, c)),
  t.identity
);

const UShareCodec = t.type({
  i: t.number,
  t: t.number,
  n: t.number,
  y: Hex32Bytes,
  seed: Hex32Bytes,
  chaincode: Hex32Bytes,
});

/**
 * `v` is the optional VSS commitment: absent on shares created without verifiable secret sharing.
 * It is declared through `t.partial` rather than a union with `undefined` so that decoding an
 * absent `v` does not materialize it as an own property on the share handed to `keyCombine`.
 */
const YShareCodec = t.intersection([
  t.type({
    i: t.number,
    j: t.number,
    y: Hex32Bytes,
    u: Hex32Bytes,
    chaincode: Hex32Bytes,
  }),
  t.partial({ v: Hex32Bytes }),
]);

const UserSigningMaterialCodec = t.type({
  uShare: UShareCodec,
  bitgoYShare: YShareCodec,
  backupYShare: YShareCodec,
});

/**
 * Maps a decode failure to a constant message. Never interpolates `error.value`: the input is
 * private key material. This is also why the codecs call `t.failure` without a message and why
 * the `validationErrors` reporter in `utils/decode.ts` is not used — both embed the failing value.
 */
function toInvalidKeyMessage(errors: t.Errors): string {
  const [error] = errors;
  // the head of the context is the root codec itself, so the remaining keys are the field path.
  // purely numeric keys are intersection/union member indices rather than field names.
  const segments = error.context
    .slice(1)
    .map((entry) => entry.key)
    .filter((key) => !/^\d+$/.test(key));
  if (segments.length === 0) {
    return 'Invalid user key - signing material is not an object';
  }
  if (segments.length === 1 && (error.value === undefined || error.value === null)) {
    return `Invalid user key - missing ${segments[0]}`;
  }
  return `Invalid user key - ${segments[0]} is not a valid share`;
}

/**
 * Parses the user TSS EdDSA signing material that a client passes as `prv` when signing,
 * and rejects anything that does not decode as user signing material.
 *
 * Decoding is a shape check only, but it keeps malformed input away from the combine routine,
 * which throws raw, input-interpolating errors for malformed shares.
 *
 * The input is private key material, so no error message may interpolate any part of it.
 * In particular, JSON.parse errors on Node >= 20 include the raw input in their message,
 * which is why parse failures are rethrown with a constant message.
 *
 * @param prv - stringified user signing material (`uShare`, `bitgoYShare`, `backupYShare`)
 */
export function parseEddsaUserSigningMaterial(prv: string): UserSigningMaterial {
  let parsed: unknown;
  try {
    parsed = JSON.parse(prv);
  } catch (e) {
    throw new Error('Invalid user key - could not parse signing material');
  }
  const decoded = UserSigningMaterialCodec.decode(parsed);
  if (decoded._tag === 'Left') {
    throw new Error(toInvalidKeyMessage(decoded.left));
  }
  return decoded.right as UserSigningMaterial;
}

/**
 * Checks that `uShare.y` is the public point actually derived from `uShare.seed`.
 *
 * `keyCombine` derives the private scalar from the seed but reconstructs the common keychain from
 * the declared `y` fields, so it never compares the two. Without this check a caller who knows
 * only the wallet's public commonKeychain can submit genuine public fields alongside a seed they
 * do not own and still verify. Re-running `keyShare` with the share's own seed and chaincode
 * reproduces the derivation and yields the `y` the seed really commits to.
 */
function uShareSeedMatchesY(MPC: Eddsa, uShare: UserSigningMaterial['uShare']): boolean {
  const seedchain = Buffer.concat([Buffer.from(uShare.seed, 'hex'), Buffer.from(uShare.chaincode, 'hex')]);
  let derived: UserSigningMaterial['uShare'];
  try {
    derived = MPC.keyShare(uShare.i, uShare.t, uShare.n, seedchain).uShare;
  } catch (e) {
    // keyShare rejects an out-of-range index or threshold, which makes the share unusable
    return false;
  }
  return derived.y === uShare.y;
}

/**
 * Verifies that user TSS EdDSA signing material (`prv`) recombines to a given commonKeychain.
 *
 * Recombines the user's share with the BitGo and backup Y shares — the same computation the
 * SDK performs when creating the user keychain or signing — and compares the result against
 * the wallet's commonKeychain. Returns false rather than throwing when the keys do not match.
 * Shares that pass the shape check but are cryptographically inconsistent are rejected with
 * a constant message: the combine routine throws raw errors, some of which interpolate
 * submitter-controlled fields, which must not surface through the API.
 *
 * Recombination alone is not proof of possession, so two further checks run first. The seed is
 * bound to `uShare.y`, and the Y shares must carry their VSS commitment `v` — `keyCombine`
 * verifies a Y share's secret `u` only when `v` is present, so material without `v` cannot be
 * verified at all and throws a distinct error rather than being judged a non-match. Genuine
 * shares produced by `keyShare` always carry `v`.
 *
 * A true result is a consistency check for a caller inspecting its own material, not proof of
 * possession, and must never be used as an authorization signal: a caller who knows only the
 * wallet's public commonKeychain can construct material that passes — an `uShare` whose seed
 * matches its `y`, plus Y shares with a chosen secret `u` and the `v` solved from it, whose
 * `y` values sum to the common key.
 *
 * @param params.prv - stringified user signing material, as passed as `prv` when signing
 * @param params.commonKeychain - the wallet's user keychain commonKeychain
 */
export async function eddsaUserSigningMaterialMatchesCommonKeychain(params: {
  prv: string;
  commonKeychain: string;
}): Promise<boolean> {
  const signingMaterial = parseEddsaUserSigningMaterial(params.prv);
  const MPC = await Eddsa.initialize();
  if (!uShareSeedMatchesY(MPC, signingMaterial.uShare)) {
    return false;
  }
  // keyCombine verifies a Y share's secret `u` against its commitment only when `v` is present,
  // so material without `v` cannot be verified at all; reject it distinctly instead of judging
  // it a non-match, which would misreport genuine material that lacks the commitment
  if (signingMaterial.bitgoYShare.v === undefined || signingMaterial.backupYShare.v === undefined) {
    throw new Error('Unable to verify key - signing material has no VSS commitment');
  }
  let combinedKey: KeyCombine;
  try {
    combinedKey = MPC.keyCombine(signingMaterial.uShare, [signingMaterial.bitgoYShare, signingMaterial.backupYShare]);
  } catch (e) {
    throw new Error('Invalid user key - could not combine signing material');
  }
  return combinedKey.pShare.y + combinedKey.pShare.chaincode === params.commonKeychain;
}
