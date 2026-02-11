import assert from 'assert';

import { type TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI, encrypt } from '@bitgo/sdk-api';
import * as testutils from '@bitgo/wasm-utxo/testutils';
import { Wallet } from '@bitgo/sdk-core';

import { Tbtc } from '../../src/impl/btc';

import { constructPsbt } from './util';

describe('Transaction Spoofability Tests', function () {
  describe('Unspent management spoofability - Consolidation (BUILD_SIGN_SEND)', function () {
    let coin: Tbtc;
    let bitgoTest: TestBitGoAPI;

    before(function () {
      bitgoTest = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      bitgoTest.safeRegister('tbtc', Tbtc.createInstance);
      bitgoTest.initializeTestVars();
      coin = bitgoTest.coin('tbtc') as Tbtc;
    });

    it('should detect hex spoofing in BUILD_SIGN_SEND', async function (): Promise<void> {
      const keyTriple = testutils.getKeyTriple('default');
      const rootWalletKey = testutils.getDefaultWalletKeys();
      const [user] = keyTriple;

      const wallet = new Wallet(bitgoTest, coin, {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: ['user', 'backup', 'bitgo'],
      });

      // originalPsbt is created to show what the legitimate transaction would look like
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const originalPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', value: BigInt(9000) }],
        'tbtc',
        rootWalletKey
      );
      const spoofedPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1pjgg9ty3s2ztp60v6lhgrw76f7hxydzuk9t9mjsndh3p2gf2ah7gs4850kn', value: BigInt(9000) }],
        'tbtc',
        rootWalletKey
      );
      const spoofedHex: string = Buffer.from(spoofedPsbt.serialize()).toString('hex');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bgUrl: string = (bitgoTest as any)._baseUrl;
      const nock = require('nock');

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`)
        .reply(200, { txHex: spoofedHex, consolidateId: 'test' });

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reply((requestBody: any) => {
          if (requestBody?.txHex === spoofedHex) {
            throw new Error('Spoofed transaction was sent: spoofing protection failed');
          }
          return [200, { txid: 'test-txid-123', status: 'signed' }];
        });

      const pubs = keyTriple.map((k) => k.neutered().toBase58());
      const responses = [
        { pub: pubs[0], encryptedPrv: encrypt('pass', user.toBase58()) },
        { pub: pubs[1] },
        { pub: pubs[2] },
      ];
      wallet
        .keyIds()
        .forEach((id, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${id}`).reply(200, responses[i]));

      await assert.rejects(
        wallet.consolidateUnspents({ walletPassphrase: 'pass' }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) =>
          typeof e?.message === 'string' &&
          e.message.includes('prebuild attempts to spend to unintended external recipients')
      );
    });
  });

  describe('Unspent management spoofability - Fanout (BUILD_SIGN_SEND)', function () {
    let coin: Tbtc;
    let bitgoTest: TestBitGoAPI;

    before(function () {
      bitgoTest = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      bitgoTest.safeRegister('tbtc', Tbtc.createInstance);
      bitgoTest.initializeTestVars();
      coin = bitgoTest.coin('tbtc') as Tbtc;
    });

    it('should detect hex spoofing in fanout BUILD_SIGN_SEND', async function (): Promise<void> {
      const keyTriple = testutils.getKeyTriple('default');
      const rootWalletKey = testutils.getDefaultWalletKeys();
      const [user] = keyTriple;

      const wallet = new Wallet(bitgoTest, coin, {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: ['user', 'backup', 'bitgo'],
      });

      // originalPsbt is created to show what the legitimate transaction would look like
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const originalPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', value: BigInt(9000) }],
        'tbtc',
        rootWalletKey
      );

      const spoofedPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1pjgg9ty3s2ztp60v6lhgrw76f7hxydzuk9t9mjsndh3p2gf2ah7gs4850kn', value: BigInt(9000) }],
        'tbtc',
        rootWalletKey
      );
      const spoofedHex: string = Buffer.from(spoofedPsbt.serialize()).toString('hex');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bgUrl: string = (bitgoTest as any)._baseUrl;
      const nock = require('nock');

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/fanoutUnspents`)
        .reply(200, { txHex: spoofedHex, fanoutId: 'test' });

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reply((requestBody: any) => {
          if (requestBody?.txHex === spoofedHex) {
            throw new Error('Spoofed transaction was sent: spoofing protection failed');
          }
          return [200, { txid: 'test-txid-123', status: 'signed' }];
        });

      const pubs = keyTriple.map((k) => k.neutered().toBase58());
      const responses = [
        { pub: pubs[0], encryptedPrv: encrypt('pass', user.toBase58()) },
        { pub: pubs[1] },
        { pub: pubs[2] },
      ];
      wallet
        .keyIds()
        .forEach((id, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${id}`).reply(200, responses[i]));

      await assert.rejects(
        wallet.fanoutUnspents({ walletPassphrase: 'pass' }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) =>
          typeof e?.message === 'string' &&
          e.message.includes('prebuild attempts to spend to unintended external recipients')
      );
    });
  });
});
