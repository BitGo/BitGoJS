import * as assert from 'assert';

import { networks } from '../../../src';
import {
  isWalletUnspent,
  formatOutputId,
  getOutputIdForInput,
  parseOutputId,
  TxOutPoint,
  Unspent,
  createTransactionBuilderForNetwork,
  getInternalChainCode,
  getExternalChainCode,
  addToTransactionBuilder,
  signInputWithUnspent,
  WalletUnspentSigner,
  outputScripts,
  unspentSum,
  getWalletAddress,
  verifySignatureWithUnspent,
} from '../../../src/bitgo';

import { getDefaultWalletKeys } from '../../testutil';
import { mockWalletUnspent } from './util';

describe('WalletUnspent', function () {
  const network = networks.bitcoin;
  const walletKeys = getDefaultWalletKeys();
  const hash = Buffer.alloc(32).fill(0xff);
  hash[0] = 0; // show endianness
  const input = { hash, index: 0 };
  const expectedOutPoint: TxOutPoint = {
    txid: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00',
    vout: 0,
  };

  it('parses and formats txid', function () {
    assert.deepStrictEqual(getOutputIdForInput(input), expectedOutPoint);
    assert.deepStrictEqual(
      formatOutputId(expectedOutPoint),
      'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00:0'
    );
    assert.deepStrictEqual(parseOutputId(formatOutputId(expectedOutPoint)), expectedOutPoint);
  });

  it('identifies wallet unspents', function () {
    const unspent: Unspent = {
      id: formatOutputId(expectedOutPoint),
      address: getWalletAddress(walletKeys, 0, 0, network),
      value: 1e8,
    };
    assert.strictEqual(isWalletUnspent(unspent), false);
    assert.strictEqual(isWalletUnspent({ ...unspent, chain: 0, index: 0 } as Unspent), true);
  });

  function runTestSignUnspent(scriptType: outputScripts.ScriptType2Of3, signer: string, cosigner: string) {
    it(`can be signed [scriptType=${scriptType} signer=${signer} cosigner=${cosigner}]`, function () {
      const unspents = [
        mockWalletUnspent(network, {
          keys: walletKeys,
          chain: getExternalChainCode(scriptType),
          vout: 0,
        }),
        mockWalletUnspent(network, {
          keys: walletKeys,
          chain: getInternalChainCode(scriptType),
          vout: 1,
        }),
      ];
      const txb = createTransactionBuilderForNetwork(network);
      txb.addOutput(getWalletAddress(walletKeys, 0, 100, network), unspentSum(unspents) - 100);
      unspents.forEach((u) => {
        addToTransactionBuilder(txb, u);
      });
      [
        WalletUnspentSigner.from(walletKeys, walletKeys[signer], walletKeys[cosigner]),
        WalletUnspentSigner.from(walletKeys, walletKeys[cosigner], walletKeys[signer]),
      ].forEach((walletSigner, nSignature) => {
        unspents.forEach((u, i) => {
          signInputWithUnspent(txb, i, unspents[i], walletSigner);
        });
        const tx = nSignature === 0 ? txb.buildIncomplete() : txb.build();
        unspents.forEach((u, i) => {
          assert.deepStrictEqual(
            verifySignatureWithUnspent(tx, i, unspents, walletKeys),
            walletKeys.triple.map((k) => k === walletKeys[signer] || (nSignature === 1 && k === walletKeys[cosigner]))
          );
        });
      });
    });
  }

  outputScripts.scriptTypes2Of3.forEach((t) => {
    const keyNames = ['user', 'backup', 'bitgo'];
    keyNames.forEach((signer) => {
      keyNames.forEach((cosigner) => {
        if (signer !== cosigner) {
          runTestSignUnspent(t, signer, cosigner);
        }
      });
    });
  });
});
