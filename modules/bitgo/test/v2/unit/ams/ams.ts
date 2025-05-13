import * as should from 'should';

import { Environments } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo, BitGoOptions } from '../../../../src';
import { reducedAmsTokenConfig } from '../../resources/amsTokenConfig';

describe('Asset metadata service', () => {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
    bitgo.initializeTestVars();
  });

  it('should create a custom coin factory from ams response', async () => {
    bitgo.initCoinFactory(reducedAmsTokenConfig);
    const coin = bitgo.coin('hteth:faketoken');
    should.exist(coin);
    coin.type.should.equal('hteth:faketoken');
    coin.name.should.equal('Holesky Testnet fake token');
    coin.decimalPlaces.should.equal(6);
    coin.tokenContractAddress.should.equal('0x89a959b9184b4f8c8633646d5dfd049d2ebc983a');
  });

  it('should not fetch coin from custom coin factory when useAms is false', async () => {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: false } as any);
    bitgo.initializeTestVars();
    bitgo.initCoinFactory(reducedAmsTokenConfig);
    (() => {
      bitgo.coin('hteth:faketoken');
    }).should.throw(
      'Coin or token type hteth:faketoken not supported or not compiled. Please be sure that you are using the latest version of BitGoJS. If using @bitgo/sdk-api, please confirm you have registered hteth:faketoken first.'
    );
  });
});
