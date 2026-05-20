import 'should';
import * as assert from 'assert';
import nock = require('nock');

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { common } from '@bitgo/sdk-core';

import { Tlnbtc } from '../../src/index';

describe('Lightning Bitcoin', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Tlnbtc;
  let bgUrl: string;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tlnbtc', Tlnbtc.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tlnbtc') as Tlnbtc;
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  it('should instantiate the coin', function () {
    basecoin.should.be.an.instanceof(Tlnbtc);
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Lightning Bitcoin');
  });

  describe('isValidPub', function () {
    it('should return true for valid xpub', function () {
      assert.strictEqual(
        basecoin.isValidPub(
          'xpub661MyMwAqRbcGaE8M1N5i3fdBskDrwgU77TejReywexvb1sqCK1LhC2SETWp8XpPS2WDqyNywdgWo5kUTwkDv7qSe12xp4En7mcogZy95rQ'
        ),
        true
      );
    });

    it('should return false for private key', function () {
      assert.strictEqual(
        basecoin.isValidPub(
          'xprv9s21ZrQH143K469fEyq5LuitdqujTUxcjtY3w3FNPKRwiDYgemh69PhxPBrgBc2s9vn8yfR1YKitAyUEXRTinrjyxxH5Xe38McnJ5rXkeXn'
        ),
        false
      );
    });

    it('should return false for invalid string', function () {
      assert.strictEqual(basecoin.isValidPub('not-a-pub'), false);
    });
  });

  describe('isValidAddress', function () {
    it('should accept valid compressed node pubkeys', function () {
      assert.strictEqual(
        basecoin.isValidAddress('02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619'),
        true
      );
      assert.strictEqual(
        basecoin.isValidAddress('03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad'),
        true
      );
    });

    it('should reject invalid node pubkeys', function () {
      // wrong prefix
      assert.strictEqual(
        basecoin.isValidAddress('04eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619'),
        false
      );
      // too short
      assert.strictEqual(
        basecoin.isValidAddress('02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f28368'),
        false
      );
      // too long
      assert.strictEqual(
        basecoin.isValidAddress('02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f28368661900'),
        false
      );
    });

    it('should accept valid testnet bitcoin addresses', function () {
      // p2sh
      assert.strictEqual(basecoin.isValidAddress('2NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X'), true);
      // bech32
      assert.strictEqual(basecoin.isValidAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'), true);
    });

    it('should reject invalid addresses', function () {
      assert.strictEqual(basecoin.isValidAddress('not-an-address'), false);
      assert.strictEqual(basecoin.isValidAddress(''), false);
    });
  });

  describe('isWalletAddress', function () {
    const walletId = 'wallet123';
    const validBitcoinAddress = '2NBSpUjBQUg4BmWUft8m2VePGDEZ2QBFM7X';
    const nodePubkey = '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';

    afterEach(function () {
      nock.cleanAll();
    });

    it('should return true when address exists on wallet', async function () {
      nock(bgUrl)
        .get(`/api/v2/tlnbtc/wallet/${walletId}/address/${encodeURIComponent(validBitcoinAddress)}`)
        .reply(200, { address: validBitcoinAddress });

      const result = await basecoin.isWalletAddress({ address: validBitcoinAddress, walletId });
      assert.strictEqual(result, true);
    });

    it('should return false when address does not exist on wallet', async function () {
      nock(bgUrl)
        .get(`/api/v2/tlnbtc/wallet/${walletId}/address/${encodeURIComponent(validBitcoinAddress)}`)
        .reply(404);

      const result = await basecoin.isWalletAddress({ address: validBitcoinAddress, walletId });
      assert.strictEqual(result, false);
    });

    it('should return false for node pubkeys without querying API', async function () {
      const result = await basecoin.isWalletAddress({ address: nodePubkey, walletId });
      assert.strictEqual(result, false);
    });

    it('should throw InvalidAddressError for invalid addresses', async function () {
      await assert.rejects(() => basecoin.isWalletAddress({ address: 'invalid', walletId }), {
        name: 'InvalidAddressError',
      });
    });
  });
});
