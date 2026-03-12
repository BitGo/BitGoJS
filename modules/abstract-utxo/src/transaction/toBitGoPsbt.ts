import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import type { UtxoCoinName } from '../names';
import { stringToBufferTryFormats } from './decode';

export type BitGoPsbt = fixedScriptWallet.BitGoPsbt;

export function toBitGoPsbt(psbt: string, coinName: UtxoCoinName): BitGoPsbt {
  return fixedScriptWallet.BitGoPsbt.fromBytes(stringToBufferTryFormats(psbt), coinName);
}

export function getVSize(psbt: BitGoPsbt): number {
  return fixedScriptWallet.Dimensions.fromPsbt(psbt).getVSize();
}
