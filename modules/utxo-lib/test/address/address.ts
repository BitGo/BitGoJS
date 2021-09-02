/**
 * @prettier
 */
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as utxolib from '../../src';
import { getNetworkList, getNetworkName } from '../../src/coins';
import {
  createScriptPubKey,
  getKeyTriple,
  isSupportedDepositType,
  ScriptType,
  scriptTypes,
} from '../integration_local_rpc/generate/outputScripts.util';
import { Network } from '../../src/networkTypes';

async function readFixture<T>(network: Network, defaultValue: T): Promise<T> {
  const p = path.join(__dirname, 'fixtures', `${getNetworkName(network)}.json`);
  try {
    return JSON.parse(await fs.readFile(p, 'utf8')) as T;
  } catch (e) {
    if (e.code === 'ENOENT') {
      await fs.writeFile(p, JSON.stringify(defaultValue, null, 2));
      throw new Error(`wrote defaults, please check contents and re-run tests`);
    }

    throw e;
  }
}

type AddressTestVector = [scriptType: ScriptType, outputScriptHex: string, address: string];

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
          const [scriptType, scriptPubKeyHex, address] = v;
          assert.strictEqual(utxolib.address.toOutputScript(address, network).toString('hex'), scriptPubKeyHex);
        });
      });
    });
  });
});
