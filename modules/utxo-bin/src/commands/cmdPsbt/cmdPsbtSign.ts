import { CommandModule, Argv } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';

import { argToString, getNetworkOptionsDemand, readStringOptions, ReadStringOptions, stringToBuffer } from '../../args';

export type ArgsSignPsbt = ReadStringOptions & {
  network: utxolib.Network;
  key: string[];
};

export const cmdSignPsbt: CommandModule<unknown, ArgsSignPsbt> = {
  command: 'sign [psbt]',
  describe: 'sign psbt',
  builder(b: Argv<unknown>): Argv<ArgsSignPsbt> {
    return b
      .options(readStringOptions)
      .options(getNetworkOptionsDemand())
      .option('key', { type: 'string', demandOption: true, array: true })
      .option('finalize', { type: 'boolean', default: false })
      .option('extract', { type: 'boolean', default: false });
  },
  async handler(argv) {
    const data = await argToString(argv);
    if (!data) {
      throw new Error('missing psbt');
    }
    const buffer = stringToBuffer(data, ['hex', 'base64']);
    const psbt = utxolib.Psbt.fromBuffer(buffer, { network: argv.network });
    for (const k of argv.key) {
      psbt.signAllInputsHD(utxolib.bip32.fromBase58(k));
    }
    if (argv.finalize) {
      psbt.finalizeAllInputs();
    }
    if (argv.extract) {
      console.log(psbt.extractTransaction().toHex());
    } else {
      console.log(psbt.toBase64());
    }
  },
};
