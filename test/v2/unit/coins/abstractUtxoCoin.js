const should = require('should');
const co = require('bluebird').coroutine;
const sinon = require('sinon');
const recoveryNocks = require('../../lib/recovery-nocks');
const fixtures = require('../../fixtures/abstractUtxoCoin.js');
const TestBitGo = require('../../../lib/test_bitgo');
const nock = require('nock');
const utxoLib = require('bitgo-utxo-lib');
const errors = require('../../../../src/errors');

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

    it('should accept a custom change address', co(function *() {

      const changeAddress = '33a9a4TTT47i2VSpNZA3YT7v3sKYaZFAYz';
      const outputAmount = 10000;
      const recipients = [];

      sinon.stub(coin, 'explainTransaction')
        .returns({
          outputs: [],
          changeOutputs: [{
            address: changeAddress,
            amount: outputAmount
          }]
        });

      const parsedTransaction = yield coin.parseTransaction({ txParams: { changeAddress, recipients }, txPrebuild: {}, wallet, verification });

      should.exist(parsedTransaction.outputs[0]);
      parsedTransaction.outputs[0].should.deepEqual({
        address: changeAddress,
        amount: outputAmount,
        external: false
      });

      coin.explainTransaction.restore();
    }));


  });

  describe('Recover Wallet:', () => {

    let coin, bitgo;

    before(() => {
      bitgo = new TestBitGo({ env: 'mock' });
      coin = bitgo.coin('tbtc');
    });

    // Note: when running this test we expect to see a message in the console: "Could not verify recovery transaction Nock..... "url": ... /decodetx ... etc"
    // This is expected. We are deliberately *not* nocking this decodeTx api call because it would be overwriting the transaction we just made
    // and we want to make sure the code is constructing the transaction properly
    // The transaction we create in this test was originally in a BitGo testnet wallet, and contains two unspents: one is segwit, one is non-segwit
    // On the first time running the test, we did not nock any external api calls
    // After building this test, the testnet transaction was broadcast successfully
    // The external api calls have now been replaced with nocks based on what they used to return, and the constructed transaction has been saved as "expectedTxHex"
    it('should construct a recovery transaction with segwit unspents', co(function *() {

      const { params, expectedTxHex } = fixtures.recoverBtcSegwitFixtures();
      recoveryNocks.nockBtcSegwitRecovery();
      const tx = yield coin.recover(params);
      const transaction = utxoLib.Transaction.fromHex(tx.transactionHex);
      transaction.ins.length.should.equal(2);
      transaction.outs.length.should.equal(1);
      transaction.outs[0].value.should.equal(57184);
      tx.transactionHex.should.equal(expectedTxHex);

    }));

    after(function() {
      nock.cleanAll();
    });

  });
});
