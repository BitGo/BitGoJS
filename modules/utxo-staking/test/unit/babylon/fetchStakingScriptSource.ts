// Download and patch `stakingScript.ts` from the `btc-staking-ts` repository.

import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';

function getSourceUrl(tag: string): string {
  return `https://raw.githubusercontent.com/babylonlabs-io/btc-staking-ts/${tag}/src/staking/stakingScript.ts`;
}

function patchStakingScriptSource(sourceUrl: string, source: string): string {
  const lines = source.split('\n');

  const matchLine1 = 'import { opcodes, script } from "bitcoinjs-lib";';
  const matchLine2 = 'import { NO_COORD_PK_BYTE_LENGTH } from "../constants/keys";';
  assert.deepStrictEqual(lines.slice(0, 2), [matchLine1, matchLine2]);

  const headerInfo = `/* downloaded from ${sourceUrl} */`;
  const subLine1 = "import { opcodes, script } from '@bitgo/utxo-lib';";
  // apparently, our underlying bitcoinjs-lib does not include
  // this commit https://github.com/bitcoinjs/bitcoinjs-lib/commit/e033a6ff41f31e70fcf715b5adf084be8e5880ef
  const subLine2 = 'opcodes.OP_CHECKSIGADD = 186;';
  const subLine3 = 'const NO_COORD_PK_BYTE_LENGTH = 32;';

  return [headerInfo, subLine1, subLine2, subLine3].concat(lines.slice(2)).join('\n');
}

async function updateStakingScriptSource(tag = 'v0.4.0-rc.2'): Promise<void> {
  const url = getSourceUrl(tag);
  const source = await (await fetch(url)).text();
  await fs.writeFile(__dirname + '/vendor/stakingScript.ts', patchStakingScriptSource(url, source));
}

if (require.main === module) {
  updateStakingScriptSource().then(console.log).catch(console.error);
}
