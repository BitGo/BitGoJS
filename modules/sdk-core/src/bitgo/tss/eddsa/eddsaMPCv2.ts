import assert from 'assert';
import * as openpgp from 'openpgp';
import { MPSComms, MPSTypes } from '@bitgo/sdk-lib-mpc';
import {
  EddsaMPCv2SignatureShareRound1Input,
  EddsaMPCv2SignatureShareRound1Output,
  EddsaMPCv2SignatureShareRound2Input,
  EddsaMPCv2SignatureShareRound2Output,
  EddsaMPCv2SignatureShareRound3Input,
} from '@bitgo/public-types';
import { SignatureShareRecord, SignatureShareType } from '../../utils/tss/baseTypes';
import { MPCv2PartiesEnum } from '../../utils/tss/ecdsa/typesMPCv2';

function partyIdToSignatureShareType(partyId: 0 | 1 | 2): SignatureShareType {
  assert(partyId === 0 || partyId === 1 || partyId === 2, 'Invalid partyId for EdDSA MPCv2 signing');
  switch (partyId) {
    case 0:
      return SignatureShareType.USER;
    case 1:
      return SignatureShareType.BACKUP;
    case 2:
      return SignatureShareType.BITGO;
  }
}

/**
 * Builds the round-1 signature share record.
 *
 * PGP-signs the WASM round-0 broadcast message with the signer's ephemeral key and
 * wraps it into a SignatureShareRecord ready for `sendSignatureShareV2`.
 */
export async function getSignatureShareRoundOne(
  userMsg1: MPSTypes.DeserializedMessage,
  userGpgPrivKey: openpgp.PrivateKey,
  partyId: 0 | 1 = 0,
  otherSignerPartyId: 0 | 1 | 2 = 2
): Promise<SignatureShareRecord> {
  const signedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(userMsg1.payload), userGpgPrivKey);
  const share: EddsaMPCv2SignatureShareRound1Input = {
    type: 'round1Input',
    data: { msg1: signedMsg1 },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}

/**
 * Verifies the peer's round-1 PGP signature and returns the raw deserialized
 * message ready for `DSG.handleIncomingMessages`.
 */
export async function verifyBitGoMessageRoundOne(
  parsedRound1Output: EddsaMPCv2SignatureShareRound1Output,
  peerGpgKey: openpgp.Key,
  peerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<MPSTypes.DeserializedMessage> {
  const rawBytes = await MPSComms.verifyMpsMessage(parsedRound1Output.data.msg1, peerGpgKey);
  return {
    from: peerPartyId,
    payload: new Uint8Array(rawBytes),
  };
}

/**
 * Builds the round-2 signature share record.
 */
export async function getSignatureShareRoundTwo(
  userMsg2: MPSTypes.DeserializedMessage,
  userGpgPrivKey: openpgp.PrivateKey,
  partyId: 0 | 1 = 0,
  otherSignerPartyId: 0 | 1 | 2 = 2
): Promise<SignatureShareRecord> {
  const signedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(userMsg2.payload), userGpgPrivKey);
  const share: EddsaMPCv2SignatureShareRound2Input = {
    type: 'round2Input',
    data: { msg2: signedMsg2 },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}

/**
 * Verifies the peer's round-2 PGP signature and returns the raw deserialized
 * message ready for `DSG.handleIncomingMessages`.
 */
export async function verifyBitGoMessageRoundTwo(
  parsedRound2Output: EddsaMPCv2SignatureShareRound2Output,
  peerGpgKey: openpgp.Key,
  peerPartyId: MPCv2PartiesEnum = MPCv2PartiesEnum.BITGO
): Promise<MPSTypes.DeserializedMessage> {
  const rawBytes = await MPSComms.verifyMpsMessage(parsedRound2Output.data.msg2, peerGpgKey);
  return {
    from: peerPartyId,
    payload: new Uint8Array(rawBytes),
  };
}

/**
 * Builds the round-3 signature share record (final signer message).
 *
 * There is no corresponding `verifyBitGoMessageRoundThree` because Wallet Platform
 * finalises the signing server-side after receiving round 3; the client obtains the
 * signed transaction via `sendTxRequest`.
 */
export async function getSignatureShareRoundThree(
  userMsg3: MPSTypes.DeserializedMessage,
  userGpgPrivKey: openpgp.PrivateKey,
  partyId: 0 | 1 = 0,
  otherSignerPartyId: 0 | 1 | 2 = 2
): Promise<SignatureShareRecord> {
  const signedMsg3 = await MPSComms.detachSignMpsMessage(Buffer.from(userMsg3.payload), userGpgPrivKey);
  const share: EddsaMPCv2SignatureShareRound3Input = {
    type: 'round3Input',
    data: { msg3: signedMsg3 },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}
