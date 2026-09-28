/**
 * @prettier
 *
 * Safe (slot-1) UTXO recovery adapter: maps a Safe child triplet onto the existing
 * `backupKeyRecovery` engine for funding checks and recovery.
 */
import {
  SafeChildTriplet,
  SafeChildTripletPubs,
  assertSafeRecoverySupported,
  onchainSlotForCoin,
} from '@bitgo/sdk-lib-safes';
import { ErrorNoInputToRecover, Triple } from '@bitgo/sdk-core';
import { BIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin } from '../abstractUtxoCoin';
import { generateAddressWithChainAndIndex } from '../address';

import { backupKeyRecovery, DEFAULT_RECOVERY_FEERATE_SAT_VBYTE_V2, RecoverParams } from './backupKeyRecovery';

export type SafeWalletFundingStatus = 'funded' | 'empty' | 'unknown';
export type SafeWalletRecoveryMode = 'signed' | 'unsigned';

export type SafeRecoveryOptionsBase = Pick<RecoverParams, 'scan' | 'apiKey' | 'recoveryProvider'>;

export type RecoverSafeWalletOptions = {
  mode: SafeWalletRecoveryMode;
  recoveryDestination: string;
} & SafeRecoveryOptionsBase &
  Pick<RecoverParams, 'feeRate'>;

function withSafeRecoveryGuard<T>(
  coin: AbstractUtxoCoin,
  options: SafeRecoveryOptionsBase,
  fn: () => Promise<T>
): Promise<T> {
  assertSafeRecoverySupported(onchainSlotForCoin(coin.getChain()), 'utxo', coin.getChain());
  if (options.scan !== undefined && options.scan <= 0) {
    throw new Error('scan must be a positive integer');
  }
  return fn();
}

/**
 * Derive the wallet's own first external address to satisfy `backupKeyRecovery`'s
 * destination validation. Never broadcast, never returned to the caller.
 */
function synthesizeDestination(coin: AbstractUtxoCoin, triplet: SafeChildTripletPubs): string {
  const walletKeys = fixedScriptWallet.RootWalletKeys.from({
    triple: [triplet.user.pub, triplet.backup.pub, triplet.bitgo.pub].map((pub) => BIP32.from(pub)) as Triple<BIP32>,
    derivationPrefixes: ['m/0/0', 'm/0/0', 'm/0/0'],
  });
  return generateAddressWithChainAndIndex(
    coin.wasmName,
    walletKeys,
    fixedScriptWallet.ChainCode.value('p2sh', 'external'),
    0,
    undefined
  );
}

export async function determineSafeWalletFunding(
  coin: AbstractUtxoCoin,
  triplet: SafeChildTripletPubs,
  options: SafeRecoveryOptionsBase = {}
): Promise<SafeWalletFundingStatus> {
  return withSafeRecoveryGuard(coin, options, async () => {
    const recoveryParams: RecoverParams = {
      ...options,
      recoveryDestination: synthesizeDestination(coin, triplet),
      userKey: triplet.user.pub,
      backupKey: triplet.backup.pub,
      bitgoKey: triplet.bitgo.pub,
      ignoreAddressTypes: [],
      feeRate: DEFAULT_RECOVERY_FEERATE_SAT_VBYTE_V2,
    };

    try {
      const result = await coin.recover(recoveryParams);
      return result && 'txHex' in result && typeof result.txHex === 'string' && result.txHex.length > 0
        ? 'funded'
        : 'unknown';
    } catch (err) {
      return err instanceof ErrorNoInputToRecover ? 'empty' : 'unknown';
    }
  });
}

export async function recoverSafeWallet(
  coin: AbstractUtxoCoin,
  triplet: SafeChildTriplet,
  options: RecoverSafeWalletOptions
): ReturnType<typeof backupKeyRecovery> {
  return withSafeRecoveryGuard(coin, options, async () => {
    const { mode, recoveryDestination, ...rest } = options;
    const recoveryParams: RecoverParams = {
      ...rest,
      recoveryDestination,
      userKey: mode === 'signed' ? triplet.user.prv : triplet.user.pub,
      backupKey: mode === 'signed' ? triplet.backup.prv : triplet.backup.pub,
      bitgoKey: triplet.bitgo.pub,
      ignoreAddressTypes: [],
    };

    return coin.recover(recoveryParams);
  });
}
