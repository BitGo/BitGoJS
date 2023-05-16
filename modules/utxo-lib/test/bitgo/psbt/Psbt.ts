import * as assert from 'assert';

import { Network, getNetworkName, networks, getNetworkList } from '../../../src';
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
  getSignatureCount,
  UtxoTransaction,
  isPsbt,
} from '../../../src/bitgo';
import { createOutputScript2of3, createOutputScriptP2shP2pk } from '../../../src/bitgo/outputScripts';

import {
  constructPsbt,
  getDefaultWalletKeys,
  inputScriptTypes,
  mockReplayProtectionUnspent,
  outputScriptTypes,
} from '../../../src/testutil';

import { defaultTestOutputAmount } from '../../transaction_util';
import { constructTransactionUsingTxBuilder, signPsbt, toBigInt, validatePsbtParsing } from './psbtUtil';

import { mockUnspents } from '../../../src/testutil/mock';
import { constructTxnBuilder, txnInputScriptTypes, txnOutputScriptTypes } from '../../../src/testutil/transaction';

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

describe('getSignatureCount', function () {
  it('tx', function () {
    const inputs = txnInputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(1000) }));
    const outputs = txnOutputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900) }));

    (['unsigned', 'halfsigned', 'fullsigned'] as const).forEach((sign, signatureCount) => {
      const txb = constructTxnBuilder(inputs, outputs, network, rootWalletKeys, sign);
      const tx = sign === 'fullsigned' ? txb.build() : txb.buildIncomplete();
      assert.strictEqual(getSignatureCount(tx), signatureCount);
      tx.ins.forEach((input, inputIndex) => {
        // p2shP2pk is at 4th index, and it will only have one signature.
        const expectedSigCount = inputIndex === 4 && signatureCount > 0 ? 1 : signatureCount;
        assert.strictEqual(getSignatureCount([tx.ins[inputIndex]], 0), expectedSigCount);
      });
    });
  });

  it('psbt', function () {
    const inputs = inputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(1000) }));
    const outputs = outputScriptTypes.map((scriptType) => ({ scriptType, value: BigInt(900) }));

    (['unsigned', 'halfsigned', 'fullsigned'] as const).forEach((sign, signatureCount) => {
      const psbt = constructPsbt(inputs, outputs, network, rootWalletKeys, sign);
      assert.strictEqual(getSignatureCount(psbt), signatureCount);
      psbt.data.inputs.forEach((input, inputIndex) => {
        // p2shP2pk is at 6th index, and it will only have one signature.
        const expectedSigCount = inputIndex === 6 && signatureCount > 0 ? 1 : signatureCount;
        assert.strictEqual(getSignatureCount(psbt, inputIndex), expectedSigCount);
      });

      if (sign === 'fullsigned') {
        const tx = psbt.finalizeAllInputs().extractTransaction() as UtxoTransaction<bigint>;
        tx.ins.forEach((input, inputIndex) => {
          // p2shP2pk is at 6th index, and it will only have one signature.
          const expectedSigCount = inputIndex === 6 ? 1 : signatureCount;
          assert.strictEqual(getSignatureCount([tx.ins[inputIndex]], 0), expectedSigCount);
        });
      }
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
    let parsed = parsePsbtInput(psbt, 0);

    assert.strictEqual(parsed?.scriptType, 'p2shP2pk');
    assert.strictEqual(parsed?.signatures, undefined);
    assert.strictEqual(parsed?.publicKeys.length, 1);
    assert.ok(parsed?.publicKeys[0].length === 33);
    assert.ok(parsed?.pubScript.equals(redeemScript));

    psbt.signAllInputs(signer);
    assert.ok(psbt.validateSignaturesOfAllInputs());

    parsed = parsePsbtInput(psbt, 0);

    assert.strictEqual(parsed?.scriptType, 'p2shP2pk');
    assert.strictEqual(parsed?.signatures?.length, 1);
    assert.strictEqual(parsed?.signatures[0].length, 72);
    assert.strictEqual(parsed?.publicKeys.length, 1);
    assert.ok(parsed?.publicKeys[0].length === 33);
    assert.ok(parsed?.pubScript.equals(redeemScript));
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
        () => parsePsbtInput(psbt, i),
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
      () => parsePsbtInput(psbtP2tr, 0),
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
        () => parsePsbtInput(psbtP2tr3, 0),
        (e) => e.message === 'Bitgo only supports a single tap leaf script per input.'
      );
    }
  });

  it('fail to parse input with signatures and without script', function () {
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
      signer: 'user',
      cosigner: 'bitgo',
      amountType: 'bigint',
      outputType: 'p2sh',
      signatureTarget: 'unsigned',
      network,
      changeIndex: CHANGE_INDEX,
      fee: FEE,
    } as const;
    const txP2tr2 = constructTransactionUsingTxBuilder([unspents[0]], rootWalletKeys, txBuilderParams2);
    const psbtP2tr2 = toWalletPsbt(txP2tr2, toBigInt([unspents[0]]), rootWalletKeys);
    if (psbtP2tr1.data.inputs[0].tapScriptSig) {
      psbtP2tr2.updateInput(0, { tapScriptSig: psbtP2tr1.data.inputs[0].tapScriptSig });

      assert.throws(
        () => parsePsbtInput(psbtP2tr2, 0),
        (e) => e.message === 'Invalid PSBT state. Signatures found without scripts.'
      );
    }
  });
});

describe('isPsbt', function () {
  function isPsbtForNetwork(n: Network) {
    describe(`network: ${getNetworkName(n)}`, function () {
      const psbt = createPsbtForNetwork({ network: n });

      it('should return true for a valid PSBT', function () {
        assert.strictEqual(isPsbt(psbt.toBuffer()), true);
      });

      it('should return false for a transaction', function () {
        assert.strictEqual(isPsbt(psbt.getUnsignedTx().toBuffer()), false);
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
        const buffer = Buffer.alloc(64);
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

      if (signatureTarget !== 'fullsigned') {
        // Now signing to make it fully signed psbt.
        // So it will be easy to verify its validity with another similar tx to be built with tx builder.
        signPsbt(psbt, unspentBigInt, rootWalletKeys, signer, cosigner, signatureTarget);
      }
      // unsigned p2tr does not contain tapLeafScript & tapBip32Derivation.
      // So it's signature validation is expected to fail
      const containsP2trInput = inputScriptTypes.includes('p2tr');
      if (signatureTarget === 'unsigned' && containsP2trInput) {
        assert.throws(
          () => psbt.validateSignaturesOfAllInputs(),
          (e) => e.message === 'No signatures to validate'
        );
      } else {
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
      }
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
