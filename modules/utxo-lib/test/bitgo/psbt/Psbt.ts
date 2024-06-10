import * as assert from 'assert';

import { Network, getNetworkName, networks, getNetworkList, testutil, isMainnet, Transaction } from '../../../src';
import {
  getExternalChainCode,
  outputScripts,
  KeyName,
  UtxoPsbt,
  ZcashPsbt,
  createPsbtFromHex,
  parsePsbtInput,
  toWalletPsbt,
  createPsbtForNetwork,
  addReplayProtectionUnspentToPsbt,
  addWalletOutputToPsbt,
  getInternalChainCode,
  UtxoTransaction,
  isTransactionWithKeyPathSpendInput,
  isPsbt,
  psbtIncludesUnspentAtIndex,
  updateWalletUnspentForPsbt,
  createPsbtFromTransaction,
  toPrevOutput,
  updateReplayProtectionUnspentToPsbt,
  Unspent,
  isWalletUnspent,
  updateWalletOutputForPsbt,
  extractP2msOnlyHalfSignedTx,
  toOutput,
  createTransactionBuilderFromTransaction,
  addXpubsToPsbt,
  clonePsbtWithoutNonWitnessUtxo,
  deleteWitnessUtxoForNonSegwitInputs,
  getPsbtInputScriptType,
  withUnsafeNonSegwit,
  getTransactionAmountsFromPsbt,
  WalletUnspent,
  getDefaultSigHash,
  isPsbtLite,
} from '../../../src/bitgo';
import {
  createOutputScript2of3,
  createOutputScriptP2shP2pk,
  isSupportedScriptType,
  ScriptType2Of3,
  ScriptTypeP2shP2pk,
  scriptTypes2Of3,
} from '../../../src/bitgo/outputScripts';

import {
  getDefaultWalletKeys,
  Input,
  inputScriptTypes,
  mockReplayProtectionUnspent,
  Output,
  outputScriptTypes,
  replayProtectionKeyPair,
  signAllTxnInputs,
} from '../../../src/testutil';

import { defaultTestOutputAmount } from '../../transaction_util';
import {
  assertEqualTransactions,
  constructTransactionUsingTxBuilder,
  signPsbt,
  toBigInt,
  validatePsbtParsing,
} from './psbtUtil';

import { mockUnspents } from '../../../src/testutil';
import { constructPsbt } from './Musig2Util';

const CHANGE_INDEX = 100;
const FEE = BigInt(100);

export type AmountType = 'number' | 'bigint';
export type InputType = outputScripts.ScriptType2Of3;
export type SignatureTargetType = 'unsigned' | 'halfsigned' | 'fullsigned';

const network = networks.bitcoin;
const rootWalletKeys = getDefaultWalletKeys();

function getScriptTypes2Of3() {
  // FIXME(BG-66941): p2trMusig2 signing does not work in this test suite yet
  //  because the test suite is written with TransactionBuilder
  return outputScripts.scriptTypes2Of3.filter((scriptType) => scriptType !== 'p2trMusig2');
}

const halfSignedInputs = (['p2sh', 'p2wsh', 'p2shP2wsh'] as const).map((scriptType) => ({
  scriptType,
  value: BigInt(1000),
}));
const halfSignedOutputs = outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(500) }));

const psbtInputs = inputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(1000) }));
const psbtOutputs = outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900) }));

describe('Psbt Misc', function () {
  it('fail to finalise p2tr sighash mismatch', function () {
    const psbt = testutil.constructPsbt(
      [{ scriptType: 'p2tr', value: BigInt(1000) }],
      [{ scriptType: 'p2sh', value: BigInt(900) }],
      network,
      rootWalletKeys,
      'fullsigned'
    );
    assert(psbt.validateSignaturesOfAllInputs());
    const tapScriptSig = psbt.data.inputs[0].tapScriptSig;
    assert(tapScriptSig);
    tapScriptSig[0].signature = Buffer.concat([tapScriptSig[0].signature, Buffer.of(Transaction.SIGHASH_ALL)]);
    assert.throws(
      () => psbt.finalizeAllInputs(),
      (e: any) => e.message === 'signature sighash does not match input sighash type'
    );
  });

  describe('isPsbtLite', function () {
    it('no inputs', function () {
      const psbt = testutil.constructPsbt([], [], network, rootWalletKeys, 'unsigned');
      assert.strictEqual(isPsbtLite(psbt), false);
    });

    it('all inputs are segwit', function () {
      const psbt = testutil.constructPsbt(
        psbtInputs.filter((s) => s.scriptType !== 'p2sh' && s.scriptType !== 'p2shP2pk'),
        psbtOutputs,
        network,
        rootWalletKeys,
        'unsigned'
      );
      assert.strictEqual(isPsbtLite(psbt), false);
    });

    it('some inputs are non-segwit', function () {
      const psbt = testutil.constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
      assert.strictEqual(isPsbtLite(psbt), false);
    });

    it('should be true if after clonePsbtWithoutNonWitnessUtxo', function () {
      const psbt = testutil.constructPsbt(psbtInputs, psbtOutputs, network, rootWalletKeys, 'unsigned');
      const clonedPsbt = clonePsbtWithoutNonWitnessUtxo(psbt);
      assert.strictEqual(isPsbtLite(clonedPsbt), true);
    });
  });
});

