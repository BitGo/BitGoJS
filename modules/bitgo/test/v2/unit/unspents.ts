import * as nock from 'nock';
import * as sinon from 'sinon';
import { common, Wallet } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src';

describe('Verify string type is used for value of unspent', function () {
  const bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
  bitgo.initializeTestVars();
  const basecoin: any = bitgo.coin('tdoge');
  const walletData = {
    id: '5b34252f1bf349930e34020a00000000',
    coin: 'tdoge',
    keys: ['5b3424f91bf349930e34017500000000', '5b3424f91bf349930e34017600000000', '5b3424f91bf349930e34017700000000'],
    coinSpecific: {},
  };
  const wallet = new Wallet(bitgo, basecoin, walletData);
  const bgUrl = common.Environments[bitgo.getEnv()].uri;
  const highPrecisionBigInt = BigInt(1e16) + BigInt(1);

  function matchMinMaxValue(minValue: string, maxValue: string): boolean {
    return minValue === '1' && maxValue === highPrecisionBigInt.toString();
  }
  function assertIsString(val: unknown): asserts val is string {
    if (typeof val !== 'string') {
      throw new Error('Expected string');
    }
  }

  describe('unspents APIs with string type minValue and maxValue', function () {
    after(function () {
      nock.cleanAll();
    });

    ['consolidate', 'fanout'].forEach((manageUnspentType) => {
      it(manageUnspentType + ' should handle string type minValue and maxValue', async function () {
        const params = { minValue: '1', maxValue: highPrecisionBigInt.toString() };

        const consolidateUnspentsScope = nock(bgUrl)
          .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/${manageUnspentType}Unspents`, (body) => {
            return matchMinMaxValue(body.minValue, body.maxValue);
          })
          .reply(200, {
            txInfo: {
              unspents: [
                {
                  id: 123,
                  address: 'sfajlkjad',
                  value: 1242123,
                  valueString: '1242123',
                },
              ],
            },
          });

        wallet
          .keyIds()
          .forEach((keyId) =>
            nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${keyId}`).reply(200, { id: keyId, pub: 'pub' })
          );

        sinon.stub(wallet, 'signTransaction').resolves({});

        const sendScope = nock(bgUrl)
          .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`, { type: manageUnspentType })
          .reply(200, {});

        await wallet[manageUnspentType + 'Unspents'](params);

        consolidateUnspentsScope.done();
        sendScope.done();
        sinon.restore();
      });
    });

    it('maximumSpendable should handle string type minValue and maxValue', async function () {
      const params = {
        minValue: '1',
        maxValue: highPrecisionBigInt.toString(),
        target: highPrecisionBigInt.toString(),
      };

      const maximumSpendableScope = nock(bgUrl)
        .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/maximumSpendable`)
        .query((queryParams) => {
          assertIsString(queryParams.minValue);
          assertIsString(queryParams.maxValue);
          return matchMinMaxValue(queryParams.minValue, queryParams.maxValue);
        })
        .reply(200, {});

      await wallet.maximumSpendable(params);

      maximumSpendableScope.done();
    });

    it('get unspents should handle string type minValue and maxValue', async function () {
      const params = {
        minValue: '1',
        maxValue: highPrecisionBigInt.toString(),
        target: highPrecisionBigInt.toString(),
      };

      const unspentsScope = nock(bgUrl)
        .get(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/unspents`)
        .query((queryParams) => {
          assertIsString(queryParams.minValue);
          assertIsString(queryParams.maxValue);
          return matchMinMaxValue(queryParams.minValue as string, queryParams.maxValue);
        })
        .reply(200, {});

      await wallet.unspents(params);

      unspentsScope.done();
    });
  });

  describe('build and send transaction APIs with string type minValue and maxValue', function () {
    after(function () {
      nock.cleanAll();
    });

    it('sendmany should handle string type minValue and maxValue', async function () {
      const params = { minValue: '1', maxValue: highPrecisionBigInt.toString() };

      const sendScope = nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`, (body) => {
          return matchMinMaxValue(body.minValue, body.maxValue);
        })
        .reply(200, {});

      const prebuildAndSignTransactionStub = sinon.stub(wallet, 'prebuildAndSignTransaction').resolves({});

      await wallet.sendMany(params);

      prebuildAndSignTransactionStub.should.calledOnce();
      sendScope.done();
    });

    it('prebuildTransaction should handle string type minValue and maxValue', async function () {
      const params = { minValue: '1', maxValue: highPrecisionBigInt.toString() };

      const buildScope = nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`, (body) => {
          return matchMinMaxValue(body.minValue, body.maxValue);
        })
        .reply(200, {
          txHex:
            '010000000197c9d011880ce52e1730d7e18d4877db343b61c7369e3274b9c0f176349137840000000000ffffffff0132000000000000001976a9146ba5752fb24f37d99db121975d8d68f0c6204d9188ac00000000',
        });

      nock(bgUrl).get(`/api/v2/${wallet.coin()}/public/block/latest`).twice().reply(200, {});

      await wallet.prebuildTransaction(params);

      buildScope.done();
    });
  });
});
