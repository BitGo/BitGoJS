import * as assert from 'assert';

import {
  createPsbtFromBuffer,
  getPsbtInputSignatureCount,
  getSignatureValidationArrayPsbt,
  getStrictSignatureCount,
  getStrictSignatureCounts,
  PsbtInput,
  PsbtOutput,
  Triple,
  UtxoPsbt,
  UtxoTransaction,
} from '../../../src/bitgo';
import { constructTxnBuilder, Input as TestUtilInput, TxnInput } from '../../../src/testutil';
import { AcidTest, InputScriptType, SignStage } from '../../../src/testutil/psbt';
import { getNetworkList, getNetworkName, isMainnet, networks } from '../../../src';
import {
  parsePsbtMusig2Nonces,
  parsePsbtMusig2PartialSigs,
  parsePsbtMusig2Participants,
} from '../../../src/bitgo/Musig2';
import { getFixture } from '../../fixture.util';

const signs = ['unsigned', 'halfsigned', 'fullsigned'] as const;

function getSigValidArray(scriptType: InputScriptType, signStage: SignStage): Triple<boolean> {
  if (scriptType === 'p2shP2pk' || signStage === 'unsigned') {
    return [false, false, false];
  }
  if (signStage === 'halfsigned') {
    return [true, false, false];
  }
  return scriptType === 'p2trMusig2' ? [true, true, false] : [true, false, true];
}

function signCount(signStage: SignStage) {
  return signStage === 'unsigned' ? 0 : signStage === 'halfsigned' ? 1 : 2;
}

// normalize buffers to hex
function toFixture(obj: unknown) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Buffer.isBuffer(obj)) {
    return obj.toString('hex');
  }
  if (Array.isArray(obj)) {
    return obj.map(toFixture);
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).flatMap(([key, value]) => (value === undefined ? [] : [[key, toFixture(value)]]))
    );
  }
  return obj;
}

function getFixturePsbtInputs(psbt: UtxoPsbt, inputs: TestUtilInput[]) {
  if (inputs.length !== psbt.data.inputs.length) {
    throw new Error('inputs length mismatch');
  }
  return psbt.data.inputs.map((input: PsbtInput, index: number) =>
    toFixture({
      type: inputs[index].scriptType,
      ...input,
      musig2Participants: parsePsbtMusig2Participants(input),
      musig2Nonces: parsePsbtMusig2Nonces(input),
      musig2PartialSigs: parsePsbtMusig2PartialSigs(input),
    })
  );
}

function getFixturePsbtOutputs(psbt: UtxoPsbt) {
  return psbt.data.outputs.map((output: PsbtOutput) => toFixture(output));
}

