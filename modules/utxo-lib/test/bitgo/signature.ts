import * as assert from 'assert';
import * as bip32 from 'bip32';

import { script as bscript, classify, TxOutput } from '../../src';
import * as networks from '../../src/networks';
import { ScriptType, ScriptType2Of3, scriptTypes2Of3 } from '../../src/bitgo/outputScripts';
import { getNetworkList, getNetworkName, isBitcoin, isMainnet } from '../../src/coins';
import { Network } from '../../src/networkTypes';
import { verifySignature, UtxoTransaction, parseSignatureScript, getSignatureVerifications } from '../../src/bitgo';

import * as fixtureUtil from '../fixture.util';

import { fixtureKeys } from '../integration_local_rpc/generate/fixtures';
import {
  defaultTestOutputAmount,
  getFullSignedTransaction2Of3,
  getFullSignedTransactionP2shP2pk,
  getHalfSignedTransaction2Of3,
  getPrevOutputs,
  getSignKeyCombinations,
  getUnsignedTransaction2Of3,
} from '../transaction_util';

async function readFixture<T>(
  network: Network,
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  name: string,
  defaultValue: T
): Promise<T> {
  return await fixtureUtil.readFixture(
    `${__dirname}/fixtures/signature/${getNetworkName(network)}/${scriptType}/${name}.json`,
    defaultValue
  );
}

function keyName(k: bip32.BIP32Interface): string | undefined {
  return ['user', 'backup', 'bitgo'][fixtureKeys.indexOf(k)];
}

function runTestCheckScriptStructure(
  network: Network,
  scriptType: ScriptType2Of3 | 'p2shP2pk',
  signer1: bip32.BIP32Interface,
  signer2?: bip32.BIP32Interface
) {
  it(`has expected script structure [${getNetworkName(network)} ${scriptType} ${keyName(signer1)} ${
    signer2 ? keyName(signer2) : ''
  }]`, async function () {
    let tx;

    if (scriptType === 'p2shP2pk') {
      tx = getFullSignedTransactionP2shP2pk(fixtureKeys, signer1, network);
    } else {
      if (!signer2) {
        throw new Error(`must set cosigner`);
      }
      tx = getFullSignedTransaction2Of3(fixtureKeys, signer1, signer2, scriptType, network);
    }

    const { script, witness } = tx.ins[0];
    const scriptDecompiled = bscript.decompile(script);
    if (!scriptDecompiled) {
      throw new Error();
    }
    const scriptASM = bscript.toASM(script).split(' ');
    const classifyInput = classify.input(script);
    const classifyWitness = classify.witness(witness);

    let pubScript;
    let classifyPubScript;
    let pubScriptASM;

    let tapscript;
    let tapscriptASM;
    let classifyTapscript;

    if (classifyInput === 'scripthash' || classifyWitness === 'witnessscripthash') {
      if (witness.length) {
        pubScript = witness[witness.length - 1];
      } else {
        pubScript = scriptDecompiled[scriptDecompiled.length - 1] as Buffer;
      }

      classifyPubScript = classify.output(pubScript);
      pubScriptASM = bscript.toASM(pubScript).split(' ');
    } else if (classifyWitness === 'taproot') {
      tapscript = witness[witness.length - 2];
      classifyTapscript = classify.output(tapscript);
      tapscriptASM = bscript.toASM(tapscript).split(' ');
    }

    const structure = {
      publicKeys: fixtureKeys.map((k) => k.publicKey.toString('hex')),
      script: script?.toString('hex'),
      witness: witness?.map((w) => w.toString('hex')),
      scriptASM,
      pubScriptASM,
      tapscriptASM,
      classifyInput,
      classifyWitness,
      classifyPubScript,
      classifyTapscript,
    };

    const fixtureName = ['structure', keyName(signer1), signer2 ? keyName(signer2) : 'none'].join('-');
    fixtureUtil.assertEqualJSON(structure, await readFixture(network, scriptType, fixtureName, structure));
  });
}

function runTestParseScript(
  network: Network,
  scriptType: ScriptType,
  k1: bip32.BIP32Interface,
  k2: bip32.BIP32Interface
) {
  async function testParseSignedInputs(tx: UtxoTransaction, name: string, expectedScriptType: string | undefined) {
    const parsed = parseSignatureScript(tx.ins[0]);
    assert.strictEqual(parsed.scriptType, expectedScriptType);
    fixtureUtil.assertEqualJSON(
      parsed,
      await readFixture(network, scriptType, ['parsed', keyName(k1), keyName(k2), name].join('-'), parsed)
    );
  }

  if (scriptType !== 'p2shP2pk') {
    it(`parses half-signed inputs [${getNetworkName(network)} ${scriptType}]`, async function () {
      await testParseSignedInputs(
        getHalfSignedTransaction2Of3(fixtureKeys, k1, k2, scriptType, network),
        'halfSigned',
        scriptType
      );
    });
  }

  it(`parses full-signed inputs [${getNetworkName(network)} ${scriptType}]`, async function () {
    if (scriptType === 'p2shP2pk') {
      await testParseSignedInputs(getFullSignedTransactionP2shP2pk(fixtureKeys, k1, network), 'fullSigned', scriptType);
    } else {
      await testParseSignedInputs(
        getFullSignedTransaction2Of3(fixtureKeys, k1, k2, scriptType, network),
        'fullSigned',
        scriptType
      );
    }
  });
}

