import * as path from 'path';
import * as assert from 'assert';
import * as utxolib from '../../src';
import { getNetworkList, getNetworkName } from '../../src';
import { getKeyTriple } from '../../src/testutil';

import {
  createScriptPubKey,
  isSupportedDepositType,
  ScriptType,
  scriptTypes,
} from '../integration_local_rpc/generate/outputScripts.util';

import { AddressFormat } from '../../src/addressFormat';
import * as fixtureUtil from '../fixture.util';

export type AddressTestVector = [scriptType: ScriptType, outputScriptHex: string, address: string];

export async function readFixture<T>(network: utxolib.Network, suffix: string, defaultValue: T): Promise<T> {
  return await fixtureUtil.readFixture(
    path.join(__dirname, 'fixtures', `${utxolib.getNetworkName(network)}${suffix}.json`),
    defaultValue
  );
}

const keyTriples = Array.from({ length: 4 }).map((v, i) => getKeyTriple(`${i}`));

export function getOutputScripts(network: utxolib.Network): [ScriptType, Buffer][] {
  return keyTriples.flatMap((keys) =>
    scriptTypes
      .filter((t) => isSupportedDepositType(network, t))
      .map((scriptType): [ScriptType, Buffer] => {
        return [scriptType, createScriptPubKey(keys, scriptType, network)];
      })
  );
}

function runWithAddressFormat(network, addressFormat?: AddressFormat) {
  describe(
    `network=${getNetworkName(network)}` + (addressFormat ? ` addressFormat=${addressFormat}` : ''),
    function () {
      let vectors: AddressTestVector[];
      let refVectors: AddressTestVector[];

      before('prepare fixtures', async function () {
        vectors = getOutputScripts(network).map(
          ([scriptType, scriptPubKey]): AddressTestVector => [
            scriptType,
            scriptPubKey.toString('hex'),
            addressFormat === undefined
              ? utxolib.address.fromOutputScript(scriptPubKey, network)
              : utxolib.addressFormat.fromOutputScriptWithFormat(scriptPubKey, addressFormat, network),
          ]
        );

        refVectors = await readFixture(
          network,
          (addressFormat ?? 'default') === 'default' ? '' : `-${addressFormat}`,
          vectors
        );
      });

      it('matches test vectors, parses to scriptPubKeyHex, implements toCanonicalFormat', function () {
        assert.strictEqual(vectors.length, refVectors.length);
        vectors.forEach((v, i) => {
          assert.deepStrictEqual(v, refVectors[i]);
          const [, scriptPubKeyHex, address] = v;

          if (!addressFormat || addressFormat === 'default') {
            assert.strictEqual(utxolib.address.toOutputScript(address, network).toString('hex'), scriptPubKeyHex);
          } else {
            assert.throws(() => {
              utxolib.address.toOutputScript(address, network);
            });
            assert.strictEqual(
              utxolib.addressFormat.toOutputScriptWithFormat(address, addressFormat, network).toString('hex'),
              scriptPubKeyHex
            );
          }

          assert.strictEqual(
            utxolib.addressFormat.toCanonicalFormat(address, network),
            utxolib.address.fromOutputScript(Buffer.from(scriptPubKeyHex, 'hex'), network)
          );

          if (network.bech32 && !address.startsWith(network.bech32)) {
            const { hash, version } = utxolib.address.fromBase58Check(address, network);
            assert.deepStrictEqual(utxolib.address.toBase58Check(hash, version, network), address);
          }
        });
      });
    }
  );
}

describe('Address', function () {
  getNetworkList().forEach((network) => {
    const formats = utxolib.addressFormat.addressFormats.filter((f) =>
      utxolib.addressFormat.isSupportedAddressFormat(f, network)
    );

    [undefined, ...formats].forEach((f) => {
      runWithAddressFormat(network, f);
    });
  });
});
