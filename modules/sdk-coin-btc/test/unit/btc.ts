import 'should';
import assert from 'assert';
import { btcBackupKey } from './fixtures';

import { type TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';

import { Tbtc } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';
import * as utxolib from '@bitgo/utxo-lib';

describe('BTC:', () => {
  let bitgo: TestBitGoAPI;

  before(() => {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tbtc', Tbtc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Address validation:', () => {
    let coin: Tbtc;
    before(() => {
      coin = bitgo.coin('tbtc') as Tbtc;
    });

    it('should validate a base58 address', () => {
      const validBase58Address = '2Mv1fGp8gHSqsiXYG7WqcYmHZdurDGVtUbn';
      coin.isValidAddress(validBase58Address).should.be.true();
      const invalidBase58Address = '2MV1FGP8GHSQSSXYG7WQCYMHZDURDGVTUBN';
      coin.isValidAddress(invalidBase58Address).should.be.false();
    });

    it('should validate a bech32 address', () => {
      const validBech32Address = 'tb1qtxxqmkkdx4n4lcp0nt2cct89uh3h3dlcu940kw9fcqyyq36peh0st94hfp';
      coin.isValidAddress(validBech32Address).should.be.true();
      coin.isValidAddress(validBech32Address.toUpperCase()).should.be.false();
    });

    it('should validate a bech32m address', () => {
      // https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#Test_vectors_for_Bech32m
      const validBech32mAddress = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
      coin.isValidAddress(validBech32mAddress).should.be.true();
      coin.isValidAddress(validBech32mAddress.toUpperCase()).should.be.false();
    });
  });

  describe('Post Build Validation', () => {
    let coin: Tbtc;
    before(() => {
      coin = bitgo.coin('tbtc') as Tbtc;
    });

    it('should not modify locktime on postProcessPrebuild', async () => {
      const txHex =
        '0100000001a8ec78f09f7acb0d344622ed3082c1a98e51ba1b1ab65406044f6e0a801609020100000000ffffffff02a0860100000000001976a9149f9a7abd600c0caa03983a77c8c3df8e062cb2fa88acfbf2150000000000220020b922cc1e737e679d24ff2d2b18cfa9fff4e35a733b4fba94282eaa1b7cfe56d200000000';
      const blockHeight = 100;
      const preBuild = { txHex, blockHeight };
      const postProcessBuilt = await coin.postProcessPrebuild(preBuild);
      const transaction = utxolib.bitgo.createTransactionFromHex(
        postProcessBuilt.txHex as string,
        utxolib.networks.bitcoin
      );

      transaction.locktime.should.equal(0);
      const inputs = transaction.ins;
      for (const input of inputs) {
        input.sequence.should.equal(0xffffffff);
      }
    });
  });

  describe('Audit Key', () => {
    const { key } = btcBackupKey;
    let coin: Tbtc;
    before(() => {
      coin = bitgo.coin('tbtc') as Tbtc;
    });

    it('should return for valid inputs', () => {
      coin.assertIsValidKey({
        encryptedPrv: key,
        walletPassphrase: 'kAm[EFQ6o=SxlcLFDw%,',
      });
    });

    it('should throw error if the walletPassphrase is incorrect', () => {
      assert.throws(
        () =>
          coin.assertIsValidKey({
            encryptedPrv: key,
            walletPassphrase: 'foo',
          }),
        { message: "failed to decrypt prv: ccm: tag doesn't match" }
      );
    });

    it('should return throw if the key is altered', () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      assert.throws(
        () =>
          coin.assertIsValidKey({
            encryptedPrv: alteredKey,
            walletPassphrase: 'kAm[EFQ6o=SxlcLFDw%,',
          }),
        { message: 'failed to decrypt prv: json decrypt: invalid parameters' }
      );
    });
  });

  describe('Unspent management spoofability - Consolidation (BUILD_SIGN_SEND)', () => {
    let coin: Tbtc;
    let bitgoTest: TestBitGoAPI;
    before(() => {
      bitgoTest = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      bitgoTest.safeRegister('tbtc', Tbtc.createInstance);
      bitgoTest.initializeTestVars();
      coin = bitgoTest.coin('tbtc') as Tbtc;
    });

    it('should detect hex spoofing in BUILD_SIGN_SEND', async (): Promise<void> => {
      const {
        getDefaultWalletKeys,
        toKeychainObjects,
      } = require('../../../bitgo/test/v2/unit/coins/utxo/util/keychains');
      const rootWalletKey = getDefaultWalletKeys();
      const keysObj = toKeychainObjects(rootWalletKey, 'pass');

      const { Wallet } = await import('@bitgo/sdk-core');
      const wallet = new Wallet(bitgoTest, coin, {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: keysObj.map((k) => k.id),
      });

      const originalPsbt = utxolib.testutil.constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', value: BigInt(9000) }],
        coin.network,
        rootWalletKey,
        'unsigned' as const
      );
      utxolib.bitgo.addXpubsToPsbt(originalPsbt, rootWalletKey);

      const spoofedPsbt = utxolib.testutil.constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1pjgg9ty3s2ztp60v6lhgrw76f7hxydzuk9t9mjsndh3p2gf2ah7gs4850kn', value: BigInt(9000) }],
        coin.network,
        rootWalletKey,
        'unsigned' as const
      );
      utxolib.bitgo.addXpubsToPsbt(spoofedPsbt, rootWalletKey);
      const spoofedHex: string = spoofedPsbt.toHex();

      const bgUrl: string = (bitgoTest as any)._baseUrl;
      const nock = require('nock');

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`)
        .reply(200, { txHex: spoofedHex, consolidateId: 'test' });

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`)
        .reply((requestBody: any) => {
          if (requestBody?.txHex === spoofedHex) {
            throw new Error('Spoofed transaction was sent: spoofing protection failed');
          }
          return [200, { txid: 'test-txid-123', status: 'signed' }];
        });

      keysObj.forEach((k, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[i]}`).reply(200, k));

      await assert.rejects(
        wallet.consolidateUnspents({ walletPassphrase: 'pass' }),
        (e: any) =>
          typeof e?.message === 'string' &&
          e.message.includes('prebuild attempts to spend to unintended external recipients')
      );
    });
  });

  describe('Unspent management spoofability - Fanout (BUILD_SIGN_SEND)', () => {
    let coin: Tbtc;
    let bitgoTest: TestBitGoAPI;
    before(() => {
      bitgoTest = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      bitgoTest.safeRegister('tbtc', Tbtc.createInstance);
      bitgoTest.initializeTestVars();
      coin = bitgoTest.coin('tbtc') as Tbtc;
    });

    it('should detect hex spoofing in fanout BUILD_SIGN_SEND', async (): Promise<void> => {
      const {
        getDefaultWalletKeys,
        toKeychainObjects,
      } = require('../../../bitgo/test/v2/unit/coins/utxo/util/keychains');
      const rootWalletKey = getDefaultWalletKeys();
      const keysObj = toKeychainObjects(rootWalletKey, 'pass');

      const { Wallet } = await import('@bitgo/sdk-core');
      const wallet = new Wallet(bitgoTest, coin, {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: keysObj.map((k) => k.id),
      });

      const originalPsbt = utxolib.testutil.constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', value: BigInt(9000) }],
        coin.network,
        rootWalletKey,
        'unsigned' as const
      );
      utxolib.bitgo.addXpubsToPsbt(originalPsbt, rootWalletKey);

      const spoofedPsbt = utxolib.testutil.constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: 'tb1pjgg9ty3s2ztp60v6lhgrw76f7hxydzuk9t9mjsndh3p2gf2ah7gs4850kn', value: BigInt(9000) }],
        coin.network,
        rootWalletKey,
        'unsigned' as const
      );
      utxolib.bitgo.addXpubsToPsbt(spoofedPsbt, rootWalletKey);
      const spoofedHex: string = spoofedPsbt.toHex();

      const bgUrl: string = (bitgoTest as any)._baseUrl;
      const nock = require('nock');

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/fanoutUnspents`)
        .reply(200, { txHex: spoofedHex, fanoutId: 'test' });

      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`)
        .reply((requestBody: any) => {
          if (requestBody?.txHex === spoofedHex) {
            throw new Error('Spoofed transaction was sent: spoofing protection failed');
          }
          return [200, { txid: 'test-txid-123', status: 'signed' }];
        });

      keysObj.forEach((k, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[i]}`).reply(200, k));

      await assert.rejects(
        wallet.fanoutUnspents({ walletPassphrase: 'pass' }),
        (e: any) =>
          typeof e?.message === 'string' &&
          e.message.includes('prebuild attempts to spend to unintended external recipients')
      );
    });
  });
});
