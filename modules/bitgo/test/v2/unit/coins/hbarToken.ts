import 'should';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import { HbarToken } from '../../../../src/v2/coins/hbarToken';

describe('Hedera Hashgraph Token', function () {
  let bitgo;
  let token: HbarToken;
  const tokenName = 'thbar:usdc';

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
    token = bitgo.coin(tokenName);
  });

  it('Return correct configurations', function () {
    token.getChain().should.equal('thbar:usdc');
    token.getFullName().should.equal('Testnet Hedera USD Coin');
    token.getBaseFactor().should.equal(1e6);
    token.type.should.equal('thbar:usdc');
    token.name.should.equal('Testnet Hedera USD Coin');
    token.coin.should.equal('thbar');
    token.network.should.equal('Testnet');
    token.decimalPlaces.should.equal(6);
  });
});
