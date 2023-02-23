import * as _ from 'lodash';

import * as nock from 'nock';
import fixtures from '../../fixtures/link/linkWallet';

import {
  Enterprise,
  Environments,
  Keychain,
  Keychains,
  LinkWallet,
  Wallet,
} from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import * as sinon from 'sinon';

describe('non-TSS Link Wallet', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let ethBaseCoin;
  let enterprise;
  let ethWalletData: any;
  let ethLinkWallet: LinkWallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    ethBaseCoin = bitgo.coin('eth');
    ethBaseCoin.keychains();

    enterprise = new Enterprise(bitgo, ethBaseCoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'Test Enterprise' });
    ethWalletData = {
      id: 'walletId',
      coin: 'eth',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
      coinSpecific: { walletVersion: 2 },
    };
    const ethWallet = new Wallet(bitgo, ethBaseCoin, ethWalletData);
    ethLinkWallet = ethWallet.toLinkWallet();
  });

  const sandbox = sinon.createSandbox();

  afterEach(function () {
    sandbox.verifyAndRestore();
  });

  describe('buildSignAndSend', function () {

    it('should build, sign and send transfer', async function () {
      const walletPassphrase = 'passphrase';
      const transferRequest = fixtures.transfer('READY');

      const prebuildTransaction = sandbox.stub(Wallet.prototype, 'prebuildTransaction');
      const txPrebuild = {
        walletId: ethLinkWallet.walletId,
        eip1559: {
          maxPriorityFeePerGas: '1725000000',
          maxFeePerGas: '103440665730',
        },
        recipients: [
          {
            address: transferRequest.receiveAddress,
            amount: transferRequest.amount,
          },
        ],
        nextContractSequenceId: 14,
        gasLimit: 200000,
        isBatch: false,
        coin: 'eth',
        walletContractAddress: '0x2ca3170fb3d0a7dd6ee574adc91812be8e35f303',
        txHex: undefined,
      };
      prebuildTransaction.resolves(txPrebuild);
      prebuildTransaction.calledOnceWithExactly({
        recipients: [
          {
            address: transferRequest.receiveAddress,
            amount: transferRequest.amount,
          },
        ],
      });

      // SIGN
      const getKeysForSigning = sandbox.stub(Keychains.prototype, 'getKeysForSigning');
      const keychain: Keychain = {
        id: 'id',
        pub: 'pub',
        type: 'independent',
      };
      getKeysForSigning.resolves([keychain]);
      getKeysForSigning.calledOnce;

      const signTransaction = sandbox.stub(Wallet.prototype, 'signTransaction');
      const signed = {
        halfSigned: {
          eip1559: {
            maxPriorityFeePerGas: '1725000000',
            maxFeePerGas: '103440665730',
          },
          isBatch: false,
          recipients: [
            {
              address: transferRequest.receiveAddress,
              amount: transferRequest.amount,
            },
          ],
          expireTime: 1677719611,
          contractSequenceId: 14,
          operationHash: '0x192c977132bd68e25049a5b8c751d34e73b2e5084984aa78816cf2e79a4659a8',
          signature: '0xa2f792675a89e241986255482c2800482708bb007b791dc0d22e5f4290b7b4637fedb08854919e2fe2be8caf5d8c631eb1ddf00d728a1121b49676d9b22e8ab61b',
          txHex: '',
        },
      };
      signTransaction.resolves(signed);
      signTransaction.calledOnceWithExactly({
        txPrebuild,
        walletPassphrase,
        keychain,
      });

      // SEND
      nock(microservicesUri)
        .post(`/api/external-exchange/v1/enterprise/${enterprise.id}/${ethLinkWallet.coin}/wallets/${ethLinkWallet.walletId}/transfers/${transferRequest.id}/send`,
          _.matches(signed))
        .reply(200, transferRequest);

      const sentTransferRequest = await ethLinkWallet.buildSignAndSend(
        { walletPassphrase: walletPassphrase },
        transferRequest,
      );

      sentTransferRequest.should.deepEqual(transferRequest);
    });

  });

});
