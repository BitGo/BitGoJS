/**
 * @prettier
 */
import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';
import { handleV2Sign } from '../../../src/clientRoutes';
import * as fs from 'fs';
import { Coin, BitGo, SignedTransaction } from 'bitgo';

describe('External signer', () => {
  it('should read an encrypted prv from signerFileSystemPath and pass it to coin.signTransaction', async () => {
    const validPrv =
      '{"61f039aad587c2000745c687373e0fa9":"{\\"iv\\":\\"+1u1Y9cvsYuRMeyH2slnXQ==\\",\\"v\\":1,\\"iter\\":10000,\\"ks\\":256,\\"ts\\":64,\\"mode\\":\\"ccm\\",\\"adata\\":\\"\\",\\"cipher\\":\\"aes\\",\\"salt\\":\\"54kOXTqJ9mc=\\",\\"ct\\":\\"JF5wQ82wa1dYyFxFlbHCvK4a+A6MTHdhOqc5uXsz2icWhkY2Lin/3Ab8ZwvwDaR1JYKmC/g1gXIGwVZEOl1M/bRHY420h7sDtmTS6Ebse5NWbF0ItfUJlk6HVATGa+C6mkbaVxJ4kQW/ehnT3riqzU069ATPz8E=\\"}"}';
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const envStub = sinon
      .stub(process, 'env')
      .value({ WALLET_61f039aad587c2000745c687373e0fa9_PASSPHRASE: 'wDX058%c4plL1@pP' });
    const signTransactionStub = sinon
      .stub(Coin.Btc.prototype, 'signTransaction')
      .resolves({ txHex: 'signedTx', txRequestId: '' } as SignedTransaction);

    const req = {
      bitgo: new BitGo({ env: 'test' }),
      body: {
        txPrebuild: {
          walletId: '61f039aad587c2000745c687373e0fa9',
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
        prv: 'xprv9s21ZrQH143K3EuPWCBuqnWxydaQV6et9htQige4EswvcHKEzNmkVmwTwKoadyHzJYppuADB7Us7AbaNLToNvoFoSxuWqndQRYtnNy5DUY2',
      })
    );
    readFileStub.restore();
    signTransactionStub.restore();
    envStub.restore();
  });
});