function runPsbt(acidTest: AcidTest) {
  const coin = getNetworkName(acidTest.network);
  const signatureCount = signCount(acidTest.signStage);

  describe(`psbt build, sign and verify for ${coin} ${acidTest.signStage}`, function () {
    let psbt: UtxoPsbt;

    before(function () {
      psbt = acidTest.createPsbt();
    });

    it('round-trip test', function () {
      assert.deepStrictEqual(psbt.toBuffer(), createPsbtFromBuffer(psbt.toBuffer(), acidTest.network).toBuffer());
    });

    it(`getSignatureValidationArray with globalXpub ${coin} ${acidTest.signStage}`, function () {
      psbt.data.inputs.forEach((input, inputIndex) => {
        const isP2shP2pk = acidTest.inputs[inputIndex].scriptType === 'p2shP2pk';
        const expectedSigValid = getSigValidArray(acidTest.inputs[inputIndex].scriptType, acidTest.signStage);
        psbt.getSignatureValidationArray(inputIndex, { rootNodes: acidTest.rootWalletKeys.triple }).forEach((sv, i) => {
          if (isP2shP2pk && acidTest.signStage !== 'unsigned' && i === 0) {
            assert.strictEqual(sv, true);
          } else {
            assert.strictEqual(sv, expectedSigValid[i]);
          }
        });
      });
    });

    it('matches fixture', async function () {
      let finalizedPsbt: UtxoPsbt | undefined;
      let extractedTransaction: Buffer | undefined;
      if (acidTest.signStage === 'fullsigned') {
        finalizedPsbt = psbt.clone().finalizeAllInputs();
        extractedTransaction = finalizedPsbt.extractTransaction().toBuffer();
      }
      const fixture = {
        walletKeys: acidTest.rootWalletKeys.triple.map((xpub) => xpub.toBase58()),
        psbtBase64: psbt.toBase64(),
        psbtBase64Finalized: finalizedPsbt ? finalizedPsbt.toBase64() : null,
        inputs: psbt.txInputs.map((input) => toFixture(input)),
        psbtInputs: getFixturePsbtInputs(psbt, acidTest.inputs),
        psbtInputsFinalized: finalizedPsbt ? getFixturePsbtInputs(finalizedPsbt, acidTest.inputs) : null,
        outputs: psbt.txOutputs.map((output) => toFixture(output)),
        psbtOutputs: getFixturePsbtOutputs(psbt),
        extractedTransaction: extractedTransaction ? toFixture(extractedTransaction) : null,
      };
      const filename = [acidTest.txFormat, coin, acidTest.signStage, 'json'].join('.');
      assert.deepStrictEqual(fixture, await getFixture(`${__dirname}/../fixtures/psbt/${filename}`, fixture));
    });

    it(`getSignatureValidationArray with rootNodes ${coin} ${acidTest.signStage}`, function () {
      psbt.data.inputs.forEach((input, inputIndex) => {
        const isP2shP2pk = acidTest.inputs[inputIndex].scriptType === 'p2shP2pk';
        const expectedSigValid = getSigValidArray(acidTest.inputs[inputIndex].scriptType, acidTest.signStage);
        psbt.getSignatureValidationArray(inputIndex, { rootNodes: acidTest.rootWalletKeys.triple }).forEach((sv, i) => {
          if (isP2shP2pk && acidTest.signStage !== 'unsigned' && i === 0) {
            assert.strictEqual(sv, true);
          } else {
            assert.strictEqual(sv, expectedSigValid[i]);
          }
        });
      });
    });

    it(`getSignatureValidationArrayPsbt  ${coin} ${acidTest.signStage}`, function () {
      const sigValidations = getSignatureValidationArrayPsbt(psbt, acidTest.rootWalletKeys);
      psbt.data.inputs.forEach((input, inputIndex) => {
        const expectedSigValid = getSigValidArray(acidTest.inputs[inputIndex].scriptType, acidTest.signStage);
        const sigValid = sigValidations.find((sv) => sv[0] === inputIndex);
        assert.ok(sigValid);
        sigValid[1].forEach((sv, i) => assert.strictEqual(sv, expectedSigValid[i]));
      });
    });

    it(`psbt signature counts ${coin} ${acidTest.signStage}`, function () {
      const counts = getStrictSignatureCounts(psbt);
      const countsFromInputs = getStrictSignatureCounts(psbt.data.inputs);

      assert.strictEqual(counts.length, psbt.data.inputs.length);
      assert.strictEqual(countsFromInputs.length, psbt.data.inputs.length);
      psbt.data.inputs.forEach((input, inputIndex) => {
        const expectedCount =
          acidTest.inputs[inputIndex].scriptType === 'p2shP2pk' && signatureCount > 0 ? 1 : signatureCount;
        assert.strictEqual(getPsbtInputSignatureCount(input), expectedCount);
        assert.strictEqual(getStrictSignatureCount(input), expectedCount);
        assert.strictEqual(counts[inputIndex], expectedCount);
        assert.strictEqual(countsFromInputs[inputIndex], expectedCount);
      });

      if (acidTest.signStage === 'fullsigned') {
        const tx = psbt.finalizeAllInputs().extractTransaction() as UtxoTransaction<bigint>;
        const counts = getStrictSignatureCounts(tx);
        const countsFromIns = getStrictSignatureCounts(tx.ins);

        tx.ins.forEach((input, inputIndex) => {
          const expectedCount =
            acidTest.inputs[inputIndex].scriptType === 'p2shP2pk' && signatureCount > 0 ? 1 : signatureCount;
          assert.strictEqual(getStrictSignatureCount(input), expectedCount);
          assert.strictEqual(counts[inputIndex], expectedCount);
          assert.strictEqual(countsFromIns[inputIndex], expectedCount);
        });
      }
    });
  });
}

function runTx(acidTest: AcidTest) {
  const coin = getNetworkName(acidTest.network);
  const signatureCount = signCount(acidTest.signStage);
  describe(`tx build, sign and verify for ${coin} ${acidTest.signStage}`, function () {
    const inputs = acidTest.inputs.filter(
      (input): input is TxnInput<bigint> =>
        input.scriptType !== 'taprootKeyPathSpend' && input.scriptType !== 'p2trMusig2'
    );
    const outputs = acidTest.outputs.filter(
      (output) =>
        ('scriptType' in output && output.scriptType !== undefined) ||
        ('address' in output && output.address !== undefined)
    );
    it(`tx signature counts ${coin} ${acidTest.signStage}`, function () {
      const txb = constructTxnBuilder(inputs, outputs, acidTest.network, acidTest.rootWalletKeys, acidTest.signStage);
      const tx = acidTest.signStage === 'fullsigned' ? txb.build() : txb.buildIncomplete();

      const counts = getStrictSignatureCounts(tx);
      const countsFromIns = getStrictSignatureCounts(tx.ins);

      assert.strictEqual(counts.length, tx.ins.length);
      assert.strictEqual(countsFromIns.length, tx.ins.length);
      tx.ins.forEach((input, inputIndex) => {
        const expectedCount = inputs[inputIndex].scriptType === 'p2shP2pk' && signatureCount > 0 ? 1 : signatureCount;
        assert.strictEqual(
          getStrictSignatureCount(input),
          expectedCount,
          `input ${inputIndex} has ${getStrictSignatureCount(input)} signatures, expected ${expectedCount}`
        );
        assert.strictEqual(counts[inputIndex], expectedCount);
        assert.strictEqual(countsFromIns[inputIndex], expectedCount);
      });
    });
  });
}

signs.forEach((sign) => {
  getNetworkList()
    .filter((v) => isMainnet(v) && v !== networks.bitcoinsv)
    .forEach((network) => {
      runPsbt(AcidTest.withDefaults(network, sign, 'psbt'));
      runPsbt(AcidTest.withDefaults(network, sign, 'psbt-lite'));
      runTx(AcidTest.withDefaults(network, sign, 'psbt'));
    });
});