function assertVerifySignatureEquals(
  tx: UtxoTransaction,
  scriptType: ScriptType2Of3,
  value: boolean,
  verificationSettings?: {
    publicKey?: Buffer;
    signatureIndex?: number;
  }
) {
  const prevOutputs = getPrevOutputs(defaultTestOutputAmount, scriptType) as TxOutput[];
  tx.ins.forEach((input, i) => {
    assert.doesNotThrow(() => {
      getSignatureVerifications(tx, i, defaultTestOutputAmount, verificationSettings, prevOutputs);
    });
    assert.strictEqual(
      verifySignature(tx, i, defaultTestOutputAmount, verificationSettings, prevOutputs),
      value,
      JSON.stringify(verificationSettings)
    );
  });
}

function checkSignTransaction(tx: UtxoTransaction, scriptType: ScriptType2Of3, signKeys: bip32.BIP32Interface[]) {
  // return true iff there are any valid signatures at all
  assertVerifySignatureEquals(tx, scriptType, signKeys.length > 0);

  fixtureKeys.forEach((k) => {
    // if publicKey is given, return true iff it is included in signKeys
    assertVerifySignatureEquals(tx, scriptType, signKeys.includes(k), { publicKey: k.publicKey });
  });

  // When transactions are signed, the signatures have the same order as the public keys in the outputScript.
  const orderedSigningKeys = fixtureKeys.filter((fixtureKey) => signKeys.includes(fixtureKey));

  [0, 1, 2].forEach((signatureIndex) => {
    if (scriptType === 'p2tr') {
      // signatureIndex parameter not support for p2tr verification
      return;
    }
    fixtureKeys.forEach((k) => {
      // If no public key is given, return true iff any valid signature with given index exists.
      assertVerifySignatureEquals(tx, scriptType, signatureIndex < signKeys.length, {
        signatureIndex,
      });

      // If publicKey and signatureIndex are provided only return if both match.
      assertVerifySignatureEquals(tx, scriptType, signatureIndex === orderedSigningKeys.indexOf(k), {
        publicKey: k.publicKey,
        signatureIndex,
      });
    });
  });
}

function runTestCheckSignatureVerify(
  network: Network,
  scriptType: ScriptType2Of3,
  k1?: bip32.BIP32Interface,
  k2?: bip32.BIP32Interface
) {
  if (k1 && k2) {
    describe(`verifySignature ${getNetworkName(network)} ${scriptType} ${keyName(k1)} ${keyName(k2)}`, function () {
      it(`verifies half-signed`, function () {
        checkSignTransaction(getHalfSignedTransaction2Of3(fixtureKeys, k1, k2, scriptType, network), scriptType, [k1]);
      });

      it(`verifies full-signed`, function () {
        checkSignTransaction(getFullSignedTransaction2Of3(fixtureKeys, k1, k2, scriptType, network), scriptType, [
          k1,
          k2,
        ]);
      });
    });
  } else {
    describe(`verifySignature ${getNetworkName(network)} ${scriptType} unsigned`, function () {
      it(`verifies unsigned`, function () {
        checkSignTransaction(getUnsignedTransaction2Of3(fixtureKeys, scriptType, network), scriptType, []);
      });
    });
  }
}

describe('Signature (scriptTypes2Of3)', function () {
  getNetworkList()
    .filter(isMainnet)
    // The signing and verification methods are largely network-independent so let's focus on a
    // single network to reduce test time.
    // During development it might make sense to test all networks.
    .filter(isBitcoin)
    .forEach((network) => {
      scriptTypes2Of3.forEach((scriptType) => {
        runTestCheckSignatureVerify(network, scriptType);

        getSignKeyCombinations(2).map(([k1, k2]) => {
          runTestCheckSignatureVerify(network, scriptType, k1, k2);
          runTestCheckScriptStructure(network, scriptType, k1, k2);
          runTestParseScript(network, scriptType, k1, k2);
        });
      });
    });
});

describe('Signature (p2shP2pk)', function () {
  it('sign and parse', function () {
    const signedTransaction = getFullSignedTransactionP2shP2pk(fixtureKeys, fixtureKeys[0], networks.bitcoin);

    signedTransaction.ins.forEach((input) => {
      assert.deepStrictEqual(parseSignatureScript(input), {
        scriptType: 'p2shP2pk',
        inputClassification: 'scripthash',
        isSegwitInput: false,
        p2shOutputClassification: 'pubkey',
      });
    });
  });

  runTestCheckScriptStructure(networks.bitcoin, 'p2shP2pk', fixtureKeys[0]);
});
