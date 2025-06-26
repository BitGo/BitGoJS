import * as utxolib from '@bitgo/utxo-lib';
import * as WasmMiniscript from '@bitgo/wasm-miniscript';

utxolib.initializeMiniscript(WasmMiniscript);

export function updateInputWithDescriptor(
  psbt: utxolib.Psbt,
  inputIndex: number,
  descriptor: WasmMiniscript.Descriptor
): void {
  const wrappedPsbt = WasmMiniscript.Psbt.deserialize(psbt.toBuffer());
  wrappedPsbt.updateInputWithDescriptor(inputIndex, descriptor);
  psbt.data.inputs[inputIndex] = utxolib.bitgo.UtxoPsbt.fromBuffer(Buffer.from(wrappedPsbt.serialize()), {
    network: utxolib.networks.bitcoin,
  }).data.inputs[inputIndex];
}

export function finalizePsbt(psbt: utxolib.Psbt): utxolib.bitgo.UtxoPsbt {
  const wrappedPsbt = WasmMiniscript.Psbt.deserialize(psbt.toBuffer());
  wrappedPsbt.finalize();
  return utxolib.bitgo.UtxoPsbt.fromBuffer(Buffer.from(wrappedPsbt.serialize()), {
    network: utxolib.networks.bitcoin,
  });
}
