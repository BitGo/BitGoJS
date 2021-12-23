import * as assert from 'assert';
import * as bip32 from 'bip32';

import { TxOutput, isTestnet } from '../../src';

import {
  verifySignature,
  parseSignatureScript,
  parseSignatureScript2Of3,
  ParsedSignatureScript2Of3,
  signInput2Of3,
  Triple,
  UtxoTransaction,
  getOutputIdForInput,
  TxOutPoint,
  createTransactionBuilderForNetwork,
  createTransactionBuilderFromTransaction,
  createTransactionFromBuffer,
} from '../../src/bitgo';
import { isScriptType2Of3, ScriptType2Of3 } from '../../src/bitgo/outputScripts';

import {
  createSpendTransactionFromPrevOutputs,
  isSupportedDepositType,
  isSupportedSpendType,
  ScriptType,
  scriptTypes,
} from './generate/outputScripts.util';
import {
  fixtureKeys,
  getProtocolVersions,
  Protocol,
  readFixture,
  TransactionFixtureWithInputs,
} from './generate/fixtures';
import { parseTransactionRoundTrip } from '../transaction_util';
import { normalizeParsedTransaction, normalizeRpcTransaction } from './compare';
import { getDefaultCosigner } from '../testutil';
import { isZcash } from '../../src/networks';

const utxolib = require('../../src');

const fixtureTxTypes = ['deposit', 'spend'] as const;
type FixtureTxType = typeof fixtureTxTypes[number];

function runTestParse(protocol: Protocol, txType: FixtureTxType, scriptType: ScriptType) {
  if (txType === 'deposit' && !isSupportedDepositType(protocol.network, scriptType)) {
    return;
  }

  if (txType === 'spend' && !isSupportedSpendType(protocol.network, scriptType)) {
    return;
  }

  const fixtureName = `${txType}_${scriptType}.json`;
  describe(fixtureName, function () {
    let fixture: TransactionFixtureWithInputs;
    let parsedTx: UtxoTransaction;

    before(async function () {
      fixture = await readFixture(protocol, fixtureName);
      parsedTx = createTransactionFromBuffer(Buffer.from(fixture.transaction.hex, 'hex'), protocol.network);
    });

    type InputLookup = { txid?: string; hash?: Buffer; index: number };

    function getPrevOutput(input: InputLookup) {
      if (input.hash) {
        input = {
          ...input,
          ...getOutputIdForInput(input as { hash: Buffer; index: number }),
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

    function getPrevOutputValue(input: InputLookup) {
      return getPrevOutput(input).value * 1e8;
    }

    function getPrevOutputScript(input: InputLookup): Buffer {
      return Buffer.from(getPrevOutput(input).scriptPubKey.hex, 'hex');
    }

    function getPrevOutputs(): (TxOutPoint & TxOutput)[] {
      return parsedTx.ins.map((i) => ({
        ...getOutputIdForInput(i),
        script: getPrevOutputScript(i),
        value: getPrevOutputValue(i),
      }));
    }

    it(`round-trip`, function () {
      parseTransactionRoundTrip(Buffer.from(fixture.transaction.hex, 'hex'), protocol.network, getPrevOutputs());
    });

    it(`recreate from unsigned hex`, function () {
      if (txType === 'deposit') {
        return;
      }
      const txbUnsigned = createTransactionBuilderForNetwork(protocol.network, { version: protocol.version });
      getPrevOutputs().forEach((o) => {
        txbUnsigned.addInput(o.txid, o.vout);
      });
      fixture.transaction.vout.forEach((o) => {
        txbUnsigned.addOutput(Buffer.from(o.scriptPubKey.hex, 'hex'), o.value * 1e8);
      });

      const tx = createTransactionFromBuffer(txbUnsigned.buildIncomplete().toBuffer(), protocol.network);
      const txb = createTransactionBuilderFromTransaction(tx, getPrevOutputs());
      const signKeys = [fixtureKeys[0], fixtureKeys[2]];
      const publicKeys = fixtureKeys.map((k) => k.publicKey) as Triple<Buffer>;
      getPrevOutputs().forEach(({ value }, vin) => {
        signKeys.forEach((key) => {
          signInput2Of3(
            txb,
            vin,
            scriptType as ScriptType2Of3,
            publicKeys,
            key,
            getDefaultCosigner(publicKeys, key.publicKey),
            value
          );
        });
      });

      assert.strictEqual(txb.build().version, tx.version);

      assert.strictEqual(txb.build().toBuffer().toString('hex'), fixture.transaction.hex);
    });

    it('compare against RPC data', function () {
      assert.deepStrictEqual(
        normalizeRpcTransaction(fixture.transaction, protocol.network),
        normalizeParsedTransaction(parsedTx, protocol.network)
      );
    });

    it(`parseSignatureScript`, function () {
      if (txType === 'deposit') {
        return;
      }

      parsedTx.ins.forEach((input, i) => {
        const result = parseSignatureScript(input) as ParsedSignatureScript2Of3;

        assert.strict(result.publicKeys !== undefined);
        assert.strictEqual(result.publicKeys.length, scriptType === 'p2tr' ? 2 : 3);

        switch (scriptType) {
          case 'p2sh':
          case 'p2shP2wsh':
            assert.strictEqual(result.inputClassification, 'scripthash');
            break;
          case 'p2wsh':
            assert.strictEqual(result.inputClassification, 'witnessscripthash');
            break;
          case 'p2tr':
            assert.strictEqual(result.inputClassification, 'taproot');
            break;
          default:
            throw new Error(`unknown scriptType ${scriptType}`);
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
        assert.strictEqual(publicKeys.length, scriptType === 'p2tr' ? 2 : 3);

        if (scriptType === 'p2tr') {
          // TODO implement verifySignature for p2tr
          this.skip();
        }

        publicKeys.forEach((publicKey, publicKeyIndex) => {
          assert.strictEqual(
            verifySignature(parsedTx, i, prevOutValue, {
              publicKey,
            }),
            publicKeyIndex === 0 || publicKeyIndex === 2
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
        protocol.network,
        { signKeys, version: protocol.version }
      );
    }

    it(`verifySignatures with one or two signatures`, function () {
      fixtureKeys.forEach((key1) => {
        const rebuiltTx = getRebuiltTransaction([key1]);
        const prevOutputs = rebuiltTx.ins.map((v) => ({
          script: getPrevOutputScript(v),
          value: getPrevOutputValue(v),
        }));
        rebuiltTx.ins.forEach((input, i) => {
          assert.strict(verifySignature(rebuiltTx, i, getPrevOutputValue(input), {}, prevOutputs));
        });

        fixtureKeys.forEach((key2) => {
          if (key1 === key2) {
            return;
          }

          if (scriptType === 'p2tr') {
            const keypair = [fixtureKeys[0], fixtureKeys[2]];
            if (!keypair.includes(key1) || !keypair.includes(key2)) {
              return;
            }
          }

          const rebuiltTx = getRebuiltTransaction([key1, key2]);
          rebuiltTx.ins.forEach((input, i) => {
            assert.strict(verifySignature(rebuiltTx, i, getPrevOutputValue(input), {}, prevOutputs));
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
  utxolib.getNetworkList().forEach((network) => {
    if (!isTestnet(network)) {
      return;
    }

    getProtocolVersions(network).forEach((version) => {
      describe(`${utxolib.getNetworkName(network)} v${version} fixtures`, function () {
        scriptTypes.forEach((scriptType) => {
          fixtureTxTypes.forEach((txType) => {
            runTestParse({ network, version }, txType, scriptType);
          });
        });
      });
    });
  });
});
