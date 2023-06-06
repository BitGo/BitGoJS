import * as assert from 'assert';

import { Network, getNetworkName, networks, getNetworkList, testutil } from '../../../src';
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
} from '../../../src/bitgo';
import {
  createOutputScript2of3,
  createOutputScriptP2shP2pk,
  ScriptType2Of3,
  ScriptTypeP2shP2pk,
  scriptTypes2Of3,
} from '../../../src/bitgo/outputScripts';

import { getDefaultWalletKeys, mockReplayProtectionUnspent, replayProtectionKeyPair } from '../../../src/testutil';

import { defaultTestOutputAmount } from '../../transaction_util';
import { constructTransactionUsingTxBuilder, signPsbt, toBigInt, validatePsbtParsing } from './psbtUtil';

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
      const tx = psbt.extractTransaction() as UtxoTransaction<bigint>;

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
    const psbt = createPsbtForNetwork({ network });
    const unspent = mockReplayProtectionUnspent(network, BigInt(1e8), { key: signer });
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
    assert.strictEqual(parsed.signatures[0].length, 72);
    assert.strictEqual(parsed.publicKeys.length, 1);
    assert.ok(parsed.publicKeys[0].length === 33);
    assert.ok(parsed.pubScript.equals(redeemScript));
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
        (e) => e.message === 'Finalized PSBT parsing is not supported'
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
      (e) => e.message === 'Found both p2sh and taprootScriptPath PSBT metadata.'
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
        (e) => e.message === 'Bitgo only supports a single tap leaf script per input.'
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
  function removeFromPsbt(psbtHex: string, network: Network, inputIndex: number, fieldToRemove: string): UtxoPsbt {
    const utxoPsbt = createPsbtFromHex(psbtHex, network);
    const psbt = createPsbtForNetwork({ network: utxoPsbt.network });
    utxoPsbt.data.inputs.map((input, ii) => {
      const txInput = utxoPsbt.txInputs[ii];
      const { hash, index } = txInput;
      if (ii === inputIndex) {
        delete input[fieldToRemove];
      }
      psbt.addInput({ ...input, hash, index });
    });
    utxoPsbt.txOutputs.forEach((o) => {
      psbt.addOutput(o);
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
  const inputScriptTypes = [...scriptTypes2Of3, 'p2shP2pk'] as (ScriptType2Of3 | ScriptTypeP2shP2pk)[];
  before(function () {
    unspents = mockUnspents(rootWalletKeys, inputScriptTypes, BigInt(2e8), network);
    const psbt = constructPsbt(unspents, rootWalletKeys, signer, cosigner, 'p2sh');
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

  const componentsOnEachScriptType = {
    p2sh: ['nonWitnessUtxo', 'redeemScript', 'bip32Derivation'],
    p2shP2wsh: ['witnessUtxo', 'bip32Derivation', 'redeemScript', 'witnessScript'],
    p2wsh: ['witnessUtxo', 'witnessScript', 'bip32Derivation'],
    p2tr: ['witnessUtxo', 'tapLeafScript', 'tapBip32Derivation'],
    p2trMusig2: ['witnessUtxo', 'tapBip32Derivation', 'tapInternalKey', 'tapMerkleRoot', 'unknownKeyVals'],
    p2shP2pk: ['redeemScript', 'nonWitnessUtxo'],
  };
  inputScriptTypes.forEach((scriptType, i) => {
    componentsOnEachScriptType[scriptType].forEach((inputComponent) => {
      it(`[${scriptType}] missing ${inputComponent} should succeed in fully signing unsigned psbt after update`, function () {
        const psbt = removeFromPsbt(psbtHex, network, i, inputComponent);
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
    before(async function () {
      const unspents = mockUnspents(rootWalletKeys, ['p2sh'], BigInt('10000000000000'), coinNetwork);
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
