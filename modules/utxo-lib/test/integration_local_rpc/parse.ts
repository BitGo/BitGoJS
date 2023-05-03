import * as assert from 'assert';
import { describe, it } from 'mocha';
import { BIP32Interface } from 'bip32';

import { isTestnet, TxOutput, getNetworkList, getNetworkName, networks } from '../../src';
import { getDefaultCosigner } from '../../src/testutil';

import {
  createTransactionBuilderForNetwork,
  createTransactionBuilderFromTransaction,
  createTransactionFromBuffer,
  getDefaultTransactionVersion,
  getOutputIdForInput,
  ParsedSignatureScriptP2ms,
  parseSignatureScript,
  parseSignatureScript2Of3,
  signInput2Of3,
  Triple,
  TxOutPoint,
  UtxoTransaction,
  verifySignature,
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
import { decimalCoinsToSats } from '../testutil';

const fixtureTxTypes = ['deposit', 'spend'] as const;
type FixtureTxType = (typeof fixtureTxTypes)[number];

function getScriptTypes() {
  // FIXME(BG-66941): p2trMusig2 signing does not work in this test suite yet
  //  because the test suite is written with TransactionBuilder
  return scriptTypes.filter((scriptType) => scriptType !== 'p2trMusig2');
}

function runTestParse<TNumber extends number | bigint>(
  protocol: Protocol,
  txType: FixtureTxType,
  scriptType: ScriptType,
  amountType: 'number' | 'bigint'
) {
  if (txType === 'deposit' && !isSupportedDepositType(protocol.network, scriptType)) {
    return;
  }

  if (txType === 'spend' && !isSupportedSpendType(protocol.network, scriptType)) {
    return;
  }

  const fixtureName = `${txType}_${scriptType}.json`;
  describe(`${fixtureName} amountType=${amountType}`, function () {
    let fixture: TransactionFixtureWithInputs;
    let txBuffer: Buffer;
    let parsedTx: UtxoTransaction<TNumber>;

    before(async function () {
      fixture = await readFixture(
        {
          network: protocol.network,
          version: protocol.version ?? getDefaultTransactionVersion(protocol.network),
        },
        fixtureName
      );
      txBuffer = Buffer.from(fixture.transaction.hex, 'hex');
      parsedTx = createTransactionFromBuffer<TNumber>(txBuffer, protocol.network, {
        version: protocol.version,
        amountType,
      });
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

    function getPrevOutputValue(input: InputLookup): TNumber {
      return decimalCoinsToSats<TNumber>(getPrevOutput(input).value, amountType);
    }

    function getPrevOutputScript(input: InputLookup): Buffer {
      return Buffer.from(getPrevOutput(input).scriptPubKey.hex, 'hex');
    }

    function getPrevOutputs(): (TxOutPoint & TxOutput<TNumber>)[] {
      return parsedTx.ins.map((i) => ({
        ...getOutputIdForInput(i),
        script: getPrevOutputScript(i),
        value: getPrevOutputValue(i),
        prevTx: txBuffer,
      }));
    }

    it(`round-trip`, function () {
      parseTransactionRoundTrip(Buffer.from(fixture.transaction.hex, 'hex'), protocol.network, {
        inputs: getPrevOutputs(),
        amountType,
        version: protocol.version,
        // FIXME: prevTx parsing for Zcash not working yet
        roundTripPsbt: txType === 'spend' && protocol.network !== networks.zcashTest,
      });
    });

    it(`round-trip (high-precision values)`, function () {
      if (amountType !== 'bigint') {
        return;
      }
      const tx = createTransactionFromBuffer<TNumber>(Buffer.from(fixture.transaction.hex, 'hex'), protocol.network, {
        amountType,
      });
      tx.outs.forEach((o) => {
        o.value = (BigInt(1e16) + BigInt(1)) as TNumber;
        assert.notStrictEqual(BigInt(Number(o.value)), o.value);
      });
      const txRoundTrip = parseTransactionRoundTrip(tx.toBuffer(), protocol.network, { amountType });
      assert.strictEqual(txRoundTrip.outs.length, tx.outs.length);
      txRoundTrip.outs.forEach((o, i) => {
        assert.deepStrictEqual(o, tx.outs[i]);
      });
    });

    it(`recreate from unsigned hex`, function () {
      if (txType === 'deposit') {
        return;
      }
      const txbUnsigned = createTransactionBuilderForNetwork<TNumber>(protocol.network, { version: protocol.version });
      getPrevOutputs().forEach((o) => {
        txbUnsigned.addInput(o.txid, o.vout);
      });
      fixture.transaction.vout.forEach((o) => {
        txbUnsigned.addOutput(Buffer.from(o.scriptPubKey.hex, 'hex'), decimalCoinsToSats<TNumber>(o.value, amountType));
      });

      const tx = createTransactionFromBuffer<TNumber>(txbUnsigned.buildIncomplete().toBuffer(), protocol.network, {
        version: protocol.version,
        amountType,
      });
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
        const result = parseSignatureScript(input) as ParsedSignatureScriptP2ms;

        assert.strict(result.publicKeys !== undefined);
        assert.strictEqual(result.publicKeys.length, scriptType === 'p2tr' ? 2 : 3);
      });
    });

    if (txType === 'deposit') {
      return;
    }

    it(`verifySignatures for original transaction`, function () {
      parsedTx.ins.forEach((input, i) => {
        const prevOutValue = getPrevOutputValue(input);
        const result = parseSignatureScript2Of3(input);
        assert.ok(result.scriptType !== 'taprootKeyPathSpend');
        if (!result.publicKeys) {
          throw new Error(`expected publicKeys`);
        }
        assert.strictEqual(result.publicKeys.length, scriptType === 'p2tr' ? 2 : 3);

        if (scriptType === 'p2tr') {
          // TODO implement verifySignature for p2tr
          this.skip();
        }

        result.publicKeys.forEach((publicKey, publicKeyIndex) => {
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

    function getRebuiltTransaction(signKeys?: BIP32Interface[]) {
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
  getNetworkList().forEach((network) => {
    if (!isTestnet(network)) {
      return;
    }

    const allVersions = getProtocolVersions(network);
    it('tests default version', function () {
      assert.strictEqual(allVersions.filter((v) => v === getDefaultTransactionVersion(network)).length, 1);
    });

    getProtocolVersions(network).forEach((version) => {
      const isDefault = version === getDefaultTransactionVersion(network);
      describe(`${getNetworkName(network)} fixtures (version=${version}, isDefault=${isDefault})`, function () {
        getScriptTypes().forEach((scriptType) => {
          fixtureTxTypes.forEach((txType) => {
            runTestParse(
              { network, version },
              txType,
              scriptType,
              network === networks.dogecoinTest ? 'bigint' : 'number'
            );
          });
        });
      });
    });
  });
});
