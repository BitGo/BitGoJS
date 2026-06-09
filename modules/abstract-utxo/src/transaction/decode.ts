import * as utxolib from '@bitgo/utxo-lib';
import { fixedScriptWallet, hasPsbtMagic, Psbt as WasmPsbt, utxolibCompat } from '@bitgo/wasm-utxo';

import { getNetworkFromCoinName, UtxoCoinName } from '../names';

import { BitGoPsbt } from './types';

type BufferEncoding = 'hex' | 'base64';

export function stringToBufferTryFormats(input: string, formats: BufferEncoding[] = ['hex', 'base64']): Buffer {
  for (const format of formats) {
    const buffer = Buffer.from(input, format);
    const bufferToString = buffer.toString(format);
    if (
      (format === 'base64' && bufferToString === input) ||
      (format === 'hex' && bufferToString === input.toLowerCase())
    ) {
      return buffer;
    }
  }

  throw new Error('input must be a valid hex or base64 string');
}

function toNetworkName(coinName: UtxoCoinName): utxolibCompat.UtxolibName {
  const network = getNetworkFromCoinName(coinName);
  const networkName = utxolib.getNetworkName(network);
  if (!networkName) {
    throw new Error(`Invalid coinName: ${coinName}`);
  }
  return networkName;
}

export function decodePsbt(psbt: string | Buffer, coinName: UtxoCoinName): BitGoPsbt {
  if (typeof psbt === 'string') {
    psbt = Buffer.from(psbt, 'hex');
  }
  return fixedScriptWallet.BitGoPsbt.fromBytes(psbt, toNetworkName(coinName));
}

export type PrebuildLike = {
  txHex?: string;
  txBase64?: string;
  txHexPsbt?: string;
};

/**
 * Decode a prebuild's PSBT bytes directly into a wasm-utxo descriptor `Psbt`.
 *
 * Skips the `fixedScriptWallet.BitGoPsbt` intermediate that `decodeTransactionFromPrebuild`
 * + `toWasmPsbt` would otherwise round-trip through for descriptor flows.
 */
export function decodeDescriptorPsbt(prebuild: PrebuildLike): WasmPsbt {
  const s = prebuild.txHexPsbt ?? prebuild.txHex ?? prebuild.txBase64;
  if (!s) {
    throw new Error('missing required txHex or txBase64 property');
  }
  const bytes = stringToBufferTryFormats(s, ['hex', 'base64']);
  if (!hasPsbtMagic(bytes)) {
    throw new Error('descriptor wallets require PSBT format transactions');
  }
  return WasmPsbt.deserialize(bytes);
}

export function encodeTransaction(transaction: fixedScriptWallet.BitGoPsbt): Buffer {
  return Buffer.from(transaction.serialize());
}
