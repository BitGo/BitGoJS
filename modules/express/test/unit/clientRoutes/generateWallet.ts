import * as sinon from 'sinon';
import * as Bluebird from 'bluebird';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';

import { handleV2GenerateWallet } from '../../../src/clientRoutes';

import { BitGo } from 'bitgo';
import { BaseCoin, Wallets, WalletWithKeychains } from '@bitgo/sdk-core';

describe('Generate Wallet', () => {
  it('should return the internal wallet object and keychains by default or if includeKeychains is true', async () => {
    const walletStub = sinon
      .stub<[], Bluebird<WalletWithKeychains>>()
      .resolves({ wallet: { toJSON: () => 'walletdata with keychains' } } as any);
    const walletsStub = sinon.createStubInstance(Wallets, { generateWallet: walletStub });
    const coinStub = sinon.createStubInstance(BaseCoin, {
      wallets: sinon.stub<[], Wallets>().returns(walletsStub as any),
    });
    const stubBitgo = sinon.createStubInstance(BitGo, { coin: sinon.stub<[string]>().returns(coinStub) });
    const walletGenerateBody = {};
    const coin = 'tbtc';
    const reqDefault = {
      bitgo: stubBitgo,
      params: {
        coin,
      },
      query: {},
      body: walletGenerateBody,
    } as unknown as express.Request;
    const reqIncludeKeychains = {
      bitgo: stubBitgo,
      params: {
        coin,
      },
      query: {
        includeKeychains: true,
      },
      body: walletGenerateBody,
    } as unknown as express.Request;

    await handleV2GenerateWallet(reqDefault).should.be.resolvedWith({ wallet: 'walletdata with keychains' });
    await handleV2GenerateWallet(reqIncludeKeychains).should.be.resolvedWith({ wallet: 'walletdata with keychains' });
  });

  it('should only return wallet data if includeKeychains query param is false', async () => {
    const walletsStub = sinon.createStubInstance(Wallets, {
      generateWallet: { wallet: { toJSON: () => 'walletdata' } } as any,
    });
    const coinStub = sinon.createStubInstance(BaseCoin, {
      wallets: sinon.stub<[], Wallets>().returns(walletsStub as any),
    });
    const stubBitgo = sinon.createStubInstance(BitGo, { coin: sinon.stub<[string]>().returns(coinStub) });
    const walletGenerateBody = {};
    const coin = 'tbtc';
    const req = {
      bitgo: stubBitgo,
      params: {
        coin,
      },
      query: {
        includeKeychains: 'false',
      },
      body: walletGenerateBody,
    } as unknown as express.Request;

    await handleV2GenerateWallet(req).should.be.resolvedWith('walletdata');
  });
});
