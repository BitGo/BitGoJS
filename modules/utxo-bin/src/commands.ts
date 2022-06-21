/* eslint-disable no-console */
import * as yargs from 'yargs';
import * as fs from 'fs';
import * as process from 'process';

const stdin: any = process.stdin;

import * as utxolib from '@bitgo/utxo-lib';

import { Parser, ParserArgs } from './parse';
import { formatTree } from './format';
import {
  fetchOutputSpends,
  fetchPrevOutputs,
  fetchPrevOutputSpends,
  fetchTransactionHex,
  fetchTransactionStatus,
} from './fetch';

type Args = {
  network: string;
  stdin: boolean;
  path?: string;
  txid?: string;
  all: boolean;
  format: 'tree' | 'json';
  fetchAll: boolean;
  fetchStatus: boolean;
  fetchInputs: boolean;
  fetchSpends: boolean;
} & ParserArgs;

export function getParser(argv: yargs.Arguments<Args>): Parser {
  return new Parser(argv.all ? Parser.PARSE_ALL : argv);
}

export const cmdParse = {
  command: 'parse [path]',
  describe: 'display transaction components in human-readable form',

  builder(b: yargs.Argv<unknown>): yargs.Argv<Args> {
    return b
      .option('path', { type: 'string', nargs: 1, default: '' })
      .option('stdin', { type: 'boolean', default: false })
      .option('txid', { type: 'string' })
      .option('fetchAll', { type: 'boolean', default: false })
      .option('fetchStatus', { type: 'boolean', default: false })
      .option('fetchInputs', { type: 'boolean', default: false })
      .option('fetchSpends', { type: 'boolean', default: false })
      .option('network', { alias: 'n', type: 'string', demandOption: true })
      .option('parseScriptAsm', { alias: 'scriptasm', type: 'boolean', default: false })
      .option('parseScriptData', { alias: 'scriptdata', type: 'boolean', default: false })
      .option('parseSignatureData', { alias: 'sigdata', type: 'boolean', default: false })
      .option('maxOutputs', { type: 'number' })
      .option('all', { type: 'boolean', default: false })
      .option('format', { choices: ['tree', 'json'], default: 'tree' } as const);
  },

  async handler(argv: yargs.Arguments<Args>): Promise<void> {
    const network = utxolib.networks[argv.network as utxolib.NetworkName];
    if (!network) {
      throw new Error(`invalid network ${network}`);
    }

    let data;

    if (argv.txid) {
      console.log('fetching txHex via blockapi...');
      data = await fetchTransactionHex(argv.txid, network);
    }

    if (argv.stdin || argv.path === '-') {
      if (data) {
        throw new Error(`conflicting arguments`);
      }
      console.log('reading from stdin');
      data = fs.readFileSync(stdin.fd, 'utf8');
    } else if (argv.path) {
      if (data) {
        throw new Error(`conflicting arguments`);
      }
      data = (await fs.promises.readFile(argv.path, 'utf8')).toString();
    }

    if (!data) {
      throw new Error(`no txdata`);
    }
    data = data.replace(/\s*/g, '');

    const tx = utxolib.bitgo.createTransactionFromHex(data, network);
    const txid = tx.getId();
    if (argv.txid && txid !== argv.txid) {
      throw new Error(`computed txid does not match txid argument`);
    }

    if (argv.fetchAll) {
      argv.fetchStatus = true;
      argv.fetchInputs = true;
      argv.fetchSpends = true;
    }

    const parsed = getParser(argv).parse(tx, {
      status: argv.fetchStatus ? await fetchTransactionStatus(txid, network) : undefined,
      prevOutputs: argv.fetchInputs ? await fetchPrevOutputs(tx) : undefined,
      prevOutputSpends: argv.fetchSpends ? await fetchPrevOutputSpends(tx) : undefined,
      outputSpends: argv.fetchSpends ? await fetchOutputSpends(tx) : undefined,
    });
    switch (argv.format) {
      case 'json':
        console.log(JSON.stringify(parsed, null, 2));
        break;
      case 'tree':
        console.log(formatTree(parsed, { hide: argv.all ? [] : undefined }));
        break;
    }
  },
};
