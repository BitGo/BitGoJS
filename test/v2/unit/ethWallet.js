
const Promise = require('bluebird');
const co = Promise.coroutine;
require('should');
const TestV2BitGo = require('../../lib/test_bitgo');
const sinon = require('sinon');
const Util = require('../../../src/util');
const fixtures = require('../fixtures/eth.js');
const EthTx = require('ethereumjs-tx');

describe('Sign ETH Transaction', co(function *() {

  let bitgo;
  let ethWallet;
  let recipients;
  let tx;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    const coin = bitgo.coin('teth');
    ethWallet = coin.newWalletObject(bitgo, coin, {});
    recipients = [{
      address: '0xe59dfe5c67114b39a5662cc856be536c614124c0',
      amount: '100000'
    }];
    tx = { recipients, nextContractSequenceId: 0 };
  }));

  it('should read transaction recipients from txPrebuild even if none are specified as top-level params', co(function *() {
    sinon.stub(Util, 'xprvToEthPrivateKey');
    sinon.stub(Util, 'ethSignMsgHash');
    sinon.stub(ethWallet.getOperationSha3ForExecuteAndConfirm);
    const { halfSigned } = yield ethWallet.signTransaction({ txPrebuild: tx, prv: 'my_user_prv' });
    halfSigned.should.have.property('recipients', recipients);
    sinon.restore();
  }));

  it('should throw an error if no recipients are in the txPrebuild and none are specified as params', co(function *() {
    yield ethWallet.signTransaction({ txPrebuild: {}, prv: 'my_user_prv' }).should.be.rejectedWith('recipients missing or not array');
  }));

  it('should throw an error if the recipients param is not an array', co(function *() {
    yield ethWallet.signTransaction({ txPrebuild: { recipients: 'not-array' }, prv: 'my_user_prv' }).should.be.rejectedWith('recipients missing or not array');
  }));

}));

describe('Add final signature to ETH tx from offline vault', function() {

  let paramsFromVault, expectedResult, bitgo, coin;
  before(function() {
    const vals = fixtures.getHalfSignedTethFromVault();
    paramsFromVault = vals.paramsFromVault;
    expectedResult = vals.expectedResult;
    bitgo = new TestV2BitGo({ env: 'test' });
    coin = bitgo.coin('teth');
  });

  it('should successfully fully sign a half-signed transaction from the offline vault', function() {
    const response = coin.signTransaction(paramsFromVault);
    const expectedTx = new EthTx(expectedResult.txHex);
    const actualTx = new EthTx(response.txHex);
    actualTx.nonce.should.deepEqual(expectedTx.nonce);
    actualTx.to.should.deepEqual(expectedTx.to);
    actualTx.value.should.deepEqual(expectedTx.value);
    actualTx.data.should.deepEqual(expectedTx.data);
    actualTx.v.should.deepEqual(expectedTx.v);
    actualTx.r.should.deepEqual(expectedTx.r);
    actualTx.s.should.deepEqual(expectedTx.s);
    actualTx.gasPrice.should.deepEqual(expectedTx.gasPrice);
    actualTx.gasLimit.should.deepEqual(expectedTx.gasLimit);
    response.txHex.should.equal(expectedResult.txHex);
  });
});