describe('extractP2msOnlyHalfSignedTx failure', function () {
  it('invalid signature count', function () {
    const psbt = testutil.constructPsbt(halfSignedInputs, halfSignedOutputs, network, rootWalletKeys, 'unsigned');
    assert.throws(
      () => extractP2msOnlyHalfSignedTx(psbt),
      (e: any) => e.message === 'unexpected signature count undefined'
    );
  });

  it('empty inputs', function () {
    const psbt = testutil.constructPsbt([], [], network, rootWalletKeys, 'unsigned');
    assert.throws(
      () => extractP2msOnlyHalfSignedTx(psbt),
      (e: any) => e.message === 'empty inputs or outputs'
    );
  });

  it('unsupported script type', function () {
    const psbt = testutil.constructPsbt(
      [{ scriptType: 'p2tr', value: BigInt(1000) }],
      [{ scriptType: 'p2sh', value: BigInt(900) }],
      network,
      rootWalletKeys,
      'halfsigned'
    );
    assert.throws(
      () => extractP2msOnlyHalfSignedTx(psbt),
      (e: any) => e.message === 'unsupported script type taprootScriptPathSpend'
    );
  });
});

function runExtractP2msOnlyHalfSignedTxTest(network: Network, inputs: Input[], outputs: Output[]) {
  const coin = getNetworkName(network);

  describe(`extractP2msOnlyHalfSignedTx success for ${coin}`, function () {
    it(`success for ${coin}`, function () {
      const signers: { signerName: KeyName; cosignerName: KeyName } = { signerName: 'user', cosignerName: 'backup' };
      const txnOutputs = outputs;
      const txnInputs = inputs
        .map((v) =>
          v.scriptType === 'p2sh' || v.scriptType === 'p2shP2wsh' || v.scriptType === 'p2wsh'
            ? {
                scriptType: v.scriptType,
                value: v.value,
              }
            : undefined
        )
        .filter((v) => !!v) as testutil.TxnInput<bigint>[];

      const psbt = testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'halfsigned', { signers });
      const halfSignedPsbtTx = extractP2msOnlyHalfSignedTx(psbt);

      let txb = testutil.constructTxnBuilder(txnInputs, txnOutputs, network, rootWalletKeys, 'halfsigned', signers);
      const halfSignedTxbTx = txb.buildIncomplete();

      const unspents = toBigInt(inputs.map((input, i) => testutil.toUnspent(input, i, network, rootWalletKeys)));

      assertEqualTransactions(halfSignedPsbtTx, halfSignedTxbTx);
      validatePsbtParsing(halfSignedPsbtTx, psbt, unspents, 'halfsigned');
      validatePsbtParsing(halfSignedTxbTx, psbt, unspents, 'halfsigned');

      testutil.signAllPsbtInputs(psbt, inputs, rootWalletKeys, 'fullsigned', { signers });
      const fullySignedPsbt = psbt.clone();
      const psbtTx = psbt.finalizeAllInputs().extractTransaction();

      const txnUnspents = txnInputs.map((v, i) => testutil.toTxnUnspent(v, i, network, rootWalletKeys));
      const prevOutputs = txnUnspents.map((u) => toOutput(u, network));
      txb = createTransactionBuilderFromTransaction<bigint>(halfSignedTxbTx, prevOutputs);
      signAllTxnInputs(txb, txnInputs, rootWalletKeys, 'fullsigned', signers);
      const txbTx = txb.build();

      assertEqualTransactions(psbtTx, txbTx);
      validatePsbtParsing(psbtTx, fullySignedPsbt, unspents, 'fullsigned');
      validatePsbtParsing(txbTx, fullySignedPsbt, unspents, 'fullsigned');
    });
  });
}

