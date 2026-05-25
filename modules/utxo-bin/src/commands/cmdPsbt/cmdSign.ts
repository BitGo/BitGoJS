import { Argv, CommandModule } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';

import { withPsbt, WithPsbtOptions, withPsbtOptions } from './withPsbt';
import { getNetworkOptionsDemand } from '../../args';

export type ArgsSignPsbt = WithPsbtOptions & {
  key: string;
};

export const cmdSign: CommandModule<unknown, ArgsSignPsbt> = {
  command: 'sign [psbt]',
  describe: 'sign psbt',
  builder(b: Argv<unknown>): Argv<ArgsSignPsbt> {
    return b
      .options(getNetworkOptionsDemand('bitcoin'))
      .options(withPsbtOptions)
      .option('key', { type: 'string', demandOption: true });
  },
  async handler(argv) {
    const key = utxolib.bip32.fromBase58(argv.key, argv.network);
    await withPsbt(argv, async function (psbt) {
      psbt.signAllInputsHD(key);
      return psbt;
    });
  },
};
