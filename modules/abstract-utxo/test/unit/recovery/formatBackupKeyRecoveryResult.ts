import assert from 'node:assert/strict';

import { Triple } from '@bitgo/sdk-core';
import { BIP32, fixedScriptWallet, hasPsbtMagic } from '@bitgo/wasm-utxo';

import {
  backupKeyRecoveryWithWalletUnspents,
  BackupKeyRecoveryTransansaction,
  formatBackupKeyRecoveryResult,
  FormattedOfflineVaultTxInfo,
} from '../../../src';
import type { WalletUnspent } from '../../../src/unspent';
import {
  assertEqualJSON,
  assertHasProperty,
  createWasmWalletKeys,
  getDefaultWasmWalletKeys,
  getFixture,
  getWalletAddress,
  toUnspent,
  utxoCoins,
} from '../util';

// Use tbtc for all tests - formatting logic doesn't vary by coin
const coin = utxoCoins.find((c) => c.getChain() === 'tbtc')!;
const scriptType = 'p2shP2wsh' as const;

// Get default wasm wallet keys (xpubs and xprivs)
const { walletKeys: defaultWasmWalletKeys, xpubs, xprivs } = getDefaultWasmWalletKeys();

/**
 * Build signing keys triple with specified neuter options.
 */
function buildSigningKeys(options: { neuterUser?: boolean; neuterBackup?: boolean }): Triple<BIP32> {
  return [
    options.neuterUser ? xpubs[0] : xprivs[0],
    options.neuterBackup ? xpubs[1] : xprivs[1],
    xpubs[2], // bitgo is always xpub
  ];
}

function createTestUnspents(): WalletUnspent<bigint>[] {
  return [
    toUnspent({ scriptType, value: BigInt(1e8) }, 0, coin.name, defaultWasmWalletKeys),
    toUnspent({ scriptType, value: BigInt(2e8) }, 0, coin.name, defaultWasmWalletKeys),
  ];
}

/**
 * Clone a PSBT - necessary because formatBackupKeyRecoveryResult mutates when finalizing.
 */
function clonePsbt(psbt: fixedScriptWallet.BitGoPsbt): fixedScriptWallet.BitGoPsbt {
  return fixedScriptWallet.BitGoPsbt.fromBytes(psbt.serialize(), coin.name);
}