function runBuildSignSendFlowTest(
  network: Network,
  inputs: Input[],
  outputs: Output[],
  { skipNonWitnessUtxo = false } = {}
) {
  const coin = getNetworkName(network);

  function assertValidate(psbt: UtxoPsbt) {
    psbt.data.inputs.forEach((input, i) => {
      assert.ok(psbt.validateSignaturesOfInputHD(i, rootWalletKeys['user']));
      if (getPsbtInputScriptType(input) !== 'p2shP2pk') {
        assert.ok(psbt.validateSignaturesOfInputHD(i, rootWalletKeys['bitgo']));
      }
    });
    assert.ok(psbt.validateSignaturesOfAllInputs());
  }

  describe(`Build, sign & send flow for ${coin}`, function () {
    /**
     * Skip adding nonWitnessUtxos to psbts
     * ------------------------------------
     * In the instance that we want to doing a bulk sweep, for network and client performance reasons we are substituting
     * the nonWitnessUtxo for p2sh and p2shP2pk inputs with a witnessUtxo. We need the witnessUtxo so that we can half
     * sign the transaction locally with the user key. When we send the half signed to BitGo, the PSBT will be properly
     * populated such that the non-segwit inputs have the nonWitnessUtxo. This means when we send it to BitGo we should
     * remove the witnessUtxo so that it just has the partialSig and redeemScript.
     */
    it(`success for ${coin}${skipNonWitnessUtxo ? ' without nonWitnessUtxo for p2sh' : ''}`, function () {
      const parentPsbt = testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'unsigned', {
        signers: {
          signerName: 'user',
          cosignerName: 'bitgo',
        },
      });

      let psbt = skipNonWitnessUtxo ? clonePsbtWithoutNonWitnessUtxo(parentPsbt) : parentPsbt;
      addXpubsToPsbt(psbt, rootWalletKeys);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys['user']);

      let psbtWithoutPrevTx = clonePsbtWithoutNonWitnessUtxo(psbt);
      let hex = psbtWithoutPrevTx.toHex();

      let psbtAtHsm = createPsbtFromHex(hex, network);
      psbtAtHsm.setAllInputsMusig2NonceHD(rootWalletKeys['bitgo'], { deterministic: true });
      let hexAtHsm = psbtAtHsm.toHex();

      let psbtFromHsm = createPsbtFromHex(hexAtHsm, network);
      deleteWitnessUtxoForNonSegwitInputs(psbtFromHsm);
      psbt.combine(psbtFromHsm);

      testutil.signAllPsbtInputs(psbt, inputs, rootWalletKeys, 'halfsigned', {
        signers: {
          signerName: 'user',
          cosignerName: 'bitgo',
        },
        skipNonWitnessUtxo,
      });

      psbtWithoutPrevTx = clonePsbtWithoutNonWitnessUtxo(psbt);
      hex = psbtWithoutPrevTx.toHex();

      psbtAtHsm = createPsbtFromHex(hex, network);
      withUnsafeNonSegwit(psbtAtHsm, () => {
        testutil.signAllPsbtInputs(psbtAtHsm, inputs, rootWalletKeys, 'fullsigned', {
          signers: {
            signerName: 'user',
            cosignerName: 'bitgo',
          },
          deterministic: true,
        });
      });
      withUnsafeNonSegwit(psbtAtHsm, () => {
        assertValidate(psbtAtHsm);
      });
      hexAtHsm = psbtAtHsm.toHex();

      psbtFromHsm = createPsbtFromHex(hexAtHsm, network);
      deleteWitnessUtxoForNonSegwitInputs(psbtFromHsm);

      if (skipNonWitnessUtxo) {
        psbt = parentPsbt;
      }
      psbt.combine(psbtFromHsm);

      assertValidate(psbt);
      assert.doesNotThrow(() => psbt.finalizeAllInputs().extractTransaction());
    });
  });
}

function runBuildPsbtWithSDK(network: Network, inputs: Input[], outputs: Output[]) {
  const coin = getNetworkName(network);
  it(`check that building a PSBT while skipping nonWitnessUtxo works - ${coin}`, async function () {
    const psbtWithNonWitness = testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'unsigned', {
      signers: {
        signerName: 'user',
        cosignerName: 'bitgo',
      },
    });
    const psbtWithoutNonWitness = testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'unsigned', {
      signers: {
        signerName: 'user',
        cosignerName: 'bitgo',
      },
      skipNonWitnessUtxo: true,
    });

    const clonedPsbt = clonePsbtWithoutNonWitnessUtxo(psbtWithNonWitness);
    assert.deepStrictEqual(psbtWithoutNonWitness.toHex(), clonedPsbt.toHex());
  });
}

getNetworkList()
  .filter((v) => isMainnet(v) && v !== networks.bitcoinsv)
  .forEach((network) => {
    runExtractP2msOnlyHalfSignedTxTest(
      network,
      halfSignedInputs.filter((input) => isSupportedScriptType(network, input.scriptType)),
      halfSignedOutputs.filter((output) => isSupportedScriptType(network, output.scriptType))
    );

    const supportedPsbtInputs = psbtInputs.filter((input) =>
      isSupportedScriptType(network, input.scriptType === 'taprootKeyPathSpend' ? 'p2trMusig2' : input.scriptType)
    );
    const supportedPsbtOutputs = psbtOutputs.filter((output) => isSupportedScriptType(network, output.scriptType));
    [false, true].forEach((skipNonWitnessUtxo) =>
      runBuildSignSendFlowTest(network, supportedPsbtInputs, supportedPsbtOutputs, { skipNonWitnessUtxo })
    );

    runBuildPsbtWithSDK(network, supportedPsbtInputs, supportedPsbtOutputs);
  });

