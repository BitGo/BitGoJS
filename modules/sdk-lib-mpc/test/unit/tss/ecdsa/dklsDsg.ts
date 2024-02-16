import { DklsDsg } from '../../../../src/tss/ecdsa-dkls';
import * as fs from 'fs';
import * as crypto from 'crypto';
import should from 'should';

describe('DKLS Dsg 2x3', function () {
  const vectors = [
    {
      party1: 0,
      party2: 1,
      msgToSign: 'ffff',
    },
    {
      party1: 0,
      party2: 2,
      msgToSign: 'ffff',
    },
    {
      party1: 1,
      party2: 2,
      msgToSign: 'ffff',
    },
  ];
  // To generate the fixtures, run DKG as in the dklsDkg.ts tests and save the resulting party.getKeyShare in a file by doing fs.writeSync(party.getKeyShare()).
  const shareFiles = [
    `${__dirname}/fixtures/userShare`,
    `${__dirname}/fixtures/backupShare`,
    `${__dirname}/fixtures/bitgoShare`,
  ];
  vectors.forEach(async function (vector) {
    it(`should create signatures for parties ${vector.party1} and ${vector.party2}`, async function () {
      const party1 = new DklsDsg.Dsg(
        fs.readFileSync(shareFiles[vector.party1]),
        vector.party1,
        'm',
        crypto.createHash('sha256').update(Buffer.from(vector.msgToSign, 'hex')).digest()
      );
      const party2 = new DklsDsg.Dsg(
        fs.readFileSync(shareFiles[vector.party2]),
        vector.party2,
        'm',
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
