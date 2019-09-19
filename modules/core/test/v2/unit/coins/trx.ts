import * as Promise from 'bluebird';
import * as should from 'should';
import { Trx } from '../../../../src/v2/coins/trx';

const co = Promise.coroutine;
import { TestBitGo } from '../../../lib/test_bitgo';

describe('TRON:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ttrx');
  });

  it('should instantiate the coin', function() {
    const basecoin = bitgo.coin('trx');
    basecoin.should.be.an.instanceof(Trx);
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });
  });
});
