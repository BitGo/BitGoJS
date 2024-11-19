import * as utxolib from '@bitgo/utxo-lib';
import { Psbt } from '@bitgo/wasm-miniscript';

export function toWrappedPsbt(psbt: utxolib.bitgo.UtxoPsbt | utxolib.Psbt | Buffer | Uint8Array): Psbt {
  if (psbt instanceof utxolib.bitgo.UtxoPsbt || psbt instanceof utxolib.Psbt) {
    psbt = psbt.toBuffer();
  }
  if (psbt instanceof Buffer || psbt instanceof Uint8Array) {
    return Psbt.deserialize(psbt);
  }
  throw new Error('Invalid input');
}

export function toUtxoPsbt(psbt: Psbt | Buffer | Uint8Array): utxolib.bitgo.UtxoPsbt {
  if (psbt instanceof Psbt) {
    psbt = psbt.serialize();
  }
  if (psbt instanceof Buffer || psbt instanceof Uint8Array) {
    return utxolib.bitgo.UtxoPsbt.fromBuffer(Buffer.from(psbt), {
      network: utxolib.networks.bitcoin,
    });
  }
  throw new Error('Invalid input');
}
