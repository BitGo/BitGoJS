import * as path from 'path';
import * as fs from 'fs-extra';
import * as assert from 'assert';

import { networks, Network, getNetworkName } from '../../src';
import { createTransactionFromHex } from '../../src/bitgo';
import { ScriptType2Of3, scriptTypes2Of3 } from '../../src/bitgo/outputScripts';

import { getHalfSignedTransaction2Of3 } from '../transaction_util';
import { fixtureKeys } from '../integration_local_rpc/generate/fixtures';
import { padInputScript } from '../../src/bitgo/nonStandardHalfSigned';
import { getDefaultCosigner } from '../testutil';

async function getFixture<T>(network: Network, name: string): Promise<T> {
  const p = path.join(__dirname, 'fixtures', 'nonStandardHalfSigned', getNetworkName(network) as string, name);
  return JSON.parse(await fs.readFile(p, 'utf-8'));
}

function runTest(scriptType: ScriptType2Of3) {
  const network = networks.bitcoin;

  describe(`createTransactionFromNonStandardHalfSigned ${scriptType}`, function () {
    if (scriptType === 'p2tr') {
      return; // TODO: enable p2tr tests when signing is supported
    }
    fixtureKeys.forEach((signKey, pubkeyIndex) => {
      it(`parses non-standard half signed transaction pubkeyIndex=${pubkeyIndex}`, async function () {
        const standardHalfSigned = getHalfSignedTransaction2Of3(
          fixtureKeys,
          signKey,
          getDefaultCosigner(fixtureKeys, signKey),
          scriptType,
          network
        );

        // Fixtures can only be constructed using utxolib < 1.10
        const nonStandardHalfSigned = createTransactionFromHex(
          await getFixture(network, `nonStandardHalfSigned-${scriptType}-${pubkeyIndex}.json`),
          network
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
  scriptTypes2Of3.forEach((scriptType) => runTest(scriptType as ScriptType2Of3));
});
