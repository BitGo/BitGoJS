import * as nock from 'nock';
import 'should';

// import { AbstractLightningCoin } from '../../src/index';

nock.disableNetConnect();

// const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
// bitgo.safeRegister('abstractLightningCoin', AbstractLightningCoin.createInstance);

describe('Abstract lightning coin', function () {
  // let bitgo;
  // let basecoin;
  //
  // before(function () {
  //   bitgo.initializeTestVars();
  //   basecoin = bitgo.coin('abstractLightningCoin');
  // });
  //
  // after(function () {
  //   nock.pendingMocks().should.be.empty();
  // });
  //
  // it('should instantiate the coin', function () {
  //   const basecoin = bitgo.coin('abstractLightningCoin');
  //   basecoin.should.be.an.instanceof(AbstractLightningCoin);
  // });
  //
  // it('isValidAddress should be correct', function () {
  //   // Add valid addresses for testing
  //   basecoin.isValidAddress('').should.be.True();
  //   basecoin.isValidAddress('').should.be.True();
  //   basecoin.isValidAddress('').should.be.True();
  // });
});
