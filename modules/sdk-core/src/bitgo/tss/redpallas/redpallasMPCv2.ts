import assert from 'assert';
import * as openpgp from 'openpgp';
import { RedPallasMPSComms, RedPallasMPSTypes } from '@bitgo/sdk-lib-mpc';
import {
  RedpallasMPCv2RerandShareRound1Input,
  RedpallasMPCv2RerandShareRound1Output,
  RedpallasMPCv2RerandShareRound2Input,
  RedpallasMPCv2RerandShareRound2Output,
  RedpallasMPCv2SignatureShareRound1Input,
  RedpallasMPCv2SignatureShareRound1Output,
  RedpallasMPCv2SignatureShareRound2Input,
  RedpallasMPCv2SignatureShareRound2Output,
  RedpallasMPCv2SignatureShareRound3Input,
  RedpallasMPCv2SignatureShareRound3Output,
} from '@bitgo/public-types';
import { SignatureShareRecord, SignatureShareType } from '../../utils/tss/baseTypes';
import { MPCv2PartiesEnum } from '../../utils/tss/ecdsa/typesMPCv2';

type SignerPartyId = MPCv2PartiesEnum.USER | MPCv2PartiesEnum.BACKUP;

function partyIdToSignatureShareType(partyId: MPCv2PartiesEnum): SignatureShareType {
  switch (partyId) {
    case MPCv2PartiesEnum.USER:
      return SignatureShareType.USER;
    case MPCv2PartiesEnum.BACKUP:
      return SignatureShareType.BACKUP;
    case MPCv2PartiesEnum.BITGO:
      return SignatureShareType.BITGO;
  }
}

/**
 * RedPallas MPS DSG and rerand signature-share helpers (multi-spend, WCI-1949).
 *
 * A shielded ZEC transaction can spend several Orchard notes; every per-spend
 * value on the /sign wire is an ARRAY of length N ordered by spend index, where
 * N is the number of Orchard spends
 * (`txRequest.transactions[i].unsignedTx.parsedTx.inputs.length`), derived on
 * the client and never a wire field. Each spend runs its own rerand session and
 * its own DSG session (N instances of `RedPallasRerand` / `RedPallasDSG` — they
 * are single-session by design; the per-spend fan-out lives in the caller, see
 * OVC's `MpcSignerRedPallas`), but each round still produces exactly ONE
 * `SignatureShareRecord` per transaction: the builders below take N
 * PGP-signed messages in and emit one record whose `msgN` is the spend-ordered
 * array; the verifiers take a parsed peer `roundNOutput` (msgN array) and
 * return N verified messages out, in the same order.
 *
 * Builders:
 * - assert a non-empty input array (N >= 1; an Orchard spend transaction has at
 *   least one input) and preserve spend order — Wallet Platform index-pairs
 *   `msgN[i]` with spend i's HSM state, so a misordered array silently mispairs
 *   spends.
 * - emit exactly ONE share record per round — WP reads only the LAST share in
 *   `signatureShares`; multiple partial records would be silently dropped.
 *
 * Verifiers:
 * - return one verified message per array entry, same order, all signed by the
 *   BitGo RedPallas GPG key; a single failed verification fails the whole round
 *   (all-or-nothing, mirroring WP's per-round share handling).
 *
 * Consumed by the custodial/cold (SMC/OVC) signing flow: OVC builds its rerand
 * and DSG shares with these and submits them via the /sign txRequest route (see
 * `sendSignatureShareV2`, body types `redPallasRerand` / `redPallasMpcV2`). No
 * caller inside this SDK yet. Mirrors `../eddsa/eddsaMPCv2.ts` (same round
 * shape, same PGP-signed-message envelope), but kept as an independent copy -
 * built on `RedPallasMPSComms` - so RedPallas MPS never depends on the EdDSA MPS
 * module, and vice versa. The EdDSA helpers themselves remain scalar
 * (single-signable): EdDSA is not part of the multi-spend cutover.
 *
 * Since `@bitgo/wasm-mps` 1.17.0, key re-randomization is a separate 2-round
 * rerand protocol that must run before every RedPallas DSG, between the same 2
 * parties that will then sign: `getRerandShareRoundOne/Two` build those share
 * records and `verifyPeerRerandMessageRoundOne/Two` unwrap the peer's rerand
 * messages (see `RedPallasRerand` in `@bitgo/sdk-lib-mpc`). Rerand R1 seeds
 * every spend's session from the SAME DKG keyshare; after R2 each spend has its
 * own rerand result `{keyShare, pk, alpha}`. The per-spend `keyShare` - never
 * the bare DKG keyshare - initializes that spend's DSG session, and the DSG
 * signature verifies under `rk == pk` of the same spend.
 */

/**
 * Builds the round-1 signature share record.
 *
 * PGP-signs each spend's WASM round-0 broadcast message with the signer's
 * ephemeral key and wraps all N of them, in spend order, into ONE
 * SignatureShareRecord (`msg1` array) ready for `sendSignatureShareV2`.
 */
