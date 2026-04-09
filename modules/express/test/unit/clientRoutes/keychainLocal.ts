import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import nock from 'nock';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGo } from 'bitgo';
import { BaseCoin, decodeOrElse } from '@bitgo/sdk-core';

import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { handleV2CreateLocalKeyChain } from '../../../src/clientRoutes';
import { KeychainLocalResponse } from '../../../src/typedRoutes/api/v2/keychainLocal';

describe('Create Local Keychain', () => {
  let bitgo: TestBitGoAPI;

  before(async function () {
    if (!nock.isActive()) {
      nock.activate();
    }

    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();

    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  after(() => {
    if (nock.isActive()) {
      nock.restore();
    }
  });

  it('should create a local keychain and return the keypair', async () => {
    const createdKeypair = { prv: 'prv-example', pub: 'pub-example' };
    const keychainsInstance = { create: sinon.stub().returns(createdKeypair) } as const;
    const coinStub = {
      keychains: sinon.stub<[], typeof keychainsInstance>().returns(keychainsInstance),
    } as unknown as BaseCoin;
    const coinMethodStub = sinon.stub(bitgo, 'coin').returns(coinStub as any);

    const req = {
      bitgo: bitgo,
      params: { coin: 'tbtc' },
      body: {},
    } as unknown as ExpressApiRouteRequest<'express.keychain.local', 'post'>;

    const res = await handleV2CreateLocalKeyChain(req);

    decodeOrElse('KeychainLocalResponse200', KeychainLocalResponse[200], res, (errors) => {
      throw new Error(`Response did not match expected codec: ${errors}`);
    });

    sinon.assert.calledOnce(keychainsInstance.create);
    coinMethodStub.restore();
  });
});
