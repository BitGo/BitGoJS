import { TestBitGo } from '../../../lib/test_bitgo';
import { Tcspr } from '../../../../src/v2/coins/tcspr';
import { Cspr } from '../../../../src/v2/coins/cspr';

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

      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should generate a keypair from a seed', function () {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.prv.should.equal('2B7A4A75B08922A29566A81CB7C391A7AA4D4664DC210A95EF3FA1AA8ED503AA');
      keyPair.pub.should.equal('029DDE31A73F0D54B029425BE520B8FC6AC7939A5936F83D2B94FC7B7CA61A98F0');
    });
  });
});
