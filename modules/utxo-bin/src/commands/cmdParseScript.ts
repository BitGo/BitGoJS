import * as utxolib from '@bitgo/utxo-lib';
import * as yargs from 'yargs';

import { ScriptParser } from '../ScriptParser';
import { getNetworkOptions, stringToBuffer } from '../args';

import { OutputFormat } from './cmdParseTx';
import { formatString } from './formatString';

export type ArgsParseScript = {
  network?: utxolib.Network;
  format: OutputFormat;
  all: boolean;
  script: string;
};

export function getScriptParser(argv: ArgsParseScript): ScriptParser {
  return new ScriptParser(argv);
}

export const cmdParseScript = {
  command: 'parseScript [script]',
  describe: 'parse script',
  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsParseScript> {
    return b
      .options(getNetworkOptions())
      .option('format', { choices: ['tree', 'json'], default: 'tree' } as const)
      .option('all', { type: 'boolean', default: false })
      .positional('script', { type: 'string', demandOption: true });
  },
  handler(argv: yargs.Arguments<ArgsParseScript>): void {
    const script = stringToBuffer(argv.script, 'hex');
    const parsed = getScriptParser(argv).parse(script);
    console.log(formatString(parsed, { ...argv, all: true }));
  },
};
