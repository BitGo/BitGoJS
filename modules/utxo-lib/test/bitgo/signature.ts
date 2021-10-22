import * as assert from 'assert';
import * as bip32 from 'bip32';

import * as networks from '../../src/networks';
import { ScriptType2Of3, scriptTypes2Of3 } from '../../src/bitgo/outputScripts';
import { getNetworkList, getNetworkName, isBitcoin, isMainnet } from '../../src/coins';
import { Network } from '../../src/networkTypes';
import { verifySignature, UtxoTransaction, parseSignatureScript } from '../../src/bitgo';

import { fixtureKeys } from '../integration_local_rpc/generate/fixtures';
import { defaultTestOutputAmount, getSignKeyCombinations, getTransactionBuilder } from '../transaction_util';

function runTest(network: Network, scriptType: ScriptType2Of3) {
  if (scriptType === 'p2tr') {
    return; // TODO: enable p2tr tests when signing is supported
  }
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
        verifySignature(tx, i, defaultTestOutputAmount, verificationSettings),
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
        getSignKeyCombinations(length).forEach((keys) => checkSignTransaction(keys));
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
      scriptTypes2Of3.forEach((scriptType) => runTest(network, scriptType));
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
});
