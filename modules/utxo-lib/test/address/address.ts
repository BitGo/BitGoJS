import * as path from 'path';
import * as assert from 'assert';
import * as utxolib from '../../src';
import { getNetworkList, getNetworkName } from '../../src/coins';
import {
  createScriptPubKey,
  isSupportedDepositType,
  ScriptType,
  scriptTypes,
} from '../integration_local_rpc/generate/outputScripts.util';

import * as fixtureUtil from '../fixture.util';
import { getKeyTriple } from '../testutil';

type AddressTestVector = [scriptType: ScriptType, outputScriptHex: string, address: string];

async function readFixture<T>(network: utxolib.Network, defaultValue: T): Promise<T> {
  return await fixtureUtil.readFixture(
    path.join(__dirname, 'fixtures', `${getNetworkName(network)}.json`),
    defaultValue
  );
}

describe('Address', function () {
  getNetworkList().forEach((network) => {
    describe(`network=${getNetworkName(network)}`, function () {
      const keyTriples = Array.from({ length: 4 }).map((v, i) => getKeyTriple(`${i}`));
      let vectors: AddressTestVector[];
      let refVectors: AddressTestVector[];

      before('prepare fixtures', async function () {
        vectors = keyTriples
          .map((keys) =>
            scriptTypes
              .filter((t) => isSupportedDepositType(network, t))
              .map((scriptType): AddressTestVector => {
                const scriptPubKey = createScriptPubKey(keys, scriptType, network);
                const address = utxolib.address.fromOutputScript(scriptPubKey, network);
                return [scriptType, scriptPubKey.toString('hex'), address];
              })
          )
          .reduce((all: AddressTestVector[], v) => [...all, ...v], []);

        refVectors = await readFixture(network, vectors);
      });

      it('matches test vectors, parses to scriptPubKeyHex', function () {
        assert.strictEqual(vectors.length, refVectors.length);
        vectors.forEach((v, i) => {
          assert.deepStrictEqual(v, refVectors[i]);
          const [, scriptPubKeyHex, address] = v;
          assert.strictEqual(utxolib.address.toOutputScript(address, network).toString('hex'), scriptPubKeyHex);
        });
      });
    });
  });
});
