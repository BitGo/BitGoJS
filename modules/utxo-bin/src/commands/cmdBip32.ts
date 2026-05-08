import * as crypto from 'crypto';

import * as yargs from 'yargs';
import { CommandModule } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';

import { parseBip32 } from '../bip32';
import { formatTreeOrJson, FormatTreeOrJson } from '../args';

import { formatString } from './formatString';

type ArgsBip32Generate = {
  format: FormatTreeOrJson;
  bip32Key: string;
  derive?: string;
  all: boolean;
};

export const cmdBip32Parse: CommandModule<unknown, ArgsBip32Generate> = {
  command: 'parse [xpub|xprv]',
  describe: 'show xpub info',
  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsBip32Generate> {
    return b
      .options({ format: formatTreeOrJson })
      .positional('bip32Key', { type: 'string', demandOption: true })
      .option('all', { type: 'boolean', default: false })
      .option('derive', { type: 'string', description: 'show xpub derived with path' });
  },
  handler(argv): void {
    console.log(formatString(parseBip32(argv.bip32Key, { derive: argv.derive }), argv));
  },
};

type GenerateBip32Args = {
  seed: string;
};

export const cmdBip32Generate: CommandModule<unknown, GenerateBip32Args> = {
  command: 'generateFromSeed',
  describe: 'generate keypair from seed - do not use for real keys!',
  builder(b) {
    return b.option('seed', { type: 'string', demandOption: true, default: 'setec astronomy' });
  },
  handler(argv) {
    const key = utxolib.bip32.fromSeed(crypto.createHash('sha256').update(argv.seed).digest());
    console.log(key.toBase58());
    console.log(key.neutered().toBase58());
  },
};

export const cmdBip32: CommandModule<unknown, unknown> = {
  command: 'bip32 <command>',
  describe: 'bip32 commands',
  builder(b: yargs.Argv<unknown>): yargs.Argv<unknown> {
    return b.strict().command(cmdBip32Parse).command(cmdBip32Generate).demandCommand();
  },
  handler(): void {
    // do nothing
  },
};