describe('formatBackupKeyRecoveryResult', function () {
  const { walletKeys: externalWallet } = createWasmWalletKeys('external');
  const recoveryDestination = getWalletAddress(coin.name, externalWallet);
  const feeRateSatVB = 100;

  describe('unsigned sweep (no signatures)', function () {
    let psbt: fixedScriptWallet.BitGoPsbt;
    let signingKeys: Triple<BIP32>;
    let unspents: WalletUnspent<bigint>[];

    before(function () {
      unspents = createTestUnspents();
      signingKeys = buildSigningKeys({ neuterUser: true, neuterBackup: true });
      psbt = backupKeyRecoveryWithWalletUnspents(
        coin.name,
        { walletKeys: defaultWasmWalletKeys, keys: signingKeys, recoveryDestination, feeRateSatVB },
        unspents
      );
    });

    it('returns FormattedOfflineVaultTxInfo with PSBT hex', function () {
      const result = formatBackupKeyRecoveryResult(coin, clonePsbt(psbt), {
        walletKeys: defaultWasmWalletKeys,
        keys: signingKeys,
        recoveryDestination,
        unspents,
      }) as FormattedOfflineVaultTxInfo;

      assertHasProperty(result, 'txHex');
      assertHasProperty(result, 'txInfo');
      assertHasProperty(result, 'feeInfo');
      assertHasProperty(result, 'coin');
      assert.strictEqual(result.coin!, coin.getChain());

      const txBuf = Buffer.from(result.txHex, 'hex');
      assert.strictEqual(hasPsbtMagic(txBuf), true);
    });

    it('matches fixture', async function () {
      const result = formatBackupKeyRecoveryResult(coin, clonePsbt(psbt), {
        walletKeys: defaultWasmWalletKeys,
        keys: signingKeys,
        recoveryDestination,
        unspents,
      });
      const fixture = await getFixture(coin, 'recovery/formatBackupKeyRecovery-unsigned', result);
      assertEqualJSON(result, fixture);
    });
  });

  describe('KRS recovery with keyternal (legacy format)', function () {
    let psbt: fixedScriptWallet.BitGoPsbt;
    let signingKeys: Triple<BIP32>;
    let unspents: WalletUnspent<bigint>[];

    before(function () {
      unspents = createTestUnspents();
      signingKeys = buildSigningKeys({ neuterUser: false, neuterBackup: true });
      psbt = backupKeyRecoveryWithWalletUnspents(
        coin.name,
        { walletKeys: defaultWasmWalletKeys, keys: signingKeys, recoveryDestination, feeRateSatVB },
        unspents
      );
    });

    it('returns BackupKeyRecoveryTransansaction with legacy tx hex', function () {
      const result = formatBackupKeyRecoveryResult(coin, clonePsbt(psbt), {
        walletKeys: defaultWasmWalletKeys,
        keys: signingKeys,
        recoveryDestination,
        krsProvider: 'keyternal',
        backupKey: 'test-backup-key',
        unspents,
      }) as BackupKeyRecoveryTransansaction;

      assertHasProperty(result, 'transactionHex');
      assertHasProperty(result, 'coin');
      assertHasProperty(result, 'backupKey');
      assertHasProperty(result, 'recoveryAmount');
      assertHasProperty(result, 'inputs');
      assert.strictEqual(result.backupKey!, 'test-backup-key');

      const txBuf = Buffer.from(result.transactionHex!, 'hex');
      assert.strictEqual(hasPsbtMagic(txBuf), false);
    });

    it('matches fixture', async function () {
      const result = formatBackupKeyRecoveryResult(coin, clonePsbt(psbt), {
        walletKeys: defaultWasmWalletKeys,
        keys: signingKeys,
        recoveryDestination,
        krsProvider: 'keyternal',
        backupKey: 'test-backup-key',
        unspents,
      });
      const fixture = await getFixture(coin, 'recovery/formatBackupKeyRecovery-krs-keyternal', result);
      assertEqualJSON(result, fixture);
    });
  });

  describe('KRS recovery with dai (PSBT format)', function () {
    let psbt: fixedScriptWallet.BitGoPsbt;
    let signingKeys: Triple<BIP32>;
    let unspents: WalletUnspent<bigint>[];

    before(function () {
      unspents = createTestUnspents();
      signingKeys = buildSigningKeys({ neuterUser: false, neuterBackup: true });
      psbt = backupKeyRecoveryWithWalletUnspents(
        coin.name,
        { walletKeys: defaultWasmWalletKeys, keys: signingKeys, recoveryDestination, feeRateSatVB },
        unspents
      );
    });

    it('returns BackupKeyRecoveryTransansaction with PSBT hex', function () {
      const result = formatBackupKeyRecoveryResult(coin, clonePsbt(psbt), {
        walletKeys: defaultWasmWalletKeys,
        keys: signingKeys,
        recoveryDestination,
        krsProvider: 'dai',
        backupKey: 'test-backup-key',
        unspents,
      }) as BackupKeyRecoveryTransansaction;

      assertHasProperty(result, 'transactionHex');
      assertHasProperty(result, 'coin');
      assertHasProperty(result, 'backupKey');
      assertHasProperty(result, 'recoveryAmount');
      assert.strictEqual(result.backupKey!, 'test-backup-key');

      const txBuf = Buffer.from(result.transactionHex!, 'hex');
      assert.strictEqual(hasPsbtMagic(txBuf), true);
      assert.strictEqual(result.inputs, undefined);
    });

    it('matches fixture', async function () {
      const result = formatBackupKeyRecoveryResult(coin, clonePsbt(psbt), {
        walletKeys: defaultWasmWalletKeys,
        keys: signingKeys,
        recoveryDestination,
        krsProvider: 'dai',
        backupKey: 'test-backup-key',
        unspents,
      });
      const fixture = await getFixture(coin, 'recovery/formatBackupKeyRecovery-krs-dai', result);
      assertEqualJSON(result, fixture);
    });
  });

  describe('full recovery (user + backup signatures)', function () {
    let psbt: fixedScriptWallet.BitGoPsbt;
    let signingKeys: Triple<BIP32>;
    let unspents: WalletUnspent<bigint>[];

    before(function () {
      unspents = createTestUnspents();
      signingKeys = buildSigningKeys({ neuterUser: false, neuterBackup: false });
      psbt = backupKeyRecoveryWithWalletUnspents(
        coin.name,
        { walletKeys: defaultWasmWalletKeys, keys: signingKeys, recoveryDestination, feeRateSatVB },
        unspents
      );
    });

    it('returns BackupKeyRecoveryTransansaction with finalized tx hex', function () {
      const result = formatBackupKeyRecoveryResult(coin, clonePsbt(psbt), {
        walletKeys: defaultWasmWalletKeys,
        keys: signingKeys,
        recoveryDestination,
        unspents,
      }) as BackupKeyRecoveryTransansaction;

      assertHasProperty(result, 'transactionHex');
      assertHasProperty(result, 'inputs');

      const txBuf = Buffer.from(result.transactionHex!, 'hex');
      assert.strictEqual(hasPsbtMagic(txBuf), false);
    });

    it('matches fixture', async function () {
      const result = formatBackupKeyRecoveryResult(coin, clonePsbt(psbt), {
        walletKeys: defaultWasmWalletKeys,
        keys: signingKeys,
        recoveryDestination,
        unspents,
      });
      const fixture = await getFixture(coin, 'recovery/formatBackupKeyRecovery-fullySigned', result);
      assertEqualJSON(result, fixture);
    });
  });
});
