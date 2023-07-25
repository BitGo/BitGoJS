import * as fs from 'fs/promises';
import * as utxolib from '@bitgo/utxo-lib';

import { Dimensions } from '../src';

const headers = [
  'Script Type',
  'Chain Codes',
  'Spend Type',
  'Input Size (Virtual Bytes)',
  'Relative Size (p2trMusig2 = 1.00)',
];

const relativeCostRef = Dimensions.fromScriptType('taprootKeyPathSpend').getInputsVSize();

type Row = [string, string, string, string, string];

function formatMarkdownTable(headers: string[], rows: string[][]): string {
  return [headers, headers.map(() => '---'), ...rows].map((row) => `| ${row.join(' | ')} |`).join('\n');
}

function generateRowsForScriptType(
  headers: string[],
  t: utxolib.bitgo.outputScripts.ScriptType2Of3,
  params?: {
    spendTypeName: string;
    scriptTypeParams: { scriptPathLevel?: number };
  }
): Row[] {
  const chainCode = utxolib.bitgo.toChainPair(t);

  if (!params) {
    if (t === 'p2tr') {
      return [
        ...generateRowsForScriptType(headers, t, {
          spendTypeName: 'Script Path, Level 2 (Backup/User, Backup/BitGo)',
          scriptTypeParams: { scriptPathLevel: 2 },
        }),
        ...generateRowsForScriptType(headers, t, {
          spendTypeName: 'Script Path, Level 1 (User/BitGo)',
          scriptTypeParams: { scriptPathLevel: 1 },
        }),
      ];
    }

    if (t === 'p2trMusig2') {
      return [
        ...generateRowsForScriptType(headers, t, {
          spendTypeName: 'Script Path (Backup/User, Backup/BitGo)',
          scriptTypeParams: { scriptPathLevel: 1 },
        }),
        ...generateRowsForScriptType(headers, t, {
          spendTypeName: 'Key Path (User/BitGo)',
          scriptTypeParams: { scriptPathLevel: undefined },
        }),
      ];
    }
  }

  const inputVSize = Dimensions.fromScriptType(t, params?.scriptTypeParams).getInputsVSize();
  const row: Row = [
    t,
    chainCode.join(`/`),
    params?.spendTypeName ?? 'all',
    inputVSize.toString(),
    (inputVSize / relativeCostRef).toFixed(2),
  ];
  return [row];
}

function generateTables() {
  const scriptTypes = [...utxolib.bitgo.outputScripts.scriptTypes2Of3];
  return formatMarkdownTable(
    headers,
    scriptTypes.flatMap((s) => generateRowsForScriptType(headers, s))
  );
}

function generateDocument() {
  return [
    '# Input Costs',
    'This document contains the worst-case input costs for various script types and spend types.',
    'The input costs are calculated using the `Dimensions` class from `@bitgo/unspents`.',
    '',
    generateTables(),
  ].join('\n');
}

if (require.main === module) {
  const outfile = 'docs/input-costs.md';
  fs.writeFile(outfile, generateDocument())
    .then(() => console.log('wrote to', outfile))
    .catch((e) => console.error(e));
}
