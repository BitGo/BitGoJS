import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BscToken } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Bsc Token:', function () {
  let bitgo: TestBitGoAPI;
  let bscTokenCoin;
  const tokenName = 'tbsc:busd';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    BscToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    bscTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    bscTokenCoin.getChain().should.equal('tbsc:busd');
    bscTokenCoin.getBaseChain().should.equal('tbsc');
    bscTokenCoin.getFullName().should.equal('Bsc Token');
    bscTokenCoin.getBaseFactor().should.equal(1e18);
    bscTokenCoin.type.should.equal(tokenName);
    bscTokenCoin.name.should.equal('Test Binance USD Token');
    bscTokenCoin.coin.should.equal('tbsc');
    bscTokenCoin.network.should.equal('Testnet');
    bscTokenCoin.decimalPlaces.should.equal(18);
  });

  describe('getSignablePayload', function () {
    // Tokens are out of scope for CGD-1083; EthLikeToken intentionally preserves
    // the pre-PR behavior of returning the raw serialized tx bytes rather than
    // the keccak256 hash returned by the parent chain coin.
    it('should return the raw serialized bytes unchanged', async function () {
      const serializedTx =
        '0xf86b808504a817c80082520894eeaf0f05f37891ab4a21208b105a0687d12c5af7880de0b6b3a76400008025a0';
      const payload = await bscTokenCoin.getSignablePayload(serializedTx);
      payload.should.deepEqual(Buffer.from(serializedTx));
    });
  });
});