describe('isTransactionWithKeyPathSpendInput', function () {
  describe('transaction input', function () {
    it('empty inputs', function () {
      const tx = testutil.constructTxnBuilder([], [], network, rootWalletKeys, 'unsigned').buildIncomplete();
      assert.strictEqual(isTransactionWithKeyPathSpendInput(tx), false);
      assert.strictEqual(isTransactionWithKeyPathSpendInput(tx.ins), false);
    });

    it('taprootKeyPath inputs successfully triggers', function () {
      const psbt = testutil.constructPsbt(
        [
          { scriptType: 'taprootKeyPathSpend', value: BigInt(1e8) },
          { scriptType: 'p2sh', value: BigInt(1e8) },
        ],
        [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }],
        network,
        rootWalletKeys,
        'fullsigned'
      );
      assert(psbt.validateSignaturesOfAllInputs());
      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction() as UtxoTransaction<bigint>;

      assert.strictEqual(isTransactionWithKeyPathSpendInput(tx), true);
      assert.strictEqual(isTransactionWithKeyPathSpendInput(tx.ins), true);
    });

    it('no taprootKeyPath inputs successfully does not trigger', function () {
      const psbt = testutil.constructPsbt(
        [
          { scriptType: 'p2trMusig2', value: BigInt(1e8) },
          { scriptType: 'p2sh', value: BigInt(1e8) },
        ],
        [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }],
        network,
        rootWalletKeys,
        'fullsigned'
      );
      assert(psbt.validateSignaturesOfAllInputs());
      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction();

      assert.strictEqual(isTransactionWithKeyPathSpendInput(tx), false);
      assert.strictEqual(isTransactionWithKeyPathSpendInput(tx.ins), false);
    });

    it('unsigned inputs successfully fail', function () {
      const psbt = testutil.constructPsbt(
        [
          { scriptType: 'p2wsh', value: BigInt(1e8) },
          { scriptType: 'p2sh', value: BigInt(1e8) },
        ],
        [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }],
        network,
        rootWalletKeys,
        'unsigned'
      );
      const tx = psbt.getUnsignedTx();
      assert.strictEqual(isTransactionWithKeyPathSpendInput(tx), false);
      assert.strictEqual(isTransactionWithKeyPathSpendInput(tx.ins), false);
    });
  });

  describe('psbt input', function () {
    it('empty inputs', function () {
      const psbt = testutil.constructPsbt([], [], network, rootWalletKeys, 'unsigned');
      assert.strictEqual(isTransactionWithKeyPathSpendInput(psbt), false);
      assert.strictEqual(isTransactionWithKeyPathSpendInput(psbt.data.inputs), false);
    });

    it('psbt with taprootKeyPathInputs successfully triggers', function () {
      const psbt = testutil.constructPsbt(
        [
          { scriptType: 'taprootKeyPathSpend', value: BigInt(1e8) },
          { scriptType: 'p2sh', value: BigInt(1e8) },
        ],
        [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }],
        network,
        rootWalletKeys,
        'unsigned'
      );

      assert.strictEqual(isTransactionWithKeyPathSpendInput(psbt), true);
      assert.strictEqual(isTransactionWithKeyPathSpendInput(psbt.data.inputs), true);
    });

    it('psbt without taprootKeyPathInputs successfully does not trigger', function () {
      const psbt = testutil.constructPsbt(
        [
          { scriptType: 'p2wsh', value: BigInt(1e8) },
          { scriptType: 'p2sh', value: BigInt(1e8) },
        ],
        [{ scriptType: 'p2sh', value: BigInt(2e8 - 10000) }],
        network,
        rootWalletKeys,
        'halfsigned'
      );

      assert.strictEqual(isTransactionWithKeyPathSpendInput(psbt), false);
      assert.strictEqual(isTransactionWithKeyPathSpendInput(psbt.data.inputs), false);
    });
  });
});

