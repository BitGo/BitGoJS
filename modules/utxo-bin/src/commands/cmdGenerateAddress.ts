import * as utxolib from '@bitgo/utxo-lib';
import * as yargs from 'yargs';

import { getNetworkOptionsDemand, keyOptions, KeyOptions } from '../args';
import {
  formatAddressTree,
  formatAddressWithFormatString,
  generateAddress,
  getAddressPlaceholderDescription,
  getRange,
  parseIndexRange,
} from '../generateAddress';

export type ArgsGenerateAddress = KeyOptions & {
  network: utxolib.Network;
  chain?: number[];
  format: string;
  index?: string[];
  limit?: number;
};

export const cmdGenerateAddress = {
  command: 'generateAddresses',
  describe: 'generate addresses',
  builder(b: yargs.Argv<unknown>): yargs.Argv<ArgsGenerateAddress> {
    return b
      .options(getNetworkOptionsDemand('bitcoin'))
      .options(keyOptions)
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
    })) {
      if (argv.format === 'tree') {
        console.log(formatAddressTree(address));
      } else {
        console.log(formatAddressWithFormatString(address, argv.format));
      }
    }
  },
};
