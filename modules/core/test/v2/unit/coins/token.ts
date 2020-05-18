import * as Bluebird from 'bluebird';
import * as should from 'should';
import { BaseCoin } from '../../../../src/v2/baseCoin';

import { TestBitGo } from '../../../lib/test_bitgo';

describe('Virtual Token:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  it('should not instantiate coin interface before loading client constants', function() {
    (() => bitgo.coin('mycrappytoken')).should.throw('Coin or token type mycrappytoken not supported or not compiled. Please be sure that you are using the latest version of BitGoJS.');
  });

  it('should wait for client constants before instantiating coin', Bluebird.coroutine(function *() {
    const promise = bitgo.token('terc');
    should(promise).be.instanceOf(Bluebird.Promise);
    const erc = yield promise;
    erc.should.be.instanceOf(BaseCoin);
    erc.type.should.equal('terc');
    erc.tokenContractAddress.should.equal('0x945ac907cf021a6bcd07852bb3b8c087051706a9');
  }));

});
