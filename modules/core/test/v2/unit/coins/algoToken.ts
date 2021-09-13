import 'should';

import { TestBitGo } from '../../../lib/test_bitgo';

describe('Algo Unison Token:', function () {
  let bitgo;
  let algoTokenCoin;
  const tokenName = 'talgo:16026728';

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    algoTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    algoTokenCoin.getChain().should.equal('talgo:16026728');
    algoTokenCoin.getBaseChain().should.equal('talgo');
    algoTokenCoin.getFullName().should.equal('Algo Token');
    algoTokenCoin.type.should.equal(tokenName);
    algoTokenCoin.name.should.equal('Unison');
    algoTokenCoin.coin.should.equal('talgo');
    algoTokenCoin.network.should.equal('Testnet');
    algoTokenCoin.decimalPlaces.should.equal(2);
  });
}); 