/**
 * Contains third-party test fixtures for nonstandard address formats
 */
import * as assert from 'assert';
import { getMainnet, getNetworkList, getNetworkName, Network, networks } from '../../src';
import { fromOutputScript } from '../../src/address';
import {
  AddressFormat,
  fromOutputScriptWithFormat,
  toCanonicalFormat,
  toOutputScriptAndFormat,
  toOutputScriptTryFormats,
  toOutputScriptWithFormat,
} from '../../src/addressFormat';
import { getTestVectorsBitcoinCashAddressTranslations } from './bitcoincash/fixtures';

export type TestVector = {
  /** address network */
  network: Network;
  /** network-specific address format */
  format: AddressFormat;
  /** hash (p2sh or p2pkh) */
  payload: Buffer;
  /** address parseable with `format` */
  input: string;
  /**
   * Address formatted with `format`.
   *
   * Certain formats allow non-canonical representations
   * (for instance cashaddr allows uppercase and unprefixed addresses)
   * in these cases `input` and `output` can be different for the same format.
   */
  output: string;
};

function getTestVectors(network: Network): TestVector[] {
  switch (getMainnet(network)) {
    case networks.bitcoincash:
      return getTestVectorsBitcoinCashAddressTranslations(network);
    default:
      return [];
  }
}

getNetworkList().forEach((network) => {
  const vectors = getTestVectors(network);
  if (!vectors.length) {
    return;
  }
  describe(`custom address formats [${getNetworkName(network)}]`, function () {
    vectors.forEach((v) => {
      it(`supports custom format for address [${v.input}]`, function () {
        const script = toOutputScriptWithFormat(v.input, v.format, network);
        assert.deepStrictEqual(toOutputScriptWithFormat(v.input, v.format, network), script);
        assert.deepStrictEqual(fromOutputScriptWithFormat(script, v.format, network), v.output);
        assert.deepStrictEqual(toOutputScriptAndFormat(v.input, network), [v.format, script]);
        assert.deepStrictEqual(toOutputScriptTryFormats(v.input, network), script);
        assert.deepStrictEqual(toCanonicalFormat(v.input, network), fromOutputScript(script, network));
      });
    });
  });
});
