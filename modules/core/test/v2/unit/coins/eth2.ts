import { TestBitGo } from '../../../lib/test_bitgo';
import { Eth2, Teth2 } from '../../../../src/v2/coins';

describe('Ethereum 2.0', function() {
  let bitgo;
  let basecoin;

  before(async function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('teth2');
  });

  it('should instantiate the coin', function() {
    let localBasecoin = bitgo.coin('teth2');
    localBasecoin.should.be.an.instanceof(Teth2);
    localBasecoin.getChain().should.equal('teth2');
    localBasecoin.getFamily().should.equal('eth2');

    localBasecoin = bitgo.coin('eth2');
    localBasecoin.should.be.an.instanceof(Eth2);
    localBasecoin.getBaseFactor().should.equal('1000000000000000000');
    localBasecoin.getChain().should.equal('eth2');
    localBasecoin.getFamily().should.equal('eth2');
    localBasecoin.getFullName().should.equal('Ethereum 2.0');
  });

  it('validates pre-creation of bitgo key', function() {
    const localBasecoin = bitgo.coin('teth2');
    const params = { enterprise: TestBitGo.TEST_ENTERPRISE };
    localBasecoin.preCreateBitGo(params);
  });

  it('should generate keypair from prv', function() {
    const prv = Uint8Array.from(
      Buffer.from('4fd90ae1b8f724a4902615c09145ae134617c325b98c6970dcf62ab9cc5e12f3', 'hex')
    );
    const localBaseCoin = bitgo.coin('teth2');
    const keyPair = localBaseCoin.generateKeyPair(prv);
    keyPair.pub.should.equal('0x8df1173b7e52aa606aa42c95a4238a4c0a2dd19b9ff373479590482b57525ce2d27a5e62f586df960fb1fc05f361dbb9');
    keyPair.prv.should.equal('0x4fd90ae1b8f724a4902615c09145ae134617c325b98c6970dcf62ab9cc5e12f3');
    localBaseCoin.isValidPub(keyPair.pub).should.be.true();
  });

  it('should generate keypair without seed', function() {
    const localBaseCoin = bitgo.coin('teth2');
    const keyPair = localBaseCoin.generateKeyPair();
    keyPair.pub.length.should.equal(98);
    keyPair.prv.length.should.equal(66);
    (keyPair.pub.startsWith('0x')).should.be.true();
    (keyPair.prv.startsWith('0x')).should.be.true();
    localBaseCoin.isValidPub(keyPair.pub).should.be.true();
  });

  it('should reject keypair generation from an invalid prv', function() {
    const prv = Uint8Array.from(Buffer.from('', 'hex'));
    const localBaseCoin = bitgo.coin('teth2');
    (function() {localBaseCoin.generateKeyPair(prv);}).should.throw();
  });
});
