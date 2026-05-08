import * as crypto from 'crypto';
import { fixedScriptWallet, BIP32 } from '@bitgo/wasm-utxo';
import { WalletUnspent } from '../src';

/**
 * Create a deterministic BIP32 key from a seed string.
 * Uses SHA256 hash of the seed as the BIP32 seed.
 */
export function getKey(seed: string): BIP32 {
  return BIP32.fromSeed(crypto.createHash('sha256').update(seed).digest());
}

/**
 * Create deterministic test wallet keys using wasm-utxo.
 * Replicates the behavior of utxo-lib's getDefaultWalletKeys().
 */
export function getTestWalletKeys(seed = 'default'): {
  rootWalletKeys: fixedScriptWallet.RootWalletKeys;
  signerXprvs: [string, string];
} {
  // Create BIP32 keys from deterministic seeds (same as utxo-lib testutil)
  const userKey = getKey(seed + '.0');
  const backupKey = getKey(seed + '.1');
  const bitgoKey = getKey(seed + '.2');

  const rootWalletKeys = fixedScriptWallet.RootWalletKeys.fromXpubs([
    userKey.neutered().toBase58(),
    backupKey.neutered().toBase58(),
    bitgoKey.neutered().toBase58(),
  ]);

  return {
    rootWalletKeys,
    signerXprvs: [userKey.toBase58(), bitgoKey.toBase58()],
  };
}

/**
 * Create a mock wallet unspent for testing.
 * @param value - Value in satoshis
 * @param chain - Chain code (default: 0)
 * @param index - Derivation index (default: 0)
 * @param vout - Output index for mock txid (default: 0)
 */
export function mockWalletUnspent(
  value: bigint,
  { chain = 0, index = 0, vout = 0 }: { chain?: number; index?: number; vout?: number } = {}
): WalletUnspent {
  // Create a deterministic mock txid based on vout (must be 64 hex chars)
  const mockTxid = vout.toString(16).padStart(64, '0');
  return {
    id: `${mockTxid}:${vout}`,
    value,
    chain,
    index,
  };
}
