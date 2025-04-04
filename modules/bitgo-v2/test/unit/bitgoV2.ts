import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoV2 } from '../../src';
import { amsTokenConfig } from '../resources/amsResponse';
import { Erc20Token } from '@bitgo/sdk-coin-eth';

describe('BitGoV2', () => {
  it('should create an instance of BitGoV2 with custom coin factory', () => {
    const BitGo = TestBitGo.decorate(BitGoV2, { env: 'prod' });
    BitGo.initCoinFactory(amsTokenConfig);
    const coin = BitGo.coin('hteth:faketoken') as Erc20Token;
    coin.getFamily().should.equal('eth');
    coin.name.should.equal('Holesky Testnet fake token');
    coin.type.should.equal('hteth:faketoken');
    coin.tokenContractAddress.should.equal(amsTokenConfig['hteth:faketoken'][0].contractAddress);
  });
  it('should register token in coin factory that is present in statics but not in custom token config', () => {
    const BitGo = TestBitGo.decorate(BitGoV2, { env: 'prod' });
    BitGo.initCoinFactory(amsTokenConfig);
    const coin = BitGo.coin('hteth:gousd');
    coin.getFamily().should.equal('eth');
    coin.getFullName().should.equal('ERC20 Token');
  });
});
