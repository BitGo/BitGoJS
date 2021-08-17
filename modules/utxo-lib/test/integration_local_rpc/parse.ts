/**
 * @prettier
 */
import * as assert from 'assert';

import { Network } from '../../src/networkTypes';
import { isTestnet } from '../../src/coins';
import { verifySignature, parseSignatureScript, Input } from '../../src/bitgo/signature';

import {
  createSpendTransactionFromPrevOutputs,
  isSupportedDepositType,
  isSupportedSpendType,
  ScriptType,
  scriptTypes,
} from './generate/outputScripts.util';
import { fixtureKeys, readFixture, TransactionFixtureWithInputs } from './generate/fixtures';

const utxolib = require('../../src');

const fixtureTxTypes = ['deposit', 'spend'] as const;
type FixtureTxType = typeof fixtureTxTypes[number];

type Output = {
  value: number;
  script: Buffer;
};

interface Transaction {
  network: Network;
  ins: Input[];
  outs: Output[];
  hashForSignatureByNetwork(index: number, pubScript: Buffer, amount: number, hashType: number, isSegwit: boolean);
  toBuffer(): Buffer;
}

function getTxidFromHash(buf: Buffer): string {
  return Buffer.from(buf).reverse().toString('hex');
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

    it(`parseSignatureScript`, function () {
      parsedTx.ins.forEach((input, i) => {
        const result = parseSignatureScript(input);

        if (txType === 'deposit') {
          return;
        }

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

    if (txType === 'deposit') {
      return;
    }

    function getPrevOutput(input: { txid?: string; hash?: Buffer; index: number }) {
      if (input.hash) {
        input = {
          ...input,
          txid: getTxidFromHash(input.hash),
        };
      }

      const inputTx = fixture.inputs.find((tx) => tx.txid === input.txid);
      if (!inputTx) {
        throw new Error(`could not find inputTx`);
      }
      const prevOutput = inputTx.vout[input.index];
      if (!prevOutput) {
        throw new Error(`could not prevOutput`);
      }
      return prevOutput;
    }

    it(`verifySignatures`, function () {
      parsedTx.ins.forEach((input, i) => {
        const prevOutput = getPrevOutput(input);
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

          assert.strictEqual(verifySignature(parsedTx, i, prevOutput.value * 1e8), true);
        });
      });
    });

    it('createSpendTransaction match', function () {
      // Since we use fixed keys and use deterministic signing, we can create the exact same
      // transaction from the same inputs.
      assert.strict(parsedTx.outs.length === 1);
      const recipientScript = parsedTx.outs[0].script;
      const rebuiltTx = createSpendTransactionFromPrevOutputs(
        fixtureKeys,
        scriptType,
        parsedTx.ins.map((i) => [getTxidFromHash(i.hash), i.index, getPrevOutput(i).value * 1e8]),
        recipientScript,
        network
      );
      assert.strictEqual(rebuiltTx.toBuffer().toString('hex'), fixture.transaction.hex);
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