describe('Parse PSBT', function () {
  it('p2shP2pk parsing', function () {
    const signer = rootWalletKeys['user'];
    const psbt = createPsbtForNetwork({ network: networks.bitcoincash });
    const unspent = mockReplayProtectionUnspent(networks.bitcoincash, BigInt(1e8), { key: signer });
    const { redeemScript } = createOutputScriptP2shP2pk(signer.publicKey);
    assert(redeemScript);
    addReplayProtectionUnspentToPsbt(psbt, unspent, redeemScript);
    addWalletOutputToPsbt(psbt, rootWalletKeys, getInternalChainCode('p2sh'), 0, BigInt(1e8 - 10000));
    const input = psbt.data.inputs[0];
    let parsed = parsePsbtInput(input);

    assert.strictEqual(parsed.scriptType, 'p2shP2pk');
    assert.strictEqual(parsed.signatures, undefined);
    assert.strictEqual(parsed.publicKeys.length, 1);
    assert.ok(parsed.publicKeys[0].length === 33);
    assert.ok(parsed.pubScript.equals(redeemScript));

    psbt.signAllInputs(signer);
    assert.ok(psbt.validateSignaturesOfAllInputs());

    parsed = parsePsbtInput(input);

    assert.strictEqual(parsed.scriptType, 'p2shP2pk');
    assert.strictEqual(parsed.signatures?.length, 1);
    assert.strictEqual(parsed.publicKeys.length, 1);
    assert.ok(parsed.publicKeys[0].length === 33);
    assert.ok(parsed.pubScript.equals(redeemScript));

    const sighash: number = parsed.signatures[0][parsed.signatures[0].length - 1];
    assert.strictEqual(sighash, getDefaultSigHash(psbt.network));
  });

  it('fail to parse finalized psbt', function () {
    const unspents = mockUnspents(
      rootWalletKeys,
      getScriptTypes2Of3().map((inputType) => inputType),
      BigInt('10000000000000000'),
      network
    );
    const txBuilderParams = {
      signer: 'user',
      cosigner: 'bitgo',
      amountType: 'bigint',
      outputType: 'p2sh',
      signatureTarget: 'fullsigned',
      network,
      changeIndex: CHANGE_INDEX,
      fee: FEE,
    } as const;
    const tx = constructTransactionUsingTxBuilder(unspents, rootWalletKeys, txBuilderParams);
    const psbt = toWalletPsbt(tx, toBigInt(unspents), rootWalletKeys);
    psbt.validateSignaturesOfAllInputs();
    psbt.finalizeAllInputs();
    psbt.data.inputs.forEach((input, i) => {
      assert.throws(
        () => parsePsbtInput(input),
        (e: any) => e.message === 'Finalized PSBT parsing is not supported'
      );
    });
  });

  it('fail to parse input with more than one script type metadata', function () {
    const unspents = mockUnspents(rootWalletKeys, ['p2tr'], BigInt('10000000000000000'), network);

    const txBuilderParams = {
      signer: 'user',
      cosigner: 'bitgo',
      amountType: 'bigint',
      outputType: 'p2sh',
      signatureTarget: 'halfsigned',
      network,
      changeIndex: CHANGE_INDEX,
      fee: FEE,
    } as const;

    const txP2tr = constructTransactionUsingTxBuilder([unspents[0]], rootWalletKeys, txBuilderParams);
    const psbtP2tr = toWalletPsbt(txP2tr, toBigInt([unspents[0]]), rootWalletKeys);

    const walletKeys = rootWalletKeys.deriveForChainAndIndex(getExternalChainCode('p2sh'), 0);
    const { redeemScript } = createOutputScript2of3(walletKeys.publicKeys, 'p2sh');
    psbtP2tr.updateInput(0, { redeemScript });

    assert.throws(
      () => parsePsbtInput(psbtP2tr.data.inputs[0]),
      (e: any) => e.message === 'Found both p2sh and taprootScriptPath PSBT metadata.'
    );
  });

  it('fail to parse more than one tap leaf script per input', function () {
    const unspents = mockUnspents(rootWalletKeys, ['p2tr'], BigInt('10000000000000000'), network);

    const txBuilderParams = {
      signer: 'user',
      cosigner: 'bitgo',
      amountType: 'bigint',
      outputType: 'p2sh',
      signatureTarget: 'halfsigned',
      network,
      changeIndex: CHANGE_INDEX,
      fee: FEE,
    } as const;

    const txP2tr1 = constructTransactionUsingTxBuilder([unspents[0]], rootWalletKeys, txBuilderParams);
    const psbtP2tr1 = toWalletPsbt(txP2tr1, toBigInt([unspents[0]]), rootWalletKeys);

    const txBuilderParams2 = {
      signer: 'user' as KeyName,
      cosigner: 'backup' as KeyName,
      amountType: 'bigint' as AmountType,
      outputType: 'p2sh' as InputType,
      signatureTarget: 'halfsigned' as SignatureTargetType,
      network,
      changeIndex: CHANGE_INDEX,
      fee: FEE,
    };

    const txP2tr2 = constructTransactionUsingTxBuilder([unspents[0]], rootWalletKeys, txBuilderParams2);
    const psbtP2tr2 = toWalletPsbt(txP2tr2, toBigInt([unspents[0]]), rootWalletKeys);

    const txBuilderParams3 = {
      signer: 'user',
      cosigner: 'bitgo',
      amountType: 'bigint',
      outputType: 'p2sh',
      signatureTarget: 'unsigned',
      network,
      changeIndex: CHANGE_INDEX,
      fee: FEE,
    } as const;
    const txP2tr3 = constructTransactionUsingTxBuilder([unspents[0]], rootWalletKeys, txBuilderParams3);
    const psbtP2tr3 = toWalletPsbt(txP2tr3, toBigInt([unspents[0]]), rootWalletKeys);
    if (psbtP2tr1.data.inputs[0].tapLeafScript && psbtP2tr2.data.inputs[0].tapLeafScript) {
      const tapLeafScripts = [psbtP2tr1.data.inputs[0].tapLeafScript[0], psbtP2tr2.data.inputs[0].tapLeafScript[0]];
      psbtP2tr3.updateInput(0, { tapLeafScript: tapLeafScripts });

      assert.throws(
        () => parsePsbtInput(psbtP2tr3.data.inputs[0]),
        (e: any) => e.message === 'Bitgo only supports a single tap leaf script per input.'
      );
    }
  });
});

describe('isPsbt', function () {
  function isPsbtForNetwork(n: Network) {
    describe(`network: ${getNetworkName(n)}`, function () {
      const psbt = createPsbtForNetwork({ network: n });

      it('should return true for a valid PSBT', function () {
        const psbtBuff = psbt.toBuffer();
        assert.strictEqual(isPsbt(psbtBuff), true);
        assert.strictEqual(isPsbt(psbtBuff.toString('hex')), true);
      });

      it('should return false for a transaction', function () {
        assert.strictEqual(isPsbt(psbt.getUnsignedTx().toBuffer()), false);
      });

      it('should return false for a truncated magic word', function () {
        const hex = psbt.toBuffer().slice(0, 3);
        assert.strictEqual(isPsbt(hex), false);
        assert.strictEqual(isPsbt(Buffer.from(hex)), false);
      });

      it('should return false for a valid PSBT with an invalid magic', function () {
        const buffer = psbt.toBuffer();
        buffer.writeUInt8(0x00, 1);
        assert.strictEqual(isPsbt(psbt.getUnsignedTx().toBuffer()), false);
      });

      it('should return false for a valid PSBT with an invalid separator', function () {
        const buffer = psbt.toBuffer();
        buffer.writeUInt8(0xfe, 4);
        assert.strictEqual(isPsbt(psbt.getUnsignedTx().toBuffer()), false);
      });

      it('should return false for a random buffer', function () {
        const random = 'deadbeaf';
        const buffer = Buffer.from(random, 'hex');
        assert.strictEqual(isPsbt(random), false);
        assert.strictEqual(isPsbt(buffer), false);
      });

      it('should return true if buffer is changed after the separator', function () {
        const buffer = psbt.toBuffer();
        buffer.writeUInt8(0x00, 5);
        assert.strictEqual(isPsbt(buffer), true);
      });
    });
  }

  getNetworkList().forEach((n) => isPsbtForNetwork(n));
});

