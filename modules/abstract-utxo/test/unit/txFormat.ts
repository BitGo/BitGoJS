import * as assert from 'assert';

import { Wallet } from '@bitgo/sdk-core';

import { AbstractUtxoCoin, TxFormat } from '../../src';
import { isMainnetCoin, isTestnetCoin } from '../../src/names';

import { utxoCoins, defaultBitGo } from './util';

type WalletType = 'hot' | 'cold' | 'custodial' | 'custodialPaired' | 'trading';
type WalletSubType = 'distributedCustody';
type WalletFlag = { name: string; value: string };

type WalletOptions = {
  type?: WalletType;
  subType?: WalletSubType;
  walletFlags?: WalletFlag[];
};

/**
 * Enumerates common wallet configurations for testing
 */
export function getWalletConfigurations(): Array<{ name: string; options: WalletOptions }> {
  return [
    { name: 'hot wallet', options: { type: 'hot' } },
    { name: 'cold wallet', options: { type: 'cold' } },
    { name: 'custodial wallet', options: { type: 'custodial' } },
    { name: 'distributedCustody wallet', options: { type: 'cold', subType: 'distributedCustody' } },
    { name: 'musigKp wallet', options: { type: 'cold', walletFlags: [{ name: 'musigKp', value: 'true' }] } },
    { name: 'hot musigKp wallet', options: { type: 'hot', walletFlags: [{ name: 'musigKp', value: 'true' }] } },
  ];
}

/**
 * Helper function to create a mock wallet for testing
 */
export function createMockWallet(coin: AbstractUtxoCoin, options: WalletOptions = {}): Wallet {
  const walletData = {
    id: '5b34252f1bf349930e34020a',
    coin: coin.getChain(),
    type: options.type || 'hot',
    ...(options.subType && { subType: options.subType }),
    ...(options.walletFlags && { walletFlags: options.walletFlags }),
  };
  return new Wallet(defaultBitGo, coin, walletData);
}

/**
 * Helper function to get the txFormat from a coin's getDefaultTxFormat method
 */
export function getTxFormat(coin: AbstractUtxoCoin, wallet: Wallet, requestedFormat?: TxFormat): TxFormat | undefined {
  return coin.getDefaultTxFormat(wallet, requestedFormat);
}

/**
 * Helper function to run a txFormat test with named arguments.
 * By default, iterates over all wallet configurations and all coins.
 */
function runTest(params: {
  description: string;
  expectedTxFormat:
    | TxFormat
    | undefined
    | ((coin: AbstractUtxoCoin, walletConfig: WalletOptions) => TxFormat | undefined);
  coinFilter?: (coin: AbstractUtxoCoin) => boolean;
  walletFilter?: (walletConfig: { name: string; options: WalletOptions }) => boolean;
  requestedTxFormat?: TxFormat;
}): void {
  it(params.description, function () {
    const walletConfigs = getWalletConfigurations();

    for (const walletConfig of walletConfigs) {
      // Skip wallet configurations that don't match the filter
      if (params.walletFilter && !params.walletFilter(walletConfig)) {
        continue;
      }

      for (const coin of utxoCoins) {
        // Skip coins that don't match the filter
        if (params.coinFilter && !params.coinFilter(coin)) {
          continue;
        }

        const wallet = createMockWallet(coin, walletConfig.options);
        const txFormat = getTxFormat(coin, wallet, params.requestedTxFormat);

        const expectedTxFormat =
          typeof params.expectedTxFormat === 'function'
            ? params.expectedTxFormat(coin, walletConfig.options)
            : params.expectedTxFormat;

        assert.strictEqual(
          txFormat,
          expectedTxFormat,
          `${params.description} - ${
            walletConfig.name
          } - ${coin.getChain()}: expected ${expectedTxFormat}, got ${txFormat}`
        );
      }
    }
  });
}

describe('txFormat', function () {
  describe('getDefaultTxFormat', function () {
    // All testnet wallets default to PSBT-lite
    runTest({
      description: 'should always return psbt-lite for testnet',
      coinFilter: (coin) => isTestnetCoin(coin.name),
      expectedTxFormat: 'psbt-lite',
    });

    // All mainnet wallets default to psbt-lite
    runTest({
      description: 'should return psbt-lite for all mainnet wallets',
      coinFilter: (coin) => isMainnetCoin(coin.name),
      expectedTxFormat: 'psbt-lite',
    });

    // Test explicitly requested formats
    runTest({
      description: 'should map explicitly requested legacy format to psbt-lite',
      expectedTxFormat: 'psbt-lite',
      requestedTxFormat: 'legacy',
    });

    runTest({
      description: 'should respect explicitly requested psbt format',
      expectedTxFormat: 'psbt',
      requestedTxFormat: 'psbt',
    });

    runTest({
      description: 'should respect explicitly requested psbt-lite format',
      expectedTxFormat: 'psbt-lite',
      requestedTxFormat: 'psbt-lite',
    });
  });

  describe('getExtraPrebuildParams with legacy format', function () {
    const legacyCompatibleTypes = ['p2sh', 'p2shP2wsh', 'p2wsh'];

    it('should filter changeAddressType to legacy-compatible types for hot wallets', async function () {
      for (const coin of utxoCoins) {
        const wallet = createMockWallet(coin, { type: 'hot' });
        const result = await coin.getExtraPrebuildParams({ txFormat: 'legacy', wallet } as any);
        assert.ok(Array.isArray(result.changeAddressType), `${coin.getChain()}: changeAddressType should be an array`);
        for (const t of result.changeAddressType as string[]) {
          assert.ok(
            legacyCompatibleTypes.includes(t),
            `${coin.getChain()}: changeAddressType contains ${t} which is not legacy-compatible`
          );
        }
      }
    });

    it('should set allowedInputScriptTypes to legacy-compatible types', async function () {
      for (const coin of utxoCoins) {
        const wallet = createMockWallet(coin, { type: 'hot' });
        const result = await coin.getExtraPrebuildParams({ txFormat: 'legacy', wallet } as any);
        assert.deepStrictEqual(
          result.allowedInputScriptTypes,
          legacyCompatibleTypes,
          `${coin.getChain()}: allowedInputScriptTypes should be legacy-compatible`
        );
      }
    });

    it('should not set allowedInputScriptTypes when txFormat is not legacy', async function () {
      for (const coin of utxoCoins) {
        const wallet = createMockWallet(coin, { type: 'hot' });
        const result = await coin.getExtraPrebuildParams({ wallet } as any);
        assert.strictEqual(
          result.allowedInputScriptTypes,
          undefined,
          `${coin.getChain()}: allowedInputScriptTypes should be undefined for default format`
        );
      }
    });
  });
});
