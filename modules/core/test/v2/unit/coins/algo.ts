import * as crypto from 'crypto';
import * as algosdk from 'algosdk';

const TestV2BitGo = require('../../../lib/test_bitgo');

describe('ALGO:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('talgo');
  });

  it('should generate a keypair from random seed', function() {
    const keyPair = basecoin.generateKeyPair();
    keyPair.should.have.property('pub');
    keyPair.should.have.property('prv');

    const address = keyPair.pub;
    basecoin.isValidAddress(address).should.equal(true);

    basecoin.isValidPub(keyPair.pub).should.equal(true);
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
  });

  it('should generate a keypair from seed', function() {
    const seed = crypto.randomBytes(32);
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

  it('should sign message', function() {
    const keyPair = basecoin.generateKeyPair();
    const message = Buffer.from('message');
    const signature = basecoin.signMessage(keyPair, message);
    const pub = algosdk.Address.decode(keyPair.pub).publicKey;
    algosdk.NaclWrapper.verify(message, signature, pub).should.equal(true);
  });
});
