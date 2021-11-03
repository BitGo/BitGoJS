import * as assert from 'assert';
import * as bip32 from 'bip32';

import { script as bscript, classify } from '../../src';
import * as networks from '../../src/networks';
import { ScriptType2Of3, scriptTypes2Of3 } from '../../src/bitgo/outputScripts';
import { getNetworkList, getNetworkName, isBitcoin, isMainnet } from '../../src/coins';
import { Network } from '../../src/networkTypes';
import { verifySignature, UtxoTransaction, parseSignatureScript, PrevOutput } from '../../src/bitgo';

import { fixtureKeys } from '../integration_local_rpc/generate/fixtures';
import {
  defaultTestOutputAmount,
  getPrevOutputs,
  getSignKeyCombinations,
  getTransactionBuilder,
} from '../transaction_util';

function runTestCheckSignatureScripts(network: Network, scriptType: ScriptType2Of3 | 'p2shP2pk') {
  it(`inputs script structure (${scriptType})`, function () {
    const tx = getTransactionBuilder(
      fixtureKeys,
      scriptType === 'p2shP2pk'
        ? [fixtureKeys[0]]
        : scriptType === 'p2tr'
        ? [fixtureKeys[0], fixtureKeys[2]]
        : [fixtureKeys[0], fixtureKeys[1]],
      scriptType,
      networks.bitcoin
    ).build();

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

    const scriptP2msHex =
      '5221028fedaf75b5b08cddf3bf4631c658b68ee6766a8e999467a641d7cb7aaaecec972103316bc27d95b96418349afc6298c259bb999c6e8f39a7217787ad53602be7c1472102e21c29b4a7eeace9c7a8cefb568ca00c86ff9bf5e79e07e5442c29d4a0950d0453ae';

    switch (scriptType) {
      case 'p2sh':
        assert.strictEqual(classifyInput, 'scripthash');
        assert.deepStrictEqual(scriptASM, [
          'OP_0',
          // Sig1
          '3045022100c2ba6a18d767b0edf21b830777ca4a962491cb0070a0e8f8500895768effd61602201ad7e5bf1fa32899b1617010ea990f1d9704747c41c69ee41a903bc44e7d8bf601',
          // Sig2
          '304402202344953197c5cfbd4af70d8f3cc41c53752dc22061733c0c5e87bee9638f3b7102204ed654b8b599ee6c480b811ee37a50cec1dbc836d2375edb0ed28794249a6b4601',
          scriptP2msHex,
        ]);
        break;
      case 'p2shP2wsh':
      case 'p2wsh':
        assert.strictEqual(classifyInput, scriptType === 'p2shP2wsh' ? 'scripthash' : 'nonstandard');
        assert.deepStrictEqual(
          scriptASM,
          scriptType === 'p2shP2wsh' ? ['00201553f31a3e25e770b7bc857b82909e83734dbfe4bcdb5a5e6fc419b6920c398a'] : ['']
        );
        assert.deepStrictEqual(
          witness.map((w) => w.toString('hex')),
          [
            '',
            // Sig1
            '304502210086013d0eb9a31dc730af9c85943fb7b14858d4b4fc6ca7cfd16c3830203b210802203400c1d9c1c5b75b3169d7a5dd4e666efa2f12eb3dff962a144b70d5d1d235c201',
            // Sig2
            '3045022100b10c25d173933e9b5970ccd4fc5b6b0a001ccc6aeef1d546c6cab677ca3041bf02201f6dddd08789047b352a14edec65184ebd0c8c827d3f96f7ea306a85cd622ad901',
            scriptP2msHex,
          ]
        );
        break;
      case 'p2tr':
        assert.strictEqual(classifyInput, 'nonstandard');
        assert.strictEqual(classifyWitness, 'taproot');
        assert.deepStrictEqual(
          witness.map((w) => w.toString('hex')),
          [
            // signature 1
            '96c9a61eeb137facfbf517b661b24ace13941de3da14ea4ccdc39b13971be6ef402c586638509fda52187384dd5fb66b085b2fbdd75ac8f34e2467ad9f07be46',
            // signature 2
            '693e625c9b1a71820a7237b4f2e2f809c78725f052f18b940e016a1cbe6d11bd90e548ca32098d4b8f3a057d34c984c34975dd98aa7251b099271a61dabebf2a',
            // tapscript
            '208fedaf75b5b08cddf3bf4631c658b68ee6766a8e999467a641d7cb7aaaecec97ad20e21c29b4a7eeace9c7a8cefb568ca00c86ff9bf5e79e07e5442c29d4a0950d04ac',
            // control block
            'c169d984b8967c360d084920bb8536dddef42b1ccb6337f2d310a8dabd24d43cc2185457a6e74cdfcdf020c0eef3b794f3077f43139aa7c30d50da5a26dceed225',
          ]
        );
        break;
      case 'p2shP2pk':
        assert.strictEqual(classifyInput, 'scripthash');
        assert.deepStrictEqual(scriptASM, [
          // Sig
          '3045022100e637466be405032a633dcef0bd161305fe93d34ffe2aabc4af434d6f265912210220113d7085b1e00435a2583af82b8a4df3fb009a8d279d231351e42f31d6bac74401',
          // P2PK
          '21028fedaf75b5b08cddf3bf4631c658b68ee6766a8e999467a641d7cb7aaaecec97ac',
        ]);
        break;
      default:
        throw new Error(`unexpected scriptType ${scriptType}`);
    }

    switch (scriptType) {
      case 'p2sh':
      case 'p2shP2wsh':
      case 'p2wsh':
        assert.strictEqual(classifyPubScript, 'multisig');
        assert.deepStrictEqual(pubScriptASM, [
          'OP_2',
          // Pubkey1
          '028fedaf75b5b08cddf3bf4631c658b68ee6766a8e999467a641d7cb7aaaecec97',
          // Pubkey2
          '03316bc27d95b96418349afc6298c259bb999c6e8f39a7217787ad53602be7c147',
          // Pubkey3
          '02e21c29b4a7eeace9c7a8cefb568ca00c86ff9bf5e79e07e5442c29d4a0950d04',
          'OP_3',
          'OP_CHECKMULTISIG',
        ]);
        break;
      case 'p2tr':
        assert.strictEqual(classifyTapscript, 'taprootnofn');
        assert.deepStrictEqual(tapscriptASM, [
          // Pubkey1
          '8fedaf75b5b08cddf3bf4631c658b68ee6766a8e999467a641d7cb7aaaecec97',
          'OP_CHECKSIGVERIFY',
          // Pubkey3
          'e21c29b4a7eeace9c7a8cefb568ca00c86ff9bf5e79e07e5442c29d4a0950d04',
          'OP_CHECKSIG',
        ]);
        break;
      case 'p2shP2pk':
        assert.strictEqual(classifyPubScript, 'pubkey');
        assert.deepStrictEqual(pubScriptASM, [
          // Pubkey
          '028fedaf75b5b08cddf3bf4631c658b68ee6766a8e999467a641d7cb7aaaecec97',
          'OP_CHECKSIG',
        ]);
        break;
      default:
        throw new Error(`unexpected scriptType ${scriptType}`);
    }
  });
}

