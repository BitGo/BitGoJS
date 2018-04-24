const crypto = require('crypto');
require('should');

const TestV2BitGo = require('../../../lib/test_bitgo');

const nock = require('nock');
nock.enableNetConnect();

describe('XLM:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txlm');
  });

  after(function() {
    nock.cleanAll();
  });

  it('should generate a keypair from random seed', function() {
    const keyPair = basecoin.generateKeyPair();
    keyPair.should.have.property('pub');
    keyPair.should.have.property('prv');

    const address = basecoin.getPubFromRaw(keyPair.pub);
    basecoin.isValidAddress(address).should.equal(true);

    const secret = basecoin.getPrvFromRaw(keyPair.prv);
    basecoin.isValidSecret(secret).should.equal(true);
  });

  it('should generate a keypair from seed', function() {
    const seed = crypto.randomBytes(32);
    const keyPair = basecoin.generateKeyPair(seed);
    keyPair.should.have.property('pub');
    keyPair.should.have.property('prv');

    const address = basecoin.getPubFromRaw(keyPair.pub);
    basecoin.isValidAddress(address).should.equal(true);

    const secret = basecoin.getPrvFromRaw(keyPair.prv);
    basecoin.isValidSecret(secret).should.equal(true);

    secret.should.equal(basecoin.getPrvFromRaw(seed));
  });

  it('should validate address', function() {
    basecoin.isValidAddress('GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4').should.equal(true);
    basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2').should.equal(true);
    basecoin.isValidAddress('SBKGCMBY56MHTT4EGE3YJIYL4CPWKSGJ7VDEQF4J3B3YO576KNL7DOYJ').should.equal(false); // private key
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8').should.equal(false); // xrp account
  });

});

