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
  toTNumber,
} from '../../../src/bitgo';

import { getDefaultWalletKeys } from '../../testutil';
import { mockWalletUnspent } from './util';
import { defaultTestOutputAmount } from '../../transaction_util';

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

  describe('unspentSum', function () {
    const unspents = [
      mockWalletUnspent(network, 123, {
        keys: walletKeys,
        vout: 0,
      }),
      mockWalletUnspent(network, 98765, {
        keys: walletKeys,
        vout: 1,
      }),
    ];
    const bigUnspents = [
      mockWalletUnspent(network, Number.MAX_SAFE_INTEGER, {
        keys: walletKeys,
        vout: 1,
      }),
    ];
    const unspentsBig = [
      mockWalletUnspent(network, BigInt(123), {
        keys: walletKeys,
        vout: 0,
      }),
      mockWalletUnspent(network, BigInt(98765), {
        keys: walletKeys,
        vout: 1,
      }),
    ];
    it('sums number', function () {
      assert.strictEqual(unspentSum(unspents, 'number'), 123 + 98765);
    });
    it('sums bigint', function () {
      assert.strictEqual(unspentSum(unspentsBig, 'bigint'), BigInt(123 + 98765));
    });
    it('sums zero', function () {
      assert.strictEqual(unspentSum([], 'number'), 0);
      assert.strictEqual(unspentSum([], 'number'), 0);
    });
    it('throws on mixing number and bigint', function () {
      assert.throws(() => {
        unspentSum((unspentsBig as unknown as Unspent<number>[]).concat(unspents), 'number');
      });
      assert.throws(() => {
        unspentSum((unspents as unknown as Unspent<bigint>[]).concat(unspentsBig), 'bigint');
      });
    });
    it('throws on unsafe integer number', function () {
      assert.throws(() => {
        unspentSum(bigUnspents.concat(unspents), 'number');
      });
    });
    it('throws on mismatch between unspent and amountType', function () {
      assert.throws(() => {
        unspentSum(unspents, 'bigint');
      });
      assert.throws(() => {
        unspentSum(unspentsBig, 'number');
      });
    });
  });

  function runTestSignUnspent<TNumber extends number | bigint>(
    scriptType: outputScripts.ScriptType2Of3,
    signer: string,
    cosigner: string,
    amountType: 'number' | 'bigint' = 'number',
    testOutputAmount = toTNumber<TNumber>(defaultTestOutputAmount, amountType)
  ) {
    it(`can be signed [scriptType=${scriptType} signer=${signer} cosigner=${cosigner} amountType=${amountType}]`, function () {
      const unspents = [
        mockWalletUnspent(network, testOutputAmount, {
          keys: walletKeys,
          chain: getExternalChainCode(scriptType),
          vout: 0,
        }),
        mockWalletUnspent(network, testOutputAmount, {
          keys: walletKeys,
          chain: getInternalChainCode(scriptType),
          vout: 1,
        }),
      ];
      const txb = createTransactionBuilderForNetwork<TNumber>(network);
      txb.addOutput(
        getWalletAddress(walletKeys, 0, 100, network),
        toTNumber<TNumber>(BigInt(unspentSum<TNumber>(unspents, amountType)) - BigInt(100), amountType)
      );
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
          runTestSignUnspent<bigint>(t, signer, cosigner, 'bigint', BigInt('10000000000000000'));
        }
      });
    });
  });
});
