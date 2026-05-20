import { ParserNode } from '../Parser';
import { formatTree } from '../format';
import { FormatTreeOrJson } from '../args';

export type FormatStringArgs = {
  format: FormatTreeOrJson;
  all: boolean;
};

export function formatString(parsed: ParserNode, argv: FormatStringArgs): string {
  switch (argv.format) {
    case 'json':
      return JSON.stringify(parsed, null, 2);
    case 'tree':
      return formatTree(parsed, { hide: argv.all ? [] : undefined });
  }
  throw new Error(`invalid format ${argv.format}`);
}
