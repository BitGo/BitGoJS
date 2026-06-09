import 'should';
import { generateKeyPairSync } from 'crypto';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';

describe('OFC:', function () {
  let bitgo;
  let ofcCoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();
    ofcCoin = bitgo.coin('ofc');
  });

  it('functions that return constants', function () {
    ofcCoin.getChain().should.equal('ofc');
    ofcCoin.getFullName().should.equal('Offchain');
  });

  it('isValidMofNSetup', function () {
    ofcCoin.isValidMofNSetup({ m: 2, n: 3 }).should.be.false();
    ofcCoin.isValidMofNSetup({ m: 1, n: 3 }).should.be.false();
    ofcCoin.isValidMofNSetup({ m: 1, n: 1 }).should.be.true();
  });

  describe('isValidPub', () => {
    it('accepts a BIP-32 xpub (user key)', () => {
      const { pub } = ofcCoin.keychains().create();
      ofcCoin.isValidPub(pub).should.equal(true);
    });

    it('accepts a base64 SPKI secp256k1 public key (BitGo key)', () => {
      const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
      const spkiBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
      ofcCoin.isValidPub(spkiBase64).should.equal(true);
    });

    it('rejects a BIP-32 xprv (private key)', () => {
      const { prv } = ofcCoin.keychains().create();
      ofcCoin.isValidPub(prv).should.equal(false);
    });

    it('rejects a SPKI public key on the wrong curve (P-256)', () => {
      const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
      const spkiBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
      ofcCoin.isValidPub(spkiBase64).should.equal(false);
    });

    it('rejects garbage base64', () => {
      ofcCoin.isValidPub(Buffer.from('not a key').toString('base64')).should.equal(false);
    });

    it('rejects an empty string', () => {
      ofcCoin.isValidPub('').should.equal(false);
    });

    it('rejects a raw (non-SPKI) secp256k1 hex public key', () => {
      ofcCoin.isValidPub('02' + '11'.repeat(32)).should.equal(false);
    });
  });
});
