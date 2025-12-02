import * as utxolib from '@bitgo/utxo-lib';
import { fixedScriptWallet, utxolibCompat } from '@bitgo/wasm-utxo';

import { SdkBackend } from './types';

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

function toNetworkName(network: utxolib.Network): utxolibCompat.UtxolibName {
  const networkName = utxolib.getNetworkName(network);
  if (!networkName) {
    throw new Error(`Invalid network: ${network}`);
  }
  return networkName;
}

export function decodePsbtWith(
  psbt: string | Buffer,
  network: utxolib.Network,
  backend: 'utxolib'
): utxolib.bitgo.UtxoPsbt;
export function decodePsbtWith(
  psbt: string | Buffer,
  network: utxolib.Network,
  backend: 'wasm-utxo'
): fixedScriptWallet.BitGoPsbt;
export function decodePsbtWith(
  psbt: string | Buffer,
  network: utxolib.Network,
  backend: SdkBackend
): utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt;
export function decodePsbtWith(
  psbt: string | Buffer,
  network: utxolib.Network,
  backend: SdkBackend
): utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt {
  if (typeof psbt === 'string') {
    psbt = Buffer.from(psbt, 'hex');
  }
  if (backend === 'utxolib') {
    return utxolib.bitgo.createPsbtFromBuffer(psbt, network);
  } else {
    return fixedScriptWallet.BitGoPsbt.fromBytes(psbt, toNetworkName(network));
  }
}
