const should = require('should');
const co = require('bluebird').coroutine;
const sinon = require('sinon');
const recoveryNocks = require('../../lib/recovery-nocks');
const fixtures = require('../../fixtures/abstractUtxoCoin.js');
const TestBitGo = require('../../../lib/test_bitgo');
const nock = require('nock');
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

      const params = fixtures.recoverBtcSegwitFixtures();
      recoveryNocks.nockBtcSegwitRecovery();
      const tx = yield coin.recover(params);
      const expectedTxHex = '01000000000102e0f7fb528646bf0dc3a717a1680fd2b8ca8dfd39f690adcdc194cea8f7cd579a00000000fc004730440220608bd5a8533244185a6b53fc4d466a82bc604980e3a5acad5dfda285651753cc02207ae73febb467eec90968e41d2c158181648bda7bab42ff376cdf890d39a07b5d0147304402200974952d2742a338e2bea84425ada7680939d4d5dec1136dbfdff3dd008e0581022079c8c74c4c18c1b816c01468d112a6cbf3d66186f3a8bf0abbe30d22d6905ecb014c695221038c3ed7682e0999fbbb9f2a06348c9406f20a4c6acfa6015aa0049dae8d846dfc2102bdb5d7ac2a8775dcd8eb31bdea85ec82f6019f9580084dc62e905e741a34e5af2103fb333c62e4a349acecb98d63c307bb3a4cf439c71b3a6dce29ab9cfa65ee2ce153aeffffffff87a38a9b6c0dfab5e787bcaa3fbb2f7033b3198a1c36826c6f76ee53263840800100000023220020d397ea8831c203b211445a981bcbb643f464b826cf3a1226842ce956baf9bcd2ffffffff0160df00000000000017a914c1cf4712d6435cb99851d1e47c3fcef34c8681ed87000400483045022100b3dd92fe9d078a98cdb2b2b59c5d8c78a3fa44e48c54659e5e578215fdffeefb022073b5be09e7b1cab7ad63b6490121d7b6d495a02471a10d71dd4807fde9216ed801483045022100a9f204b05acd968a0054ebfc68a5387b0bb54d47c60eaeb9a650f855f08d2cd502206333ff64198a29bce8cd97a62a5c56fc014b4e60d3ecfdd26f9c2e6f91c2a7bf01695221025e8f5d3dc7e2247a05b7434cd57f985a782d858762ab73bb31f27b4e9cb006cb21036cca9315316b6a54c3b5de33d30d374575c5a30f9b0629e95a37abacf2d878fd2103b7a4d470b12a223518c49d26e2b587c03382ab9c6f7c00e428f8985b57abc2be53ae00000000';
      tx.transactionHex.should.equal(expectedTxHex);

    }));

    after(function() {
      nock.cleanAll();
    });

  });
});
