import openpgp from 'openpgp';
import { MPSTypes, MPSUtil, MPSComms } from '@bitgo/sdk-lib-mpc';
import { MPCv2PartyFromStringOrNumber } from '@bitgo/public-types';
import assert from 'assert';
import { getUserPartyGpgKey, getBitGoPartyGpgKey } from '../ecdsa/ecdsaMPCv2';
import { MPCv2SignatureShareRound1Output, MPCv2SignatureShareRound2Input } from '../../utils/tss/eddsa/types';
import { partyIdToSignatureShareType } from '../ecdsa/ecdsaMPCv2';
import { SignatureShareRecord } from '../../utils/tss/baseTypes';
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
        to: otherSignerPartyId,
        from: authEncBroadcastMessage.from,
        encryptedMessage: authEncBroadcastMessage.payload.encryptedMessage,
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
          encryptedMessage: msg1.encryptedMessage,
          signature: msg1.signature,
        },
      },
      {
        from: msg2.from,
        payload: {
          encryptedMessage: msg2.encryptedMessage,
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

  const encryptedMessages = await Promise.all(MPSUtil.serializeMessages([userToBitGoMessages2, userToBitGoMessages3]).map(async (message) => {
    return MPSComms.encryptAndAuthOutgoingMessageP2P(
      message,
      getUserPartyGpgKey(userGpgKey, partyId),
      getBitGoPartyGpgKey(otherPartyGpgKey, otherSignerPartyId),
      );
    })
  );
  const [msg2, msg3] = encryptedMessages;


  assert(msg2, 'User to BitGo messages 2 not present.');
  assert(msg3, 'User to BitGo messages 3 not present.');

  assert(MPCv2PartyFromStringOrNumber.is(msg2.from));
  assert(MPCv2PartyFromStringOrNumber.is(msg3.from));

  const share: MPCv2SignatureShareRound2Input = {
    type: 'round2Input',
    data: {
      msg2: {
        to: otherSignerPartyId,
        from: msg2.from as MPCv2PartyFromStringOrNumber,
        encryptedMessage: msg2.payload.encryptedMessage,
        signature: msg2.payload.signature,
      },
      msg3: {
        to: otherSignerPartyId,
        from: msg3.from as MPCv2PartyFromStringOrNumber,
        encryptedMessage: msg3.payload.encryptedMessage,
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
