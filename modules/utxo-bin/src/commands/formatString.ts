import * as yargs from 'yargs';

import { ParserNode } from '../Parser';
import { formatTree } from '../format';

import { OutputFormat } from './cmdParseTx';

export type FormatStringArgs = {
  format: OutputFormat;
  all: boolean;
};

export function formatString(parsed: ParserNode, argv: yargs.Arguments<FormatStringArgs>): string {
  switch (argv.format) {
    case 'json':
      return JSON.stringify(parsed, null, 2);
    case 'tree':
      return formatTree(parsed, { hide: argv.all ? [] : undefined });
  }
  throw new Error(`invalid format ${argv.format}`);
}
