/* eslint-disable no-console */
import * as yargs from 'yargs';
import * as fs from 'fs';
import * as process from 'process';
import { promisify } from 'util';

import clipboardy from 'clipboardy-cjs';
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
import { ScriptParser } from './ScriptParser';
import { stringToBuffer } from './parseString';
import {
  formatAddressTree,
  formatAddressWithFormatString,
  generateAddress,
  getAddressPlaceholderDescription,
  getRange,
  parseIndexRange,
} from './generateAddress';

type OutputFormat = 'tree' | 'json';

type ArgsParseTransaction = {
  network: string;
  stdin: boolean;
  clipboard: boolean;
  path?: string;
  txid?: string;
  data?: string;
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

type ArgsParseScript = {
  network?: string;
  format: OutputFormat;
  all: boolean;
  script: string;
};

export type ArgsGenerateAddress = {
  network?: string;
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  chain?: number[];
  format: string;
  index?: string[];
  limit?: number;
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
    throw new Error(`invalid network ${name}`);
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

export function getScriptParser(argv: ArgsParseScript): ScriptParser {
  return new ScriptParser(resolveNetwork(argv));
}

export const cmdParseTx = {
  command: 'parseTx [path]',
  aliases: ['parse', 'tx'],
  describe:
    'Display transaction components in human-readable form. ' +
    'Supported formats are Partially Signed Bitcoin Transaction (PSBT), ' +
    'bitcoinjs-lib encoding (Legacy) or fully signed transaction. ' +
    'Bytes must be encoded in hex or base64 format.',

  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsParseTransaction> {
    return b
      .option('path', { type: 'string', nargs: 1, default: '' })
      .option('stdin', { type: 'boolean', default: false })
      .option('data', { type: 'string', description: 'transaction bytes (hex or base64)', alias: 'hex' })
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
      console.log('After inserting data, press Ctrl-D to finish. Press Ctrl-C to cancel.');
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

    if (argv.data) {
      if (data) {
        throw new Error(`conflicting arguments`);
      }
      data = argv.data;
    }

    // strip whitespace
    if (!data) {
      throw new Error(`no txdata`);
    }

    const bytes = stringToBuffer(data, ['hex', 'base64']);

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

export const cmdParseScript = {
  command: 'parseScript [script]',
  describe: 'parse script',
  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsParseScript> {
    return b
      .option('network', { alias: 'n', type: 'string' })
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

export const cmdGenerateAddress = {
  command: 'generateAddresses',
  describe: 'generate addresses',
  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsGenerateAddress> {
    return b
      .option('network', { alias: 'n', type: 'string' })
      .option('userKey', { type: 'string', demandOption: true })
      .option('backupKey', { type: 'string', demandOption: true })
      .option('bitgoKey', { type: 'string', demandOption: true })
      .option('format', {
        type: 'string',
        default: '%p0\t%a',
        description: `Format string. Placeholders: ${getAddressPlaceholderDescription()}`,
      })
      .option('chain', { type: 'number', description: 'Address chain' })
      .array('chain')
      .option('index', {
        type: 'string',
        description: 'Address index. Can be given as a range (e.g. 0-99). Takes precedence over --limit.',
      })
      .array('index')
      .option('limit', {
        type: 'number',
        description: 'Alias for --index with range starting at 0 to limit-1.',
        default: 100,
      });
  },
  handler(argv: yargs.Arguments<ArgsGenerateAddress>): void {
    let indexRange: number[];
    if (argv.index) {
      indexRange = parseIndexRange(argv.index);
    } else if (argv.limit) {
      indexRange = getRange(0, argv.limit - 1);
    } else {
      throw new Error(`no index or limit`);
    }
    for (const address of generateAddress({
      ...argv,
      index: indexRange,
      network: getNetworkForName(argv.network ?? 'bitcoin'),
    })) {
      if (argv.format === 'tree') {
        console.log(formatAddressTree(address));
      } else {
        console.log(formatAddressWithFormatString(address, argv.format));
      }
    }
  },
};
