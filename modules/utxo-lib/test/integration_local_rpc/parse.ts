import * as assert from 'assert';
import * as bip32 from 'bip32';

import { Network } from '../../src/networkTypes';
import { isTestnet } from '../../src/coins';
import {
  verifySignature,
  parseSignatureScript,
  parseSignatureScript2Of3,
  ParsedSignatureScript2Of3,
} from '../../src/bitgo/signature';

import {
  createSpendTransactionFromPrevOutputs,
  isSupportedDepositType,
  isSupportedSpendType,
  ScriptType,
  scriptTypes,
} from './generate/outputScripts.util';
import { fixtureKeys, readFixture, TransactionFixtureWithInputs } from './generate/fixtures';
import { isScriptType2Of3 } from '../../src/bitgo/outputScripts';
import { parseTransactionRoundTrip } from '../transaction_util';
import { normalizeParsedTransaction, normalizeRpcTransaction } from './compare';
import { UtxoTransaction } from '../../src/bitgo/UtxoTransaction';
import { createTransactionFromBuffer } from '../../src/bitgo';

const utxolib = require('../../src');

const fixtureTxTypes = ['deposit', 'spend'] as const;
type FixtureTxType = typeof fixtureTxTypes[number];

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
    let parsedTx: UtxoTransaction;

    before(async function () {
      fixture = await readFixture(network, fixtureName);
      parsedTx = createTransactionFromBuffer(Buffer.from(fixture.transaction.hex, 'hex'), network);
    });

    function getPrevOutputValue(input: { txid?: string; hash?: Buffer; index: number }) {
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
      return prevOutput.value * 1e8;
    }

    function getPrevOutputs(): [txid: string, index: number, value: number][] {
      return parsedTx.ins.map((i) => [getTxidFromHash(i.hash), i.index, getPrevOutputValue(i)]);
    }

    it(`round-trip`, function () {
      parseTransactionRoundTrip(Buffer.from(fixture.transaction.hex, 'hex'), network, getPrevOutputs());
    });

    it('compare against RPC data', function () {
      assert.deepStrictEqual(
        normalizeRpcTransaction(fixture.transaction, network),
        normalizeParsedTransaction(parsedTx, network)
      );
    });

    it(`parseSignatureScript`, function () {
      parsedTx.ins.forEach((input, i) => {
        const result = parseSignatureScript(input) as ParsedSignatureScript2Of3;

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

    it(`verifySignatures for original transaction`, function () {
      parsedTx.ins.forEach((input, i) => {
        const prevOutValue = getPrevOutputValue(input);
        const { publicKeys } = parseSignatureScript2Of3(input);
        if (!publicKeys) {
          throw new Error(`expected publicKeys`);
        }
        assert.strictEqual(publicKeys.length, 3);

        publicKeys.forEach((publicKey, publicKeyIndex) => {
          assert.strictEqual(
            verifySignature(parsedTx, i, prevOutValue, {
              publicKey,
            }),
            publicKeyIndex === 0 || publicKeyIndex === 1
          );
        });

        assert.strictEqual(verifySignature(parsedTx, i, prevOutValue), true);
      });
    });

    function getRebuiltTransaction(signKeys?: bip32.BIP32Interface[]) {
      assert.strict(parsedTx.outs.length === 1);
      assert.strict(isScriptType2Of3(scriptType));
      const recipientScript = parsedTx.outs[0].script;
      return createSpendTransactionFromPrevOutputs(
        fixtureKeys,
        scriptType,
        getPrevOutputs(),
        recipientScript,
        network,
        { signKeys }
      );
    }

    it(`verifySignatures with one or two signatures`, function () {
      fixtureKeys.forEach((key1) => {
        const rebuiltTx = getRebuiltTransaction([key1]);
        rebuiltTx.ins.forEach((input, i) => {
          assert.strict(verifySignature(rebuiltTx, i, getPrevOutputValue(input)));
        });

        fixtureKeys.forEach((key2) => {
          if (key1 === key2) {
            return;
          }

          const rebuiltTx = getRebuiltTransaction([key1, key2]);
          rebuiltTx.ins.forEach((input, i) => {
            assert.strict(verifySignature(rebuiltTx, i, getPrevOutputValue(input)));
          });
        });
      });
    });

    it('createSpendTransaction match', function () {
      const rebuiltTx = getRebuiltTransaction();
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
