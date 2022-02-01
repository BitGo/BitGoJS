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
import { Btc } from 'bitgo/dist/src/v2/coins/btc';
import { BitGo } from 'bitgo';

describe('External signer', () => {
  it('should read prv from signerFileSystemPath and pass it to coin.signTransaction', async () => {
    const validPrv =
      '{"prv":"xprv9s21ZrQH143K3EuPWCBuqnWxydaQV6et9htQige4EswvcHKEzNmkVmwTwKoadyHzJYppuADB7Us7AbaNLToNvoFoSxuWqndQRYtnNy5DUY2"}';
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const signTransactionStub = sinon.stub(Btc.prototype, 'signTransaction').resolves('signedTx');

    const req = {
      bitgo: new BitGo({ env: 'test' }),
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
  });
});