function runTest(network: Network, scriptType: ScriptType2Of3) {
  function assertVerifySignatureEquals(
    tx: UtxoTransaction,
    value: boolean,
    verificationSettings?: {
      publicKey?: Buffer;
      signatureIndex?: number;
    }
  ) {
    tx.ins.forEach((input, i) => {
      assert.strictEqual(
        verifySignature(
          tx,
          i,
          defaultTestOutputAmount,
          verificationSettings,
          getPrevOutputs(defaultTestOutputAmount, scriptType) as PrevOutput[]
        ),
        value,
        JSON.stringify(verificationSettings)
      );
    });
  }

  function checkSignTransaction(signKeys: bip32.BIP32Interface[]) {
    const tx = getTransactionBuilder(fixtureKeys, signKeys, scriptType, network).buildIncomplete();

    // return true iff there are any valid signatures at all
    assertVerifySignatureEquals(tx, signKeys.length > 0);

    fixtureKeys.forEach((k) => {
      // if publicKey is given, return true iff it is included in signKeys
      assertVerifySignatureEquals(tx, signKeys.includes(k), { publicKey: k.publicKey });
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
        assertVerifySignatureEquals(tx, signatureIndex < signKeys.length, {
          signatureIndex,
        });

        // If publicKey and signatureIndex are provided only return if both match.
        assertVerifySignatureEquals(tx, signatureIndex === orderedSigningKeys.indexOf(k), {
          publicKey: k.publicKey,
          signatureIndex,
        });
      });
    });
  }

  describe(`verifySignature ${getNetworkName(network)} ${scriptType}`, function () {
    [0, 1, 2, 3].forEach((length) => {
      it(`returns true for selected keys (length=${length})`, function () {
        getSignKeyCombinations(length).forEach((keys) => {
          if (scriptType === 'p2tr') {
            // p2tr test only supports [userKey, bitgoKey] signatures currently
            if (keys.length === 3) {
              return;
            }
            if (keys.length === 2) {
              const [userKey, , bitgoKey] = fixtureKeys;
              if (!keys.every((k) => [userKey, bitgoKey].includes(k))) {
                return;
              }
            }
          }
          checkSignTransaction(keys);
        });
      });
    });
  });
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
        runTest(network, scriptType);
        runTestCheckSignatureScripts(network, scriptType);
      });
    });
});

describe('Signature (p2shP2pk)', function () {
  it('sign and parse', function () {
    const signedTransaction = getTransactionBuilder(
      fixtureKeys,
      fixtureKeys.slice(0, 1),
      'p2shP2pk',
      networks.bitcoin
    ).build();

    signedTransaction.ins.forEach((input) => {
      assert.deepStrictEqual(parseSignatureScript(input), {
        inputClassification: 'scripthash',
        isSegwitInput: false,
        p2shOutputClassification: 'pubkey',
      });
    });
  });

  runTestCheckSignatureScripts(networks.bitcoin, 'p2shP2pk');
});
