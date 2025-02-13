import { Descriptor, Psbt } from '@bitgo/wasm-miniscript';
import * as utxolib from '@bitgo/utxo-lib';

export function updateInputWithDescriptor(psbt: utxolib.Psbt, inputIndex: number, descriptor: Descriptor): void {
  const wrappedPsbt = Psbt.deserialize(psbt.toBuffer());
  wrappedPsbt.updateInputWithDescriptor(inputIndex, descriptor);
  psbt.data.inputs[inputIndex] = utxolib.bitgo.UtxoPsbt.fromBuffer(Buffer.from(wrappedPsbt.serialize()), {
    network: utxolib.networks.bitcoin,
  }).data.inputs[inputIndex];
}

export function finalizePsbt(psbt: utxolib.Psbt): utxolib.bitgo.UtxoPsbt {
  const wrappedPsbt = Psbt.deserialize(psbt.toBuffer());
  wrappedPsbt.finalize();
  return utxolib.bitgo.UtxoPsbt.fromBuffer(Buffer.from(wrappedPsbt.serialize()), {
    network: utxolib.networks.bitcoin,
  });
}
