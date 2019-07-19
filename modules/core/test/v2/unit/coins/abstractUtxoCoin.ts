import * as should from 'should';
import  { coroutine as co } from 'bluebird';
const sinon = require('sinon');
const recoveryNocks = require('../../lib/recovery-nocks');
const fixtures = require('../../fixtures/abstractUtxoCoin.ts');
const TestBitGo = require('../../../lib/test_bitgo');
const nock = require('nock');
const utxoLib = require('bitgo-utxo-lib');
import errors = require('../../../../src/errors');

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
      sinon.stub(coin, 'explainTransaction').resolves({
        outputs: [],
        changeOutputs: [{
          address: wallet._wallet.migratedFrom,
          amount: outputAmount
        }]
      });

      sinon.stub(coin, 'verifyAddress').throws(new errors.UnexpectedAddressError('test error'));


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
      sinon.stub(coin, 'explainTransaction').resolves({
        outputs: [{
          address: externalAddress,
          amount: outputAmount
        }],
        changeOutputs: []
      });

      sinon.stub(coin, 'verifyAddress').throws(new errors.UnexpectedAddressError('test error'));

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

      sinon.stub(coin, 'explainTransaction').resolves({
        outputs: [],
        changeOutputs: [
          {
            address: changeAddress,
            amount: outputAmount,
          },
        ],
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
      sinon.stub(coin, 'verifyRecoveryTransaction').resolvesArg(0);
    });

    it('should construct a recovery transaction with segwit unspents', co(function *() {
      const { params, expectedTxHex } = fixtures.recoverBtcSegwitFixtures();
      recoveryNocks.nockBtcSegwitRecovery(bitgo);
      const tx = yield coin.recover(params);
      const transaction = utxoLib.Transaction.fromHex(tx.transactionHex);
      transaction.ins.length.should.equal(2);
      transaction.outs.length.should.equal(1);
      transaction.outs[0].value.should.equal(57112);
      tx.transactionHex.should.equal(expectedTxHex);
    }));

    it('should construct an unsigned recovery transaction for the offline vault', co(function *() {
      const { params, expectedTxHex } = fixtures.recoverBtcUnsignedFixtures();
      recoveryNocks.nockBtcUnsignedRecovery(bitgo);
      const txPrebuild = yield coin.recover(params);
      txPrebuild.txHex.should.equal(expectedTxHex);
      txPrebuild.should.have.property('feeInfo');
      txPrebuild.coin.should.equal('tbtc');
      txPrebuild.txInfo.unspents.length.should.equal(2);
    }));

    after(function() {
      nock.cleanAll();
      coin.verifyRecoveryTransaction.restore();
    });

  });
});
