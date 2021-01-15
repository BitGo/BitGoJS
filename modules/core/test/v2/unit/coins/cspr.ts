import * as Promise from 'bluebird';
const co = Promise.coroutine;

import { TestBitGo } from '../../../lib/test_bitgo';
import { Tcspr } from '../../../../src/v2/coins';
import { Cspr } from '../../../../src/v2/coins';

describe('Casper', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo = new TestBitGo({
      env: 'mock'
    });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tcspr');
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tcspr');
    localBasecoin.should.be.an.instanceof(Tcspr);

    localBasecoin = bitgo.coin('cspr');
    localBasecoin.should.be.an.instanceof(Cspr);
  });

  it('should return tcspr', function () {
    basecoin.getChain().should.equal('tcspr');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Casper');
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
    });

    it('should generate a keypair from a seed', function () {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.pub.should.equal('xpub661MyMwAqRbcFnJi3mvSpYNYyXUcjq7spqHg9GhpcWqs3wF4S8forUeJ3K8XfpUumpY4mLhaGPWAxAJETCnJM56w5f25g6kvLh5Bxb3ZEbD');
      keyPair.prv.should.equal('xprv9s21ZrQH143K3JEEwkPSTQRpRVe8LNQ2TcN5LtJD4BJtB8uutbMZJgKpC3EPHMPGn97Y9aXFYeFegFsPdZXu6BF5XB7yXhZDUE5d6keTHyV');
    });

    it('should validate a public key', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should validate a private key', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPrv(keyPair.prv).should.equal(true);
    });

    it('Should supplement wallet generation', co(function *() {
      const details = yield basecoin.supplementGenerateWallet({});
      details.should.have.property('rootPrivateKey');
      basecoin.isValidPrv(details.rootPrivateKey).should.equal(true);
    }));

    it('Should supplement wallet generation with provided private key', co(function *() {
      const rootPrivateKey = 'e0c5c347fc67a46aa5104ece454882315fe5d70af286dbd3d2e04227ebd2927d';
      const details = yield basecoin.supplementGenerateWallet({ rootPrivateKey });
      details.should.have.property('rootPrivateKey');
      details.rootPrivateKey.should.equal(rootPrivateKey);
    }));
  });
});
