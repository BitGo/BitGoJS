import * as utxolib from '@bitgo/utxo-lib';
import { CommandModule } from 'yargs';

import { getNetworkOptionsDemand, keyOptions, KeyOptions } from '../../args';
import {
  formatAddressTree,
  formatFixedScriptAddress,
  generateFixedScriptAddress,
  getFixedScriptAddressPlaceholderDescription,
  getRange,
  parseIndexRange,
} from '../../generateAddress';

type IndexLimitOptions = {
  index?: string[];
  limit?: number;
};

const indexLimitOptions = {
  index: {
    type: 'string',
    array: true,
    description: 'Address index. Can be given as a range (e.g. 0-99). Takes precedence over --limit.',
  },
  limit: {
    type: 'number',
    description: 'Alias for --index with range starting at 0 to limit-1.',
    default: 100,
  },
} as const;

function getIndexRangeFromArgv(argv: IndexLimitOptions): number[] {
  if (argv.index) {
    return parseIndexRange(argv.index);
  }
  if (argv.limit) {
    return getRange(0, argv.limit - 1);
  }
  throw new Error(`no index or limit`);
}

type ArgsGenerateAddressFixedScript = KeyOptions &
  IndexLimitOptions & {
    network: utxolib.Network;
    chain?: number[];
    format: string;
  };

export const cmdGenerateFixedScript: CommandModule<unknown, ArgsGenerateAddressFixedScript> = {
  command: 'fromFixedScript',
  describe: 'generate bitgo fixed-script addresses',
  builder(b) {
    return b
      .options(getNetworkOptionsDemand('bitcoin'))
      .options(keyOptions)
      .option('format', {
        type: 'string',
        default: '%p0\t%a',
        description: `Format string.\nPlaceholders:\n${getFixedScriptAddressPlaceholderDescription()}`,
      })
      .option('chain', { type: 'number', array: true, description: 'Address chain' })
      .options(indexLimitOptions);
  },
  handler(argv): void {
    for (const address of generateFixedScriptAddress({
      ...argv,
      index: getIndexRangeFromArgv(argv),
    })) {
      if (argv.format === 'tree') {
        console.log(formatAddressTree(address));
      } else {
        console.log(formatFixedScriptAddress(address, argv.format));
      }
    }
  },
};
