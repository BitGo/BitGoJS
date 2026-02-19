import assert from 'node:assert/strict';

import { CoinName, fixedScriptWallet, BIP32, message } from '@bitgo/wasm-utxo';
import * as utxolib from '@bitgo/utxo-lib';
import { testutil } from '@bitgo/utxo-lib';

import { explainPsbt as explainPsbtUtxolib, explainPsbtWasm } from '../../src/transaction/fixedScript';
import { verifyKeySignature } from '../../src/verifyKey';
import { SdkBackend } from '../../src/transaction';

function explainPsbt(
  psbt: utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt,
  walletKeys: utxolib.bitgo.RootWalletKeys,
  customChangeWalletKeys: utxolib.bitgo.RootWalletKeys | undefined,
  coin: CoinName
) {
  if (psbt instanceof fixedScriptWallet.BitGoPsbt) {
    return explainPsbtWasm(psbt, fixedScriptWallet.RootWalletKeys.from(walletKeys), {
      replayProtection: { publicKeys: [] },
      customChangeWalletXpubs: customChangeWalletKeys
        ? fixedScriptWallet.RootWalletKeys.from(customChangeWalletKeys)
        : undefined,
    });
  } else {
    return explainPsbtUtxolib(psbt, { pubs: walletKeys, customChangePubs: customChangeWalletKeys }, coin);
  }
}

function describeWithBackend(sdkBackend: SdkBackend) {
  describe(`Custom Change Wallets (sdkBackend=${sdkBackend})`, function () {
    const network = utxolib.networks.bitcoin;
    const rootWalletKeys = testutil.getDefaultWalletKeys();
    const customChangeWalletKeys = testutil.getWalletKeysForSeed('custom change');

    const inputs: testutil.Input[] = [{ scriptType: 'p2sh', value: BigInt(10000) }];
    const outputs: testutil.Output[] = [
      // regular change (uses rootWalletKeys via default)
      { scriptType: 'p2sh', value: BigInt(3000) },
      // custom change (bip32Derivation from customChangeWalletKeys, not added as global xpubs)
      { scriptType: 'p2sh', value: BigInt(3000), walletKeys: customChangeWalletKeys },
      // external (no derivation info)
      { scriptType: 'p2sh', value: BigInt(3000), walletKeys: null },
    ];

    let psbt: utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt = testutil.constructPsbt(
      inputs,
      outputs,
      network,
      rootWalletKeys,
      'unsigned',
      {
        addGlobalXPubs: true,
      }
    );

    if (sdkBackend === 'wasm-utxo') {
      psbt = fixedScriptWallet.BitGoPsbt.fromBytes(psbt.toBuffer(), 'btc');
    }

    it('classifies custom change output when customChangePubs is provided', function () {
      const explanation = explainPsbt(psbt, rootWalletKeys, customChangeWalletKeys, 'btc');

      assert.strictEqual(explanation.changeOutputs.length, 1);
      assert.strictEqual(explanation.changeOutputs[0].amount, '3000');

      assert.ok(explanation.customChangeOutputs);
      assert.strictEqual(explanation.customChangeOutputs.length, 1);
      assert.strictEqual(explanation.customChangeOutputs[0].amount, '3000');
      assert.strictEqual(explanation.customChangeAmount, '3000');

      assert.strictEqual(explanation.outputs.length, 1);
      assert.strictEqual(explanation.outputs[0].amount, '3000');
    });

    it('classifies custom change output as external without customChangePubs', function () {
      const explanation = explainPsbt(psbt, rootWalletKeys, undefined, 'btc');

      assert.strictEqual(explanation.changeOutputs.length, 1);
      assert.strictEqual(explanation.changeOutputs[0].amount, '3000');

      assert.strictEqual(explanation.customChangeOutputs?.length ?? 0, 0);

      // custom change + external both treated as external outputs
      assert.strictEqual(explanation.outputs.length, 2);
    });

    it('verifies valid custom change key signatures', function () {
      const userPrivateKey = BIP32.fromBase58(rootWalletKeys.triple[0].toBase58()).privateKey!;
      const userPub = rootWalletKeys.triple[0].neutered().toBase58();

      for (const key of customChangeWalletKeys.triple) {
        const pub = key.neutered().toBase58();
        const signature = Buffer.from(message.signMessage(pub, userPrivateKey)).toString('hex');
        assert.ok(
          verifyKeySignature({ userKeychain: { pub: userPub }, keychainToVerify: { pub }, keySignature: signature })
        );
      }
    });

    it('rejects invalid custom change key signatures', function () {
      const wrongKey = BIP32.fromBase58(testutil.getWalletKeysForSeed('wrong').triple[0].toBase58());
      const userPub = rootWalletKeys.triple[0].neutered().toBase58();

      for (const key of customChangeWalletKeys.triple) {
        const pub = key.neutered().toBase58();
        const badSignature = Buffer.from(message.signMessage(pub, wrongKey.privateKey!)).toString('hex');
        assert.strictEqual(
          verifyKeySignature({ userKeychain: { pub: userPub }, keychainToVerify: { pub }, keySignature: badSignature }),
          false
        );
      }
    });
  });
}

describeWithBackend('utxolib');
describeWithBackend('wasm-utxo');
