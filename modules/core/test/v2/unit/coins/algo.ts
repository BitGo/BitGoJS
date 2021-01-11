import * as Promise from 'bluebird';
import { randomBytes } from 'crypto';
import * as algosdk from 'algosdk';
import 'should';

const algoFixtures = require('../../fixtures/coins/algo');
const co = Promise.coroutine;
import { Wallet } from '../../../../src/v2/wallet';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as nock from 'nock';

describe('ALGO:', function() {
  let bitgo;
  let basecoin;
  let fixtures;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('talgo');
  });

  after(function() {
    nock.cleanAll();
  });

  it('should have three key ids before signing', function() {
    const keyIds = basecoin.keyIdsForSigning();
    keyIds.length.should.equal(3);
  });

  it('should generate a keypair from seed', function() {
    const seed = randomBytes(32);
    const keyPair = basecoin.generateKeyPair(seed);
    keyPair.should.have.property('pub');
    keyPair.should.have.property('prv');

    const address = keyPair.pub;
    basecoin.isValidAddress(address).should.equal(true);
    basecoin.isValidPub(keyPair.pub).should.equal(true);
    basecoin.isValidPrv(keyPair.prv).should.equal(true);

    // verify regenerated keyPair from seed
    const decodedSeed = algosdk.Seed.decode(keyPair.prv).seed;
    const regeneratedKeyPair = basecoin.generateKeyPair(decodedSeed);

    keyPair.pub.should.equal(regeneratedKeyPair.pub);
    keyPair.prv.should.equal(regeneratedKeyPair.prv);
  });

  it('should validate address', function() {
    const keyPair = basecoin.generateKeyPair();
    basecoin.isValidAddress(keyPair.pub).should.equal(true);
    basecoin.isValidPub(keyPair.pub).should.equal(true);
    basecoin.isValidAddress('UMYEHZ2NNBYX43CU37LMINSHR362FT4GFVWL6V5IHPRCJVPZ46H6CBYLYX').should.equal(false);
  });

  it('should validate seed', function() {
    const keyPair = basecoin.generateKeyPair();
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
    basecoin.isValidPrv('UMYEHZ2NNBYX43CU37LMINSHR362FT4GFVWL6V5IHPRCJVPZ46H6CBYLYX').should.equal(false);
  });

  it('should sign message', co(function *() {
    const keyPair = basecoin.generateKeyPair();
    const message = Buffer.from('message');
    const signature = yield basecoin.signMessage(keyPair, message);
    const pub = algosdk.Address.decode(keyPair.pub).publicKey;
    algosdk.NaclWrapper.verify(message, signature, pub).should.equal(true);
  }));

  it('should validate a stellar seed', function() {
    basecoin.isStellarSeed('SBMWLNV75BPI2VB4G27RWOMABVRTSSF7352CCYGVELZDSHCXWCYFKXIX').should.ok();
  });

  it('should convert a stellar seed to an algo seed', function() {
    const seed = basecoin.convertFromStellarSeed('SBMWLNV75BPI2VB4G27RWOMABVRTSSF7352CCYGVELZDSHCXWCYFKXIX');
    seed.should.equal('LFS3NP7IL2GVIPBWX4NTTAANMM4URP67OQQWBVJC6I4RYV5QWBKUJUZOCE');
  });

  describe('Transaction Verification', function() {
    let basecoin;
    let wallet;

    before(co(function *() {
      basecoin = bitgo.coin('talgo');
      fixtures = algoFixtures.prebuild();
      wallet = new Wallet(bitgo, basecoin, fixtures.walletData);
    }));

    it('should sign a prebuild', co(function *() {
      // sign transaction
      const halfSignedTransaction = yield wallet.signTransaction({
        txPrebuild: {
          txHex: fixtures.buildTxBase64,
          keys: [fixtures.userKeychain.pub, fixtures.backupKeychain.pub, fixtures.bitgoKeychain.pub],
          addressVersion: 1,
        },
        prv: fixtures.userKeychain.prv,
      });

      halfSignedTransaction.halfSigned.txHex.should.equal(fixtures.signedTxBase64);
    }));

    it('should sign an half-signed signed transaction', co(function *() {
      const fullySignedTx = yield wallet.signTransaction({
        txPrebuild: {
          halfSigned: {
            txHex: fixtures.signedTxBase64,
          },
          keys: [fixtures.userKeychain.pub, fixtures.backupKeychain.pub, fixtures.bitgoKeychain.pub],
          addressVersion: 1,
        },
        prv: fixtures.backupKeychain.prv,
      });
      fullySignedTx.txHex.should.equal(fixtures.fullySignBase64);
    }));

    it('should explain an half-signed transaction', co(function *() {
      const explainParams = { halfSigned: { txHex: fixtures.signedTxBase64 } };

      const explanation = yield basecoin.explainTransaction(explainParams);

      explanation.outputs[0].amount.should.equal(1000);
      explanation.outputs[0].address.should.equal(fixtures.txData.to);
      explanation.id.should.equal(fixtures.signedTxId);
    }));

    it('should explain an fully signed transaction', co(function *() {
      const explainParams = { txHex: fixtures.fullySignBase64 };

      const explanation = yield basecoin.explainTransaction(explainParams);

      explanation.outputs[0].amount.should.equal(1000);
      explanation.outputs[0].address.should.equal(fixtures.txData.to);
      explanation.id.should.equal(fixtures.signedTxId);
    }));
  });
});
