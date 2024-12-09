import * as utxolib from '@bitgo/utxo-lib';
import * as yargs from 'yargs';

import {
  argToString,
  formatTreeOrJson,
  getNetworkOptionsDemand,
  FormatTreeOrJson,
  ReadStringOptions,
  readStringOptions,
  stringToBuffer,
} from '../args';
import { TxParser, TxParserArgs } from '../TxParser';
import {
  fetchOutputSpends,
  fetchPrevOutputs,
  fetchPrevOutputSpends,
  fetchTransactionHex,
  fetchTransactionStatus,
  getClient,
} from '../fetch';
import { getParserTxProperties } from '../ParserTx';
import { parseUnknown } from '../parseUnknown';
import { Parser } from '../Parser';

import { formatString } from './formatString';

export type ArgsParseTransaction = ReadStringOptions & {
  network: utxolib.Network;
  txid?: string;
  blockHeight?: number;
  txIndex?: number;
  all: boolean;
  cache: boolean;
  format: FormatTreeOrJson;
  fetchAll: boolean;
  fetchStatus: boolean;
  fetchInputs: boolean;
  fetchSpends: boolean;
  finalize: boolean;
  parseSignatureData: boolean;
  parseAsUnknown: boolean;
  parseError: 'throw' | 'continue';
} & Omit<TxParserArgs, 'parseSignatureData'>;

export function getTxParser(argv: ArgsParseTransaction): TxParser {
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
      .options(readStringOptions)
      .options(getNetworkOptionsDemand())
      .option('txid', { type: 'string' })
      .option('blockHeight', { type: 'number' })
      .option('txIndex', { type: 'number' })
      .option('fetchAll', { type: 'boolean', default: false })
      .option('fetchStatus', { type: 'boolean', default: false })
      .option('fetchInputs', { type: 'boolean', default: false })
      .option('fetchSpends', { type: 'boolean', default: false })
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
      .option('vout', { type: 'number' })
      .array('vout')
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
      .option('format', formatTreeOrJson)
      .option('parseError', { choices: ['continue', 'throw'], default: 'continue' } as const);
  },

  async handler(argv: yargs.Arguments<ArgsParseTransaction>): Promise<void> {
    let data;

    const httpClient = await getClient({ cache: argv.cache });

    if (argv.txid || argv.blockHeight !== undefined || argv.txIndex !== undefined) {
      data = await fetchTransactionHex(
        httpClient,
        {
          txid: argv.txid,
          blockHeight: argv.blockHeight,
          txIndex: argv.txIndex,
        },
        argv.network
      );
    }

    const string = await argToString(argv, data);
    if (!string) {
      throw new Error(`no txdata`);
    }

    const bytes = stringToBuffer(string, ['hex', 'base64']);

    let tx = utxolib.bitgo.isPsbt(bytes)
      ? utxolib.bitgo.createPsbtFromBuffer(bytes, argv.network)
      : utxolib.bitgo.createTransactionFromBuffer(bytes, argv.network, { amountType: 'bigint' });

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
      status: argv.fetchStatus && txid ? await fetchTransactionStatus(httpClient, txid, argv.network) : undefined,
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
