//
// Account consolidation tests
//

import * as sinon from 'sinon';
require('should-sinon');

import '../lib/asserts';
import * as nock from 'nock';
import * as Promise from 'bluebird';
const co = Promise.coroutine;

import { Wallet } from '../../../src/v2/wallet';
import * as common from '../../../src/common';

import { TestBitGo } from '../../lib/test_bitgo';
const algoFixtures = require('../fixtures/coins/algo');

nock.disableNetConnect();

describe('Account Consolidations:', function() {
  let bitgo;
  let wallet;
  let basecoin;
  let bgUrl;
  let fixtures;

  for(const coinName of ['talgo', 'txtz']) {
    describe(coinName + ' Account Consolidations: ', function() {
      before(co(function* () {
        bitgo = new TestBitGo({ env: 'test' });
        bitgo.initializeTestVars();
        basecoin = bitgo.coin(coinName);

        const walletData = {
          id: '5e4168f4403d0c5c1c3bdd15486e757f',
          coin: coinName,
        };

        wallet = new Wallet(bitgo, basecoin, walletData);
        bgUrl = common.Environments[bitgo.getEnv()].uri;
        if (coinName === 'talgo') {
          fixtures = algoFixtures.prebuild();
        }
      }));

      describe('Building', function() {
        it('should not allow a non-account consolidation coin build', co(function *() {
          const unsupportedCoin = bitgo.coin('tbtc');
          const invalidWallet = new Wallet(bitgo, unsupportedCoin, {});
          yield invalidWallet.buildAccountConsolidations().should.be.rejectedWith({ message: `${unsupportedCoin.getFullName()} does not allow account consolidations.` });
        }));

        it('should build with no params', co(function *() {
          const scope = nock(bgUrl)
            .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateAccount/build`)
            .query({})
            .reply(200, fixtures.buildAccountConsolidation);

          const accountConsolidationBuild = yield wallet.buildAccountConsolidations();

          accountConsolidationBuild.length.should.equal(2);

          scope.isDone().should.be.True();
        }));
      });

      describe('Sending', function() {
        afterEach(function() {
          sinon.restore();
        });

        it('should not allow a non-account consolidation coin send', co(function *() {
          const unsupportedCoin = bitgo.coin('tbtc');
          const invalidWallet = new Wallet(bitgo, unsupportedCoin, {});
          yield invalidWallet.sendAccountConsolidation({ }).should.be.rejectedWith({ message: `${unsupportedCoin.getFullName()} does not allow account consolidations.` });
        }));

        it('should not allow a non-account consolidation coin send multiples', co(function *() {
          const unsupportedCoin = bitgo.coin('tbtc');
          const invalidWallet = new Wallet(bitgo, unsupportedCoin, {});
          yield invalidWallet.sendAccountConsolidations({ }).should.be.rejectedWith({ message: `${unsupportedCoin.getFullName()} does not allow account consolidations.` });
        }));

        it('should not allow a bad pre-build to be passed', co(function *() {
          yield wallet.sendAccountConsolidation({ prebuildTx: 'some string' }).should.be.rejectedWith({ message: 'Invalid build of account consolidation.' });
          yield wallet.sendAccountConsolidation({ prebuildTx: undefined }).should.be.rejectedWith({ message: 'Invalid build of account consolidation.' });
        }));

        it('should require a consolidation id to be passed', co(function *() {
          yield wallet.sendAccountConsolidation({ prebuildTx: {} }).should.be.rejectedWith({ message: 'Failed to find consolidation id on consolidation transaction.' });
        }));

        it('should submit a consolidation transaction', co(function *() {
          const params = { prebuildTx: fixtures.buildAccountConsolidation[0] };

          sinon.stub(wallet, 'prebuildAndSignTransaction').resolves(fixtures.signedAccountConsolidationBuilds[0]);

          const scope = nock(bgUrl)
            .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`, fixtures.signedAccountConsolidationBuild)
            .reply(200);

          yield wallet.sendAccountConsolidation(params);

          scope.isDone().should.be.True();
        }));

        it('should submit a consolidation account send (build + send) with two successes', co(function *() {
          const scopeBuild = nock(bgUrl)
            .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateAccount/build`)
            .query({})
            .reply(200, fixtures.buildAccountConsolidation);

          sinon.stub(wallet, 'prebuildAndSignTransaction')
            .onCall(0).resolves(fixtures.signedAccountConsolidationBuilds[0])
            .onCall(1).resolves(fixtures.signedAccountConsolidationBuilds[1]);

          const scopeFirstSigned = nock(bgUrl)
            .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`, fixtures.signedAccountConsolidationBuilds[0])
            .reply(200);

          const scopeTwoSigned = nock(bgUrl)
            .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`, fixtures.signedAccountConsolidationBuilds[1])
            .reply(200);

          const consolidations = yield wallet.sendAccountConsolidations();

          consolidations.success.length.should.equal(2);
          consolidations.failure.length.should.equal(0);

          scopeFirstSigned.isDone().should.be.True();
          scopeTwoSigned.isDone().should.be.True();
          scopeBuild.isDone().should.be.True();
        }));

        it('should submit a consolidation account send (build + send) with one success, one failure', co(function *() {
          const scopeBuild = nock(bgUrl)
            .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateAccount/build`)
            .query({})
            .reply(200, fixtures.buildAccountConsolidation);

          sinon.stub(wallet, 'prebuildAndSignTransaction')
            .onCall(0).resolves(fixtures.signedAccountConsolidationBuilds[0])
            .onCall(1).resolves(fixtures.signedAccountConsolidationBuilds[1]);

          const scopeWithSuccess = nock(bgUrl)
            .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`, fixtures.signedAccountConsolidationBuilds[0])
            .reply(200);

          const scopeWithError = nock(bgUrl)
            .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`, fixtures.signedAccountConsolidationBuilds[1])
            .reply(500);

          const consolidations = yield wallet.sendAccountConsolidations();

          consolidations.success.length.should.equal(1);
          consolidations.failure.length.should.equal(1);

          scopeWithSuccess.isDone().should.be.True();
          scopeWithError.isDone().should.be.True();
          scopeBuild.isDone().should.be.True();
        }));
      });
    });
  }
});
