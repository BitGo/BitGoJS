import { promises as fs } from 'fs';
import { Descriptor, Psbt } from '@bitgo/wasm-miniscript';
import * as utxolib from '@bitgo/utxo-lib';

function encode(path: string, defaultValue: unknown): string {
  if (path.endsWith('.txt')) {
    return String(defaultValue);
  }
  if (path.endsWith('.json')) {
    return JSON.stringify(defaultValue, null, 2) + '\n';
  }
  throw new Error(`unrecognized path ${path}`);
}

function decode(path: string, v: string): unknown {
  if (path.endsWith('.txt')) {
    return v;
  }
  if (path.endsWith('.json')) {
    return JSON.parse(v);
  }
  throw new Error(`unrecognized path ${path}`);
}

export async function getFixture(path: string, defaultValue: unknown): Promise<unknown> {
  try {
    return decode(path, await fs.readFile(path, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      await fs.writeFile(path, encode(path, defaultValue), 'utf8');
      throw new Error(`wrote default value for ${path}`);
    }
    throw e;
  }
}

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
