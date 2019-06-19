//
// Tests for Wallets
//

import * as should from 'should';
const sinon = require('sinon');
require('should-sinon');
require('../lib/asserts');
const nock = require('nock');
import * as Promise from 'bluebird';
const co = Promise.coroutine;
import * as _ from 'lodash';
const bitcoin = require('bitgo-utxo-lib');
import { Wallet } from '../../../src/v2/wallet';
const common = require('../../../src/common');

const TestV2BitGo = require('../../lib/test_bitgo');

nock.disableNetConnect();

describe('V2 Wallet:', function() {
  let bitgo;
  let wallet;
  let bgUrl;
  let basecoin;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbtc');
    const walletData = {
      id: '5b34252f1bf349930e34020a',
      coin: 'tbtc',
      keys: [
        '5b3424f91bf349930e340175'
      ]
    };
    wallet = new Wallet(bitgo, basecoin, walletData);
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  }));

  describe('Wallet transfers', function() {
    it('should search in wallet for a transfer', co(function *() {
      const params = { limit: 1, searchLabel: 'test' };

      const scope =
        nock(bgUrl)
        .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/transfer`)
        .query(params)
        .reply(200, {
          coin: 'tbch',
          transfers: [
            {
              wallet: wallet.id(),
              comment: 'tests'
            }
          ]
        });

      try {
        yield wallet.transfers(params);
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }

      scope.isDone().should.be.True();
    }));

    it('should forward all valid parameters', co(function *() {
      const params = {
        limit: 1,
        address: ['address1', 'address2'],
        dateGte: 'dateString0',
        dateLt: 'dateString1',
        valueGte: 0,
        valueLt: 300000000,
        allTokens: true,
        searchLabel: 'abc',
        includeHex: true,
        type: 'transfer_type',
        state: 'transfer_state'
      };

      // The actual api request will only send strings, but the SDK function expects numbers for some values
      const apiParams = _.mapValues(params, param => Array.isArray(param) ? param : String(param));

      const scope =
        nock(bgUrl)
        .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/transfer`)
        .query(_.matches(apiParams))
        .reply(200);

      yield wallet.transfers(params);
      scope.isDone().should.be.True();
    }));

    it('should accept a string argument for address', co(function *() {
      const params = {
        limit: 1,
        address: 'stringAddress'
      };

      const apiParams = {
        limit: '1',
        address: 'stringAddress'
      };

      const scope =
        nock(bgUrl)
        .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/transfer`)
        .query(_.matches(apiParams))
        .reply(200);

      try {
        yield wallet.transfers(params);
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }

      scope.isDone().should.be.True();
    }));

    it('should throw errors for invalid expected parameters', co(function *() {
      (() => {
        wallet.transfers({ address: 13375 });
      }).should.throw('invalid address argument, expecting string or array');

      (() => {
        wallet.transfers({ address: [null] });
      }).should.throw('invalid address argument, expecting array of address strings');

      (() => {
        wallet.transfers({ dateGte: 20101904 });
      }).should.throw('invalid dateGte argument, expecting string');

      (() => {
        wallet.transfers({ dateLt: 20101904 });
      }).should.throw('invalid dateLt argument, expecting string');

      (() => {
        wallet.transfers({ valueGte: '10230005' });
      }).should.throw('invalid valueGte argument, expecting number');

      (() => {
        wallet.transfers({ valueLt: '-5e8' });
      }).should.throw('invalid valueLt argument, expecting number');

      (() => {
        wallet.transfers({ includeHex: '123' });
      }).should.throw('invalid includeHex argument, expecting boolean');

      (() => {
        wallet.transfers({ state: 123 });
      }).should.throw('invalid state argument, expecting string or array');

      (() => {
        wallet.transfers({ state: [123, 456] });
      }).should.throw('invalid state argument, expecting array of state strings');

      (() => {
        wallet.transfers({ type: 123 });
      }).should.throw('invalid type argument, expecting string');
    }));
  });

  describe('Wallet addresses', function() {
    it('should search in wallet addresses', co(function *() {
      const params = { limit: 1, labelContains: 'test' };

      const scope =
        nock(bgUrl)
        .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/addresses`)
        .query(params)
        .reply(200, {
          coin: 'tbch',
          transfers: [
            {
              wallet: wallet.id(),
              comment: 'tests'
            }
          ]
        });

      try {
        yield wallet.addresses(params);
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }

      scope.isDone().should.be.True();
    }));
  });

  describe('Transaction Signature Verification', function() {
    let wallet;
    let basecoin;

    const userKeychain = {
      prv: 'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g',
      pub: 'xpub661MyMwAqRbcGBjE5QG7pkf9cZD33UUD6K46q7ELrbuG7FqXfLNGiXYGHeEnGBb5AWREnk1eA28g8ArZvURbhshXWkTtddHRo54fgyVvLdb',
      rawPub: '023636e68b7b204573abda2616aff6b584910dece2543f1cc6d842caac7d74974b',
      rawPrv: '7438a50010ce7b1dfd86e68046cc78ba1ebd242d6d85d9904d3fcc08734bc172'
    };
    const backupKeychain = {
      prv: 'xprv9s21ZrQH143K4NtHwJ6oHbJpUiLygwx1xpyD24wwYcVcPZ7LqEGHY58EfT3vgnQWAvkw6AQ4Gnw1fVN4fiem5gjMf4rKHC1HzYRsXERfjVa',
      pub: 'xpub661MyMwAqRbcGrxm3KdoejFZ2kBU6QfsL3topTMZ6x2bGMSVNmaY5sSiWkNNK7QqShEWc5oeLVi74V8oMxr2uhCw1oRWMTCidLuPYVHHLzf',
      rawPub: '03fae58eed086af828279a626ce2ad7ef6424b76fa0fb7e1c8da5a7de222b79203',
      rawPrv: 'cda3fb304f1e7ac4e599361577767b52c6c04fdea8ca44c0e360e6a0de7027bd'
    };
    const prebuild = {
      txHex: '01000000010fef30ca07288fb78659253227b8514ae9397faf76e53530118712d240bfb1060000000000ffffffff02255df4240000000017a9149799c321e46a9c7bb11835495a96d6ae31af36c58780c3c9010000000017a9144394c8c16c50397285830b449ceca588f5f359e98700000000',
      txInfo: {
        nP2SHInputs: 1,
        nSegwitInputs: 0,
        nOutputs: 2,
        unspents: [
          {
            chain: 0,
            index: 0,
            redeemScript: '5221032c227d73891b33c45f5f02ab7eebdc4f4ed9ffb5565aedbfb478abb1bfd9d467210266824ac31b6a9d6568c3f7ced9aee1c720cd85994dd41d43dc63b0977195729e21037c07484a5d2d3831d38df1b7b45a2459df6fb40b204bbbf24e0f11763c79a50953ae',
            id: '06b1bf40d21287113035e576af7f39e94a51b82732255986b78f2807ca30ef0f:0',
            address: '2MzKPdDF127CNb5h3g3wNXGD7QMSrobKsvV',
            value: 650000000
          }
        ],
        changeAddresses: [
          '2N74pDqYayJq7PhtrvUvrt1t6ZX9C8ogUdk'
        ]
      },
      feeInfo: {
        size: 373,
        fee: 5595,
        feeRate: 15000,
        payGoFee: 0,
        payGoFeeString: '0'
      },
      walletId: '5a78dd561c6258a907f1eeaee132f796'
    };
    const signedTxHex = '02000000010fef30ca07288fb78659253227b8514ae9397faf76e53530118712d240bfb10600000000fdfd00004730440220140811e76ad440c863164a1f9c0956b7a7db17a29f3fe543576dd6279f975243022006ec7def583d18e8ac2de5bb7bf9c647b67d510c07fc7bdc2487ab06f08e3a684147304402205aa8e8646bc5fad6fda5565f8af5e304a5b5b7aa96690dc1562191365ba38a3202205ce0c8a7cbb3448ea4f6f69a8f4a1accae65021a0acc2d90292226c4615bb75b41004c695221032c227d73891b33c45f5f02ab7eebdc4f4ed9ffb5565aedbfb478abb1bfd9d467210266824ac31b6a9d6568c3f7ced9aee1c720cd85994dd41d43dc63b0977195729e21037c07484a5d2d3831d38df1b7b45a2459df6fb40b204bbbf24e0f11763c79a50953aeffffffff02255df4240000000017a9149799c321e46a9c7bb11835495a96d6ae31af36c58780c3c9010000000017a9144394c8c16c50397285830b449ceca588f5f359e98700000000';

    before(co(function *() {
      basecoin = bitgo.coin('tbch');
      const walletData = {
        id: '5a78dd561c6258a907f1eeaee132f796',
        users: [
          {
            user: '543c11ed356d00cb7600000b98794503',
            permissions: [
              'admin',
              'view',
              'spend'
            ]
          }
        ],
        coin: 'tbch',
        label: 'Signature Verification Wallet',
        m: 2,
        n: 3,
        keys: [
          '5a78dd56bfe424aa07aa068651b194fd',
          '5a78dd5674a70eb4079f58797dfe2f5e',
          '5a78dd561c6258a907f1eea9f1d079e2'
        ],
        tags: [
          '5a78dd561c6258a907f1eeaee132f796'
        ],
        disableTransactionNotifications: false,
        freeze: {},
        deleted: false,
        approvalsRequired: 1,
        isCold: true,
        coinSpecific: {},
        admin: {
          policy: {
            id: '5a78dd561c6258a907f1eeaf50991950',
            version: 0,
            date: '2018-02-05T22:40:22.761Z',
            mutableUpToDate: '2018-02-07T22:40:22.761Z',
            rules: []
          }
        },
        clientFlags: [],
        balance: 650000000,
        confirmedBalance: 650000000,
        spendableBalance: 650000000,
        balanceString: '650000000',
        confirmedBalanceString: '650000000',
        spendableBalanceString: '650000000',
        receiveAddress: {
          id: '5a78de2bbfe424aa07aa131ec03c8dc1',
          address: '2MyQZVquvjL3ZPBgD8cGdHRkHgfzNQFkVyF',
          chain: 0,
          index: 3,
          coin: 'tbch',
          wallet: '5a78dd561c6258a907f1eeaee132f796',
          coinSpecific: {
            redeemScript: '52210276cfa62b997cb3a9c53579a31bf004af4aab070343800285ee737da175c9af1121028cd41b3df3ad36256da33f470bd75d9b70f05d4f10351a2c9fc5d37d94c9909921038b919223eba3ab96f189465b1cb1904b9eaafa2cbe428d14a918fca659aa136a53ae'
          }
        },
        pendingApprovals: []
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    }));

    it('should sign a prebuild', co(function *() {
      // sign transaction
      const halfSignedTransaction = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: userKeychain.prv
      });
      halfSignedTransaction.txHex.should.equal('02000000010fef30ca07288fb78659253227b8514ae9397faf76e53530118712d240bfb10600000000b6004730440220140811e76ad440c863164a1f9c0956b7a7db17a29f3fe543576dd6279f975243022006ec7def583d18e8ac2de5bb7bf9c647b67d510c07fc7bdc2487ab06f08e3a684100004c695221032c227d73891b33c45f5f02ab7eebdc4f4ed9ffb5565aedbfb478abb1bfd9d467210266824ac31b6a9d6568c3f7ced9aee1c720cd85994dd41d43dc63b0977195729e21037c07484a5d2d3831d38df1b7b45a2459df6fb40b204bbbf24e0f11763c79a50953aeffffffff02255df4240000000017a9149799c321e46a9c7bb11835495a96d6ae31af36c58780c3c9010000000017a9144394c8c16c50397285830b449ceca588f5f359e98700000000');

      prebuild.txHex = halfSignedTransaction.txHex;
      const signedTransaction = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv
      });
      signedTransaction.txHex.should.equal(signedTxHex);
    }));

    it('should verify a signed transaction', co(function *() {
      const unspent = prebuild.txInfo.unspents[0];
      const signedTransaction = bitcoin.Transaction.fromHex(signedTxHex);
      const areSignaturesValid = basecoin.verifySignature(signedTransaction, 0, unspent.value);
      areSignaturesValid.should.equal(true);

      // mangle first signature
      const sigScript = bitcoin.script.decompile(signedTransaction.ins[0].script);
      sigScript.length.should.equal(5);
      const firstSignature = sigScript[1];
      const secondSignature = sigScript[2];
      firstSignature.length.should.equal(71);
      secondSignature.length.should.equal(71);

      // mangle random byte of first signature (modifying too much could make the sig script become misclassified)
      firstSignature[10] = 54;
      sigScript[1] = firstSignature;
      signedTransaction.ins[0].script = bitcoin.script.compile(sigScript);

      const areMangledSignaturesValid = basecoin.verifySignature(signedTransaction, 0, unspent.value);
      areMangledSignaturesValid.should.equal(false);

      const isFirstSignatureValid = basecoin.verifySignature(signedTransaction, 0, unspent.value, { signatureIndex: 0 });
      isFirstSignatureValid.should.equal(false);

      // the second signature remains unmodifed and should still be valid
      const isSecondSignatureValid = basecoin.verifySignature(signedTransaction, 0, unspent.value, { signatureIndex: 1 });
      isSecondSignatureValid.should.equal(true);

      const isPublicKeySignatureValid = basecoin.verifySignature(signedTransaction, 0, unspent.value, { publicKey: '0266824ac31b6a9d6568c3f7ced9aee1c720cd85994dd41d43dc63b0977195729e' });
      isPublicKeySignatureValid.should.equal(true);

      const isSignatureMappedPublicKeySignatureValid = basecoin.verifySignature(signedTransaction, 0, unspent.value, { publicKey: '0266824ac31b6a9d6568c3f7ced9aee1c720cd85994dd41d43dc63b0977195729e', signatureIndex: 1 });
      isSignatureMappedPublicKeySignatureValid.should.equal(true);

      const isMismappedPublicKeySignatureValid = basecoin.verifySignature(signedTransaction, 0, unspent.value, { publicKey: '0266824ac31b6a9d6568c3f7ced9aee1c720cd85994dd41d43dc63b0977195729e', signatureIndex: 0 });
      isMismappedPublicKeySignatureValid.should.equal(false);
    }));

    it('should error when amount is zero', co(function *() {
      const params = {
        amount: 0,
        address: TestV2BitGo.V2.TEST_WALLET1_ADDRESS,
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
      };
      (() => wallet.send(params)).should.throw(Error);
    }));

    it('should error when amount is negative', co(function *() {
      const params = {
        amount: -1,
        address: TestV2BitGo.V2.TEST_WALLET1_ADDRESS,
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
      };
      (() => wallet.send(params)).should.throw(Error);
    }));

    it('should error when send many and amount is zero', co(function *() {
      const params = {
        recipients: [{
          address: TestV2BitGo.V2.TEST_WALLET1_ADDRESS,
          amount: 0
        }, {
          address: TestV2BitGo.V2.TEST_WALLET2_ADDRESS,
          amount: 10
        }],
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
      };
      const error = yield bitgo.getAsyncError(wallet.sendMany(params));
      should.exist(error);
    }));

    it('should error when send many and amount is negative', co(function *() {
      const params = {
        recipients: [{
          address: TestV2BitGo.V2.TEST_WALLET1_ADDRESS,
          amount: 10
        }, {
          address: TestV2BitGo.V2.TEST_WALLET2_ADDRESS,
          amount: -1
        }],
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
      };
      const error = yield bitgo.getAsyncError(wallet.sendMany(params));
      should.exist(error);
    }));
  });

  describe('Wallet Transactions', function() {
    let ethWallet;

    before(co(function *() {
      const walletData = {
        id: '598f606cd8fc24710d2ebadb1d9459bb',
        coin: 'teth',
        keys: [
          '598f606cd8fc24710d2ebad89dce86c2',
          '598f606cc8e43aef09fcb785221d9dd2',
          '5935d59cf660764331bafcade1855fd7'
        ]
      };
      ethWallet = new Wallet(bitgo, bitgo.coin('teth'), walletData);
    }));

    it('should search for pending transaction correctly', co(function *() {
      const params = { walletId: wallet.id() };

      const scope =
        nock(bgUrl)
        .get(`/api/v2/${wallet.coin()}/tx/pending/first`)
        .query(params)
        .reply(200);
      try {
        yield wallet.getFirstPendingTransaction();
        throw '';
      } catch (error) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      scope.isDone().should.be.True();
    }));

    it('should try to change the fee correctly', co(function *() {
      const params = { txid: '0xffffffff', fee: '10000000' };

      const scope =
        nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/changeFee`, params)
        .reply(200);

      try {
        yield wallet.changeFee({ txid: '0xffffffff', fee: '10000000' });
        throw '';
      } catch (error) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      scope.isDone().should.be.True();
    }));

    it('should pass data parameter and amount: 0 when using sendTransaction', co(function *() {
      const path = `/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`;
      const recipientAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const recipients = [{
        address: recipientAddress,
        amount: 0,
        data: '0x00110011'
      }];
      const response = nock(bgUrl)
      .post(path, _.matches({ recipients })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

      try {
        yield ethWallet.send({ address: recipients[0].address, data: recipients[0].data, amount: recipients[0].amount });
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      response.isDone().should.be.true();
    }));

    it('should pass data parameter and amount: 0 when using sendMany', co(function *() {
      const path = `/api/v2/${ethWallet.coin()}/wallet/${ethWallet.id()}/tx/build`;
      const recipientAddress = '0x7db562c4dd465cc895761c56f83b6af0e32689ba';
      const recipients = [{
        address: recipientAddress,
        amount: 0,
        data: '0x00110011'
      }];
      const response = nock(bgUrl)
      .post(path, _.matches({ recipients })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

      try {
        yield ethWallet.sendMany({ recipients });
      } catch (e) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      response.isDone().should.be.true();
    }));
  });

  describe('Create Address', () => {
    it('should correctly validate arguments to create address', co(function *() {
      let message = 'gasPrice has to be an integer or numeric string';
      yield wallet.createAddress({ gasPrice: {} }).should.be.rejectedWith(message);
      yield wallet.createAddress({ gasPrice: 'abc' }).should.be.rejectedWith(message);
      yield wallet.createAddress({ gasPrice: null }).should.be.rejectedWith(message);

      message = 'chain has to be an integer';
      yield wallet.createAddress({ chain: {} }).should.be.rejectedWith(message);
      yield wallet.createAddress({ chain: 'abc' }).should.be.rejectedWith(message);
      yield wallet.createAddress({ chain: null }).should.be.rejectedWith(message);

      message = 'count has to be a number between 1 and 250';
      yield wallet.createAddress({ count: {} }).should.be.rejectedWith(message);
      yield wallet.createAddress({ count: 'abc' }).should.be.rejectedWith(message);
      yield wallet.createAddress({ count: null }).should.be.rejectedWith(message);
      yield wallet.createAddress({ count: -1 }).should.be.rejectedWith(message);
      yield wallet.createAddress({ count: 0 }).should.be.rejectedWith(message);
      yield wallet.createAddress({ count: 251 }).should.be.rejectedWith(message);
    }));
  });

  describe('Accelerate Transaction', function() {
    it('fails if cpfpTxIds is not passed', co(function *() {
      yield wallet.accelerateTransaction({})
      .should.be.rejectedWith({ code: 'cpfptxids_not_array' });
    }));

    it('fails if cpfpTxIds is not an array', co(function *() {
      yield wallet.accelerateTransaction({ cpfpTxIds: {} })
      .should.be.rejectedWith({ code: 'cpfptxids_not_array' });
    }));

    it('fails if cpfpTxIds is not of length 1', co(function *() {
      yield wallet.accelerateTransaction({ cpfpTxIds: [] })
      .should.be.rejectedWith({ code: 'cpfptxids_not_array' });
      yield wallet.accelerateTransaction({ cpfpTxIds: ['id1', 'id2'] })
      .should.be.rejectedWith({ code: 'cpfptxids_not_array' });
    }));

    it('fails if cpfpFeeRate is not passed and neither is noCpfpFeeRate', co(function *() {
      yield wallet.accelerateTransaction({ cpfpTxIds: ['id'] })
      .should.be.rejectedWith({ code: 'cpfpfeerate_not_set' });
    }));

    it('fails if cpfpFeeRate is not an integer', co(function *() {
      yield wallet.accelerateTransaction({ cpfpTxIds: ['id'], cpfpFeeRate: 'one' })
      .should.be.rejectedWith({ code: 'cpfpfeerate_not_nonnegative_integer' });
    }));

    it('fails if cpfpFeeRate is negative', co(function *() {
      yield wallet.accelerateTransaction({ cpfpTxIds: ['id'], cpfpFeeRate: -1 })
      .should.be.rejectedWith({ code: 'cpfpfeerate_not_nonnegative_integer' });
    }));

    it('fails if maxFee is not passed and neither is noMaxFee', co(function *() {
      yield wallet.accelerateTransaction({ cpfpTxIds: ['id'], noCpfpFeeRate: true })
      .should.be.rejectedWith({ code: 'maxfee_not_set' });
    }));

    it('fails if maxFee is not an integer', co(function *() {
      yield wallet.accelerateTransaction({ cpfpTxIds: ['id'], noCpfpFeeRate: true, maxFee: 'one' })
      .should.be.rejectedWith({ code: 'maxfee_not_nonnegative_integer' });
    }));

    it('fails if maxFee is negative', co(function *() {
      yield wallet.accelerateTransaction({ cpfpTxIds: ['id'], noCpfpFeeRate: true, maxFee: -1 })
      .should.be.rejectedWith({ code: 'maxfee_not_nonnegative_integer' });
    }));

    it('submits a transaction with all cpfp specific parameters', co(function *() {
      const params = {
        cpfpTxIds: ['id'],
        cpfpFeeRate: 1,
        maxFee: 1
      };

      const prebuildReturn = Object.assign({ txHex: '123' }, params);
      const prebuildStub = sinon.stub(wallet, 'prebuildAndSignTransaction').resolves(prebuildReturn);

      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`;
      nock(bgUrl)
      .post(path, _.matches(prebuildReturn))
      .reply(200);

      yield wallet.accelerateTransaction(params);

      prebuildStub.should.have.been.calledOnceWith(params);

      sinon.restore();
    }));
  });

  describe('maxFeeRate verification', function() {
    const address = '5b34252f1bf349930e34020a';
    const recipients = [{
      address,
      amount: 0
    }];
    const maxFeeRate = 10000;
    let basecoin;
    let wallet;

    before(co(function *() {
      basecoin = bitgo.coin('tbtc');
      const walletData = {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: [
          '5b3424f91bf349930e340175'
        ]
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    }));

    it('should pass maxFeeRate parameter when building transactions', co(function *() {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`;
      const response = nock(bgUrl)
      .post(path, _.matches({ recipients, maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

      try {
        yield wallet.prebuildTransaction({ recipients, maxFeeRate });
      } catch (e) {
        // the prebuildTransaction method will probably throw an exception for not having all of the correct nocks
        // we only care about /tx/build and whether maxFeeRate is an allowed parameter
      }

      response.isDone().should.be.true();
    }));

    it('should pass maxFeeRate parameter when consolidating unspents', co(function *() {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`;
      const response = nock(bgUrl)
      .post(path, _.matches({ maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

      nock(bgUrl)
      .get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[0]}`)
      .reply(200);

      try {
        yield wallet.consolidateUnspents({ recipients, maxFeeRate });
      } catch (e) {
        // the consolidateUnspents method will probably throw an exception for not having all of the correct nocks
        // we only care about /consolidateUnspents and whether maxFeeRate is an allowed parameter
      }

      response.isDone().should.be.true();
    }));

    it('should pass maxFeeRate parameter when calling sweep wallets', co(function *() {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/sweepWallet`;
      const response = nock(bgUrl)
      .post(path, _.matches({ address, maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

      try {
        yield wallet.sweep({ address, maxFeeRate });
      } catch (e) {
        // the sweep method will probably throw an exception for not having all of the correct nocks
        // we only care about /sweepWallet and whether maxFeeRate is an allowed parameter
      }

      response.isDone().should.be.true();
    }));

    it('should pass maxFeeRate parameter when calling fanout unspents', co(function *() {
      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/fanoutUnspents`;
      const response = nock(bgUrl)
      .post(path, _.matches({ maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

      try {
        yield wallet.fanoutUnspents({ address, maxFeeRate });
      } catch (e) {
        // the fanoutUnspents method will probably throw an exception for not having all of the correct nocks
        // we only care about /fanoutUnspents and whether maxFeeRate is an allowed parameter
      }

      response.isDone().should.be.true();
    }));
  });

  describe('Transaction prebuilds', function() {
    it('prebuild should call build and getLatestBlockHeight for utxo coins', co(function *() {
      const params = {};
      nock(bgUrl)
      .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`)
      .query(params)
      .reply(200, {});
      const blockHeight = 100;
      const blockHeightStub = sinon.stub(basecoin, 'getLatestBlockHeight').resolves(blockHeight);
      const postProcessStub = sinon.stub(basecoin, 'postProcessPrebuild').resolves({});
      yield wallet.prebuildTransaction(params);
      blockHeightStub.should.have.been.calledOnce();
      postProcessStub.should.have.been.calledOnceWith({
        blockHeight: 100,
        wallet: wallet,
        buildParams: { },
      });
    }));

    it('prebuild should call build but not getLatestBlockHeight for account coins', co(function *() {
      ['txrp', 'txlm', 'teth'].forEach(co(function *(coin) {
        const accountcoin = bitgo.coin(coin);
        const walletData = {
          id: '5b34252f1bf349930e34021a',
          coin,
          keys: [
            '5b3424f91bf349930e340175'
          ]
        };
        const accountWallet = new Wallet(bitgo, accountcoin, walletData);
        const params = {};
        nock(bgUrl)
        .post(`/api/v2/${accountWallet.coin()}/wallet/${accountWallet.id()}/tx/build`)
        .query(params)
        .reply(200, {});
        const postProcessStub = sinon.stub(accountcoin, 'postProcessPrebuild').resolves({});
        yield accountWallet.prebuildTransaction(params);
        postProcessStub.should.have.been.calledOnceWith({
          wallet: accountWallet,
          buildParams: { },
        });
      }));
    }));
  });

  describe('Maximum Spendable', function maximumSpendable() {
    let bgUrl;

    before(co(function *() {
      nock.activeMocks().should.be.empty();
      bgUrl = common.Environments[bitgo.getEnv()].uri;
    }));

    it('arguments', co(function *() {
      const optionalParams = {
        limit: '25',
        minValue: '0',
        maxValue: '9999999999999',
        minHeight: '0',
        minConfirms: '2',
        enforceMinConfirmsForChange: 'false',
        feeRate: '10000',
        maxFeeRate: '100000',
        recipientAddress: '2NCUFDLiUz9CVnmdVqQe9acVonoM89e76df'
      };

      const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/maximumSpendable`;
      const response = nock(bgUrl)
        .get(path)
        .query(_.matches(optionalParams)) // use _.matches to do a partial match on request body object instead of strict matching
        .reply(200, {
          coin: 'tbch',
          maximumSpendable: 65000
        });

      try {
        yield wallet.maximumSpendable(optionalParams);
      } catch (e) {
        // test is successful if nock is consumed
      }

      response.isDone().should.be.true();
    }));
  });

  describe('Wallet Sharing', function() {
    it('should share to cold wallet without passing skipKeychain', co(function *() {
      const userId = '123';
      const email = 'shareto@sdktest.com';
      const permissions = 'view,spend';

      const getSharingKeyNock = nock(bgUrl)
      .post('/api/v1/user/sharingkey', { email })
      .reply(200, { userId });

      const getKeyNock = nock(bgUrl)
      .get(`/api/v2/tbtc/key/${wallet._wallet.keys[0]}`)
      .reply(200, {});

      const createShareNock = nock(bgUrl)
      .post(`/api/v2/tbtc/wallet/${wallet._wallet.id}/share`, { user: userId, permissions, keychain: {} })
      .reply(200, {});

      yield wallet.shareWallet({ email, permissions });

      getSharingKeyNock.isDone().should.be.True();
      getKeyNock.isDone().should.be.True();
      createShareNock.isDone().should.be.True();
    }));
  });
});
