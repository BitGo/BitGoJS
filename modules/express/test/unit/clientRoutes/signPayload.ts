import * as sinon from 'sinon';
import 'should-http';
import 'should-sinon';
import 'should';
import * as fs from 'fs';
import { BitGo, Coin, BaseCoin, Wallet, Wallets } from 'bitgo';
import '../../lib/asserts';
import { handleV2OFCSignPayload, handleV2OFCSignPayloadInExtSigningMode } from '../../../src/clientRoutes';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { OfcSignPayloadResponse } from '../../../src/typedRoutes/api/v2/ofcSignPayload';
import { decodeOrElse } from '@bitgo/sdk-core';

describe('Sign an arbitrary payload with trading account key', function () {
  const coin = 'ofc';
  const payload = {
    this: {
      is: {
        a: 'payload',
      },
    },
  };
  const stringifiedPayload = JSON.stringify(payload);
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

  it('should return a signed payload with type as object', async function () {
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
      decoded: {
        walletId,
        payload,
      },
      query: {},
    } as unknown as ExpressApiRouteRequest<'express.ofc.signPayload', 'post'>;
    const result = await handleV2OFCSignPayload(req).should.be.resolvedWith(expectedResponse);
    decodeOrElse('OfcSignPayloadResponse200', OfcSignPayloadResponse[200], result, (_) => {
      throw new Error(`Response did not match expected codec`);
    });
  });
  it('should return a signed payload with type as json string', async function () {
    const expectedResponse = {
      payload: stringifiedPayload,
      signature,
    };
    const req = {
      bitgo: bitGoStub,
      body: {
        payload: stringifiedPayload,
        walletId,
      },
      decoded: {
        walletId,
        payload,
      },
      query: {},
    } as unknown as ExpressApiRouteRequest<'express.ofc.signPayload', 'post'>;
    const result = await handleV2OFCSignPayload(req).should.be.resolvedWith(expectedResponse);
    decodeOrElse('OfcSignPayloadResponse200', OfcSignPayloadResponse[200], result, (_) => {
      throw new Error(`Response did not match expected codec`);
    });
  });
  it('should not double-stringify when decoded payload is already a string', async function () {
    // When the io-ts Json codec matches a string input (left-to-right union resolution),
    // decoded.payload is the original string. The handler must not JSON.stringify it again.
    const expectedResponse = {
      payload: stringifiedPayload,
      signature,
    };
    const req = {
      bitgo: bitGoStub,
      body: {
        payload: stringifiedPayload,
        walletId,
      },
      decoded: {
        walletId,
        payload: stringifiedPayload,
      },
      query: {},
    } as unknown as ExpressApiRouteRequest<'express.ofc.signPayload', 'post'>;
    const result = await handleV2OFCSignPayload(req).should.be.resolvedWith(expectedResponse);
    result.payload.should.equal(stringifiedPayload);
    result.payload.should.not.startWith('"');
    decodeOrElse('OfcSignPayloadResponse200', OfcSignPayloadResponse[200], result, (_) => {
      throw new Error(`Response did not match expected codec`);
    });
  });
  it('should decode handler response with OfcSignPayloadResponse codec', async function () {
    const expected = {
      payload: JSON.stringify(payload),
      signature,
    };
    const req = {
      bitgo: bitGoStub,
      body: {
        walletId,
        payload,
      },
      decoded: {
        walletId,
        payload,
      },
    } as unknown as ExpressApiRouteRequest<'express.ofc.signPayload', 'post'>;

    const result = await handleV2OFCSignPayload(req);
    decodeOrElse('OfcSignPayloadResponse200', OfcSignPayloadResponse[200], result, (_) => {
      throw new Error(`Response did not match expected codec`);
    });
    result.should.eql(expected);
    OfcSignPayloadResponse[200].is(result).should.be.true();
  });
});

