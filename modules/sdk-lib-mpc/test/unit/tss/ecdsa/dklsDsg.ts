import { DklsDsg } from '../../../../src/tss/ecdsa-dkls';
import * as fs from 'fs';
import * as crypto from 'crypto';
import should from 'should';
import { Keyshare } from '@silencelaboratories/dkls-wasm-ll-node';
import { decode } from 'cbor';
import { Secp256k1Bip32HdTree, bigIntFromBufferBE, bigIntToBufferBE } from '../../../../src';

import * as secp256k1 from 'secp256k1';

describe('DKLS Dsg 2x3', function () {
  const vectors = [
    {
      party1: 0,
      party2: 1,
      msgToSign: 'ffff',
      derivationPath: 'm',
    },
    {
      party1: 0,
      party2: 2,
      msgToSign: 'ffff',
      derivationPath: 'm/0',
    },
    {
      party1: 1,
      party2: 2,
      msgToSign: 'ffff',
      derivationPath: 'm/0/0/0',
    },
    {
      party1: 1,
      party2: 2,
      msgToSign: 'ffff',
      derivationPath: 'm/0/9/10',
    },
  ];
  // To generate the fixtures, run DKG as in the dklsDkg.ts tests and save the resulting party.getKeyShare in a file by doing fs.writeSync(party.getKeyShare()).
  const shareFiles = [
    `${__dirname}/fixtures/userShare`,
    `${__dirname}/fixtures/backupShare`,
    `${__dirname}/fixtures/bitgoShare`,
  ];
  vectors.forEach(async function (vector) {
    it(`should create signatures for parties ${vector.party1} and ${vector.party2} with derivation`, async function () {
      const party1 = new DklsDsg.Dsg(
        fs.readFileSync(shareFiles[vector.party1]),
        vector.party1,
        vector.derivationPath,
        crypto.createHash('sha256').update(Buffer.from(vector.msgToSign, 'hex')).digest()
      );
      const party2 = new DklsDsg.Dsg(
        fs.readFileSync(shareFiles[vector.party2]),
        vector.party2,
        vector.derivationPath,
        crypto.createHash('sha256').update(Buffer.from(vector.msgToSign, 'hex')).digest()
      );
      // Round 1 ////
      const party1Round1Message = await party1.init();
      const party2Round1Message = await party2.init();
      const party2Round2Messages = party2.handleIncomingMessages({
        p2pMessages: [],
        broadcastMessages: [party1Round1Message],
      });
      // ////////////
      // Round 2
      const party1Round2Messages = party1.handleIncomingMessages({
        p2pMessages: [],
        broadcastMessages: [party2Round1Message],
      });
      const party1Round3Messages = party1.handleIncomingMessages({
        p2pMessages: party2Round2Messages.p2pMessages,
        broadcastMessages: [],
      });
      const party2Round3Messages = party2.handleIncomingMessages({
        p2pMessages: party1Round2Messages.p2pMessages,
        broadcastMessages: [],
      });
      const party2Round4Messages = party2.handleIncomingMessages({
        p2pMessages: party1Round3Messages.p2pMessages,
        broadcastMessages: [],
      });
      // ////////////
      // / Produce Signature
      const party1Round4Messages = party1.handleIncomingMessages({
        p2pMessages: party2Round3Messages.p2pMessages,
        broadcastMessages: [],
      });
      party1.handleIncomingMessages({
        p2pMessages: [],
        broadcastMessages: party2Round4Messages.broadcastMessages,
      });
      should.exist(party1.signature);
      // ////////////
      party2.handleIncomingMessages({
        p2pMessages: [],
        broadcastMessages: party1Round4Messages.broadcastMessages,
      });
      party1.signature.should.deepEqual(party2.signature);
      const keyShare: Keyshare = Keyshare.fromBytes(fs.readFileSync(shareFiles[vector.party1]));
      const pk = bigIntFromBufferBE(Buffer.from(keyShare.publicKey));
      const chaincode = bigIntFromBufferBE(Buffer.from(decode(keyShare.toBytes()).root_chain_code));
      const hdTree = new Secp256k1Bip32HdTree();
      const derivedKey = hdTree.publicDerive({ pk: pk, chaincode: chaincode }, vector.derivationPath);
      const pub1 = secp256k1.ecdsaRecover(
        Buffer.concat([party1.signature.R, party1.signature.S]),
        0,
        crypto.createHash('sha256').update(Buffer.from(vector.msgToSign, 'hex')).digest(),
        true
      );
      const pub2 = secp256k1.ecdsaRecover(
        Buffer.concat([party1.signature.R, party1.signature.S]),
        1,
        crypto.createHash('sha256').update(Buffer.from(vector.msgToSign, 'hex')).digest(),
        true
      );
      const derivedPub =
        vector.derivationPath === 'm' ? keyShare.publicKey : new Uint8Array(bigIntToBufferBE(derivedKey.pk));
      (
        (pub1.every((p) => derivedPub.includes(p)) && derivedPub.every((p) => pub1.includes(p))) ||
        (pub2.every((p) => derivedPub.includes(p)) && derivedPub.every((p) => pub2.includes(p)))
      ).should.equal(true);
    });
  });

  it(`should fail when signing two different messages`, async function () {
    const party1 = new DklsDsg.Dsg(
      fs.readFileSync(`${__dirname}/fixtures/userShare`),
      0,
      'm',
      crypto.createHash('sha256').update(Buffer.from('ffff', 'hex')).digest()
    );
    const party2 = new DklsDsg.Dsg(
      fs.readFileSync(`${__dirname}/fixtures/bitgoShare`),
      2,
      'm',
      crypto.createHash('sha256').update(Buffer.from('fffa', 'hex')).digest()
    );
    // Round 1 ////
    const party1Round1Message = await party1.init();
    const party2Round1Message = await party2.init();
    const party2Round2Messages = party2.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [party1Round1Message],
    });
    // ////////////
    // Round 2
    const party1Round2Messages = party1.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [party2Round1Message],
    });
    const party1Round3Messages = party1.handleIncomingMessages({
      p2pMessages: party2Round2Messages.p2pMessages,
      broadcastMessages: [],
    });
    const party2Round3Messages = party2.handleIncomingMessages({
      p2pMessages: party1Round2Messages.p2pMessages,
      broadcastMessages: [],
    });
    const party2Round4Messages = party2.handleIncomingMessages({
      p2pMessages: party1Round3Messages.p2pMessages,
      broadcastMessages: [],
    });
    // ////////////
    // / Produce Signature
    party1.handleIncomingMessages({
      p2pMessages: party2Round3Messages.p2pMessages,
      broadcastMessages: [],
    });
    let err = '';
    try {
      party1.handleIncomingMessages({
        p2pMessages: [],
        broadcastMessages: party2Round4Messages.broadcastMessages,
      });
    } catch (e) {
      err = e;
    }
    err.should.equal('Error while creating messages from party 0, round 5: Error: combine error');
  });
});
