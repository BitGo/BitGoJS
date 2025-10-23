import openpgp from 'openpgp';
import { MPSTypes, MPSUtil, MPSComms } from '@bitgo/sdk-lib-mpc';
import { MPCv2PartyFromStringOrNumber, SignatureShareRecord, SignatureShareType } from '@bitgo/public-types';
import assert from 'assert';
import { getUserPartyGpgKey, getBitGoPartyGpgKey } from '../ecdsa/ecdsaMPCv2';
import { MPCv2SignatureShareRound1Output, MPCv2SignatureShareRound2Input } from '../../utils/tss/eddsa/types';

function partyIdToSignatureShareType(partyId: 0 | 1 | 2): SignatureShareType {
  assert(partyId === 0 || partyId === 1 || partyId === 2, 'Invalid partyId for MPCv2 signing');
  switch (partyId) {
    case 0:
      return SignatureShareType.USER;
    case 1:
      return SignatureShareType.BACKUP;
    case 2:
      return SignatureShareType.BITGO;
  }
}

export async function getSignatureShareRoundOne(
  round1Message: MPSTypes.DeserializedMessage,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  bitgoGpgKey: openpgp.Key,
  partyId: 0 | 1 = 0,
  otherSignerPartyId: 0 | 1 | 2 = 2
): Promise<SignatureShareRecord> {
  const serializedMessage = MPSUtil.serializeMessages([round1Message])[0];
  const authEncBroadcastMessage = await MPSComms.encryptAndAuthOutgoingMessageP2P(
    serializedMessage,
    getUserPartyGpgKey(userGpgKey, partyId),
    getBitGoPartyGpgKey(bitgoGpgKey, otherSignerPartyId)
  );
  // Share type expected by Wallet Platform's API
  assert(MPCv2PartyFromStringOrNumber.is(authEncBroadcastMessage.from));
  const share: any = {
    type: 'round1Input',
    data: {
      msg1: {
        from: authEncBroadcastMessage.from,
        message: authEncBroadcastMessage.payload.message,
        signature: authEncBroadcastMessage.payload.signature,
      },
    },
  };
  const serializedShare = JSON.stringify(share);
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: serializedShare,
  };
}

export async function verifyBitGoMessagesAndSignaturesRoundOne(
  parsedSignatureShare: MPCv2SignatureShareRound1Output,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  bitgoGpgKey: openpgp.Key,
  partyId: 0 | 1 = 0
): Promise<MPSTypes.SerializedMessage[]> {
  const { msg1, msg2 } = parsedSignatureShare.data;
  return await MPSComms.decryptAndVerifyIncomingMessageP2P(
    [
      {
        from: msg1.from,
        payload: {
          message: msg1.message,
          signature: msg1.signature,
        },
      },
      {
        from: msg2.from,
        payload: {
          message: msg2.message,
          signature: msg2.signature,
        },
      },
    ],
    getBitGoPartyGpgKey(bitgoGpgKey),
    getUserPartyGpgKey(userGpgKey, partyId)
  );
}

export async function getSignatureShareRoundTwo(
  userToBitGoMessages2: MPSTypes.DeserializedMessage,
  userToBitGoMessages3: MPSTypes.DeserializedMessage,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  otherPartyGpgKey: openpgp.Key,
  partyId: 0 | 1 = 0,
  otherSignerPartyId: 0 | 1 | 2 = 2
): Promise<SignatureShareRecord> {
  const userToBitGoEncryptedMsg2 = await MPSComms.encryptAndAuthOutgoingMessages(
    MPSUtil.serializeMessages([userToBitGoMessages2]),
    [getBitGoPartyGpgKey(otherPartyGpgKey, otherSignerPartyId), getUserPartyGpgKey(userGpgKey, partyId)]
  );

  const userToBitGoEncryptedMsg3 = await MPSComms.encryptAndAuthOutgoingMessages(
    MPSUtil.serializeMessages([userToBitGoMessages3]),
    [getBitGoPartyGpgKey(otherPartyGpgKey, otherSignerPartyId), getUserPartyGpgKey(userGpgKey, partyId)]
  );

  assert(userToBitGoEncryptedMsg2.length, 'User to BitGo messages 2 not present.');
  assert(userToBitGoEncryptedMsg3.length, 'User to BitGo messages 3 not present.');

  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg2[0].from));
  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg3[0].from));

  const msg2 = userToBitGoEncryptedMsg2[0];
  const msg3 = userToBitGoEncryptedMsg3[0];
  const share: MPCv2SignatureShareRound2Input = {
    type: 'round2Input',
    data: {
      msg2: {
        from: msg2.from as MPCv2PartyFromStringOrNumber,
        message: msg2.payload.message,
        signature: msg2.payload.signature,
      },
      msg3: {
        from: msg3.from as MPCv2PartyFromStringOrNumber,
        message: msg3.payload.message,
        signature: msg3.payload.signature,
      },
    },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}
