import { Psbt as WasmPsbt } from '@bitgo/wasm-miniscript';
import * as utxolib from '@bitgo/utxo-lib';

export function toWrappedPsbt(psbt: utxolib.bitgo.UtxoPsbt | utxolib.Psbt | Buffer | Uint8Array): WasmPsbt {
  if (psbt instanceof utxolib.bitgo.UtxoPsbt || psbt instanceof utxolib.Psbt) {
    psbt = psbt.toBuffer();
  }
  if (psbt instanceof Buffer || psbt instanceof Uint8Array) {
    return WasmPsbt.deserialize(psbt);
  }
  throw new Error('Invalid input');
}

export function toUtxoPsbt(psbt: WasmPsbt | Buffer | Uint8Array, network: utxolib.Network): utxolib.bitgo.UtxoPsbt {
  if (psbt instanceof WasmPsbt) {
    psbt = psbt.serialize();
  }
  if (psbt instanceof Buffer || psbt instanceof Uint8Array) {
    return utxolib.bitgo.UtxoPsbt.fromBuffer(Buffer.from(psbt), { network });
  }
  throw new Error('Invalid input');
}

/**
 * Use `wasm-miniscript` to finalize a PSBT.
 * Miniscript based finalization is more powerful than bitcoinjs-lib's / utxo-lib's finalization
 * and can finalize more complex scripts (e.g. miniscript descriptors).
 * @param psbt
 */
export function finalizePsbt(psbt: utxolib.bitgo.UtxoPsbt): void {
  if (utxolib.getMainnet(psbt.network) !== utxolib.networks.bitcoin) {
    throw new Error('only bitcoin and testnet are supported');
  }
  const wrappedPsbt = toWrappedPsbt(psbt);
  wrappedPsbt.finalize();
  const unwrappedPsbt = toUtxoPsbt(wrappedPsbt, psbt.network);
  for (let i = 0; i < psbt.data.inputs.length; i++) {
    psbt.data.inputs[i] = unwrappedPsbt.data.inputs[i];
  }
}