export async function getSignatureShareRoundOne(
  userMsg1s: RedPallasMPSTypes.DeserializedMessage[],
  userGpgPrivKey: openpgp.PrivateKey,
  partyId: SignerPartyId = MPCv2PartiesEnum.USER,
  otherSignerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<SignatureShareRecord> {
  assert(userMsg1s.length >= 1, 'Expected at least 1 round-1 message (one per shielded spend)');
  const signedMsg1s = await Promise.all(
    userMsg1s.map((userMsg1) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(userMsg1.payload), userGpgPrivKey))
  );
  const share: RedpallasMPCv2SignatureShareRound1Input = {
    type: 'round1Input',
    data: { msg1: signedMsg1s },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}

/**
 * Verifies the peer's round-1 PGP signatures and returns the raw deserialized
 * messages, one per shielded spend in the peer's array order, ready for
 * `RedPallasDSG.handleIncomingMessages` (feed `msg1[i]` into spend i's session).
 * All-or-nothing: a single failed verification rejects the whole round.
 */
export async function verifyPeerMessageRoundOne(
  parsedRound1Output: RedpallasMPCv2SignatureShareRound1Output,
  peerGpgKey: openpgp.Key,
  peerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<RedPallasMPSTypes.DeserializedMessage[]> {
  const verifiedMsgs: RedPallasMPSTypes.DeserializedMessage[] = [];
  for (const signedMsg1 of parsedRound1Output.data.msg1) {
    const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg1, peerGpgKey);
    verifiedMsgs.push({ from: peerPartyId, payload: new Uint8Array(rawBytes) });
  }
  return verifiedMsgs;
}

/**
 * Builds the round-2 signature share record.
 *
 * PGP-signs each spend's round-2 message and wraps all N of them, in spend
 * order, into ONE SignatureShareRecord (`msg2` array).
 */
export async function getSignatureShareRoundTwo(
  userMsg2s: RedPallasMPSTypes.DeserializedMessage[],
  userGpgPrivKey: openpgp.PrivateKey,
  partyId: SignerPartyId = MPCv2PartiesEnum.USER,
  otherSignerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<SignatureShareRecord> {
  assert(userMsg2s.length >= 1, 'Expected at least 1 round-2 message (one per shielded spend)');
  const signedMsg2s = await Promise.all(
    userMsg2s.map((userMsg2) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(userMsg2.payload), userGpgPrivKey))
  );
  const share: RedpallasMPCv2SignatureShareRound2Input = {
    type: 'round2Input',
    data: { msg2: signedMsg2s },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}

/**
 * Verifies the peer's round-2 PGP signatures and returns the raw deserialized
 * messages, one per shielded spend in the peer's array order, ready for
 * `RedPallasDSG.handleIncomingMessages` (feed `msg2[i]` into spend i's session).
 * All-or-nothing: a single failed verification rejects the whole round.
 */
export async function verifyPeerMessageRoundTwo(
  parsedRound2Output: RedpallasMPCv2SignatureShareRound2Output,
  peerGpgKey: openpgp.Key,
  peerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<RedPallasMPSTypes.DeserializedMessage[]> {
  const verifiedMsgs: RedPallasMPSTypes.DeserializedMessage[] = [];
  for (const signedMsg2 of parsedRound2Output.data.msg2) {
    const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg2, peerGpgKey);
    verifiedMsgs.push({ from: peerPartyId, payload: new Uint8Array(rawBytes) });
  }
  return verifiedMsgs;
}

/**
 * Verifies the peer's round-3 PGP signatures and returns the raw deserialized
 * messages, one per shielded spend in the peer's array order, ready for
 * `RedPallasDSG.handleIncomingMessages` (feed `msg3[i]` into spend i's session).
 * All-or-nothing: a single failed verification rejects the whole round.
 */
export async function verifyPeerMessageRoundThree(
  parsedRound3Output: RedpallasMPCv2SignatureShareRound3Output,
  peerGpgKey: openpgp.Key,
  peerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<RedPallasMPSTypes.DeserializedMessage[]> {
  const verifiedMsgs: RedPallasMPSTypes.DeserializedMessage[] = [];
  for (const signedMsg3 of parsedRound3Output.data.msg3) {
    const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg3, peerGpgKey);
    verifiedMsgs.push({ from: peerPartyId, payload: new Uint8Array(rawBytes) });
  }
  return verifiedMsgs;
}

/**
 * Builds the round-3 signature share record (final signer messages).
 *
 * PGP-signs each spend's round-3 message and wraps all N of them, in spend
 * order, into ONE SignatureShareRecord (`msg3` array).
 *
 * There is no corresponding `verifyBitGoMessageRoundThree` because Wallet Platform
 * finalises the signing server-side after receiving round 3; the client obtains
 * the signed transaction via `sendTxRequest`.
 */
export async function getSignatureShareRoundThree(
  userMsg3s: RedPallasMPSTypes.DeserializedMessage[],
  userGpgPrivKey: openpgp.PrivateKey,
  partyId: SignerPartyId = MPCv2PartiesEnum.USER,
  otherSignerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<SignatureShareRecord> {
  assert(userMsg3s.length >= 1, 'Expected at least 1 round-3 message (one per shielded spend)');
  const signedMsg3s = await Promise.all(
    userMsg3s.map((userMsg3) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(userMsg3.payload), userGpgPrivKey))
  );
  const share: RedpallasMPCv2SignatureShareRound3Input = {
    type: 'round3Input',
    data: { msg3: signedMsg3s },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}

/**
 * Builds the rerand round-1 signature share record.
 *
 * Rerand must run before every RedPallas DSG, with the same counterpart, once
 * per shielded spend: the caller initializes N `RedPallasRerand` sessions on the
 * SAME DKG keyshare and passes each session's `getFirstMessage()`, in spend
 * order. Round 1 carries the PGP-signed WASM commitments; all N are wrapped
 * into ONE SignatureShareRecord (`msg1` array).
 */
export async function getRerandShareRoundOne(
  userMsg1s: RedPallasMPSTypes.DeserializedMessage[],
  userGpgPrivKey: openpgp.PrivateKey,
  partyId: SignerPartyId = MPCv2PartiesEnum.USER,
  otherSignerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<SignatureShareRecord> {
  assert(userMsg1s.length >= 1, 'Expected at least 1 rerand round-1 message (one per shielded spend)');
  const signedMsg1s = await Promise.all(
    userMsg1s.map((userMsg1) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(userMsg1.payload), userGpgPrivKey))
  );
  const share: RedpallasMPCv2RerandShareRound1Input = {
    type: 'round1Input',
    data: { msg1: signedMsg1s },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}

/**
 * Verifies the peer's rerand round-1 PGP signatures and returns the raw
 * deserialized messages, one per shielded spend in the peer's array order,
 * ready for `RedPallasRerand.handleIncomingMessages` (feed `msg1[i]` into
 * spend i's session). All-or-nothing: a single failed verification rejects the
 * whole round.
 */
export async function verifyPeerRerandMessageRoundOne(
  parsedRound1Output: RedpallasMPCv2RerandShareRound1Output,
  peerGpgKey: openpgp.Key,
  peerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<RedPallasMPSTypes.DeserializedMessage[]> {
  const verifiedMsgs: RedPallasMPSTypes.DeserializedMessage[] = [];
  for (const signedMsg1 of parsedRound1Output.data.msg1) {
    const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg1, peerGpgKey);
    verifiedMsgs.push({ from: peerPartyId, payload: new Uint8Array(rawBytes) });
  }
  return verifiedMsgs;
}

/**
 * Builds the rerand round-2 signature share record (opening messages).
 *
 * PGP-signs each spend's rerand round-2 message and wraps all N of them, in
 * spend order, into ONE SignatureShareRecord (`msg2` array).
 */
export async function getRerandShareRoundTwo(
  userMsg2s: RedPallasMPSTypes.DeserializedMessage[],
  userGpgPrivKey: openpgp.PrivateKey,
  partyId: SignerPartyId = MPCv2PartiesEnum.USER,
  otherSignerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<SignatureShareRecord> {
  assert(userMsg2s.length >= 1, 'Expected at least 1 rerand round-2 message (one per shielded spend)');
  const signedMsg2s = await Promise.all(
    userMsg2s.map((userMsg2) => RedPallasMPSComms.detachSignMpsMessage(Buffer.from(userMsg2.payload), userGpgPrivKey))
  );
  const share: RedpallasMPCv2RerandShareRound2Input = {
    type: 'round2Input',
    data: { msg2: signedMsg2s },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}

/**
 * Verifies the peer's rerand round-2 PGP signatures and returns the raw
 * deserialized messages, one per shielded spend in the peer's array order,
 * ready for `RedPallasRerand.handleIncomingMessages` (feed `msg2[i]` into
 * spend i's session). All-or-nothing: a single failed verification rejects the
 * whole round. After this exchange both parties read each spend's
 * rerandomized keyshare via `getRerandomizedKeyShare()` and feed it into that
 * spend's `RedPallasDSG.initDsg` - never the bare DKG keyshare.
 */
export async function verifyPeerRerandMessageRoundTwo(
  parsedRound2Output: RedpallasMPCv2RerandShareRound2Output,
  peerGpgKey: openpgp.Key,
  peerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<RedPallasMPSTypes.DeserializedMessage[]> {
  const verifiedMsgs: RedPallasMPSTypes.DeserializedMessage[] = [];
  for (const signedMsg2 of parsedRound2Output.data.msg2) {
    const rawBytes = await RedPallasMPSComms.verifyMpsMessage(signedMsg2, peerGpgKey);
    verifiedMsgs.push({ from: peerPartyId, payload: new Uint8Array(rawBytes) });
  }
  return verifiedMsgs;
}
