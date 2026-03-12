import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import type { UtxoCoinName } from '../../names';
import type { BitGoPsbt } from '../toBitGoPsbt';
import { getReplayProtectionPubkeys } from './replayProtection';

export interface Musig2Participant<T> {
  getMusig2Nonces(psbt: T, walletId: string): Promise<T>;
}

/**
 * Check if a PSBT has any key-path spend (MuSig2) inputs.
 * Extracts wallet keys from the PSBT's global xpubs — no external keys required.
 */
export function hasKeyPathSpendInput(psbt: BitGoPsbt, coinName: UtxoCoinName): boolean {
  const xpubs = psbt.getGlobalXpubs();
  const walletKeys = fixedScriptWallet.getWalletKeysFromPsbt(psbt, xpubs);
  const replayProtection = { publicKeys: getReplayProtectionPubkeys(coinName) };
  const parsed = psbt.parseTransactionWithWalletKeys(walletKeys, { replayProtection });
  return parsed.inputs.some((input) => input.scriptType === 'p2trMusig2KeyPath');
}
