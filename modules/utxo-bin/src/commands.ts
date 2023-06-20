/* eslint-disable no-console */
import * as yargs from 'yargs';
import * as fs from 'fs';
import * as process from 'process';
import { promisify } from 'util';

import * as clipboardy from 'clipboardy';
import * as utxolib from '@bitgo/utxo-lib';

import { Parser, ParserNode } from './Parser';
import { formatTree } from './format';
import {
  fetchOutputSpends,
  fetchPrevOutputs,
  fetchPrevOutputSpends,
  fetchTransactionHex,
  fetchTransactionStatus,
} from './fetch';
import { TxParser, TxParserArgs } from './TxParser';
import { AddressParser } from './AddressParser';
import { BaseHttpClient, CachingHttpClient, HttpClient } from '@bitgo/blockapis';
import { readStdin } from './readStdin';
import { parseUnknown } from './parseUnknown';
import { getParserTxProperties } from './ParserTx';

type OutputFormat = 'tree' | 'json';

type ArgsParseTransaction = {
  network: string;
  stdin: boolean;
  clipboard: boolean;
  path?: string;
  txid?: string;
  hex?: string;
  all: boolean;
  cache: boolean;
  format: OutputFormat;
  fetchAll: boolean;
  fetchStatus: boolean;
  fetchInputs: boolean;
  fetchSpends: boolean;
  finalize: boolean;
  parseSignatureData: boolean;
  parseAsUnknown: boolean;
  parseError: 'throw' | 'continue';
} & Omit<TxParserArgs, 'parseSignatureData'>;

type ArgsParseAddress = {
  network?: string;
  all: boolean;
  format: OutputFormat;
  convert: boolean;
  address: string;
};

async function getClient({ cache }: { cache: boolean }): Promise<HttpClient> {
  if (cache) {
    const mkdir = promisify(fs.mkdir);
    const dir = `${process.env.HOME}/.cache/utxo-bin/`;
    await mkdir(dir, { recursive: true });
    return new CachingHttpClient(dir);
  }
  return new BaseHttpClient();
}

function getNetworkForName(name: string) {
  const network = utxolib.networks[name as utxolib.NetworkName];
  if (!network) {
    throw new Error(`invalid network ${network}`);
  }
  return network;
}

function getNetwork(argv: yargs.Arguments<{ network: string }>): utxolib.Network {
  return getNetworkForName(argv.network);
}

function formatString(
  parsed: ParserNode,
  argv: yargs.Arguments<{
    format: OutputFormat;
    all: boolean;
  }>
): string {
  switch (argv.format) {
    case 'json':
      return JSON.stringify(parsed, null, 2);
    case 'tree':
      return formatTree(parsed, { hide: argv.all ? [] : undefined });
  }
  throw new Error(`invalid format ${argv.format}`);
}

function resolveNetwork<T extends { network?: string }>(
  args: T
): T & {
  network?: utxolib.Network;
} {
  if (args.network) {
    return { ...args, network: getNetworkForName(args.network) };
  }
  return { ...args, network: undefined };
}

export function getTxParser(argv: yargs.Arguments<ArgsParseTransaction>): TxParser {
  if (argv.all) {
    return new TxParser({ ...argv, ...TxParser.PARSE_ALL });
  }
  return new TxParser({
    ...argv,
    parseSignatureData: {
      script: argv.parseSignatureData,
      ecdsa: argv.parseSignatureData,
      schnorr: argv.parseSignatureData,
    },
  });
}

export function getAddressParser(argv: ArgsParseAddress): AddressParser {
  return new AddressParser(resolveNetwork(argv));
}

