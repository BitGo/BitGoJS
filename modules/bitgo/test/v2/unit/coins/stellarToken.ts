import 'should';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';

describe('Stellar Token:', function () {
  let bitgo;
  let stellarTokenCoin;
  const tokenName = 'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L';

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();
    stellarTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    stellarTokenCoin.getChain().should.equal('txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L');
    stellarTokenCoin.getFullName().should.equal('Stellar Token');
    stellarTokenCoin.getBaseFactor().should.equal(1e7);
    stellarTokenCoin.type.should.equal(tokenName);
    stellarTokenCoin.name.should.equal('BitGo Shield Token');
    stellarTokenCoin.coin.should.equal('txlm');
    stellarTokenCoin.network.should.equal('Testnet');
    stellarTokenCoin.code.should.equal('BST');
    stellarTokenCoin.issuer.should.equal('GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L');
    stellarTokenCoin.decimalPlaces.should.equal(7);
  });
});