describe('Update incomplete psbt', function () {
  function removeFromPsbt(
    psbtHex: string,
    network: Network,
    remove: { input?: { index: number; fieldToRemove: string }; output?: { index: number; fieldToRemove: string } }
  ): UtxoPsbt {
    const utxoPsbt = createPsbtFromHex(psbtHex, network);
    const psbt = createPsbtForNetwork({ network: utxoPsbt.network });
    const txInputs = utxoPsbt.txInputs;
    utxoPsbt.data.inputs.map((input, ii) => {
      const { hash, index } = txInputs[ii];
      if (remove.input && ii === remove.input.index) {
        delete input[remove.input.fieldToRemove];
      }
      psbt.addInput({ ...input, hash, index });
    });

    const txOutputs = utxoPsbt.txOutputs;
    utxoPsbt.data.outputs.map((output, ii) => {
      if (remove.output && remove.output.index === ii) {
        delete output[remove.output.fieldToRemove];
      }
      psbt.addOutput({ ...output, script: txOutputs[ii].script, value: txOutputs[ii].value });
    });
    return psbt;
  }

  function signAllInputs(psbt: UtxoPsbt, { assertValidSignaturesAndExtractable = true } = {}) {
    psbt.data.inputs.forEach((input, inputIndex) => {
      const parsedInput = parsePsbtInput(input);
      if (parsedInput.scriptType === 'taprootKeyPathSpend') {
        psbt.setInputMusig2NonceHD(inputIndex, rootWalletKeys[signer]);
        psbt.setInputMusig2NonceHD(inputIndex, rootWalletKeys[cosigner]);
      }

      if (parsedInput.scriptType === 'p2shP2pk') {
        psbt.signInput(inputIndex, replayProtectionKeyPair);
      } else {
        psbt.signInputHD(inputIndex, rootWalletKeys[signer]);
        psbt.signInputHD(inputIndex, rootWalletKeys[cosigner]);
      }
    });

    if (assertValidSignaturesAndExtractable) {
      assert.ok(psbt.validateSignaturesOfAllInputs());
      psbt.finalizeAllInputs();
      const txExtracted = psbt.extractTransaction();
      assert.ok(txExtracted);
    }
  }

  let psbtHex: string;
  let unspents: Unspent<bigint>[];
  const signer = 'user';
  const cosigner = 'bitgo';
  const scriptTypes = [...scriptTypes2Of3, 'p2shP2pk'] as (ScriptType2Of3 | ScriptTypeP2shP2pk)[];
  const outputValue = BigInt((2e8 * scriptTypes.length - 100) / 5);
  const outputs = [
    { chain: getExternalChainCode('p2sh'), index: 88, value: outputValue },
    { chain: getExternalChainCode('p2shP2wsh'), index: 89, value: outputValue },
    { chain: getExternalChainCode('p2wsh'), index: 90, value: outputValue },
    { chain: getExternalChainCode('p2tr'), index: 91, value: outputValue },
    { chain: getExternalChainCode('p2trMusig2'), index: 92, value: outputValue },
  ];
  before(function () {
    unspents = mockUnspents(rootWalletKeys, scriptTypes, BigInt(2e8), network);
    const psbt = constructPsbt(unspents, rootWalletKeys, signer, cosigner, outputs);
    psbtHex = psbt.toHex();
  });

  it('can create a sign-able psbt from an unsigned transaction extracted from the psbt', function () {
    if (true) {
      return;
    }
    const psbtOrig = createPsbtFromHex(psbtHex, network);
    const tx = psbtOrig.getUnsignedTx();
    const psbt = createPsbtFromTransaction(
      tx,
      unspents.map((u) => toPrevOutput(u, network))
    );
    unspents.forEach((u, inputIndex) => {
      if (isWalletUnspent(u)) {
        updateWalletUnspentForPsbt(psbt, inputIndex, u, rootWalletKeys, signer, cosigner);
      } else {
        const { redeemScript } = createOutputScriptP2shP2pk(replayProtectionKeyPair.publicKey);
        updateReplayProtectionUnspentToPsbt(psbt, inputIndex, u, redeemScript);
      }
    });

    signAllInputs(psbt);
  });

  const componentsOnEachInputScriptType = {
    p2sh: ['nonWitnessUtxo', 'redeemScript', 'bip32Derivation'],
    p2shP2wsh: ['witnessUtxo', 'bip32Derivation', 'redeemScript', 'witnessScript'],
    p2wsh: ['witnessUtxo', 'witnessScript', 'bip32Derivation'],
    p2tr: ['witnessUtxo', 'tapLeafScript', 'tapBip32Derivation'],
    p2trMusig2: ['witnessUtxo', 'tapBip32Derivation', 'tapInternalKey', 'tapMerkleRoot', 'unknownKeyVals'],
    p2shP2pk: ['redeemScript', 'nonWitnessUtxo'],
  };

  const p2trComponents = ['tapTree', 'tapInternalKey', 'tapBip32Derivation'];
  const componentsOnEachOutputScriptType = {
    p2sh: ['bip32Derivation', 'redeemScript'],
    p2shP2wsh: ['bip32Derivation', 'witnessScript', 'redeemScript'],
    p2wsh: ['bip32Derivation', 'witnessScript'],
    p2tr: p2trComponents,
    p2trMusig2: p2trComponents,
    p2shP2pk: [],
  };
  scriptTypes.forEach((scriptType, i) => {
    componentsOnEachInputScriptType[scriptType].forEach((inputComponent) => {
      it(`[${scriptType}] missing ${inputComponent} on input should succeed in fully signing unsigned psbt after update`, function () {
        const psbt = removeFromPsbt(psbtHex, network, { input: { index: i, fieldToRemove: inputComponent } });
        const unspent = unspents[i];
        if (isWalletUnspent(unspent)) {
          updateWalletUnspentForPsbt(psbt, i, unspent, rootWalletKeys, signer, cosigner);
        } else {
          const { redeemScript } = createOutputScriptP2shP2pk(replayProtectionKeyPair.publicKey);
          assert.ok(redeemScript);
          updateReplayProtectionUnspentToPsbt(psbt, i, unspent, redeemScript);
        }
        signAllInputs(psbt);
      });
    });

    componentsOnEachOutputScriptType[scriptType].forEach((outputComponent) => {
      it(`[${scriptType}] missing ${outputComponent} on output should produce same hex as fully hydrated after update`, function () {
        const psbt = removeFromPsbt(psbtHex, network, { output: { index: i, fieldToRemove: outputComponent } });
        updateWalletOutputForPsbt(psbt, rootWalletKeys, i, outputs[i].chain, outputs[i].index);
        assert.strictEqual(psbt.toHex(), psbtHex);
      });
    });
  });
});

