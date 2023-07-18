import * as sinon from 'sinon';
import 'should-http';
import 'should-sinon';
import 'should';
import * as fs from 'fs';
import { Request } from 'express';
import { BitGo, Coin, BaseCoin, Wallet, Wallets } from 'bitgo';

import '../../lib/asserts';
import { handleV2OFCSignPayload, handleV2OFCSignPayloadInExtSigningMode } from '../../../src/clientRoutes';

describe('Sign an arbitrary payload with trading account key', function () {
  const coin = 'ofc';
  const payload = {
    this: {
      is: {
        a: 'payload',
      },
    },
  };
  const signature = 'signedPayload123';
  const walletId = 'myWalletId';

  const walletStub = sinon.createStubInstance(Wallet as any, {
    id: walletId,
    coin: sinon.stub().returns(coin),
    toTradingAccount: sinon.stub().returns({
      signPayload: sinon.stub().returns(signature),
    }),
  });

  const walletsStub = sinon.createStubInstance(Wallets as any, {
    get: sinon.stub().resolves(walletStub),
  });

  const coinStub = sinon.createStubInstance(BaseCoin as any, { wallets: sinon.stub().returns(walletsStub) });

  const bitGoStub = sinon.createStubInstance(BitGo as any, { coin: sinon.stub().returns(coinStub) });

  before(() => {
    process.env['WALLET_myWalletId_PASSPHRASE'] = 'mypass';
  });

  it('should return a signed payload', async function () {
    const expectedResponse = {
      payload: JSON.stringify(payload),
      signature,
    };
    const req = {
      bitgo: bitGoStub,
      body: {
        payload,
        walletId,
      },
      query: {},
    } as unknown as Request;
    await handleV2OFCSignPayload(req).should.be.resolvedWith(expectedResponse);
  });
});

describe('With the handler to sign an arbitrary payload in external signing mode', () => {
  let bitgo: BitGo;

  const walletId = '61f039aad587c2000745c687373e0fa9';
  const walletPassword = 'wDX058%c4plL1@pP';
  const secret =
    'xprv9s21ZrQH143K3EuPWCBuqnWxydaQV6et9htQige4EswvcHKEzNmkVmwTwKoadyHzJYppuADB7Us7AbaNLToNvoFoSxuWqndQRYtnNy5DUY2';
  const validPrv =
    '{"61f039aad587c2000745c687373e0fa9":"{\\"iv\\":\\"+1u1Y9cvsYuRMeyH2slnXQ==\\",\\"v\\":1,\\"iter\\":10000,\\"ks\\":256,\\"ts\\":64,\\"mode\\":\\"ccm\\",\\"adata\\":\\"\\",\\"cipher\\":\\"aes\\",\\"salt\\":\\"54kOXTqJ9mc=\\",\\"ct\\":\\"JF5wQ82wa1dYyFxFlbHCvK4a+A6MTHdhOqc5uXsz2icWhkY2Lin/3Ab8ZwvwDaR1JYKmC/g1gXIGwVZEOl1M/bRHY420h7sDtmTS6Ebse5NWbF0ItfUJlk6HVATGa+C6mkbaVxJ4kQW/ehnT3riqzU069ATPz8E=\\"}"}';

  const payload = {
    this: {
      is: {
        a: 'payload',
      },
    },
  };

  before(() => {
    bitgo = new BitGo({ env: 'test' });
  });

  it('should return a payload signed with trading account key read from the local file system', async () => {
    const stubbedSignature = Buffer.from('mysign');
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const envStub = sinon
      .stub(process, 'env')
      .value({ WALLET_61f039aad587c2000745c687373e0fa9_PASSPHRASE: walletPassword });

    const signMessageStub = sinon.stub(Coin.Ofc.prototype, 'signMessage').resolves(stubbedSignature);

    const stubbedSigHex = stubbedSignature.toString('hex');

    const expectedResponse = {
      payload: JSON.stringify(payload),
      signature: stubbedSigHex,
    };

    const req = {
      bitgo,
      body: {
        walletId,
        payload,
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as Request;

    await handleV2OFCSignPayloadInExtSigningMode(req).should.be.resolvedWith(expectedResponse);
    readFileStub.should.be.calledOnceWith('signerFileSystemPath');
    signMessageStub.should.be.calledOnceWith(
      sinon.match({
        prv: secret,
      })
    );
    readFileStub.restore();
    envStub.restore();
  });

  describe('With invalid setup', () => {
    const invalidPrv = '{"61f039aad587c2000745c687373e0fa9":"invalid"}';

    it('should throw an error with missing wallet passphrase in env', async () => {
      const req = {
        bitgo,
        body: {
          walletId,
          payload,
        },
      } as unknown as Request;

      await handleV2OFCSignPayloadInExtSigningMode(req).should.be.rejectedWith(
        'Could not find wallet passphrase WALLET_61f039aad587c2000745c687373e0fa9_PASSPHRASE in environment'
      );
    });

    it('should throw an error with undefined signerFileSystemPath in env', async () => {
      const envStub = sinon
        .stub(process, 'env')
        .value({ WALLET_61f039aad587c2000745c687373e0fa9_PASSPHRASE: walletPassword });

      const req = {
        bitgo,
        body: {
          walletId,
          payload,
        },
        config: {
          signerFileSystemPath: undefined,
        },
      } as unknown as Request;

      await handleV2OFCSignPayloadInExtSigningMode(req).should.be.rejectedWith(
        'Missing required configuration: signerFileSystemPath'
      );
      envStub.restore();
    });

    it('should throw error when trying to decrypt with invalid private key', async () => {
      const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(invalidPrv);
      const envStub = sinon
        .stub(process, 'env')
        .value({ WALLET_61f039aad587c2000745c687373e0fa9_PASSPHRASE: walletPassword });

      const req = {
        bitgo,
        body: {
          walletId,
          payload,
        },
        config: {
          signerFileSystemPath: 'signerFileSystemPath',
        },
      } as unknown as Request;

      await handleV2OFCSignPayloadInExtSigningMode(req).should.be.rejectedWith(
        "Error when trying to decrypt private key: INVALID: json decode: this isn't json!"
      );

      readFileStub.restore();
      envStub.restore();
    });

    it('should throw error when trying to decrypt with invalid wallet passphrase key', async () => {
      const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
      const envStub = sinon
        .stub(process, 'env')
        .value({ WALLET_61f039aad587c2000745c687373e0fa9_PASSPHRASE: 'invalidPassphrase' });

      const req = {
        bitgo,
        body: {
          walletId,
          payload,
        },
        config: {
          signerFileSystemPath: 'signerFileSystemPath',
        },
      } as unknown as Request;

      await handleV2OFCSignPayloadInExtSigningMode(req).should.be.rejectedWith(
        "Error when trying to decrypt private key: CORRUPT: password error - ccm: tag doesn't match"
      );

      readFileStub.restore();
      envStub.restore();
    });
  });
});
