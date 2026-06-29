import 'should';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';

describe('Stellar Token:', function () {
  let bitgo;
  let stellarTokenCoin;
  const tokenName = 'txlm:BST-GCWHAO4SVB4KX3Q62QZGZUHUH2GSH3OIV7IS7Y3MPQOFGQFGBP6IYCOU';

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();
    stellarTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    stellarTokenCoin.getChain().should.equal('txlm:BST-GCWHAO4SVB4KX3Q62QZGZUHUH2GSH3OIV7IS7Y3MPQOFGQFGBP6IYCOU');
    stellarTokenCoin.getFullName().should.equal('Stellar Token');
    stellarTokenCoin.getBaseFactor().should.equal(1e7);
    stellarTokenCoin.type.should.equal(tokenName);
    stellarTokenCoin.name.should.equal('BitGo Shield Token');
    stellarTokenCoin.coin.should.equal('txlm');
    stellarTokenCoin.network.should.equal('Testnet');
    stellarTokenCoin.code.should.equal('BST');
    stellarTokenCoin.issuer.should.equal('GCWHAO4SVB4KX3Q62QZGZUHUH2GSH3OIV7IS7Y3MPQOFGQFGBP6IYCOU');
    stellarTokenCoin.decimalPlaces.should.equal(7);
  });
});
