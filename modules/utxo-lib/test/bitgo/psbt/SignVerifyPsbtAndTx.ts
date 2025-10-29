import * as assert from 'assert';

import {
  addXpubsToPsbt,
  clonePsbtWithoutNonWitnessUtxo,
  getPsbtInputSignatureCount,
  getSignatureValidationArrayPsbt,
  getStrictSignatureCount,
  getStrictSignatureCounts,
  PsbtInput,
  PsbtOutput,
  RootWalletKeys,
  Triple,
  UtxoPsbt,
  UtxoTransaction,
} from '../../../src/bitgo';
import { BIP32Interface } from '@bitgo/secp256k1';
import {
  constructPsbt,
  constructTxnBuilder,
  getDefaultWalletKeys,
  Input as TestUtilInput,
  InputScriptType,
  inputScriptTypes,
  Output as TestUtilOutput,
  outputScriptTypes,
  TxnInput,
  txnInputScriptTypes,
  TxnOutput,
  txnOutputScriptTypes,
} from '../../../src/testutil';
import { getNetworkList, getNetworkName, isMainnet, Network, networks } from '../../../src';
import { isSupportedScriptType } from '../../../src/bitgo/outputScripts';
import { SignatureTargetType } from './Psbt';
import { getFixture } from '../../fixture.util';

const rootWalletKeys = getDefaultWalletKeys();
const signs = ['unsigned', 'halfsigned', 'fullsigned'] as const;

const rootWalletKeysXpubs = new RootWalletKeys(
  rootWalletKeys.triple.map((bip32) => bip32.neutered()) as Triple<BIP32Interface>,
  rootWalletKeys.derivationPrefixes
);

const psbtInputs = inputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(1000) }));
const psbtOutputs = outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900) }));

const txInputs = txnInputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(1000) }));
const txOutputs = txnOutputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900) }));

function getSigValidArray(scriptType: InputScriptType, sign: SignatureTargetType): Triple<boolean> {
  if (scriptType === 'p2shP2pk' || sign === 'unsigned') {
    return [false, false, false];
  }
  if (sign === 'halfsigned') {
    return [true, false, false];
  }
  return scriptType === 'p2trMusig2' ? [true, true, false] : [true, false, true];
}

function signCount(sign: SignatureTargetType) {
  return sign === 'unsigned' ? 0 : sign === 'halfsigned' ? 1 : 2;
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
    toFixture({ type: inputs[index].scriptType, ...input })
  );
}

function getFixturePsbtOutputs(psbt: UtxoPsbt) {
  return psbt.data.outputs.map((output: PsbtOutput) => toFixture(output));
}

