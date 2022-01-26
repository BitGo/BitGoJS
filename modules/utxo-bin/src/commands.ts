/* eslint-disable no-console */
import * as yargs from 'yargs';
import * as fs from 'fs';
import * as process from 'process';

import * as utxolib from '@bitgo/utxo-lib';

import { Parser, ParserArgs } from './parse';
import { formatTree } from './format';

type Args = {
  network: string;
  path: string;
  all: boolean;
  format: 'tree' | 'json';
} & ParserArgs;

export function getParser(argv: yargs.Arguments<Args>): Parser {
  return new Parser(argv.all ? Parser.PARSE_ALL : argv);
}

export const cmdParse = {
  command: 'parse <path>',
  describe: 'display transaction components in human-readable form',

  builder(b: yargs.Argv<unknown>): yargs.Argv<Args> {
    return b
      .option('path', { type: 'string', default: '-' })
      .option('network', { alias: 'n', type: 'string', demandOption: true })
      .option('parseScriptAsm', { alias: 'scriptasm', type: 'boolean', default: false })
      .option('parseScriptData', { alias: 'scriptdata', type: 'boolean', default: false })
      .option('parseSignatureData', { alias: 'sigdata', type: 'boolean', default: false })
      .option('all', { type: 'boolean', default: false })
      .option('format', { choices: ['tree', 'json'], default: 'tree' } as const);
  },

  async handler(argv: yargs.Arguments<Args>): Promise<void> {
    let data;
    const network = utxolib.networks[argv.network as utxolib.NetworkName];
    if (!network) {
      throw new Error(`invalid network ${network}`);
    }
    if (argv.path === undefined || argv.path === '' || argv.path === '-') {
      console.log('reading from stdin');
      data = fs.readFileSync(process.stdin.fd, 'utf8');
    } else {
      data = (await fs.promises.readFile(argv.path, 'utf8')).toString();
    }
    data = data.replace(/\s*/g, '');

    const tx = utxolib.bitgo.createTransactionFromHex(data, network);
    const parsed = getParser(argv).parse(tx);
    switch (argv.format) {
      case 'json':
        console.log(JSON.stringify(parsed, null, 2));
        break;
      case 'tree':
        console.log(formatTree(parsed));
        break;
    }
  },
};
