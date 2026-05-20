import * as path from 'path';
import * as fs from 'fs-extra';
import * as assert from 'assert';

import { networks, Network, getNetworkName } from '../../src';
import { createTransactionFromBuffer } from '../../src/bitgo';
import { ScriptType2Of3, scriptTypes2Of3 } from '../../src/bitgo/outputScripts';
import { getDefaultCosigner } from '../../src/testutil';

import { getHalfSignedTransaction2Of3 } from '../transaction_util';
import { fixtureKeys } from '../integration_local_rpc/generate/fixtures';
import { padInputScript } from '../../src/bitgo/nonStandardHalfSigned';

async function getFixture<T>(network: Network, name: string): Promise<T> {
  const p = path.join(__dirname, 'fixtures', 'nonStandardHalfSigned', getNetworkName(network) as string, name);
  return JSON.parse(await fs.readFile(p, 'utf-8'));
}

function runTest<TNumber extends number | bigint>(scriptType: ScriptType2Of3, amountType: 'number' | 'bigint') {
  const network = networks.bitcoin;

  describe(`createTransactionFromNonStandardHalfSigned ${scriptType} ${amountType}`, function () {
    if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
      return; // TODO: enable p2tr tests when signing is supported
    }
    fixtureKeys.forEach((signKey, pubkeyIndex) => {
      it(`parses non-standard half signed transaction pubkeyIndex=${pubkeyIndex}`, async function () {
        const standardHalfSigned = getHalfSignedTransaction2Of3<TNumber>(
          fixtureKeys,
          signKey,
          getDefaultCosigner(fixtureKeys, signKey),
          scriptType,
          network,
          { amountType }
        );

        // Fixtures can only be constructed using utxolib < 1.10
        const nonStandardHalfSigned = createTransactionFromBuffer<TNumber>(
          Buffer.from(
            await getFixture<string>(network, `nonStandardHalfSigned-${scriptType}-${pubkeyIndex}.json`),
            'hex'
          ),
          network,
          { amountType }
        );

        // The nonstandard transaction input is missing two `OP_0`
        assert.strictEqual(nonStandardHalfSigned.toBuffer().length, standardHalfSigned.toBuffer().length - 2);

        nonStandardHalfSigned.ins.forEach((input) => padInputScript(input, pubkeyIndex));

        assert.strictEqual(nonStandardHalfSigned.toBuffer().length, standardHalfSigned.toBuffer().length);
        assert.strictEqual(
          nonStandardHalfSigned.toBuffer().toString('hex'),
          standardHalfSigned.toBuffer().toString('hex')
        );
      });
    });
  });
}

describe('Non-Standard Half-Signed Transactions', function () {
  scriptTypes2Of3.forEach((scriptType) => runTest<number>(scriptType as ScriptType2Of3, 'number'));
  scriptTypes2Of3.forEach((scriptType) => runTest<bigint>(scriptType as ScriptType2Of3, 'bigint'));
});