function runPsbt(
  network: Network,
  sign: SignatureTargetType,
  inputs: TestUtilInput[],
  outputs: TestUtilOutput[],
  {
    txFormat,
  }: {
    txFormat?: 'psbt' | 'psbt-lite';
  }
) {
  const coin = getNetworkName(network);
  const signatureCount = signCount(sign);
  const inputTypes = inputs.map((input) => input.scriptType);

  describe(`psbt build, sign and verify for ${coin} ${inputTypes.join('-')} ${sign}`, function () {
    let psbt: UtxoPsbt;

    it(`getSignatureValidationArray with globalXpub ${coin} ${sign}`, function () {
      psbt = constructPsbt(inputs, outputs, network, rootWalletKeys, sign, { deterministic: true });
      addXpubsToPsbt(psbt, rootWalletKeysXpubs);
      psbt.data.inputs.forEach((input, inputIndex) => {
        const isP2shP2pk = inputs[inputIndex].scriptType === 'p2shP2pk';
        const expectedSigValid = getSigValidArray(inputs[inputIndex].scriptType, sign);
        psbt.getSignatureValidationArray(inputIndex, { rootNodes: rootWalletKeys.triple }).forEach((sv, i) => {
          if (isP2shP2pk && sign !== 'unsigned' && i === 0) {
            assert.strictEqual(sv, true);
          } else {
            assert.strictEqual(sv, expectedSigValid[i]);
          }
        });
      });

      if (txFormat === 'psbt-lite') {
        psbt = clonePsbtWithoutNonWitnessUtxo(psbt);
      }
    });

    it('matches fixture', async function () {
      let extractedTransaction: Buffer | undefined;
      if (sign === 'fullsigned') {
        extractedTransaction = psbt.clone().finalizeAllInputs().extractTransaction().toBuffer();
      }
      const fixture = {
        walletKeys: rootWalletKeys.triple.map((xpub) => xpub.toBase58()),
        psbtBase64: psbt.toBase64(),
        inputs: psbt.txInputs.map((input) => toFixture(input)),
        psbtInputs: getFixturePsbtInputs(psbt, inputs),
        outputs: psbt.txOutputs.map((output) => toFixture(output)),
        psbtOutputs: getFixturePsbtOutputs(psbt),
        extractedTransaction: extractedTransaction ? toFixture(extractedTransaction) : null,
      };
      const filename = [txFormat, coin, sign, 'json'].join('.');
      assert.deepStrictEqual(fixture, await getFixture(`${__dirname}/../fixtures/psbt/${filename}`, fixture));
    });

    it(`getSignatureValidationArray with rootNodes ${coin} ${sign}`, function () {
      const psbt = constructPsbt(inputs, outputs, network, rootWalletKeys, sign);
      addXpubsToPsbt(psbt, rootWalletKeysXpubs);
      psbt.data.inputs.forEach((input, inputIndex) => {
        const isP2shP2pk = inputs[inputIndex].scriptType === 'p2shP2pk';
        const expectedSigValid = getSigValidArray(inputs[inputIndex].scriptType, sign);
        psbt.getSignatureValidationArray(inputIndex, { rootNodes: rootWalletKeysXpubs.triple }).forEach((sv, i) => {
          if (isP2shP2pk && sign !== 'unsigned' && i === 0) {
            assert.strictEqual(sv, true);
          } else {
            assert.strictEqual(sv, expectedSigValid[i]);
          }
        });
      });
    });

    it(`getSignatureValidationArrayPsbt  ${coin} ${sign}`, function () {
      const psbt = constructPsbt(inputs, outputs, network, rootWalletKeys, sign);
      const sigValidations = getSignatureValidationArrayPsbt(psbt, rootWalletKeysXpubs);
      psbt.data.inputs.forEach((input, inputIndex) => {
        const expectedSigValid = getSigValidArray(inputs[inputIndex].scriptType, sign);
        const sigValid = sigValidations.find((sv) => sv[0] === inputIndex);
        assert.ok(sigValid);
        sigValid[1].forEach((sv, i) => assert.strictEqual(sv, expectedSigValid[i]));
      });
    });

    it(`psbt signature counts ${coin} ${sign}`, function () {
      const psbt = constructPsbt(inputs, outputs, network, rootWalletKeys, sign);
      const counts = getStrictSignatureCounts(psbt);
      const countsFromInputs = getStrictSignatureCounts(psbt.data.inputs);

      assert.strictEqual(counts.length, psbt.data.inputs.length);
      assert.strictEqual(countsFromInputs.length, psbt.data.inputs.length);
      psbt.data.inputs.forEach((input, inputIndex) => {
        const expectedCount = inputs[inputIndex].scriptType === 'p2shP2pk' && signatureCount > 0 ? 1 : signatureCount;
        assert.strictEqual(getPsbtInputSignatureCount(input), expectedCount);
        assert.strictEqual(getStrictSignatureCount(input), expectedCount);
        assert.strictEqual(counts[inputIndex], expectedCount);
        assert.strictEqual(countsFromInputs[inputIndex], expectedCount);
      });

      if (sign === 'fullsigned') {
        const tx = psbt.finalizeAllInputs().extractTransaction() as UtxoTransaction<bigint>;
        const counts = getStrictSignatureCounts(tx);
        const countsFromIns = getStrictSignatureCounts(tx.ins);

        tx.ins.forEach((input, inputIndex) => {
          const expectedCount = inputs[inputIndex].scriptType === 'p2shP2pk' ? 1 : signatureCount;
          assert.strictEqual(getStrictSignatureCount(input), expectedCount);
          assert.strictEqual(counts[inputIndex], expectedCount);
          assert.strictEqual(countsFromIns[inputIndex], expectedCount);
        });
      }
    });
  });
}

function runTx<TNumber extends number | bigint>(
  network: Network,
  sign: SignatureTargetType,
  inputs: TxnInput<TNumber>[],
  outputs: TxnOutput<TNumber>[]
) {
  const coin = getNetworkName(network);
  const signatureCount = signCount(sign);
  describe(`tx build, sign and verify for ${coin} ${sign}`, function () {
    it(`tx signature counts ${coin} ${sign}`, function () {
      const txb = constructTxnBuilder(inputs, outputs, network, rootWalletKeys, sign);
      const tx = sign === 'fullsigned' ? txb.build() : txb.buildIncomplete();

      const counts = getStrictSignatureCounts(tx);
      const countsFromIns = getStrictSignatureCounts(tx.ins);

      assert.strictEqual(counts.length, tx.ins.length);
      assert.strictEqual(countsFromIns.length, tx.ins.length);
      tx.ins.forEach((input, inputIndex) => {
        const expectedCount = inputs[inputIndex].scriptType === 'p2shP2pk' && signatureCount > 0 ? 1 : signatureCount;
        assert.strictEqual(getStrictSignatureCount(input), expectedCount);
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
      const supportedPsbtInputs = psbtInputs.filter((input) =>
        isSupportedScriptType(network, input.scriptType === 'taprootKeyPathSpend' ? 'p2trMusig2' : input.scriptType)
      );
      const supportedPsbtOutputs = psbtOutputs.filter((output) => isSupportedScriptType(network, output.scriptType));
      runPsbt(network, sign, supportedPsbtInputs, supportedPsbtOutputs, { txFormat: 'psbt' });
      runPsbt(network, sign, supportedPsbtInputs, supportedPsbtOutputs, { txFormat: 'psbt-lite' });

      const supportedTxInputs = txInputs.filter((input) => isSupportedScriptType(network, input.scriptType));
      const supportedTxOutputs = txOutputs.filter((output) => isSupportedScriptType(network, output.scriptType));
      runTx(network, sign, supportedTxInputs, supportedTxOutputs);
    });
});
