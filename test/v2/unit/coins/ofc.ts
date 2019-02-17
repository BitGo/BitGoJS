import 'should';

const TestV2BitGo = require('../../../lib/test_bitgo');

describe('OFC:', function() {
  let bitgo;
  let ofcCoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    ofcCoin = bitgo.coin('ofc');
  });

  it('functions that return constants', function() {
    ofcCoin.getChain().should.equal('ofc');
    ofcCoin.getFullName().should.equal('Offchain');
  });

  it('isValidMofNSetup', function() {
    ofcCoin.isValidMofNSetup({ m: 2, n: 3 }).should.be.false();
    ofcCoin.isValidMofNSetup({ m: 1, n: 3 }).should.be.false();
    ofcCoin.isValidMofNSetup({ m: 1, n: 1 }).should.be.true();
  });

  it('should validate pub key', () => {
    const { pub } = ofcCoin.keychains().create();
    ofcCoin.isValidPub(pub).should.equal(true);
  });
});
