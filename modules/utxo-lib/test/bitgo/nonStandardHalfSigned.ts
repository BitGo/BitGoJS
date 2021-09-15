/**
 * @prettier
 */
import * as path from 'path';
import * as fs from 'fs-extra';
import * as assert from 'assert';
import { getNetworkName } from '../../src/coins';
import { createTransactionFromHex } from '../../src/bitgo';
import { ScriptType2Of3 } from '../../src/bitgo/outputScripts';
import * as networks from '../../src/networks';
import { Network } from '../../src/networkTypes';

import { getTransactionBuilder } from '../transaction_util';
import { fixtureKeys } from '../integration_local_rpc/generate/fixtures';
import { padInputScript } from '../../src/bitgo/nonStandardHalfSigned';

async function getFixture<T>(network: Network, name: string, defaultValue: T): Promise<T> {
  const p = path.join(__dirname, 'fixtures', getNetworkName(network) as string, name);
  try {
    return JSON.parse(await fs.readFile(p, 'utf-8'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      await fs.mkdirp(path.dirname(p));
      await fs.writeFile(p, JSON.stringify(defaultValue, null, 2));
      throw new Error(`wrote default value, please verify output and re-run tests`);
    }

    throw e;
  }
}

function runTest(scriptType: ScriptType2Of3) {
  const network = networks.bitcoin;

  describe(`createTransactionFromNonStandardHalfSigned ${scriptType}`, function () {
    fixtureKeys.forEach((signKey, pubkeyIndex) => {
      it(`parses non-standard half signed transaction pubkeyIndex=${pubkeyIndex}`, async function () {
        const txb = getTransactionBuilder(fixtureKeys, [signKey], scriptType, network);
        const standardHalfSigned = txb.buildIncomplete();
        const nonStandardHalfSigned = createTransactionFromHex(
          await getFixture(
            network,
            `nonStandardHalfSigned-${scriptType}-${pubkeyIndex}.json`,
            txb.build().toBuffer().toString('hex')
          ),
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
  ['p2sh', 'p2shP2wsh'].forEach((scriptType) => runTest(scriptType as ScriptType2Of3));
});
