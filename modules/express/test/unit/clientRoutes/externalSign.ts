/**
 * @prettier
 */

import { common } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import * as should from 'should';
import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';
import { handleV2Sign } from '../../../src/clientRoutes';
import { fetchKeys } from '../../../src/fetchEncryptedPrivKeys';
import * as fs from 'fs';
import { Coin, BitGo, SignedTransaction } from 'bitgo';
import * as nock from 'nock';
nock.restore();

describe('External signer', () => {
  let bitgo: TestBitGoAPI;
  let bgUrl;

  const walletId = '61f039aad587c2000745c687373e0fa9';
  const secret =
    'xprv9s21ZrQH143K3EuPWCBuqnWxydaQV6et9htQige4EswvcHKEzNmkVmwTwKoadyHzJYppuADB7Us7AbaNLToNvoFoSxuWqndQRYtnNy5DUY2';
  const password = 'wDX058%c4plL1@pP';
  const validPrv =
    '{"61f039aad587c2000745c687373e0fa9":"{\\"iv\\":\\"+1u1Y9cvsYuRMeyH2slnXQ==\\",\\"v\\":1,\\"iter\\":10000,\\"ks\\":256,\\"ts\\":64,\\"mode\\":\\"ccm\\",\\"adata\\":\\"\\",\\"cipher\\":\\"aes\\",\\"salt\\":\\"54kOXTqJ9mc=\\",\\"ct\\":\\"JF5wQ82wa1dYyFxFlbHCvK4a+A6MTHdhOqc5uXsz2icWhkY2Lin/3Ab8ZwvwDaR1JYKmC/g1gXIGwVZEOl1M/bRHY420h7sDtmTS6Ebse5NWbF0ItfUJlk6HVATGa+C6mkbaVxJ4kQW/ehnT3riqzU069ATPz8E=\\"}"}';

  before(function () {
    if (!nock.isActive()) {
      nock.activate();
    }

    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();

    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  after(() => {
    if (nock.isActive()) {
      nock.restore();
    }
  });

  it('should read an encrypted prv from signerFileSystemPath and pass it to coin.signTransaction', async () => {
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const envStub = sinon.stub(process, 'env').value({ WALLET_61f039aad587c2000745c687373e0fa9_PASSPHRASE: password });
    const signTransactionStub = sinon
      .stub(Coin.Btc.prototype, 'signTransaction')
      .resolves({ txHex: 'signedTx', txRequestId: '' } as SignedTransaction);

    const req = {
      bitgo: bitgo,
      body: {
        txPrebuild: {
          walletId: walletId,
        },
      },
      params: {
        coin: 'tbtc',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;

    await handleV2Sign(req);

    readFileStub.should.be.calledOnceWith('signerFileSystemPath');
    signTransactionStub.should.be.calledOnceWith(
      sinon.match({
        prv: secret,
      })
    );
    readFileStub.restore();
    signTransactionStub.restore();
    envStub.restore();
  });

  it('should accept a local secret and password for a wallet', async () => {
    const accessToken = '';
    const walletIds = {
      tbtc: [
        {
          id: walletId,
          secret,
          password,
        },
      ],
    };

    const walletResult = {
      id: walletId,
      keys: [walletId, walletId, walletId],
    };

    const keyResult = {
      id: walletId,
    };

    nock(bgUrl).get(`/api/v2/tbtc/wallet/${walletId}`).reply(200, walletResult);
    nock(bgUrl).get(`/api/v2/tbtc/key/${walletId}`).reply(200, keyResult);

    const data = await fetchKeys(walletIds, accessToken);

    should.exist(data[walletId]);
    data[walletId].should.startWith('{"iv":"');
  });
});
