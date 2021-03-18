import * as Promise from 'bluebird';
import { Stx } from '../../../../src/v2/coins/';

const co = Promise.coroutine;
import { TestBitGo } from '../../../lib/test_bitgo';

describe('STX:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tstx');
  });

  it('should instantiate the coin', function() {
    const basecoin = bitgo.coin('stx');
    basecoin.should.be.an.instanceof(Stx);
  });


  it('should check valid addresses', co(function *() {
    const badAddresses = [
      '',
      null,
      'abc',
      'SP244HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
      'ST1T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY'
    ];
    const goodAddresses = [
      'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
      'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y',
      'SP2T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
      'SP2T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
    ];

    badAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(false); });
    goodAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(true); });
  }));

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should generate a keypair from a seed', function() {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f24bab7dd0c2af7f107416ef858ff79b0670c72406dad064e72bb17fc0a9038bb';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      keyPair.pub.should.equal('040706358b2bf2917d7be11a692681d9e7266e431b2dc124cb15ba6d98501ecab091e6e25ce84278c56e1e264b69df67b3f37e2a7ffe41f3f56a07fb393095d5b1');
      keyPair.prv.should.equal('1f3cd7a858a11eef3e3f591cb5532241ce12c26b588197c88ebb42c6b6cbb5ba');
    });
  });
});
