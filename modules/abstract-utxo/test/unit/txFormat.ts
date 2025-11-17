import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { Wallet } from '@bitgo/sdk-core';

import { AbstractUtxoCoin, TxFormat } from '../../src';

import { utxoCoins, defaultBitGo } from './util';

type WalletOptions = {
  type?: 'hot' | 'cold' | 'custodial' | 'custodialPaired' | 'trading';
  subType?: string;
  walletFlags?: Array<{ name: string; value: string }>;
};

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
 * Helper function to run a txFormat test with named arguments
 */
function runTest(params: {
  description: string;
  walletOptions: WalletOptions;
  expectedTxFormat: TxFormat | undefined | ((coin: AbstractUtxoCoin) => TxFormat | undefined);
  coinFilter?: (coin: AbstractUtxoCoin) => boolean;
  requestedTxFormat?: TxFormat;
}): void {
  it(params.description, function () {
    for (const coin of utxoCoins) {
      // Skip coins that don't match the filter
      if (params.coinFilter && !params.coinFilter(coin)) {
        continue;
      }

      const wallet = createMockWallet(coin, params.walletOptions);
      const txFormat = getTxFormat(coin, wallet, params.requestedTxFormat);

      const expectedTxFormat =
        typeof params.expectedTxFormat === 'function' ? params.expectedTxFormat(coin) : params.expectedTxFormat;

      assert.strictEqual(
        txFormat,
        expectedTxFormat,
        `${params.description} - ${coin.getChain()}: expected ${expectedTxFormat}, got ${txFormat}`
      );
    }
  });
}

describe('txFormat', function () {
  describe('getDefaultTxFormat', function () {
    // Testnet hot wallets default to PSBT (except ZCash)
    runTest({
      description: 'should default to psbt for testnet hot wallets (except zcash)',
      walletOptions: { type: 'hot' },
      expectedTxFormat: (coin) => {
        const isZcash = utxolib.getMainnet(coin.network) === utxolib.networks.zcash;
        // ZCash is excluded from PSBT default due to PSBT support issues (BTC-1322)
        return isZcash ? undefined : 'psbt';
      },
      coinFilter: (coin) => utxolib.isTestnet(coin.network),
    });

    // Mainnet Bitcoin hot wallets default to PSBT
    runTest({
      description: 'should default to psbt for mainnet bitcoin hot wallets',
      walletOptions: { type: 'hot' },
      expectedTxFormat: 'psbt',
      coinFilter: (coin) =>
        utxolib.isMainnet(coin.network) && utxolib.getMainnet(coin.network) === utxolib.networks.bitcoin,
    });

    // Mainnet non-Bitcoin hot wallets do NOT default to PSBT
    runTest({
      description: 'should not default to psbt for mainnet non-bitcoin hot wallets',
      walletOptions: { type: 'hot' },
      expectedTxFormat: undefined,
      coinFilter: (coin) =>
        utxolib.isMainnet(coin.network) && utxolib.getMainnet(coin.network) !== utxolib.networks.bitcoin,
    });

    // Cold wallets default to PSBT
    runTest({
      description: 'should default to psbt for testnet cold wallets as well',
      walletOptions: { type: 'cold' },
      coinFilter: (coin) => utxolib.isTestnet(coin.network),
      expectedTxFormat: (coin) => {
        const isZcash = utxolib.getMainnet(coin.network) === utxolib.networks.zcash;
        // ZCash is excluded from PSBT default due to PSBT support issues (BTC-1322)
        return isZcash ? undefined : 'psbt';
      },
    });

    // DistributedCustody wallets default to PSBT
    runTest({
      description: 'should default to psbt for distributedCustody wallets',
      walletOptions: { type: 'cold', subType: 'distributedCustody' },
      expectedTxFormat: (coin) => {
        const isZcash = utxolib.getMainnet(coin.network) === utxolib.networks.zcash;
        // ZCash is excluded from PSBT default due to PSBT support issues (BTC-1322)
        return isZcash ? undefined : 'psbt';
      },
    });

    // Wallets with musigKp flag default to PSBT
    runTest({
      description: 'should default to psbt for wallets with musigKp flag',
      walletOptions: { type: 'cold', walletFlags: [{ name: 'musigKp', value: 'true' }] },
      expectedTxFormat: (coin) => {
        const isZcash = utxolib.getMainnet(coin.network) === utxolib.networks.zcash;
        // ZCash is excluded from PSBT default due to PSBT support issues (BTC-1322)
        return isZcash ? undefined : 'psbt';
      },
    });

    // Explicitly specified legacy format is respected
    runTest({
      description: 'should respect explicitly specified legacy txFormat',
      walletOptions: { type: 'hot' },
      expectedTxFormat: 'legacy',
      requestedTxFormat: 'legacy',
    });

    // Explicitly specified psbt format is respected
    runTest({
      description: 'should respect explicitly specified psbt txFormat',
      walletOptions: { type: 'cold' },
      expectedTxFormat: 'psbt',
      requestedTxFormat: 'psbt',
    });
  });
});
