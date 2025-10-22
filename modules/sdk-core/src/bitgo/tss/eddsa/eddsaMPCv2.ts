import assert from 'assert';
import openpgp from 'openpgp';
import { MPCv2SignatureShareRound1Input, MPCv2PartyFromStringOrNumber } from '@bitgo/public-types';
import { DklsTypes, MPSTypes, MPSComms } from '@bitgo/sdk-lib-mpc';
import { SignatureShareRecord } from '../../utils';
import { partyIdToSignatureShareType } from '../ecdsa/ecdsaMPCv2';

/**
 Helpers in this take care of all interaction with WP API's
**/

export async function getSignatureShareRoundOne(
  round1Message: MPSTypes.DeserializedMessage,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  partyId: 0 | 1 = 0,
  otherSignerPartyId: 0 | 1 | 2 = 2
): Promise<SignatureShareRecord> {
  const serializedMessages = MPSTypes.serializeMessages([round1Message]);
  const authEncBroadcastMessage = await MPSComms.encryptAndAuthOutgoingMessages(serializedMessages, [
    getUserPartyGpgKey(userGpgKey, partyId),
  ])[0];
  // Share type expected by Wallet Platform's API
  assert(MPCv2PartyFromStringOrNumber.is(authEncBroadcastMessage.from));
  const share: MPCv2SignatureShareRound1Input = {
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

export async function getSignatureShareRoundTwo(
  userToBitGoMessages2: MPSTypes.DeserializedMessages,
  userToBitGoMessages3: MPSTypes.DeserializedMessages,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  partyId: 0 | 1 = 0,
  otherSignerPartyId: 0 | 1 | 2 = 2
): Promise<SignatureShareRecord> {
  const userToBitGoEncryptedMsg2 = await MPSComms.encryptAndAuthOutgoingMessages(
    MPSTypes.serializeMessages(userToBitGoMessages2),
    [getUserPartyGpgKey(userGpgKey, partyId)]
  );

  const userToBitGoEncryptedMsg3 = await MPSComms.encryptAndAuthOutgoingMessages(
    MPSTypes.serializeMessages(userToBitGoMessages3),
    [getUserPartyGpgKey(userGpgKey, partyId)]
  );
  assert(userToBitGoEncryptedMsg2.length, 'User to BitGo messages 2 not present.');
  assert(userToBitGoEncryptedMsg3.length, 'User to BitGo messages 3 not present.');
  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg2[0].from));
  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg3[0].from));
  const share: any = {
    type: 'round2Input',
    data: {
      msg2: {
        from: userToBitGoEncryptedMsg2[0].from,
        encryptedMessage: userToBitGoEncryptedMsg2[0].payload.message,
        signature: userToBitGoEncryptedMsg2[0].payload.signature,
      },
      msg3: {
        from: userToBitGoEncryptedMsg3[0].from,
        encryptedMessage: userToBitGoEncryptedMsg3[0].payload.message,
        signature: userToBitGoEncryptedMsg3[0].payload.signature,
      },
    },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}

export async function getSignatureShareRoundThree(
  userToBitGoMessages4: MPSTypes.DeserializedMessages,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  partyId: 0 | 1 = 0,
  otherSignerPartyId: 0 | 1 | 2 = 2
): Promise<SignatureShareRecord> {
  const userToBitGoEncryptedMsg4 = await MPSComms.encryptAndAuthOutgoingMessages(
    MPSTypes.serializeMessages(userToBitGoMessages4),
    [getUserPartyGpgKey(userGpgKey, partyId)]
  );
  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg4[0].from));
  const share: any = {
    type: 'round3Input',
    data: {
      msg4: {
        from: userToBitGoEncryptedMsg4[0].from,
        message: userToBitGoEncryptedMsg4[0].payload.message,
        signature: userToBitGoEncryptedMsg4[0].payload.signature,
      },
    },
  };
  return {
    from: partyIdToSignatureShareType(partyId),
    to: partyIdToSignatureShareType(otherSignerPartyId),
    share: JSON.stringify(share),
  };
}

export async function verifyBitGoMessagesAndSignaturesRoundOne(
  parsedSignatureShare: any,
  bitgoGpgKey: openpgp.Key
): Promise<MPSTypes.SerializedMessages> {
  return await MPSComms.decryptAndVerifyIncomingMessages(
    [
      {
        from: parsedSignatureShare.data.msg1.from,
        payload: {
          message: parsedSignatureShare.data.msg1.message,
          signature: parsedSignatureShare.data.msg1.signature,
        },
      },
      {
        from: parsedSignatureShare.data.msg2.from,
        payload: {
          message: parsedSignatureShare.data.msg2.message,
          signature: parsedSignatureShare.data.msg2.signature,
        },
      },
    ],
    [getBitGoPartyGpgKey(bitgoGpgKey)]
  );
}

export async function verifyBitGoMessagesAndSignaturesRoundTwo(
  parsedSignatureShare: any,
  bitgoGpgKey: openpgp.Key
): Promise<MPSTypes.SerializedMessages> {
  return await MPSComms.decryptAndVerifyIncomingMessages(
    [
      {
        from: parsedSignatureShare.data.msg3.from,
        payload: {
          message: parsedSignatureShare.data.msg3.message,
          signature: parsedSignatureShare.data.msg3.signature,
        },
      },
    ],
    [getBitGoPartyGpgKey(bitgoGpgKey)]
  );
}

export function getBitGoPartyGpgKey(key: openpgp.Key, partyId: 0 | 1 | 2 = 2): DklsTypes.PartyGpgKey {
  return {
    partyId: partyId,
    gpgKey: key.armor(),
  };
}

export function getUserPartyGpgKey(key: openpgp.SerializedKeyPair<string>, partyId: 0 | 1 = 0): DklsTypes.PartyGpgKey {
  return {
    partyId: partyId,
    gpgKey: key.privateKey,
  };
}
