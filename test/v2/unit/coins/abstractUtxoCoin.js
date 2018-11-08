const should = require('should');
const co = require('bluebird').coroutine;
const sinon = require('sinon');

const TestBitGo = require('../../../lib/test_bitgo');

const errors = require('../../../../src/v2/errors');

describe('Abstract UTXO Coin:', () => {

  describe('Parse Transaction:', () => {

    let coin;
    let bitgo;

    /*
     * mock objects which get passed into parse transaction.
     * These objects are structured to force parse transaction into a
     * particular execution path for these tests.
     */
    const wallet = {
      _wallet: {
        migratedFrom: 'v1_wallet_base_address'
      }
    };
    const verification = {
      disableNetworking: true,
      keychains: {}
    };

    const outputAmount = 0.01 * 1e8;

    before(() => {
      bitgo = new TestBitGo({ env: 'mock' });
      coin = bitgo.coin('btc');
    });

    it('should classify outputs which spend change back to a v1 wallet base address as internal', co(function *() {
      sinon.stub(coin, 'explainTransaction')
      .returns({
        outputs: [],
        changeOutputs: [{
          address: wallet._wallet.migratedFrom,
          amount: outputAmount
        }]
      });

      sinon.stub(coin, 'verifyAddress')
      .throws(new errors.UnexpectedAddressError('test error'));


      const parsedTransaction = yield coin.parseTransaction({ txParams: {}, txPrebuild: {}, wallet, verification });

      should.exist(parsedTransaction.outputs[0]);
      parsedTransaction.outputs[0].should.deepEqual({
        address: wallet._wallet.migratedFrom,
        amount: outputAmount,
        external: false
      });

      coin.explainTransaction.restore();
      coin.verifyAddress.restore();
    }));

    it('should classify outputs which spend to addresses not on the wallet as external', co(function *() {
      const externalAddress = 'external_address';
      sinon.stub(coin, 'explainTransaction')
      .returns({
        outputs: [{
          address: externalAddress,
          amount: outputAmount
        }],
        changeOutputs: []
      });

      sinon.stub(coin, 'verifyAddress')
      .throws(new errors.UnexpectedAddressError('test error'));

      const parsedTransaction = yield coin.parseTransaction({ txParams: {}, txPrebuild: {}, wallet, verification });

      should.exist(parsedTransaction.outputs[0]);
      parsedTransaction.outputs[0].should.deepEqual({
        address: externalAddress,
        amount: outputAmount,
        external: true
      });

      coin.explainTransaction.restore();
      coin.verifyAddress.restore();
    }));
  });
});
