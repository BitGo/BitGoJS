import 'should';

import { TestBitGo } from '../../../lib/test_bitgo';

describe('EOS Token:', function () {
  let bitgo;
  let eosTokenCoin;
  const tokenName = 'teos:CHEX';

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    eosTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    eosTokenCoin.getChain().should.equal(tokenName);
    eosTokenCoin.getBaseChain().should.equal('teos');
    eosTokenCoin.getBaseFactor().should.equal(1e8);
    eosTokenCoin.getFullName().should.equal('EOS Token');
    eosTokenCoin.coin.should.equal('teos');
    eosTokenCoin.decimalPlaces.should.equal(8);
    eosTokenCoin.tokenContractAddress.should.equal('testtoken111');
  });
});
