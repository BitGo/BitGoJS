import assert from 'assert';

import * as sinon from 'sinon';
import nock = require('nock');
import { BIP32 } from '@bitgo/wasm-utxo';
import { Triple } from '@bitgo/sdk-core';

import {
  backupKeyRecovery,
  BackupKeyRecoveryTransansaction,
  CoingeckoApi,
  FormattedOfflineVaultTxInfo,
} from '../../../src';
import type { Unspent } from '../../../src/unspent';
import {
  defaultBitGo,
  encryptKeychain,
  getDefaultWasmWalletKeys,
  getMinUtxoCoins,
  getWalletAddress,
  getWalletKeys,
  keychainsBase58,
  toUnspentWithPrevTx,
  WalletUnspentWithPrevTx,
} from '../util';

import { MockRecoveryProvider } from './mock';

type ScriptType2Of3 = 'p2sh' | 'p2shP2wsh' | 'p2wsh' | 'p2tr' | 'p2trMusig2';

nock.disableNetConnect();

const walletPassphrase = 'lol';

type NamedKeys = {
  userKey: string;
  backupKey: string;
  bitgoKey: string;
};

// Get default wasm wallet keys (xpubs, xprivs, and walletKeys)
const { walletKeys: wasmWalletKeys, xpubs, xprivs } = getDefaultWasmWalletKeys();

function getNamedKeys(keys: Triple<BIP32>, password: string): NamedKeys {
  function encode(k: BIP32): string {
    const base58 = k.toBase58();
    // Check if it's a public key
    const pubKeyMatch = keychainsBase58.find((kc) => kc.pub === base58);
    if (pubKeyMatch) {
      return base58;
    }
    // It's a private key - find and encrypt it
    const keyBase58 = keychainsBase58.find((kc) => kc.prv === base58);
    if (!keyBase58) {
      throw new Error('Key not found in keychainsBase58');
    }
    return encryptKeychain(password, keyBase58);
  }
  return {
    userKey: encode(keys[0]),
    backupKey: encode(keys[1]),
    bitgoKey: encode(keys[2]),
  };
}

function getKeysForFullSignedRecovery(password: string): NamedKeys {
  return getNamedKeys([xprivs[0], xprivs[1], xpubs[2]], password);
}

const keysFullSignedRecovery = getKeysForFullSignedRecovery(walletPassphrase);

/**
 * Tests for unspent gathering via backupKeyRecovery with MockRecoveryProvider.
 * This validates the address scanning and unspent collection logic separately
 * from the transaction building logic tested in backupKeyRecovery.ts.
 */
describe('Backup Key Recovery - Unspent Gathering', function () {
  const defaultFeeRateSatB = 100;

  getMinUtxoCoins().forEach((coin) => {
    describe(`Unspent Gathering [${coin.getChain()}]`, function () {
      const externalWallet = getWalletKeys('external');
      const recoveryDestination = getWalletAddress(coin.name, externalWallet);

      before('mock', function () {
        sinon.stub(CoingeckoApi.prototype, 'getUSDPrice').resolves(69_420);
      });

      after(function () {
        sinon.restore();
      });

      it('gathers unspents from recovery provider and builds transaction', async function () {
        this.timeout(10_000);
        // Use p2sh for all coins (universal support)
        const scriptTypes: ScriptType2Of3[] = ['p2sh'];

        // Create test unspents with prevTx using wasm-utxo only (no utxolib dependency)
        const testUnspents: WalletUnspentWithPrevTx<bigint>[] = scriptTypes.flatMap((scriptType, index) => [
          toUnspentWithPrevTx({ scriptType, value: BigInt(1e8) }, index, coin.name, wasmWalletKeys),
          toUnspentWithPrevTx({ scriptType, value: BigInt(2e8) }, index, coin.name, wasmWalletKeys),
        ]);

        // Convert to API format for BCH/BCHA if needed
        const mockedApiUnspents: Unspent<bigint>[] =
          coin.getChain() === 'bch' || coin.getChain() === 'bcha'
            ? testUnspents.map((u) => ({
                ...u,
                address: coin.canonicalAddress(u.address, 'cashaddr').split(':')[1],
              }))
            : testUnspents;

        const mockProvider = new MockRecoveryProvider(mockedApiUnspents);

        // Verify mock provider works correctly
        const fetchedUnspents = await mockProvider.getUnspentsForAddresses(mockedApiUnspents.map((u) => u.address));
        assert.strictEqual(fetchedUnspents.length, mockedApiUnspents.length);

        // Call backupKeyRecovery which should gather unspents via the mock provider
        const recovery = await backupKeyRecovery(coin, defaultBitGo, {
          walletPassphrase,
          recoveryDestination,
          scan: 5,
          ignoreAddressTypes: [],
          ...keysFullSignedRecovery,
          recoveryProvider: mockProvider,
          feeRate: defaultFeeRateSatB,
        });

        // Verify recovery succeeded (transaction hex indicates unspents were gathered)
        const txHex =
          (recovery as BackupKeyRecoveryTransansaction).transactionHex ??
          (recovery as FormattedOfflineVaultTxInfo).txHex;
        assert.ok(txHex, 'should have transaction hex from gathered unspents');
      });

      it('handles empty unspents from recovery provider', async function () {
        this.timeout(10_000);

        const mockProvider = new MockRecoveryProvider([]);

        await assert.rejects(async () => {
          await backupKeyRecovery(coin, defaultBitGo, {
            walletPassphrase,
            recoveryDestination,
            scan: 2,
            ignoreAddressTypes: [],
            ...keysFullSignedRecovery,
            recoveryProvider: mockProvider,
            feeRate: defaultFeeRateSatB,
          });
        }, /No input to recover/);
      });
    });
  });
});
