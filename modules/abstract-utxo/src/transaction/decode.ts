import * as utxolib from '@bitgo/utxo-lib';
import { fixedScriptWallet, utxolibCompat } from '@bitgo/wasm-utxo';

import { getNetworkFromCoinName, UtxoCoinName } from '../names';

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

function toNetworkName(coinName: UtxoCoinName): utxolibCompat.UtxolibName {
  const network = getNetworkFromCoinName(coinName);
  const networkName = utxolib.getNetworkName(network);
  if (!networkName) {
    throw new Error(`Invalid coinName: ${coinName}`);
  }
  return networkName;
}

export function decodePsbtWith(
  psbt: string | Buffer,
  coinName: UtxoCoinName,
  backend: 'utxolib'
): utxolib.bitgo.UtxoPsbt;
export function decodePsbtWith(
  psbt: string | Buffer,
  coinName: UtxoCoinName,
  backend: 'wasm-utxo'
): fixedScriptWallet.BitGoPsbt;
export function decodePsbtWith(
  psbt: string | Buffer,
  coinName: UtxoCoinName,
  backend: SdkBackend
): utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt;
export function decodePsbtWith(
  psbt: string | Buffer,
  coinName: UtxoCoinName,
  backend: SdkBackend
): utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt {
  if (typeof psbt === 'string') {
    psbt = Buffer.from(psbt, 'hex');
  }
  if (backend === 'utxolib') {
    const network = getNetworkFromCoinName(coinName);
    return utxolib.bitgo.createPsbtFromBuffer(psbt, network);
  } else {
    return fixedScriptWallet.BitGoPsbt.fromBytes(psbt, toNetworkName(coinName));
  }
}

export function encodeTransaction(
  transaction: utxolib.bitgo.UtxoTransaction<bigint | number> | utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt
): Buffer {
  if (transaction instanceof utxolib.bitgo.UtxoTransaction) {
    return transaction.toBuffer();
  } else if (transaction instanceof utxolib.bitgo.UtxoPsbt) {
    return transaction.toBuffer();
  } else {
    return Buffer.from(transaction.serialize());
  }
}
