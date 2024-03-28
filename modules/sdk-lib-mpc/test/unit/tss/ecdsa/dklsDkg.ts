import { DklsDkg } from '../../../../src/tss/ecdsa-dkls';
import {
  decryptAndVerifyIncomingMessages,
  encryptAndAuthOutgoingMessages,
} from '../../../../src/tss/ecdsa-dkls/commsLayer';
import { bigIntToBufferBE, Secp256k1Curve } from '../../../../src';
import { Ecdsa } from '@bitgo/sdk-core';
import { PartyGpgKey, deserializeMessages, serializeMessages } from '../../../../src/tss/ecdsa-dkls/types';
import * as openpgp from 'openpgp';
import { decode, encode } from 'cbor-x';

import * as secp256k1 from 'secp256k1';
import { KeygenSession, Keyshare, Message, SignSession } from '@silencelaboratories/dkls-wasm-ll-node';

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
    const MPC = new Ecdsa();
    const sec256k1 = new Secp256k1Curve();
    const [A, B, C] = await Promise.all([MPC.keyShare(1, 2, 3), MPC.keyShare(2, 2, 3), MPC.keyShare(3, 2, 3)]);
    const aKeyCombine = MPC.keyCombine(A.pShare, [B.nShares[1], C.nShares[1]]);
    const bKeyCombine = MPC.keyCombine(B.pShare, [A.nShares[2], C.nShares[2]]);
    const cKeyCombine = MPC.keyCombine(C.pShare, [A.nShares[3], B.nShares[3]]);
    const x_i_list = [new Array(32).fill(0), new Array(32).fill(0), new Array(32).fill(0)];
    x_i_list[0][31] = 1;
    x_i_list[1][31] = 2;
    x_i_list[2][31] = 3;
    const aPub = bigIntToBufferBE(sec256k1.basePointMult(BigInt('0x' + aKeyCombine.xShare.x)));
    const bPub = bigIntToBufferBE(sec256k1.basePointMult(BigInt('0x' + bKeyCombine.xShare.x)));
    const cPub = bigIntToBufferBE(sec256k1.basePointMult(BigInt('0x' + cKeyCombine.xShare.x)));
    const keyShare = backup.getKeyShare();
    const backupKeyShare = decode(keyShare);
    const aKeyShare = {
      total_parties: 3,
      threshold: 2,
      rank_list: [0, 0, 0],
      party_id: 0,
      public_key: Array.from(Buffer.from(aKeyCombine.xShare.y, 'hex')),
      root_chain_code: Array.from(Buffer.from(aKeyCombine.xShare.chaincode, 'hex')),
      final_session_id: Array(32).fill(0),
      seed_ot_receivers: [Array(32832).fill(0), Array(32832).fill(0)],
      seed_ot_senders: [Array(32768).fill(0), Array(32768).fill(0)],
      sent_seed_list: [Array(32).fill(0)],
      rec_seed_list: [Array(32).fill(0)],
      s_i: Array.from(Buffer.from(aKeyCombine.xShare.x, 'hex')),
      big_s_list: [Array.from(aPub), Array.from(bPub), Array.from(cPub)],
      x_i_list: x_i_list,
    };
    const bKeyShare = {
      total_parties: 3,
      threshold: 2,
      rank_list: [0, 0, 0],
      party_id: 1,
      public_key: Array.from(Buffer.from(bKeyCombine.xShare.y, 'hex')),
      root_chain_code: Array.from(Buffer.from(bKeyCombine.xShare.chaincode, 'hex')),
      final_session_id: Array(32).fill(0),
      seed_ot_receivers: [Array(32832).fill(0), Array(32832).fill(0)],
      seed_ot_senders: [Array(32768).fill(0), Array(32768).fill(0)],
      sent_seed_list: [Array(32).fill(0)],
      rec_seed_list: [Array(32).fill(0)],
      s_i: Array.from(Buffer.from(bKeyCombine.xShare.x, 'hex')),
      big_s_list: [Array.from(aPub), Array.from(bPub), Array.from(cPub)],
      x_i_list: x_i_list,
    };
    const cKeyShare = {
      total_parties: 3,
      threshold: 2,
      rank_list: [0, 0, 0],
      party_id: 2,
      public_key: Array.from(Buffer.from(cKeyCombine.xShare.y, 'hex')),
      root_chain_code: Array.from(Buffer.from(cKeyCombine.xShare.chaincode, 'hex')),
      final_session_id: Array(32).fill(0),
      seed_ot_receivers: [Array(32832).fill(0), Array(32832).fill(0)],
      seed_ot_senders: [Array(32768).fill(0), Array(32768).fill(0)],
      sent_seed_list: [Array(32).fill(0)],
      rec_seed_list: [Array(32).fill(0)],
      s_i: Array.from(Buffer.from(cKeyCombine.xShare.x, 'hex')),
      big_s_list: [Array.from(aPub), Array.from(bPub), Array.from(cPub)],
      x_i_list: x_i_list,
    };
    console.log(backupKeyShare.public_key);
    const sLAKeyShare = Keyshare.fromBytes(encode(aKeyShare));
    const sLBKeyShare = Keyshare.fromBytes(encode(bKeyShare));
    const sLCKeyShare = Keyshare.fromBytes(encode(cKeyShare));
    console.log(sLAKeyShare.publicKey);
    console.log(sLBKeyShare.publicKey);
    console.log(sLCKeyShare.publicKey);

    function key_rotation(oldshares: Keyshare[]) {
      return oldshares.map((p) => KeygenSession.initKeyRotation(p));
    }

    function filterMessages(msgs: Message[], party: number): Message[] {
      return msgs.filter((m) => m.from_id != party).map((m) => m.clone());
    }

    function selectMessages(msgs: Message[], party: number): Message[] {
      return msgs.filter((m) => m.to_id == party).map((m) => m.clone());
    }

    function dkg_inner(parties: KeygenSession[]): Keyshare[] {
      const msg1: Message[] = parties.map((p) => p.createFirstMessage());
      const msg2: Message[] = parties.flatMap((p, pid) => p.handleMessages(filterMessages(msg1, pid)));

      // after handling batch msg1, all parties calculate final session id,
      // and not we have to calculate commitments for chain_code_sid
      const commitments = parties.map((p) => p.calculateChainCodeCommitment());

      const msg3: Message[] = parties.flatMap((p, pid) => p.handleMessages(selectMessages(msg2, pid)));
      const msg4: Message[] = parties.flatMap((p, pid) => p.handleMessages(selectMessages(msg3, pid), commitments));

      parties.flatMap((p, pid) => p.handleMessages(filterMessages(msg4, pid)));

      return parties.map((p) => p.keyshare()); // deallocates session object
    }
    const shares = [sLAKeyShare, sLBKeyShare, sLCKeyShare];
    const rotation_parties = key_rotation(shares);
    const new_shares = dkg_inner(rotation_parties);

    new_shares.forEach((s, i) => s.finishKeyRotation(shares[i]));
    function dsg(shares: Keyshare[], t: number, messageHash: Uint8Array) {
      const parties: SignSession[] = [];

      // for simplicity we always use the first T shares.
      for (let i = 0; i < t; i++) {
        parties.push(new SignSession(shares[i], 'm'));
      }

      const msg1: Message[] = parties.map((p) => p.createFirstMessage());
      const msg2: Message[] = parties.flatMap((p, pid) => p.handleMessages(filterMessages(msg1, pid)));
      const msg3: Message[] = parties.flatMap((p, pid) => p.handleMessages(selectMessages(msg2, pid)));

      parties.flatMap((p, pid) => p.handleMessages(selectMessages(msg3, pid)));

      const msg4: Message[] = parties.map((p) => p.lastMessage(messageHash));

      const signs = parties.map((p, pid) => p.combine(filterMessages(msg4, pid)));

      return signs;
    }
    const messageHash = new Uint8Array(32);
    const sig = dsg(new_shares, 2, messageHash);
    const pub1 = secp256k1.ecdsaRecover(
      Buffer.concat([Buffer.from(sig[0][0]), Buffer.from(sig[0][1])]),
      0,
      messageHash,
      true
    );
    const pub2 = secp256k1.ecdsaRecover(
      Buffer.concat([Buffer.from(sig[0][0]), Buffer.from(sig[0][1])]),
      1,
      messageHash,
      true
    );
    console.log(pub1);
    console.log(pub2);
    (
      (pub1.every((p) => Buffer.from(aKeyCombine.xShare.y, 'hex').includes(p)) &&
        Buffer.from(aKeyCombine.xShare.y, 'hex').every((p) => pub1.includes(p))) ||
      (pub2.every((p) => Buffer.from(aKeyCombine.xShare.y, 'hex').includes(p)) &&
        Buffer.from(aKeyCombine.xShare.y, 'hex').every((p) => pub2.includes(p)))
    ).should.equal(true);
    decode(user.getKeyShare()).public_key.should.deepEqual(backupKeyShare.public_key);
    decode(bitgo.getKeyShare()).public_key.should.deepEqual(backupKeyShare.public_key);
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
  });
});
