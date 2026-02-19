import assert from 'node:assert/strict';

import nock = require('nock');
import { CoinName, fixedScriptWallet, BIP32, message } from '@bitgo/wasm-utxo';
import * as utxolib from '@bitgo/utxo-lib';
import { testutil } from '@bitgo/utxo-lib';
import { common, Wallet } from '@bitgo/sdk-core';
import { getSeed } from '@bitgo/sdk-test';

import { explainPsbt as explainPsbtUtxolib, explainPsbtWasm } from '../../src/transaction/fixedScript';
import { verifyKeySignature } from '../../src/verifyKey';
import { SdkBackend } from '../../src/transaction';

import { defaultBitGo, getUtxoCoin } from './util';

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
    const coin = getUtxoCoin('btc');
    const network = utxolib.networks.bitcoin;
    const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;
    const rootWalletKeys = testutil.getDefaultWalletKeys();
    const customChangeWalletKeys = testutil.getWalletKeysForSeed('custom change');
    const userPrivateKey = BIP32.fromBase58(rootWalletKeys.triple[0].toBase58()).privateKey!;

    const mainKeyIds = rootWalletKeys.triple.map((k) => getSeed(k.neutered().toBase58()).toString('hex'));
    const customChangeKeyIds = customChangeWalletKeys.triple.map((k) =>
      getSeed(k.neutered().toBase58()).toString('hex')
    );
    const customChangeKeySignatures = Object.fromEntries(
      (['user', 'backup', 'bitgo'] as const).map((name, i) => [
        name,
        Buffer.from(
          message.signMessage(customChangeWalletKeys.triple[i].neutered().toBase58(), userPrivateKey)
        ).toString('hex'),
      ])
    ) as Record<'user' | 'backup' | 'bitgo', string>;

    const inputs: testutil.Input[] = [{ scriptType: 'p2sh', value: BigInt(10000) }];
    const outputs: testutil.Output[] = [
      // regular change (uses rootWalletKeys via default)
      { scriptType: 'p2sh', value: BigInt(3000) },
      // custom change (bip32Derivation from customChangeWalletKeys, not added as global xpubs)
      { scriptType: 'p2sh', value: BigInt(3000), walletKeys: customChangeWalletKeys },
      // external (no derivation info)
      { scriptType: 'p2sh', value: BigInt(3000), walletKeys: null },
    ];

    const utxolibPsbt = testutil.constructPsbt(inputs, outputs, network, rootWalletKeys, 'unsigned', {
      addGlobalXPubs: true,
    });
    const psbt: utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt =
      sdkBackend === 'wasm-utxo' ? fixedScriptWallet.BitGoPsbt.fromBytes(utxolibPsbt.toBuffer(), 'btc') : utxolibPsbt;

    const externalAddress = utxolib.address.fromOutputScript(utxolibPsbt.txOutputs[2].script, network);
    const customChangeWalletId = 'custom-change-wallet-id';
    const mainWalletId = 'main-wallet-id';

    function nockKeyFetch(keyIds: string[], keys: utxolib.bitgo.RootWalletKeys): nock.Scope[] {
      return keyIds.map((id, i) =>
        nock(bgUrl)
          .get(`/api/v2/${coin.getChain()}/key/${id}`)
          .reply(200, { pub: keys.triple[i].neutered().toBase58() })
      );
    }

    function nockCustomChangeWallet(): nock.Scope {
      return nock(bgUrl).get(`/api/v2/${coin.getChain()}/wallet/${customChangeWalletId}`).reply(200, {
        id: customChangeWalletId,
        keys: customChangeKeyIds,
        coin: coin.getChain(),
      });
    }

    afterEach(() => nock.cleanAll());

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

    describe('parseTransaction', function () {
      it('fetches custom change wallet keys and verifies signatures', async function () {
        const wallet = new Wallet(defaultBitGo, coin, {
          id: mainWalletId,
          keys: mainKeyIds,
          coin: coin.getChain(),
          coinSpecific: { customChangeWalletId },
          customChangeKeySignatures,
        });

        const nocks = [
          ...nockKeyFetch(mainKeyIds, rootWalletKeys),
          nockCustomChangeWallet(),
          ...nockKeyFetch(customChangeKeyIds, customChangeWalletKeys),
        ];

        const parsed = await coin.parseTransaction({
          txParams: { recipients: [{ address: externalAddress, amount: '3000' }] },
          txPrebuild: { txHex: utxolibPsbt.toHex(), decodeWith: sdkBackend },
          wallet: wallet as unknown as import('../../src').UtxoWallet,
        });

        for (const n of nocks) assert.ok(n.isDone());

        assert.ok(parsed.customChange);
        assert.strictEqual(parsed.customChange.keys.length, 3);
        for (let i = 0; i < 3; i++) {
          assert.strictEqual(parsed.customChange.keys[i].pub, customChangeWalletKeys.triple[i].neutered().toBase58());
        }

        assert.strictEqual(parsed.explicitExternalOutputs.length, 1);
        assert.strictEqual(parsed.explicitExternalOutputs[0].amount, '3000');
      });

      it('has no custom change when wallet lacks customChangeWalletId', async function () {
        const wallet = new Wallet(defaultBitGo, coin, {
          id: mainWalletId,
          keys: mainKeyIds,
          coin: coin.getChain(),
          coinSpecific: {},
        });

        const nocks = nockKeyFetch(mainKeyIds, rootWalletKeys);

        const parsed = await coin.parseTransaction({
          txParams: { recipients: [{ address: externalAddress, amount: '3000' }] },
          txPrebuild: { txHex: utxolibPsbt.toHex(), decodeWith: sdkBackend },
          wallet: wallet as unknown as import('../../src').UtxoWallet,
        });

        for (const n of nocks) assert.ok(n.isDone());

        assert.strictEqual(parsed.customChange, undefined);
        assert.strictEqual(parsed.needsCustomChangeKeySignatureVerification, false);
      });

      it('rejects invalid custom change key signatures', async function () {
        const wrongKey = BIP32.fromBase58(testutil.getWalletKeysForSeed('wrong').triple[0].toBase58());
        const badSignatures = Object.fromEntries(
          (['user', 'backup', 'bitgo'] as const).map((name, i) => [
            name,
            Buffer.from(
              message.signMessage(customChangeWalletKeys.triple[i].neutered().toBase58(), wrongKey.privateKey!)
            ).toString('hex'),
          ])
        ) as Record<'user' | 'backup' | 'bitgo', string>;

        const wallet = new Wallet(defaultBitGo, coin, {
          id: mainWalletId,
          keys: mainKeyIds,
          coin: coin.getChain(),
          coinSpecific: { customChangeWalletId },
          customChangeKeySignatures: badSignatures,
        });

        nockKeyFetch(mainKeyIds, rootWalletKeys);
        nockCustomChangeWallet();
        nockKeyFetch(customChangeKeyIds, customChangeWalletKeys);

        await assert.rejects(
          () =>
            coin.parseTransaction({
              txParams: { recipients: [{ address: externalAddress, amount: '3000' }] },
              txPrebuild: { txHex: utxolibPsbt.toHex(), decodeWith: sdkBackend },
              wallet: wallet as unknown as import('../../src').UtxoWallet,
            }),
          /failed to verify custom change .* key signature/
        );
      });
    });
  });
}

describeWithBackend('utxolib');
describeWithBackend('wasm-utxo');