describe('Psbt from transaction using wallet unspents', function () {
  function runTestSignUnspents<TNumber extends number | bigint>({
    inputScriptTypes,
    outputScriptType,
    signer,
    cosigner,
    amountType,
    testOutputAmount,
    signatureTarget,
  }: {
    inputScriptTypes: InputType[];
    outputScriptType: outputScripts.ScriptType2Of3;
    signer: KeyName;
    cosigner: KeyName;
    amountType: 'number' | 'bigint';
    testOutputAmount: TNumber;
    signatureTarget: SignatureTargetType;
  }) {
    it(`can be signed [inputs=${inputScriptTypes} signer=${signer} cosigner=${cosigner} amountType=${amountType} signatureTarget=${signatureTarget}]`, function () {
      const unspents = mockUnspents(rootWalletKeys, inputScriptTypes, testOutputAmount, network);
      // const txBuilderParams = { network, changeIndex: CHANGE_INDEX, fee: FEE };
      const txBuilderParams = {
        signer,
        cosigner,
        amountType,
        outputType: outputScriptType,
        signatureTarget: signatureTarget,
        network,
        changeIndex: CHANGE_INDEX,
        fee: FEE,
      };
      const tx = constructTransactionUsingTxBuilder(unspents, rootWalletKeys, txBuilderParams);

      const unspentBigInt = toBigInt(unspents);

      const psbt = toWalletPsbt(tx, unspentBigInt, rootWalletKeys);

      validatePsbtParsing(tx, psbt, unspentBigInt, signatureTarget);

      // Check that the correct unspent corresponds to the input
      unspentBigInt.forEach((unspent, inputIndex) => {
        const otherUnspent = inputIndex === 0 ? unspentBigInt[1] : unspentBigInt[0];
        assert.strictEqual(psbtIncludesUnspentAtIndex(psbt, inputIndex, unspent.id), true);
        assert.strictEqual(psbtIncludesUnspentAtIndex(psbt, inputIndex, otherUnspent.id), false);
        updateWalletUnspentForPsbt(psbt, inputIndex, unspent, rootWalletKeys, signer, cosigner);
      });

      if (signatureTarget !== 'fullsigned') {
        // Now signing to make it fully signed psbt.
        // So it will be easy to verify its validity with another similar tx to be built with tx builder.
        signPsbt(psbt, unspentBigInt, rootWalletKeys, signer, cosigner, signatureTarget);
      }
      assert.deepStrictEqual(psbt.validateSignaturesOfAllInputs(), true);
      psbt.finalizeAllInputs();
      const txFromPsbt = psbt.extractTransaction();

      const txBuilderParams2 = {
        signer,
        cosigner,
        amountType,
        outputType: outputScriptType,
        signatureTarget: 'fullsigned' as SignatureTargetType,
        network,
        changeIndex: CHANGE_INDEX,
        fee: FEE,
      };

      // New legacy tx resembles the signed psbt.
      const txFromTxBuilder = constructTransactionUsingTxBuilder(unspents, rootWalletKeys, txBuilderParams2);

      assert.deepStrictEqual(txFromPsbt.getHash(), txFromTxBuilder.getHash());
    });
  }

  function getInputScripts(): InputType[][] {
    return getScriptTypes2Of3().flatMap((t) => {
      return getScriptTypes2Of3().flatMap((lastType) => {
        return [[t, t, lastType]];
      });
    });
  }

  function getSignerPairs(containsTaprootInput: boolean): [signer: KeyName, cosigner: KeyName][] {
    const signaturePairs = [['user', 'bitgo'] as [signer: KeyName, cosigner: KeyName]];
    if (containsTaprootInput) {
      signaturePairs.push(['user', 'backup'] as [signer: KeyName, cosigner: KeyName]);
    }
    return signaturePairs;
  }

  (['unsigned', 'halfsigned', 'fullsigned'] as SignatureTargetType[]).forEach((signatureTarget) => {
    getInputScripts().forEach((inputScriptTypes) => {
      getSignerPairs(inputScriptTypes.includes('p2tr')).forEach(([signer, cosigner]) => {
        runTestSignUnspents({
          inputScriptTypes,
          outputScriptType: 'p2sh',
          signer,
          cosigner,
          amountType: 'number',
          testOutputAmount: defaultTestOutputAmount,
          signatureTarget,
        });
        runTestSignUnspents<bigint>({
          inputScriptTypes,
          outputScriptType: 'p2sh',
          signer,
          cosigner,
          amountType: 'bigint',
          testOutputAmount: BigInt('10000000000000000'),
          signatureTarget,
        });
      });
    });
  });
});

