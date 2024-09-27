import * as utxolib from '@bitgo/utxo-lib';
import * as yargs from 'yargs';

import { AddressParser } from '../AddressParser';
import { getNetworkOptions } from '../args';

import { OutputFormat } from './cmdParseTx';
import { formatString } from './formatString';

export type ArgsParseAddress = {
  network?: utxolib.Network;
  all: boolean;
  format: OutputFormat;
  convert: boolean;
  address: string;
};

export function getAddressParser(argv: ArgsParseAddress): AddressParser {
  return new AddressParser(argv);
}

export const cmdParseAddress = {
  command: 'parseAddress [address]',
  aliases: ['address'],
  describe: 'parse address',
  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsParseAddress> {
    return b
      .options(getNetworkOptions())
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
