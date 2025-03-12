import * as sinon from 'sinon';
import * as nock from 'nock';

import { Environments, Wallet } from '@bitgo/sdk-core';
import { TestableBG, TestBitGo } from '@bitgo/sdk-test';

import { BitGo } from '../../../src';

nock.disableNetConnect();

describe('PrebuildAndSign', function () {
  const bitgo: TestableBG & BitGo = TestBitGo.decorate(BitGo, { env: 'test' });
  const bgUrl: string = Environments[bitgo.getEnv()].uri;

  before(async function () {
    bitgo.initializeTestVars();
  });

  afterEach(function () {
    sinon.restore();
  });

  after(async function () {
    nock.cleanAll();
  });

  describe('Account Based MultiSig Hot Wallets', function () {
    const coin = 'hteth';
    const walletId = '65f060a22df7cd8a42958441d4e90a45';
    const wallet = new Wallet(bitgo, bitgo.coin(coin), { id: walletId, coin, multisigType: 'on-chain' });

    it('should validate build with user params', async function () {
      nock(bgUrl)
        .post(`/api/v2/${coin}/wallet/${walletId}/tx/build`)
        .reply(200, {
          feeInfo: {
            date: '2025-03-11T16:54:31.174Z',
            gasPrice: '2431332',
            baseFee: '1431332',
            gasUsedRatio: '0.847974014624559',
            safeLowMinerTip: '1000000',
            normalMinerTip: '1000000',
            standardMinerTip: '1000000',
            fastestMinerTip: '1000000',
            ludicrousMinerTip: '1000000',
          },
          eip1559: {
            maxPriorityFeePerGas: '1150000',
            maxFeePerGas: '4012664',
          },
          recipients: [
            {
              address: '0xe33e8728f320ccd98af20b19b333857ad2325f07',
              amount: '1000000000000000',
            },
          ],
          nextContractSequenceId: 21,
          gasLimit: 200000,
          isBatch: false,
          coin: 'hteth',
          buildParams: {
            recipients: [
              {
                address: '0xe33e872',
                amount: '1000000',
              },
            ],
          },
        });
      sinon.stub(wallet as any, 'getKeychainsAndValidatePassphrase').resolves([]);

      await wallet
        .prebuildAndSignTransaction({
          recipients: [
            {
              address: '0xe33e872',
              amount: '1000000',
            },
          ],
        })
        .should.be.rejectedWith(
          `normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client`
        );
    });

    it('should validate that transaction is going to batcher for multiple recepients', async function () {
      nock(bgUrl)
        .post(`/api/v2/${coin}/wallet/${walletId}/tx/build`)
        .reply(200, {
          feeInfo: {
            date: '2025-03-12T18:38:11.627Z',
            gasPrice: '22051229178',
            baseFee: '21051229178',
            gasUsedRatio: '0.055718833333333335',
            safeLowMinerTip: '1000000000',
            normalMinerTip: '1250000000',
            standardMinerTip: '1250000000',
            fastestMinerTip: '1503782862',
            ludicrousMinerTip: '1503782862',
          },
          eip1559: {
            maxPriorityFeePerGas: '1437500000',
            maxFeePerGas: '43539958356',
          },
          recipients: [
            {
              address: '0xc1b7e7cc1ecafbfd0771a5eb5454ab5b0356980d',
              amount: '3000000000000000',
              data: '0xc00c4e9e000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000020000000000000000000000002669c843ef62adeff9915a36349ce2542f08d9760000000000000000000000003669c843ef62adeff9915a36349ce2542f08d976000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000038d7ea4c68000',
            },
          ],
          nextContractSequenceId: 22,
          gasLimit: 200000,
          isBatch: true,
          coin: 'hteth',
          buildParams: {
            comment: '',
            recipients: [
              {
                address: '0x2669c843ef62AdEFF9915a36349cE2542F08D976',
                amount: '2000000000000000',
              },
              {
                address: '0x3669c843ef62AdEFF9915a36349cE2542F08D976',
                amount: '1000000000000000',
              },
            ],
          },
        });
      sinon.stub(wallet as any, 'getKeychainsAndValidatePassphrase').resolves([]);

      await wallet
        .prebuildAndSignTransaction({
          comment: '',
          recipients: [
            {
              address: '0x2669c843ef62AdEFF9915a36349cE2542F08D976',
              amount: '1000000000000000',
            },
            {
              address: '0x3669c843ef62AdEFF9915a36349cE2542F08D976',
              amount: '1000000000000000',
            },
          ],
        })
        .should.be.rejectedWith(
          `batch transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client`
        );
    });
  });
});
