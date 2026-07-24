/*

Despite the location of this file, the fixtures are in fact not created via `local_rpc` but a
modified dash unit test:

https://github.com/OttoAllmendinger/bitcoin/commit/0845a546e1bd97ac2037647f7398c6e20cfb7153

However the generated fixtures have the same format as the RPC responses so we will put the code here.

*/

import * as fs from 'fs-extra';
import * as assert from 'assert';

import { RpcTransaction } from './generate/RpcTypes';
import { normalizeParsedTransaction, normalizeRpcTransaction } from './compare';

import { parseTransactionRoundTrip } from '../transaction_util';

import { networks, Transaction } from '../../src';
import { DashTransaction } from '../../src/bitgo';

export async function readDashEvoTransactions(): Promise<RpcTransaction[]> {
  const rootDir = `test/integration_local_rpc/fixtures/dashTestExtra/`;
  const files = await fs.readdir(rootDir);
  return Promise.all(
    files.sort().map(async (filename) => JSON.parse(await fs.readFile(`${rootDir}/${filename}`, 'utf8')))
  );
}

describe('Dash', function () {
  const network = networks.dashTest;
  let txs: RpcTransaction[];

  before('read fixtures', async function () {
    txs = await readDashEvoTransactions();
  });

  it(`parses Evolution (EVO) special transactions`, function () {
    assert.strictEqual(txs.length, 29);

    txs.forEach((transaction) => {
      const buf = Buffer.from(transaction.hex, 'hex');
      const tx = parseTransactionRoundTrip(buf, network);
      assert.deepStrictEqual(normalizeParsedTransaction(tx, network), normalizeRpcTransaction(transaction, network));
    });
  });

  it(`Calculates correct sighash`, function () {
    const txsExtraPayload = txs
      .map((transaction) =>
        parseTransactionRoundTrip<number, DashTransaction>(Buffer.from(transaction.hex, 'hex'), network)
      )
      .filter((tx) => tx.extraPayload && tx.extraPayload.length > 0);
    const txsNormalizedHashes = txsExtraPayload.map((tx) =>
      // https://github.com/bitcoin/bitcoin/pull/3656/files
      tx.hashForSignature(0, Buffer.alloc(0), Transaction.SIGHASH_ALL).toString('hex')
    );
    assert.deepStrictEqual(txsNormalizedHashes, [
      '6af1aa2b82798cfba54961445132ddd612642f5fd32bfb3cafaa30eeff204d29',
      'dbe20a989766a4fed6438b109fa64191d0ccc6f560f1a8920ebbbc0254fa2e98',
      '66f9f8c5cc628e429006c462e711571f4b3246d89e8977b2fa11005769f44c00',
      '51a0f90eba51615374a27f91d21fd02232449e9ad7c0baa35099c5444a274fe9',
      'b7a411ad3541c7a9cda8c6185f2ab957d462a2fba063ccefded70b7d5b5c1ea9',
      'b1e5d0b87e7dcc6fa0c7896ab36a68b3f8211d669a9ce0eb8a32ec984d66aa95',
      '766668a5925a5858dbb263ddcc58d104e33bb6700189e38984dcc239d0a87878',
      '82464689bcfae77ba24f8453f2c3bb50fa25fb022eb02a3aea2b550e45810649',
      'fab147b2e788bb7ff8734a2c8cf7bebfdc7d324edf70896001cb5ea98918ecdd',
      '2e4f49ad4c867d5702e1ca10526d86cd73bf77322728b408d9fe2685063e8c51',
      '8b6c400dbae12d5e814b1871c3b794ae9cca23bfdc3f6ebe54cccbd7e5577579',
      '5cb8e125c9ad5cb2f4f2a494ebf3411711ac4331f3284c3c05d3696775c1398f',
      'b196f24d479d995b674e61b786505d89f4b0513f0bc4f981495efc5d17b5eb46',
      'f27f3ad3ace5a9682a3cca54af759e78295a94c75126f6062d086380f41a5fab',
      '6cc89ea666304705ba494992e81546fb7d4a4cc2d24d1b13c7091d18c3c32730',
      'a6d458a269c18a0f2a453f1f5ea5e033f217959d75dcd8aac9415e8586c81418',
      'df5463da5fd164444378232f8e050406fc42ea48c4db02170a2eef224100131b',
      'c092e8bb800616448efd56817f7cc1ccc8b1bcb4378fc3ab48951f4fc76a1ea2',
      '13376fc808ebf8ee5bdec5d61d02ea5b8961e0377891a22c3b170fcf2d16d6e2',
      '192f9db5d71817a04bb1a601a6368eda95fc16a6018da9366c89f37c9ab2de29',
      '4fa5ea402103dafc4c15beec91b69875df5687edc3c005af8a6064f55f71eefa',
      '9da4657761b7b8c476d5cebc9dfc4477604d7ed6972c5f34af27a6a3cdcab4f2',
      '62b23def8d6a172d345d6bea68f26eb56a9f41b679a98e46c019a51e15f5e0bb',
      'c5054c1af1ad9f0279c546d7b4125cc505c8b75392afba4fd0267dc9f39e51db',
      '2db5d36542d3bf6d98d5896d58f1723548090fe82247c9483ac32b4c78607e82',
      '5204293f35c482ab7ce592b6d65dab2aaeecd506ed70c942e8034dea3adde593',
    ]);
  });
});
