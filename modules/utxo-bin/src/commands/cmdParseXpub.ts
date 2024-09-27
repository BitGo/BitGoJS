import * as yargs from 'yargs';

import { parseXpub } from '../bip32';

import { formatString, FormatStringArgs } from './formatString';

export const cmdParseXpub = {
  command: 'parseXpub [xpub]',
  describe: 'show xpub info',
  builder(b: yargs.Argv<unknown>): yargs.Argv<
    {
      xpub: string;
      derive?: string;
    } & FormatStringArgs
  > {
    return b
      .positional('xpub', { type: 'string', demandOption: true })
      .option('format', { choices: ['tree', 'json'], default: 'tree' } as const)
      .option('all', { type: 'boolean', default: false })
      .option('derive', { type: 'string', description: 'show xpub derived with path' });
  },
  handler(
    argv: yargs.Arguments<
      {
        xpub: string;
        derive?: string;
      } & FormatStringArgs
    >
  ): void {
    console.log(formatString(parseXpub(argv.xpub, { derive: argv.derive }), argv));
  },
};
