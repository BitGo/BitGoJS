import { Argv, CommandModule } from 'yargs';
import { withPsbt, WithPsbtOptions, withPsbtOptions } from './withPsbt';
import * as utxolib from '@bitgo/utxo-lib';
import { toUtxoPsbt, toWrappedPsbt } from './wrap';

type ArgsFinalizePsbt = WithPsbtOptions & {
  extract: boolean;
};

export function finalizeWithWrappedPsbt(psbt: utxolib.bitgo.UtxoPsbt | utxolib.Psbt): void {
  const wrappedPsbt = toWrappedPsbt(psbt);
  wrappedPsbt.finalize();
  const unwrappedPsbt = toUtxoPsbt(wrappedPsbt);
  for (let i = 0; i < psbt.data.inputs.length; i++) {
    psbt.data.inputs[i] = unwrappedPsbt.data.inputs[i];
  }
}

export const cmdFinalize: CommandModule<unknown, ArgsFinalizePsbt> = {
  command: 'finalize [psbt]',
  describe: 'finalize psbt',
  builder(b: Argv<unknown>): Argv<ArgsFinalizePsbt> {
    return b.options(withPsbtOptions).option('extract', { type: 'boolean', default: false });
  },
  async handler(argv) {
    await withPsbt(argv, async function (psbt) {
      finalizeWithWrappedPsbt(psbt);
      if (argv.extract) {
        return psbt.extractTransaction().toBuffer();
      }
      return psbt;
    });
  },
};

export const cmdExtract: CommandModule<unknown, WithPsbtOptions> = {
  command: 'extract [psbt]',
  describe: 'extract transaction from psbt',
  builder(b: Argv<unknown>): Argv<WithPsbtOptions> {
    return b.options(withPsbtOptions);
  },
  async handler(argv) {
    await withPsbt(argv, async function (psbt) {
      return psbt.extractTransaction().toBuffer();
    });
  },
};