describe('With the handler to sign an arbitrary payload in external signing mode', () => {
  let bitgo: BitGo;

  const walletId = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
  const walletPassword = 'test-wallet-passphrase';
  const secret =
    'xprv9s21ZrQH143K3EuPWCBuqnWxydaQV6et9htQige4EswvcHKEzNmkVmwTwKoadyHzJYppuADB7Us7AbaNLToNvoFoSxuWqndQRYtnNy5DUY2';
  let validPrv: string;

  const payload = {
    this: {
      is: {
        a: 'payload',
      },
    },
  };

  before(async () => {
    bitgo = new BitGo({ env: 'test' });
    const encryptedPrv = await bitgo.encrypt({
      password: walletPassword,
      input: secret,
      encryptionVersion: 1,
    });
    validPrv = JSON.stringify({ [walletId]: encryptedPrv });
  });

  it('should return a payload signed with trading account key read from the local file system', async () => {
    const stubbedSignature = Buffer.from('mysign');
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const envStub = sinon.stub(process, 'env').value({ [`WALLET_${walletId}_PASSPHRASE`]: walletPassword });

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
      decoded: {
        walletId,
        payload,
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.ofc.extSignPayload', 'post'>;

    await handleV2OFCSignPayloadInExtSigningMode(req).should.be.resolvedWith(expectedResponse);
    readFileStub.should.be.calledOnceWith('signerFileSystemPath');
    signMessageStub.should.be.calledOnceWith(
      sinon.match({
        prv: secret,
      })
    );
    readFileStub.restore();
    envStub.restore();
    signMessageStub.restore();
  });

  it('should use wallet passphrase from request body', async () => {
    const stubbedSignature = Buffer.from('mysign');
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);

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
        walletPassphrase: walletPassword,
      },
      decoded: {
        walletId,
        payload,
        walletPassphrase: walletPassword,
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.ofc.extSignPayload', 'post'>;

    await handleV2OFCSignPayloadInExtSigningMode(req).should.be.resolvedWith(expectedResponse);
    readFileStub.should.be.calledOnceWith('signerFileSystemPath');
    signMessageStub.should.be.calledOnceWith(
      sinon.match({
        prv: secret,
      })
    );
    readFileStub.restore();
    signMessageStub.restore();
  });

  it('should prioritize request body passphrase over environment variable', async () => {
    const stubbedSignature = Buffer.from('mysign');
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const envStub = sinon.stub(process, 'env').value({ [`WALLET_${walletId}_PASSPHRASE`]: walletPassword });

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
        walletPassphrase: walletPassword,
      },
      decoded: {
        walletId,
        payload,
        walletPassphrase: walletPassword,
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.ofc.extSignPayload', 'post'>;

    await handleV2OFCSignPayloadInExtSigningMode(req).should.be.resolvedWith(expectedResponse);
    readFileStub.should.be.calledOnceWith('signerFileSystemPath');
    signMessageStub.should.be.calledOnceWith(
      sinon.match({
        prv: secret,
      })
    );
    readFileStub.restore();
    envStub.restore();
    signMessageStub.restore();
  });

  describe('With invalid setup', () => {
    const invalidPrv = JSON.stringify({ [walletId]: 'invalid' });

    it('should throw an error with missing wallet passphrase in env', async () => {
      const req = {
        bitgo,
        body: {
          walletId,
          payload,
        },
        decoded: {
          walletId,
          payload,
        },
      } as unknown as ExpressApiRouteRequest<'express.v2.ofc.extSignPayload', 'post'>;

      await handleV2OFCSignPayloadInExtSigningMode(req).should.be.rejectedWith(
        `Could not find wallet passphrase WALLET_${walletId}_PASSPHRASE in environment`
      );
    });

    it('should throw an error with undefined signerFileSystemPath in env', async () => {
      const envStub = sinon.stub(process, 'env').value({ [`WALLET_${walletId}_PASSPHRASE`]: walletPassword });

      const req = {
        bitgo,
        body: {
          walletId,
          payload,
        },
        decoded: {
          walletId,
          payload,
        },
        config: {
          signerFileSystemPath: undefined,
        },
      } as unknown as ExpressApiRouteRequest<'express.v2.ofc.extSignPayload', 'post'>;

      await handleV2OFCSignPayloadInExtSigningMode(req).should.be.rejectedWith(
        'Missing required configuration: signerFileSystemPath'
      );
      envStub.restore();
    });

    it('should throw error when trying to decrypt with invalid private key', async () => {
      const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(invalidPrv);
      const envStub = sinon.stub(process, 'env').value({ [`WALLET_${walletId}_PASSPHRASE`]: walletPassword });

      const req = {
        bitgo,
        body: {
          walletId,
          payload,
        },
        decoded: {
          walletId,
          payload,
        },
        config: {
          signerFileSystemPath: 'signerFileSystemPath',
        },
      } as unknown as ExpressApiRouteRequest<'express.v2.ofc.extSignPayload', 'post'>;

      await handleV2OFCSignPayloadInExtSigningMode(req).should.be.rejectedWith(
        'Error when trying to decrypt private key: decrypt: ciphertext is not valid JSON'
      );

      readFileStub.restore();
      envStub.restore();
    });

    it('should throw error when trying to decrypt with invalid wallet passphrase key', async () => {
      const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
      const envStub = sinon.stub(process, 'env').value({ [`WALLET_${walletId}_PASSPHRASE`]: 'invalidPassphrase' });

      const req = {
        bitgo,
        body: {
          walletId,
          payload,
        },
        decoded: {
          walletId,
          payload,
        },
        config: {
          signerFileSystemPath: 'signerFileSystemPath',
        },
      } as unknown as ExpressApiRouteRequest<'express.v2.ofc.extSignPayload', 'post'>;

      await handleV2OFCSignPayloadInExtSigningMode(req).should.be.rejectedWith(
        'unable to decrypt keychain with the given wallet passphrase'
      );

      readFileStub.restore();
      envStub.restore();
    });

    it('should throw error when trying to decrypt with invalid wallet passphrase in body', async () => {
      const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);

      const req = {
        bitgo,
        body: {
          walletId,
          payload,
          walletPassphrase: 'invalidPassphrase',
        },
        decoded: {
          walletId,
          payload,
          walletPassphrase: 'invalidPassphrase',
        },
        config: {
          signerFileSystemPath: 'signerFileSystemPath',
        },
      } as unknown as ExpressApiRouteRequest<'express.v2.ofc.extSignPayload', 'post'>;

      await handleV2OFCSignPayloadInExtSigningMode(req).should.be.rejectedWith(
        'unable to decrypt keychain with the given wallet passphrase'
      );

      readFileStub.restore();
    });
  });
});
