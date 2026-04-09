import 'should';
import { BaseCoin } from '@bitgo/sdk-core';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';

describe('Virtual Token:', function () {
  let bitgo;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();
  });

  it('should not instantiate coin interface before loading client constants', function () {
    (() => bitgo.coin('mycrappytoken')).should.throw(
      'Coin or token type mycrappytoken not supported or not compiled. Please be sure that you are using the latest version of BitGoJS. If using @bitgo/sdk-api, please confirm you have registered mycrappytoken first.'
    );
  });

  it('should wait for client constants before instantiating coin', async function () {
    const erc = await bitgo.token('terc');
    erc.should.be.instanceOf(BaseCoin);
    erc.type.should.equal('terc');
    erc.tokenContractAddress.should.equal('0x945ac907cf021a6bcd07852bb3b8c087051706a9');
  });
});
