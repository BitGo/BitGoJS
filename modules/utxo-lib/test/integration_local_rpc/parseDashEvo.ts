/**
 * @prettier
 */

/*

Despite the location of this file, the fixtures are in fact not created via `local_rpc` but a
modified dash unit test:

https://github.com/OttoAllmendinger/bitcoin/commit/0845a546e1bd97ac2037647f7398c6e20cfb7153

However the generated fixtures have the same format as the RPC responses so we will put the code here.

*/

import * as fs from 'fs-extra';
import * as assert from 'assert';
import { parseTransactionRoundTrip } from '../transaction_util';
import networks = require('../../src/networks');
import { RpcTransaction } from './generate/RpcTypes';
import { normalizeParsedTransaction, normalizeRpcTransaction } from './compare';

export async function readDashEvoTransactions(): Promise<RpcTransaction[]> {
  const rootDir = `test/integration_local_rpc/fixtures/dashTestExtra/`;
  const files = await fs.readdir(rootDir);
  return Promise.all(
    files.sort().map(async (filename) => JSON.parse(await fs.readFile(`${rootDir}/${filename}`, 'utf8')))
  );
}

describe('Dash', function () {
  const network = networks.dash;
  it(`parses Evolution (EVO) special transactions`, async function () {
    const txs = await readDashEvoTransactions();
    assert.strictEqual(txs.length, 29);

    txs.forEach((transaction) => {
      const buf = Buffer.from(transaction.hex, 'hex');
      const tx = parseTransactionRoundTrip(buf, network);
      assert.deepStrictEqual(normalizeParsedTransaction(tx, network), normalizeRpcTransaction(transaction, network));
    });
  });
});
