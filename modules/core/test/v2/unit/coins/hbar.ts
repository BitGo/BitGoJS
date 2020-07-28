import * as Promise from 'bluebird';
import { Hbar } from '../../../../src/v2/coins/';

const co = Promise.coroutine;
import { TestBitGo } from '../../../lib/test_bitgo';

describe('Hedera Hashgraph:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('thbar');
  });

  it('should instantiate the coin', function() {
    const basecoin = bitgo.coin('hbar');
    basecoin.should.be.an.instanceof(Hbar);
  });

  it('should check valid addresses', co(function *() {
    const badAddresses = ['', '0.0', 'YZ09fd-', '0.0.0.a', 'sadasdfggg', '0.2.a.b'];
    const goodAddresses = ['0', '0.0.0', '0.0.41098'];

    badAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(false); });
    goodAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(true); });
  }));

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      // TODO: add back when validation of the pub is live
      // basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should generate a keypair from a seed', function() {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.prv.should.equal('302e020100300506032b65700422042080350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f');
      keyPair.pub.should.equal('302a300506032b65700321009cc402b5c75214269c2826e3c6119377cab6c367601338661c87a4e07c6e0333');
    });
  });
});
