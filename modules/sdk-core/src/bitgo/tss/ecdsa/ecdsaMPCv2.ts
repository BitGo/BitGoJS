import { SignatureShareRecord, SignatureShareType } from '../../utils';
import openpgp from 'openpgp';
import { DklsComms, DklsTypes } from '@bitgo/sdk-lib-mpc';
import {
  MPCv2SignatureShareRound1Input,
  MPCv2SignatureShareRound1Output,
  MPCv2SignatureShareRound2Input,
  MPCv2SignatureShareRound2Output,
  MPCv2SignatureShareRound3Input,
  MPCv2PartyFromStringOrNumber,
} from '@bitgo/public-types';
import assert from 'assert';

/**
 Helpers in this take care of all interaction with WP API's
**/

export async function getSignatureShareRoundOne(
  round1Message: DklsTypes.DeserializedBroadcastMessage,
  userGpgKey: openpgp.SerializedKeyPair<string>
): Promise<SignatureShareRecord> {
  const serializedMessages = DklsTypes.serializeMessages({
    broadcastMessages: [round1Message],
    p2pMessages: [],
  });
  const authEncBroadcastMessage = (
    await DklsComms.encryptAndAuthOutgoingMessages(
      serializedMessages,
      [], // Broadcast message so doesn't need to encrypt to BitGo's GPG key
      [getUserPartyGpgKey(userGpgKey)]
    )
  ).broadcastMessages[0];
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
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: serializedShare,
  };
}

export async function getSignatureShareRoundTwo(
  userToBitGoMessages2: DklsTypes.DeserializedMessages,
  userToBitGoMessages3: DklsTypes.DeserializedMessages,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  bitgoGpgKey: openpgp.Key
): Promise<SignatureShareRecord> {
  const userToBitGoEncryptedMsg2 = await DklsComms.encryptAndAuthOutgoingMessages(
    DklsTypes.serializeMessages(userToBitGoMessages2),
    [getBitGoPartyGpgKey(bitgoGpgKey)],
    [getUserPartyGpgKey(userGpgKey)]
  );

  const userToBitGoEncryptedMsg3 = await DklsComms.encryptAndAuthOutgoingMessages(
    DklsTypes.serializeMessages(userToBitGoMessages3),
    [getBitGoPartyGpgKey(bitgoGpgKey)],
    [getUserPartyGpgKey(userGpgKey)]
  );
  assert(userToBitGoEncryptedMsg2.p2pMessages.length, 'User to BitGo messages 2 not present.');
  assert(userToBitGoEncryptedMsg3.p2pMessages.length, 'User to BitGo messages 3 not present.');
  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg2.p2pMessages[0].from));
  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg2.p2pMessages[0].to));
  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg3.p2pMessages[0].from));
  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg3.p2pMessages[0].to));
  const share: MPCv2SignatureShareRound2Input = {
    type: 'round2Input',
    data: {
      msg2: {
        from: userToBitGoEncryptedMsg2.p2pMessages[0].from,
        to: userToBitGoEncryptedMsg2.p2pMessages[0].to,
        encryptedMessage: userToBitGoEncryptedMsg2.p2pMessages[0].payload.encryptedMessage,
        signature: userToBitGoEncryptedMsg2.p2pMessages[0].payload.signature,
      },
      msg3: {
        from: userToBitGoEncryptedMsg3.p2pMessages[0].from,
        to: userToBitGoEncryptedMsg3.p2pMessages[0].to,
        encryptedMessage: userToBitGoEncryptedMsg3.p2pMessages[0].payload.encryptedMessage,
        signature: userToBitGoEncryptedMsg3.p2pMessages[0].payload.signature,
      },
    },
  };
  return {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: JSON.stringify(share),
  };
}

export async function getSignatureShareRoundThree(
  userToBitGoMessages4: DklsTypes.DeserializedMessages,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  bitgoGpgKey: openpgp.Key
): Promise<SignatureShareRecord> {
  const userToBitGoEncryptedMsg4 = await DklsComms.encryptAndAuthOutgoingMessages(
    DklsTypes.serializeMessages(userToBitGoMessages4),
    [getBitGoPartyGpgKey(bitgoGpgKey)],
    [getUserPartyGpgKey(userGpgKey)]
  );
  assert(MPCv2PartyFromStringOrNumber.is(userToBitGoEncryptedMsg4.broadcastMessages[0].from));
  if (!userToBitGoEncryptedMsg4.broadcastMessages[0].signatureR?.message) {
    throw Error('signatureR should be defined');
  }
  const share: MPCv2SignatureShareRound3Input = {
    type: 'round3Input',
    data: {
      msg4: {
        from: userToBitGoEncryptedMsg4.broadcastMessages[0].from,
        message: userToBitGoEncryptedMsg4.broadcastMessages[0].payload.message,
        signature: userToBitGoEncryptedMsg4.broadcastMessages[0].payload.signature,
        signatureR: userToBitGoEncryptedMsg4.broadcastMessages[0].signatureR.message,
      },
    },
  };
  return {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: JSON.stringify(share),
  };
}

export async function verifyBitGoMessagesAndSignaturesRoundOne(
  parsedSignatureShare: MPCv2SignatureShareRound1Output,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  bitgoGpgKey: openpgp.Key
): Promise<DklsTypes.SerializedMessages> {
  return await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [
        {
          from: parsedSignatureShare.data.msg2.from,
          to: parsedSignatureShare.data.msg2.to,
          payload: {
            encryptedMessage: parsedSignatureShare.data.msg2.encryptedMessage,
            signature: parsedSignatureShare.data.msg2.signature,
          },
        },
      ],
      broadcastMessages: [
        {
          from: parsedSignatureShare.data.msg1.from,
          payload: {
            message: parsedSignatureShare.data.msg1.message,
            signature: parsedSignatureShare.data.msg1.signature,
          },
        },
      ],
    },
    [getBitGoPartyGpgKey(bitgoGpgKey)],
    [getUserPartyGpgKey(userGpgKey)]
  );
}

export async function verifyBitGoMessagesAndSignaturesRoundTwo(
  parsedSignatureShare: MPCv2SignatureShareRound2Output,
  userGpgKey: openpgp.SerializedKeyPair<string>,
  bitgoGpgKey: openpgp.Key
): Promise<DklsTypes.SerializedMessages> {
  return await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [
        {
          from: parsedSignatureShare.data.msg3.from,
          to: parsedSignatureShare.data.msg3.to,
          payload: {
            encryptedMessage: parsedSignatureShare.data.msg3.encryptedMessage,
            signature: parsedSignatureShare.data.msg3.signature,
          },
        },
      ],
      broadcastMessages: [],
    },
    [getBitGoPartyGpgKey(bitgoGpgKey)],
    [getUserPartyGpgKey(userGpgKey)]
  );
}

export function getBitGoPartyGpgKey(key: openpgp.Key): DklsTypes.PartyGpgKey {
  return {
    partyId: 2,
    gpgKey: key.armor(),
  };
}

export function getUserPartyGpgKey(key: openpgp.SerializedKeyPair<string>): DklsTypes.PartyGpgKey {
  return {
    partyId: 0,
    gpgKey: key.privateKey,
  };
}
