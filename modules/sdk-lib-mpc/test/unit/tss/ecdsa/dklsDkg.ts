import assert from 'assert';
import { DklsDkg, DklsTypes } from '../../../../src/tss/ecdsa-dkls';
import {
  decryptAndVerifyIncomingMessages,
  encryptAndAuthOutgoingMessages,
} from '../../../../src/tss/ecdsa-dkls/commsLayer';
import { PartyGpgKey, deserializeMessages, serializeMessages } from '../../../../src/tss/ecdsa-dkls/types';
import * as openpgp from 'openpgp';
import { decode } from 'cbor';

describe('DKLS Dkg 2x3', function () {
  it(`should create key shares`, async function () {
    const user = new DklsDkg.Dkg(3, 2, 0);
    const backup = new DklsDkg.Dkg(3, 2, 1);
    const bitgo = new DklsDkg.Dkg(3, 2, 2);
    const userRound1Message = await user.initDkg();
    const backupRound1Message = await backup.initDkg();
    const bitgoRound1Message = await bitgo.initDkg();
    const userRound2Messages = user.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [bitgoRound1Message, backupRound1Message],
    });
    const backupRound2Messages = backup.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [userRound1Message, bitgoRound1Message],
    });
    const bitgoRound2Messages = bitgo.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [userRound1Message, backupRound1Message],
    });
    const userRound3Messages = user.handleIncomingMessages({
      p2pMessages: backupRound2Messages.p2pMessages
        .filter((m) => m.to === 0)
        .concat(bitgoRound2Messages.p2pMessages.filter((m) => m.to === 0)),
      broadcastMessages: [],
    });
    const backupRound3Messages = backup.handleIncomingMessages({
      p2pMessages: bitgoRound2Messages.p2pMessages
        .filter((m) => m.to === 1)
        .concat(userRound2Messages.p2pMessages.filter((m) => m.to === 1)),
      broadcastMessages: [],
    });
    const bitgoRound3Messages = bitgo.handleIncomingMessages({
      p2pMessages: backupRound2Messages.p2pMessages
        .filter((m) => m.to === 2)
        .concat(userRound2Messages.p2pMessages.filter((m) => m.to === 2)),
      broadcastMessages: [],
    });
    const userRound4Messages = user.handleIncomingMessages({
      p2pMessages: backupRound3Messages.p2pMessages
        .filter((m) => m.to === 0)
        .concat(bitgoRound3Messages.p2pMessages.filter((m) => m.to === 0)),
      broadcastMessages: [],
    });
    const backupRound4Messages = backup.handleIncomingMessages({
      p2pMessages: bitgoRound3Messages.p2pMessages
        .filter((m) => m.to === 1)
        .concat(userRound3Messages.p2pMessages.filter((m) => m.to === 1)),
      broadcastMessages: [],
    });
    const bitgoRound4Messages = bitgo.handleIncomingMessages({
      p2pMessages: backupRound3Messages.p2pMessages
        .filter((m) => m.to === 2)
        .concat(userRound3Messages.p2pMessages.filter((m) => m.to === 2)),
      broadcastMessages: [],
    });
    user.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: bitgoRound4Messages.broadcastMessages.concat(backupRound4Messages.broadcastMessages),
    });
    bitgo.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: backupRound4Messages.broadcastMessages.concat(userRound4Messages.broadcastMessages),
    });
    backup.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: bitgoRound4Messages.broadcastMessages.concat(userRound4Messages.broadcastMessages),
    });

    const userKeyShare = user.getKeyShare();
    const backupKeyShare = backup.getKeyShare();
    const bitgoKeyShare = bitgo.getKeyShare();
    assert.deepEqual(decode(userKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(decode(backupKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(DklsTypes.getCommonKeychain(userKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
    assert.deepEqual(DklsTypes.getCommonKeychain(backupKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
  });

  it(`should create key shares with authenticated encryption`, async function () {
    const user = new DklsDkg.Dkg(3, 2, 0);
    const backup = new DklsDkg.Dkg(3, 2, 1);
    const bitgo = new DklsDkg.Dkg(3, 2, 2);
    openpgp.config.rejectCurves = new Set();
    const userKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'user',
          email: 'user@username.com',
        },
      ],
      curve: 'secp256k1',
    });
    const bitgoKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@username.com',
        },
      ],
      curve: 'secp256k1',
    });
    const backupKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'backup',
          email: 'backup@username.com',
        },
      ],
      curve: 'secp256k1',
    });
    const userGpgPubKey: PartyGpgKey = {
      partyId: 0,
      gpgKey: userKey.publicKey,
    };
    const userGpgPrvKey: PartyGpgKey = {
      partyId: 0,
      gpgKey: userKey.privateKey,
    };
    const bitgoGpgPubKey: PartyGpgKey = {
      partyId: 2,
      gpgKey: bitgoKey.publicKey,
    };
    const bitgoGpgPrvKey: PartyGpgKey = {
      partyId: 2,
      gpgKey: bitgoKey.privateKey,
    };
    const backupGpgPubKey: PartyGpgKey = {
      partyId: 1,
      gpgKey: backupKey.publicKey,
    };
    const backupGpgPrvKey: PartyGpgKey = {
      partyId: 1,
      gpgKey: backupKey.privateKey,
    };
    const userRound1Message = await user.initDkg();
    const backupRound1Message = await backup.initDkg();
    const bitgoRound1Message = await bitgo.initDkg();
    let serializedMessages = serializeMessages({
      broadcastMessages: [userRound1Message, backupRound1Message],
      p2pMessages: [],
    });
    let authEncMessages = await encryptAndAuthOutgoingMessages(
      serializedMessages,
      [],
      [userGpgPrvKey]
    );
    const userRound2Messages = user.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [bitgoRound1Message, backupRound1Message],
    });
    const backupRound2Messages = backup.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [userRound1Message, bitgoRound1Message],
    });
    const decryptedMessages = await decryptAndVerifyIncomingMessages(
      authEncMessages,
      [userGpgPubKey, backupGpgPubKey],
      [bitgoGpgPrvKey]
    );
    const deserializedDecryptedMessages = deserializeMessages(decryptedMessages);
    const bitgoRound2Messages = bitgo.handleIncomingMessages(deserializedDecryptedMessages);
    const userRound3Messages = user.handleIncomingMessages({
      p2pMessages: backupRound2Messages.p2pMessages
        .filter((m) => m.to === 0)
        .concat(bitgoRound2Messages.p2pMessages.filter((m) => m.to === 0)),
      broadcastMessages: [],
    });
    const backupRound3Messages = backup.handleIncomingMessages({
      p2pMessages: bitgoRound2Messages.p2pMessages
        .filter((m) => m.to === 1)
        .concat(userRound2Messages.p2pMessages.filter((m) => m.to === 1)),
      broadcastMessages: [],
    });
    serializedMessages = serializeMessages({
      broadcastMessages: [],
      p2pMessages: userRound2Messages.p2pMessages
        .filter((m) => m.to === 2)
        .concat(backupRound2Messages.p2pMessages.filter((m) => m.to === 2)),
    });
    authEncMessages = await encryptAndAuthOutgoingMessages(
      serializedMessages,
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
    );
    const bitgoRound3Messages = bitgo.handleIncomingMessages(
      deserializeMessages(
        await decryptAndVerifyIncomingMessages(authEncMessages, [userGpgPubKey, backupGpgPubKey], [bitgoGpgPrvKey])
      )
    );
    const userRound4Messages = user.handleIncomingMessages({
      p2pMessages: backupRound3Messages.p2pMessages
        .filter((m) => m.to === 0)
        .concat(bitgoRound3Messages.p2pMessages.filter((m) => m.to === 0)),
      broadcastMessages: [],
    });
    const backupRound4Messages = backup.handleIncomingMessages({
      p2pMessages: bitgoRound3Messages.p2pMessages
        .filter((m) => m.to === 1)
        .concat(userRound3Messages.p2pMessages.filter((m) => m.to === 1)),
      broadcastMessages: [],
    });
    serializedMessages = serializeMessages({
      broadcastMessages: [],
      p2pMessages: userRound3Messages.p2pMessages
        .filter((m) => m.to === 2)
        .concat(backupRound3Messages.p2pMessages.filter((m) => m.to === 2)),
    });
    authEncMessages = await encryptAndAuthOutgoingMessages(
      serializedMessages,
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
    );
    const bitgoRound4Messages = bitgo.handleIncomingMessages(
      deserializeMessages(
        await decryptAndVerifyIncomingMessages(authEncMessages, [userGpgPubKey, backupGpgPubKey], [bitgoGpgPrvKey])
      )
    );
    user.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: bitgoRound4Messages.broadcastMessages.concat(backupRound4Messages.broadcastMessages),
    });
    serializedMessages = serializeMessages({
      broadcastMessages: backupRound4Messages.broadcastMessages.concat(userRound4Messages.broadcastMessages),
      p2pMessages: [],
    });
    authEncMessages = await encryptAndAuthOutgoingMessages(
      serializedMessages,
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
    );
    bitgo.handleIncomingMessages(
      deserializeMessages(
        await decryptAndVerifyIncomingMessages(authEncMessages, [userGpgPubKey, backupGpgPubKey], [bitgoGpgPrvKey])
      )
    );
    backup.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: bitgoRound4Messages.broadcastMessages.concat(userRound4Messages.broadcastMessages),
    });

    const userKeyShare = user.getKeyShare();
    const backupKeyShare = backup.getKeyShare();
    const bitgoKeyShare = bitgo.getKeyShare();
    assert.deepEqual(decode(userKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(decode(backupKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(DklsTypes.getCommonKeychain(userKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
    assert.deepEqual(DklsTypes.getCommonKeychain(backupKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
  });
});
