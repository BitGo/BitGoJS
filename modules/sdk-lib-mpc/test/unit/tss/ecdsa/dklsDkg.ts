import assert from 'assert';
import { DklsDkg, DklsTypes } from '../../../../src/tss/ecdsa-dkls';
import { isRight } from 'fp-ts/Either';
import {
  decryptAndVerifyIncomingMessages,
  encryptAndAuthOutgoingMessages,
} from '../../../../src/tss/ecdsa-dkls/commsLayer';
import {
  deserializeMessages,
  PartyGpgKey,
  ReducedKeyShareType,
  RetrofitData,
  serializeMessages,
} from '../../../../src/tss/ecdsa-dkls/types';
import * as fixtures from './fixtures/mpcv1shares';
import * as openpgp from 'openpgp';
import { decode } from 'cbor-x';
import { generate2of2KeyShares, generateDKGKeyShares } from '../../../../src/tss/ecdsa-dkls/util';

describe('DKLS Dkg 2x3', function () {
  it(`should create key shares`, async function () {
    const [user, backup, bitgo] = await generateDKGKeyShares();
    const userKeyShare = user.getKeyShare();
    const backupKeyShare = backup.getKeyShare();
    const bitgoKeyShare = bitgo.getKeyShare();
    const userReducedKeyShare = user.getReducedKeyShare();
    const decodeReducedKeyshare = ReducedKeyShareType.decode(decode(userReducedKeyShare));
    assert(isRight(decodeReducedKeyshare));
    assert.deepEqual(decode(userKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(decode(backupKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(DklsTypes.getCommonKeychain(userKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
    assert.deepEqual(DklsTypes.getCommonKeychain(backupKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
  });

  it(`should create key shares with seed`, async function () {
    const seedUser = Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex');
    const seedBackup = Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex');
    const seedBitgo = Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex');
    const [user, backup, bitgo] = await generateDKGKeyShares(
      undefined,
      undefined,
      undefined,
      seedUser,
      seedBackup,
      seedBitgo
    );
    const userKeyShare = user.getKeyShare();
    const backupKeyShare = backup.getKeyShare();
    const bitgoKeyShare = bitgo.getKeyShare();
    const userReducedKeyShare = user.getReducedKeyShare();
    const decodeReducedKeyshare = ReducedKeyShareType.decode(decode(userReducedKeyShare));
    assert(isRight(decodeReducedKeyshare));
    // Seed is used so public key is the same every time.
    assert.deepEqual(
      Buffer.from(decode(userKeyShare).public_key).toString('hex'),
      '0207a4047c116a239b6d354cb957f190e32ee9f899ea4e289a0317fbc54438e0a2'
    );
    assert.deepEqual(decode(userKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(decode(backupKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(DklsTypes.getCommonKeychain(userKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
    assert.deepEqual(DklsTypes.getCommonKeychain(backupKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
  });

  it(`should create retrofit MPCV1 shares`, async function () {
    const aKeyCombine = {
      xShare: fixtures.mockDKeyShare.xShare,
    };
    const bKeyCombine = {
      xShare: fixtures.mockEKeyShare.xShare,
    };
    const cKeyCombine = {
      xShare: fixtures.mockFKeyShare.xShare,
    };
    const retrofitDataA: RetrofitData = {
      xShare: aKeyCombine.xShare,
    };
    const retrofitDataB: RetrofitData = {
      xShare: bKeyCombine.xShare,
    };
    const retrofitDataC: RetrofitData = {
      xShare: cKeyCombine.xShare,
    };
    const [user, backup, bitgo] = await generateDKGKeyShares(retrofitDataA, retrofitDataB, retrofitDataC);

    const userKeyShare = user.getKeyShare();
    const backupKeyShare = backup.getKeyShare();
    const bitgoKeyShare = bitgo.getKeyShare();
    assert.deepEqual(decode(userKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(decode(backupKeyShare).public_key, decode(bitgoKeyShare).public_key);
    assert.deepEqual(DklsTypes.getCommonKeychain(userKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
    assert.deepEqual(DklsTypes.getCommonKeychain(backupKeyShare), DklsTypes.getCommonKeychain(bitgoKeyShare));
    assert.deepEqual(aKeyCombine.xShare.y, Buffer.from(decode(userKeyShare).public_key).toString('hex'));
  });

  it(`should create retrofit MPCV1 shares with only 2 parties`, async function () {
    const aKeyCombine = {
      xShare: fixtures.mockDKeyShare.xShare,
    };
    const bKeyCombine = {
      xShare: fixtures.mockEKeyShare.xShare,
    };
    const retrofitDataA: RetrofitData = {
      xShare: aKeyCombine.xShare,
    };
    const retrofitDataB: RetrofitData = {
      xShare: bKeyCombine.xShare,
    };
    const [user, backup] = await generate2of2KeyShares(retrofitDataA, retrofitDataB);
    const userKeyShare = user.getKeyShare();
    const backupKeyShare = backup.getKeyShare();
    assert.deepEqual(aKeyCombine.xShare.y, Buffer.from(decode(userKeyShare).public_key).toString('hex'));
    assert.deepEqual(bKeyCombine.xShare.y, Buffer.from(decode(backupKeyShare).public_key).toString('hex'));
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
      [bitgoGpgPubKey],
      [userGpgPrvKey, backupGpgPrvKey]
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
