import assert from 'assert';

import { getSeed } from '@bitgo/sdk-test';
import { bip32 } from '@bitgo/utxo-lib';
import { BIP32 as WasmBIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';
import {
  buildSafeRecoverKeyParams,
  deriveSafeWalletKeys,
  RecoveryKeyMismatchError,
  type Secp256k1MultisigChildKeys,
  type Triple,
} from '@bitgo/sdk-core';

import { defaultBitGo, getMinUtxoCoins, getWalletAddress, toUnspentWithPrevTx } from '../util';
import type { WalletUnspentWithPrevTx } from '../util/unspents';
import type { Unspent } from '../../../src/unspent';

import { MockRecoveryProvider } from './mock';

// p2sh is universally supported; its inputs need a prev-tx the mock provider must serve.
const FUND_SCRIPT_TYPE = 'p2sh' as const;
const FUND_VALUE = BigInt(1e8);
const FEE_RATE_SAT_VB = 50;

/** Safe slot-1 (secp256k1Multisig) keycard roots: user and backup private, BitGo public-only. */
function getSafeRoots(): { user: string; backup: string; bitgo: string } {
  return {
    user: bip32.fromSeed(getSeed('safeRecovery/user')).toBase58(),
    backup: bip32.fromSeed(getSeed('safeRecovery/backup')).toBase58(),
    bitgo: bip32.fromSeed(getSeed('safeRecovery/bitgo')).neutered().toBase58(),
  };
}

function getSafeChildWalletKeys(userPrv: string, backupPrv: string, bitgoPub: string) {
  const triple = [userPrv, backupPrv, bitgoPub].map((k) => WasmBIP32.from(k)) as Triple<WasmBIP32>;
  // The derived child triplet is the wallet root, the same 'm/0/0' prefixes backupKeyRecovery applies.
  return fixedScriptWallet.RootWalletKeys.from({ triple, derivationPrefixes: ['m/0/0', 'm/0/0', 'm/0/0'] });
}

function getUnrelatedChildWalletKeys() {
  return getSafeChildWalletKeys(
    bip32.fromSeed(getSeed('safeRecovery/unrelated/user')).toBase58(),
    bip32.fromSeed(getSeed('safeRecovery/unrelated/backup')).toBase58(),
    bip32.fromSeed(getSeed('safeRecovery/unrelated/bitgo')).neutered().toBase58()
  );
}

getMinUtxoCoins().forEach((coin) => {
  describe(`Safe slot-1 recovery (UTXO) [${coin.getChain()}]`, function () {
    let derivedKeys: Secp256k1MultisigChildKeys;
    let walletAddress: string;
    let recoveryDestination: string;
    let unspents: Unspent<bigint>[];

    before(async function () {
      const derived = await deriveSafeWalletKeys({
        coin: coin.getChain(),
        slot: 'secp256k1Multisig',
        account: 0,
        roots: { secp256k1Multisig: getSafeRoots() },
      });
      if (derived.slot !== 'secp256k1Multisig') {
        throw new Error(`unexpected slot ${derived.slot}`);
      }
      derivedKeys = derived.keys;

      const childKeys = getSafeChildWalletKeys(derivedKeys.user.prv, derivedKeys.backup.prv, derivedKeys.bitgo.pub);
      // The derived child triplet is the wallet root: its first receive address anchors recovery.
      walletAddress = getWalletAddress(coin.name, childKeys);
      recoveryDestination = getWalletAddress(coin.name, getUnrelatedChildWalletKeys());

      const funded: WalletUnspentWithPrevTx<bigint> = toUnspentWithPrevTx(
        { scriptType: FUND_SCRIPT_TYPE, value: FUND_VALUE },
        0,
        coin.name,
        childKeys
      );
      // BCH's API format is prefix-less cashaddr; the scan queries that same format.
      unspents = [
        coin.getChain() === 'bch'
          ? { ...funded, address: coin.canonicalAddress(funded.address, 'cashaddr').split(':')[1] }
          : funded,
      ];
    });

    function getRecoverParams(walletAddressAnchor?: string) {
      return buildSafeRecoverKeyParams({
        bitgo: defaultBitGo,
        coin: coin.getChain(),
        mode: 'signed',
        slot: 'secp256k1Multisig',
        keys: derivedKeys,
        ...(walletAddressAnchor !== undefined ? { walletAddress: walletAddressAnchor } : {}),
      });
    }

    it('derives, anchors to the wallet address, and builds a signed sweep', async function () {
      const recoverParams = await getRecoverParams(walletAddress);
      const result = await coin.recover({
        ...recoverParams,
        recoveryDestination,
        ignoreAddressTypes: [],
        feeRate: FEE_RATE_SAT_VB,
        // ZEC: pre-NU7 height for v4 tx mechanics (ignored by other coins).
        blockHeight: 3146400,
        recoveryProvider: new MockRecoveryProvider(unspents),
      });

      if (!('transactionHex' in result)) {
        throw new Error('expected a signed recovery transaction');
      }
      assert.ok(
        result.inputs?.some((input) => input.id === unspents[0].id),
        'expected the funded unspent as sweep input'
      );
    });

    it('fails closed when the anchor does not match the derived wallet', async function () {
      const recoverParams = await getRecoverParams(getWalletAddress(coin.name, getUnrelatedChildWalletKeys()));

      await assert.rejects(
        () =>
          coin.recover({
            ...recoverParams,
            recoveryDestination,
            ignoreAddressTypes: [],
            feeRate: FEE_RATE_SAT_VB,
            blockHeight: 3146400,
            recoveryProvider: new MockRecoveryProvider(unspents),
          }),
        RecoveryKeyMismatchError
      );
    });
  });
});
