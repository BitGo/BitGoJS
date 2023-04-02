import * as assert from 'assert';

import { Network, getNetworkName, networks } from '../../../src';
import {
  getExternalChainCode,
  outputScripts,
  KeyName,
  UtxoPsbt,
  ZcashPsbt,
  createPsbtFromHex,
  parsePsbtInput,
  toWalletPsbt,
} from '../../../src/bitgo';
import { createOutputScript2of3 } from '../../../src/bitgo/outputScripts';

import { getDefaultWalletKeys } from '../../../src/testutil';

import { defaultTestOutputAmount } from '../../transaction_util';
import { constructTransactionUsingTxBuilder, signPsbt, toBigInt, validatePsbtParsing } from './psbtUtil';

import { mockUnspents } from '../../../src/testutil/mock';

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

describe('Parse PSBT', function () {
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
          (e) => e.message === 'invalid psbt input to validate signature'
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
