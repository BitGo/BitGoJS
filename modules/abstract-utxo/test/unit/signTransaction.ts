import 'mocha';
import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import nock = require('nock');
import { testutil } from '@bitgo/utxo-lib';
import { common, Triple } from '@bitgo/sdk-core';

import { getReplayProtectionPubkeys } from '../../src';
import type { Unspent } from '../../src/unspent';

import { getUtxoWallet, getDefaultWalletKeys, getUtxoCoin, keychainsBase58, defaultBitGo } from './util';

describe('signTransaction', function () {
  const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;

  const coin = getUtxoCoin('btc');
  const wallet = getUtxoWallet(coin, { id: '5b34252f1bf349930e34020a00000000', coin: coin.getChain() });
  const rootWalletKeys = getDefaultWalletKeys();
  const userPrv = rootWalletKeys.user.toBase58();
  const pubs = keychainsBase58.map((v) => v.pub) as Triple<string>;

  function validatePsbt(txHex: string, targetSigCount: 0 | 1, targetNonceCount?: 1 | 2) {
    const psbt = utxolib.bitgo.createPsbtFromHex(txHex, coin.network);
    psbt.data.inputs.forEach((input, index) => {
      const parsed = utxolib.bitgo.parsePsbtInput(input);
      if (parsed.scriptType === 'taprootKeyPathSpend') {
        assert.ok(targetNonceCount);
        const nonce = psbt.getProprietaryKeyVals(index, {
          identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
          subtype: utxolib.bitgo.ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        });
        assert.strictEqual(nonce.length, targetNonceCount);
      }
      const expectedSigCount = parsed.scriptType === 'p2shP2pk' || targetSigCount === 0 ? undefined : 1;
      assert.strictEqual(parsed.signatures?.length, expectedSigCount);
    });
  }

  function validateTx(txHex: string, unspents: Unspent<bigint>[], targetSigCount: 0 | 1) {
    const tx = utxolib.bitgo.createTransactionFromHex(txHex, coin.network);
    unspents.forEach((u, i) => {
      const sigCount = utxolib.bitgo.getStrictSignatureCount(tx.ins[i]);
      const expectedSigCount = utxolib.bitgo.isWalletUnspent(u) && !!targetSigCount ? 1 : 0;
      assert.strictEqual(sigCount, expectedSigCount);
    });
  }

  async function signTransaction(
    tx: utxolib.bitgo.UtxoPsbt | utxolib.bitgo.UtxoTransaction<bigint>,
    useSigningSteps: boolean,
    unspents?: Unspent<bigint>[]
  ) {
    const isPsbt = tx instanceof utxolib.bitgo.UtxoPsbt;
    const isTxWithTaprootKeyPathSpend = isPsbt && utxolib.bitgo.isTransactionWithKeyPathSpendInput(tx);
    const txHex = tx.toHex();

    function nockSignPsbt(psbtHex: string): nock.Scope {
      const psbt = utxolib.bitgo.createPsbtFromHex(psbtHex, coin.network);
      return nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/signpsbt`, (body) => body.psbt)
        .reply(200, { psbt: psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo).toHex() });
    }

    if (!useSigningSteps) {
      let scope: nock.Scope | undefined;
      if (tx instanceof utxolib.bitgo.UtxoPsbt && isTxWithTaprootKeyPathSpend) {
        scope = nockSignPsbt(tx.clone().setAllInputsMusig2NonceHD(rootWalletKeys.bitgo).toHex());
      }
      const psbt = await coin.signTransaction({
        txPrebuild: {
          txHex,
          txInfo: isPsbt ? undefined : { unspents },
          walletId: isTxWithTaprootKeyPathSpend ? wallet.id() : undefined,
        },
        prv: userPrv,
        pubs: isPsbt ? undefined : pubs,
      });
      assert.ok('txHex' in psbt);
      if (isPsbt) {
        validatePsbt(psbt.txHex, 1, 2);
      } else {
        assert.ok(unspents);
        validateTx(psbt.txHex, unspents, 1);
      }
      if (scope) {
        assert.strictEqual(scope.isDone(), true);
      }
      return;
    }

    const signerNoncePsbt = await coin.signTransaction({
      txPrebuild: { txHex },
      prv: userPrv,
      signingStep: 'signerNonce',
    });
    assert.ok('txHex' in signerNoncePsbt);
    if (isPsbt) {
      validatePsbt(signerNoncePsbt.txHex, 0, isTxWithTaprootKeyPathSpend ? 1 : undefined);
    } else {
      assert.ok(unspents);
      validateTx(signerNoncePsbt.txHex, unspents, 0);
    }

    let scope: nock.Scope | undefined;
    if (isTxWithTaprootKeyPathSpend) {
      scope = nockSignPsbt(signerNoncePsbt.txHex);
    }

    const cosignerNoncePsbt = await coin.signTransaction({
      txPrebuild: { ...signerNoncePsbt, walletId: wallet.id() },
      signingStep: 'cosignerNonce',
    });
    assert.ok('txHex' in cosignerNoncePsbt);
    if (isPsbt) {
      validatePsbt(cosignerNoncePsbt.txHex, 0, isTxWithTaprootKeyPathSpend ? 2 : undefined);
    } else {
      assert.ok(unspents);
      validateTx(cosignerNoncePsbt.txHex, unspents, 0);
    }

    if (scope) {
      assert.strictEqual(scope.isDone(), true);
    }

    const signerSigPsbt = await coin.signTransaction({
      txPrebuild: { ...cosignerNoncePsbt, txInfo: isPsbt ? undefined : { unspents } },
      prv: userPrv,
      pubs: isPsbt ? undefined : pubs,
      signingStep: 'signerSignature',
    });
    assert.ok('txHex' in signerSigPsbt);
    if (isPsbt) {
      validatePsbt(signerSigPsbt.txHex, 1, isTxWithTaprootKeyPathSpend ? 2 : undefined);
    } else {
      assert.ok(unspents);
      validateTx(signerSigPsbt.txHex, unspents, 1);
    }
  }

  it('customSigningFunction flow - PSBT with taprootKeyPathSpend inputs', async function () {
    const inputs: testutil.Input[] = testutil.inputScriptTypes.map((scriptType) => ({
      scriptType,
      value: BigInt(1000),
    }));
    const unspentSum = inputs.reduce((prev: bigint, curr) => prev + curr.value, BigInt(0));
    const outputs: testutil.Output[] = [{ scriptType: 'p2sh', value: unspentSum - BigInt(1000) }];
    const psbt = testutil.constructPsbt(inputs, outputs, coin.network, rootWalletKeys, 'unsigned', {
      p2shP2pkKey: getReplayProtectionPubkeys(coin.name)[0],
    });

    for (const v of [false, true]) {
      await signTransaction(psbt, v);
    }
  });

  it('customSigningFunction flow - PSBT without taprootKeyPathSpend inputs', async function () {
    const inputs: testutil.Input[] = testutil.inputScriptTypes
      .filter((v) => v !== 'taprootKeyPathSpend')
      .map((scriptType) => ({
        scriptType,
        value: BigInt(1000),
      }));
    const unspentSum = inputs.reduce((prev: bigint, cur) => prev + cur.value, BigInt(0));
    const outputs: testutil.Output[] = [{ scriptType: 'p2sh', value: unspentSum - BigInt(1000) }];
    const psbt = testutil.constructPsbt(inputs, outputs, coin.network, rootWalletKeys, 'unsigned');

    for (const v of [false, true]) {
      await signTransaction(psbt, v);
    }
  });

  it('customSigningFunction flow - Network Tx', async function () {
    const inputs: testutil.TxnInput<bigint>[] = testutil.txnInputScriptTypes
      .filter((v) => v !== 'p2shP2pk')
      .map((scriptType) => ({
        scriptType,
        value: BigInt(1000),
      }));
    const unspentSum = inputs.reduce((prev: bigint, curr) => prev + curr.value, BigInt(0));
    const outputs: testutil.TxnOutput<bigint>[] = [{ scriptType: 'p2sh', value: unspentSum - BigInt(1000) }];
    const txBuilder = testutil.constructTxnBuilder(inputs, outputs, coin.network, rootWalletKeys, 'unsigned');
    const unspents = inputs.map((v, i) => testutil.toTxnUnspent(v, i, coin.network, rootWalletKeys));

    for (const v of [false, true]) {
      await signTransaction(txBuilder.buildIncomplete(), v, unspents);
    }
  });

  it('fails on PSBT cache miss', async function () {
    const inputs: testutil.Input[] = [{ scriptType: 'taprootKeyPathSpend', value: BigInt(1000) }];
    const unspentSum = inputs.reduce((prev: bigint, curr) => prev + curr.value, BigInt(0));
    const outputs: testutil.Output[] = [{ scriptType: 'p2sh', value: unspentSum - BigInt(1000) }];
    const psbt = testutil.constructPsbt(inputs, outputs, coin.network, rootWalletKeys, 'unsigned');

    await assert.rejects(
      async () => {
        await coin.signTransaction({
          txPrebuild: { txHex: psbt.toHex() },
          prv: userPrv,
          signingStep: 'signerSignature',
        });
      },
      {
        message: `Psbt is missing from txCache (cache size 0).
            This may be due to the request being routed to a different BitGo-Express instance that for signing step 'signerNonce'.`,
      }
    );
  });

  it('fails on unsupported locking script', async function () {
    const inputs: testutil.Input[] = [
      { scriptType: 'p2wsh', value: BigInt(1000) },
      { scriptType: 'p2trMusig2', value: BigInt(1000) },
    ];
    const unspentSum = inputs.reduce((prev: bigint, curr) => prev + curr.value, BigInt(0));
    const outputs: testutil.Output[] = [{ scriptType: 'p2sh', value: unspentSum - BigInt(500) }];
    const psbt = testutil.constructPsbt(inputs, outputs, coin.network, rootWalletKeys, 'unsigned');

    // override the 1st PSBT input with unsupported 2 of 2 multi-sig locking script.
    const unspent = testutil.toUnspent(inputs[0], 0, coin.network, rootWalletKeys);
    if (!utxolib.bitgo.isWalletUnspent(unspent)) {
      throw new Error('invalid unspent');
    }
    const { publicKeys } = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);
    const script2Of2 = utxolib.payments.p2ms({ m: 2, pubkeys: [publicKeys[0], publicKeys[1]] });
    psbt.data.inputs[0].witnessScript = script2Of2.output;

    await assert.rejects(
      async () => {
        await coin.signTransaction({
          txPrebuild: { txHex: psbt.toHex() },
          prv: userPrv,
        });
      },
      {
        message: `length mismatch`,
      }
    );
  });
});