function testUtxoPsbt(coinNetwork: Network) {
  describe(`Testing UtxoPsbt (de)serialization for ${getNetworkName(coinNetwork)} network`, function () {
    let psbt: UtxoPsbt;
    let psbtHex: string;
    let unspents: (WalletUnspent<bigint> | Unspent<bigint>)[];
    before(async function () {
      unspents = mockUnspents(rootWalletKeys, ['p2sh'], BigInt('10000000000000'), coinNetwork);
      const txBuilderParams = {
        signer: 'user',
        cosigner: 'bitgo',
        amountType: 'bigint',
        outputType: 'p2sh',
        signatureTarget: 'fullsigned',
        network: coinNetwork,
        changeIndex: CHANGE_INDEX,
        fee: FEE,
      } as const;
      const tx = constructTransactionUsingTxBuilder(unspents, rootWalletKeys, txBuilderParams);
      psbt = toWalletPsbt(tx, toBigInt(unspents), rootWalletKeys);
      if (coinNetwork === networks.zcash) {
        (psbt as ZcashPsbt).setDefaultsForVersion(network, 450);
      }
      psbtHex = psbt.toHex();
    });

    it('should be able to clone psbt', async function () {
      const clone = psbt.clone();
      assert.deepStrictEqual(clone.toBuffer(), psbt.toBuffer());
    });

    it('should be able to round-trip', async function () {
      assert.deepStrictEqual(createPsbtFromHex(psbtHex, coinNetwork, false).toBuffer(), psbt.toBuffer());
    });

    it('should be able to get transaction info from psbt', function () {
      const txInfo = getTransactionAmountsFromPsbt(psbt);
      assert.strictEqual(txInfo.fee, FEE);
      assert.strictEqual(txInfo.inputCount, unspents.length);
      assert.strictEqual(txInfo.inputAmount, BigInt('10000000000000') * BigInt(unspents.length));
      assert.strictEqual(txInfo.outputAmount, BigInt('10000000000000') * BigInt(unspents.length) - FEE);
      assert.strictEqual(txInfo.outputCount, psbt.data.outputs.length);
    });

    function deserializeBip32PathsCorrectly(bip32PathsAbsolute: boolean): void {
      function checkDerivationPrefix(bip32Derivation: { path: string }): void {
        const path = bip32Derivation.path.split('/');
        const prefix = bip32PathsAbsolute ? 'm' : '0';
        assert(path[0] === prefix);
      }
      it(`should deserialize PSBT bip32Derivations with paths ${
        bip32PathsAbsolute ? '' : 'not '
      } absolute`, async function () {
        const deserializedPsbt = createPsbtFromHex(psbtHex, coinNetwork, bip32PathsAbsolute);
        assert(deserializedPsbt);
        deserializedPsbt.data.inputs.forEach((input) => {
          input?.bip32Derivation?.forEach((derivation) => checkDerivationPrefix(derivation));
          input?.tapBip32Derivation?.forEach((derivation) => checkDerivationPrefix(derivation));
        });
      });
    }

    [true, false].forEach((bip32PathsAbsolute) => deserializeBip32PathsCorrectly(bip32PathsAbsolute));
  });
}

[networks.bitcoin, networks.zcash, networks.dash, networks.dogecoin, networks.litecoin].forEach((coinNetwork) =>
  testUtxoPsbt(coinNetwork)
);