export const cmdParseTx = {
  command: 'parseTx [path]',
  aliases: ['parse', 'tx'],
  describe:
    'Display transaction components in human-readable form. ' +
    'Supported formats are Partially Signed Bitcoin Transaction (PSBT), ' +
    'bitcoinjs-lib encoding (Legacy) or fully signed transaction. ' +
    'Bytes must be encoded in hex format.',

  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsParseTransaction> {
    return b
      .option('path', { type: 'string', nargs: 1, default: '' })
      .option('stdin', { type: 'boolean', default: false })
      .option('hex', { type: 'string', description: 'transaction bytes (hex-encoded)' })
      .option('clipboard', { type: 'boolean', default: false })
      .option('txid', { type: 'string' })
      .option('fetchAll', { type: 'boolean', default: false })
      .option('fetchStatus', { type: 'boolean', default: false })
      .option('fetchInputs', { type: 'boolean', default: false })
      .option('fetchSpends', { type: 'boolean', default: false })
      .option('network', { alias: 'n', type: 'string', demandOption: true })
      .option('parseScriptAsm', { alias: 'scriptasm', type: 'boolean', default: false })
      .option('parseScriptData', { alias: 'scriptdata', type: 'boolean', default: false })
      .option('parseSignatureData', { alias: 'sigdata', type: 'boolean', default: false })
      .option('parseOutputScript', { type: 'boolean', default: false })
      .option('parseAsUnknown', {
        type: 'boolean',
        default: false,
        description: 'show plain Javascript object without any post-processing',
      })
      .option('maxOutputs', { type: 'number' })
      .option('vin', { type: 'number' })
      .array('vin')
      .option('finalize', {
        type: 'boolean',
        default: false,
        description: 'finalize PSBT and parse result instead of PSBT',
      })
      .option('all', { type: 'boolean', default: false })
      .option('cache', {
        type: 'boolean',
        default: false,
        description: 'use local cache for http responses',
      })
      .option('format', { choices: ['tree', 'json'], default: 'tree' } as const)
      .option('parseError', { choices: ['continue', 'throw'], default: 'continue' } as const);
  },

  async handler(argv: yargs.Arguments<ArgsParseTransaction>): Promise<void> {
    const network = getNetwork(argv);
    let data;

    const httpClient = await getClient({ cache: argv.cache });

    if (argv.txid) {
      data = await fetchTransactionHex(httpClient, argv.txid, network);
    }

    if (argv.stdin || argv.path === '-') {
      if (data) {
        throw new Error(`conflicting arguments`);
      }
      console.log('Reading from stdin. Please paste hex-encoded transaction data.');
      console.log('Press Ctrl-D to finish, or Ctrl-C to cancel.');
      if (process.stdin.isTTY) {
        data = await readStdin();
      } else {
        data = await fs.promises.readFile('/dev/stdin', 'utf8');
      }
    }

    if (argv.clipboard) {
      if (data) {
        throw new Error(`conflicting arguments`);
      }
      data = await clipboardy.read();
    }

    if (argv.path) {
      if (data) {
        throw new Error(`conflicting arguments`);
      }
      data = (await fs.promises.readFile(argv.path, 'utf8')).toString();
    }

    if (argv.hex) {
      if (data) {
        throw new Error(`conflicting arguments`);
      }
      data = argv.hex;
    }

    // strip whitespace
    data = data?.replace(/\s*/g, '');
    if (!data) {
      throw new Error(`no txdata`);
    }

    const bytes = Buffer.from(data, 'hex');

    // make sure hex was parsed
    if (bytes.toString('hex') !== data) {
      throw new Error(`invalid hex`);
    }

    let tx = utxolib.bitgo.isPsbt(bytes)
      ? utxolib.bitgo.createPsbtFromBuffer(bytes, network)
      : utxolib.bitgo.createTransactionFromBuffer(bytes, network, { amountType: 'bigint' });

    const { id: txid } = getParserTxProperties(tx, undefined);
    if (tx instanceof utxolib.bitgo.UtxoTransaction) {
      if (argv.txid && txid !== argv.txid) {
        throw new Error(`computed txid does not match txid argument`);
      }
    } else if (argv.finalize) {
      tx.finalizeAllInputs();
      tx = tx.extractTransaction();
    }

    if (argv.parseAsUnknown) {
      console.log(formatString(parseUnknown(new Parser(), 'tx', tx), argv));
      return;
    }

    if (argv.fetchAll) {
      argv.fetchStatus = true;
      argv.fetchInputs = true;
      argv.fetchSpends = true;
    }

    const parsed = getTxParser(argv).parse(tx, {
      status: argv.fetchStatus && txid ? await fetchTransactionStatus(httpClient, txid, network) : undefined,
      prevOutputs: argv.fetchInputs ? await fetchPrevOutputs(httpClient, tx) : undefined,
      prevOutputSpends: argv.fetchSpends ? await fetchPrevOutputSpends(httpClient, tx) : undefined,
      outputSpends:
        argv.fetchSpends && tx instanceof utxolib.bitgo.UtxoTransaction
          ? await fetchOutputSpends(httpClient, tx)
          : undefined,
    });

    console.log(formatString(parsed, argv));
  },
} as const;

export const cmdParseAddress = {
  command: 'parseAddress [address]',
  aliases: ['address'],
  describe: 'parse address',
  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsParseAddress> {
    return b
      .option('network', { alias: 'n', type: 'string' })
      .option('format', { choices: ['tree', 'json'], default: 'tree' } as const)
      .option('convert', { type: 'boolean', default: false })
      .option('all', { type: 'boolean', default: false })
      .positional('address', { type: 'string', demandOption: true });
  },

  handler(argv: yargs.Arguments<ArgsParseAddress>): void {
    const parsed = getAddressParser(argv).parse(argv.address);
    console.log(formatString(parsed, argv));
  },
} as const;
