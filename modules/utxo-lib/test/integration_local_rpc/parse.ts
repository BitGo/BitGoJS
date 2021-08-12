/**
 * @prettier
 */
import * as assert from 'assert';

import { Network } from '../../src/networkTypes';
import { isTestnet } from '../../src/coins';
import {
  verifySignature,
  Transaction as TransactionVerifySignature,
  parseSignatureScript,
} from '../../src/bitgo/signature';

import { isSupportedDepositType, isSupportedSpendType, ScriptType, scriptTypes } from './generate/outputScripts.util';
import { readFixture, TransactionFixtureWithInputs } from './generate/fixtures';

const utxolib = require('../../src');

const fixtureTxTypes = ['deposit', 'spend'] as const;
type FixtureTxType = typeof fixtureTxTypes[number];

interface Transaction extends TransactionVerifySignature {
  toBuffer(): Buffer;
}

function runTestParse(network: Network, txType: FixtureTxType, scriptType: ScriptType) {
  if (txType === 'deposit' && !isSupportedDepositType(network, scriptType)) {
    return;
  }

  if (txType === 'spend' && !isSupportedSpendType(network, scriptType)) {
    return;
  }

  const fixtureName = `${txType}_${scriptType}.json`;
  describe(fixtureName, function () {
    let fixture: TransactionFixtureWithInputs;
    let parsedTx: Transaction;

    before(async function () {
      fixture = await readFixture(network, fixtureName);
      parsedTx = utxolib.Transaction.fromBuffer(Buffer.from(fixture.transaction.hex, 'hex'), network);
    });

    it(`round-trip`, function () {
      assert.strictEqual(typeof fixture.transaction.hex, 'string');
      assert.strictEqual(parsedTx.toBuffer().toString('hex'), fixture.transaction.hex);
    });

    if (txType === 'deposit') {
      return;
    }

    it(`parseSignatureScript`, function () {
      parsedTx.ins.forEach((input, i) => {
        const result = parseSignatureScript(input);
        assert.strict(result.publicKeys !== undefined);
        assert.strictEqual(result.publicKeys.length, 3);

        switch (scriptType) {
          case 'p2sh':
          case 'p2shP2wsh':
            assert.strictEqual(result.inputClassification, 'scripthash');
            break;
          case 'p2wsh':
            assert.strictEqual(result.inputClassification, 'witnessscripthash');
            break;
        }
      });
    });

    it(`verifySignatures`, function () {
      parsedTx.ins.forEach((input, i) => {
        const inputTxid = Buffer.from(input.hash).reverse().toString('hex');
        const inputTx = fixture.inputs.find((tx) => tx.txid === inputTxid);
        if (!inputTx) {
          throw new Error(`could not find inputTx`);
        }
        const prevOutput = inputTx.vout[input.index];
        if (!prevOutput) {
          throw new Error(`could not prevOutput`);
        }
        const { publicKeys } = parseSignatureScript(input);
        if (!publicKeys) {
          throw new Error(`expected publicKeys`);
        }
        assert.strictEqual(publicKeys.length, 3);
        publicKeys.slice(0, 2).forEach((publicKey) => {
          assert.strictEqual(
            verifySignature(parsedTx, i, prevOutput.value * 1e8, {
              publicKey,
            }),
            true
          );
        });
      });
    });
  });
}

describe(`regtest fixtures`, function () {
  Object.keys(utxolib.networks).forEach((networkName) => {
    const network = utxolib.networks[networkName];
    if (!isTestnet(network)) {
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
});
