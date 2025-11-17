import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { Wallet } from '@bitgo/sdk-core';

import { AbstractUtxoCoin, TxFormat } from '../../src';

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
    // All testnet wallets default to PSBT
    runTest({
      description: 'should always return psbt for testnet',
      coinFilter: (coin) => utxolib.isTestnet(coin.network),
      expectedTxFormat: 'psbt',
    });

    // DistributedCustody wallets default to PSBT (mainnet only, testnet already covered)
    runTest({
      description: 'should return psbt for distributedCustody wallets on mainnet',
      coinFilter: (coin) => utxolib.isMainnet(coin.network),
      walletFilter: (w) => w.options.subType === 'distributedCustody',
      expectedTxFormat: 'psbt',
    });

    // MuSig2 wallets default to PSBT (mainnet only, testnet already covered)
    runTest({
      description: 'should return psbt for wallets with musigKp flag on mainnet',
      coinFilter: (coin) => utxolib.isMainnet(coin.network),
      walletFilter: (w) => Boolean(w.options.walletFlags?.some((f) => f.name === 'musigKp' && f.value === 'true')),
      expectedTxFormat: 'psbt',
    });

    // Mainnet Bitcoin hot wallets default to PSBT
    runTest({
      description: 'should return psbt for mainnet bitcoin hot wallets',
      coinFilter: (coin) =>
        utxolib.isMainnet(coin.network) && utxolib.getMainnet(coin.network) === utxolib.networks.bitcoin,
      walletFilter: (w) => w.options.type === 'hot',
      expectedTxFormat: 'psbt',
    });

    // Other mainnet wallets do NOT default to PSBT
    runTest({
      description: 'should return undefined for other mainnet wallets',
      coinFilter: (coin) => utxolib.isMainnet(coin.network),
      walletFilter: (w) => {
        const isHotBitcoin = w.options.type === 'hot'; // This will be bitcoin hot wallets
        const isDistributedCustody = w.options.subType === 'distributedCustody';
        const hasMusigKpFlag = Boolean(w.options.walletFlags?.some((f) => f.name === 'musigKp' && f.value === 'true'));
        // Only test "other" wallets - exclude the special cases
        return !isHotBitcoin && !isDistributedCustody && !hasMusigKpFlag;
      },
      expectedTxFormat: undefined,
    });

    // Test explicitly requested formats
    runTest({
      description: 'should respect explicitly requested legacy format',
      expectedTxFormat: 'legacy',
      requestedTxFormat: 'legacy',
    });

    runTest({
      description: 'should respect explicitly requested psbt format',
      expectedTxFormat: 'psbt',
      requestedTxFormat: 'psbt',
    });
  });
});
