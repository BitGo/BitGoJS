/**
 * @prettier
 */
import * as assert from 'assert';

import { isSupportedDepositType, isSupportedSpendType, ScriptType, scriptTypes } from './generate/outputScripts';
import { Network } from './generate/types';
import { readFixture } from './generate/fixtures';

const utxolib = require('../../src');
const coins = require('../../src/coins');

const fixtureTxTypes = ['deposit', 'spend'] as const;
type FixtureTxType = typeof fixtureTxTypes[number];

type RpcTransaction = {
  hex: string;
};

function runTestParse(network: Network, txType: FixtureTxType, scriptType: ScriptType) {
  if (txType === 'deposit' && !isSupportedDepositType(network, scriptType)) {
    return;
  }

  if (txType === 'spend' && !isSupportedSpendType(network, scriptType)) {
    return;
  }

  const fixtureName = `${txType}_${scriptType}.json`;

  it(`round-trip ${fixtureName}`, async function () {
    const rpcTx: RpcTransaction = await readFixture(network, fixtureName);
    assert.strictEqual(typeof rpcTx.hex, 'string');
    const buf = Buffer.from(rpcTx.hex, 'hex');
    const parsedTx = utxolib.Transaction.fromBuffer(buf, network);
    assert(parsedTx.toBuffer().equals(buf));
  });
}

Object.keys(utxolib.networks).forEach((networkName) => {
  const network = utxolib.networks[networkName];
  if (!coins.isTestnet(network)) {
    return;
  }

  describe(`${networkName} fixtures`, function () {
    scriptTypes.forEach((scriptType) => {
      fixtureTxTypes.forEach((txType) => {
        runTestParse(network, txType, scriptType);
      });
    });
  });
});
