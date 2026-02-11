import assert from 'assert';

import * as testutils from '@bitgo/wasm-utxo/testutils';
import { Wallet } from '@bitgo/sdk-core';

import { constructPsbt, getWalletAddress, getUtxoCoin, defaultBitGo, nockBitGo, nockWalletKeys } from './util';

describe('Transaction Spoofability Tests', function () {
  const coin = getUtxoCoin('tbtc');

  describe('Unspent management spoofability - Consolidation (BUILD_SIGN_SEND)', function () {
    it('should detect spoofed consolidation to attacker address', async function (): Promise<void> {
      const keyTriple = testutils.getKeyTriple('default');
      const walletKeys = testutils.getDefaultWalletKeys();
      const attackerKeys = testutils.getWalletKeysForSeed('attacker');

      const wallet = new Wallet(defaultBitGo, coin, {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: ['user', 'backup', 'bitgo'],
      });

      // The attacker replaces the legitimate wallet address with their own
      const attackerAddress = getWalletAddress('tbtc', attackerKeys);
      const spoofedPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: attackerAddress, value: BigInt(9000) }],
        'tbtc',
        walletKeys // Input uses wallet keys (the funds being stolen)
      );
      const spoofedHex: string = Buffer.from(spoofedPsbt.serialize()).toString('hex');

      nockBitGo()
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`)
        .reply(200, { txHex: spoofedHex, consolidateId: 'test' });

      nockBitGo()
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reply((requestBody: any) => {
          if (requestBody?.txHex === spoofedHex) {
            throw new Error('Spoofed transaction was sent: spoofing protection failed');
          }
          return [200, { txid: 'test-txid-123', status: 'signed' }];
        });

      nockWalletKeys(wallet, keyTriple, 'pass');

      await assert.rejects(
        wallet.consolidateUnspents({ walletPassphrase: 'pass' }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) =>
          typeof e?.message === 'string' &&
          e.message.includes('prebuild attempts to spend to unintended external recipients')
      );
    });
  });

  describe('Unspent management spoofability - Fanout (BUILD_SIGN_SEND)', function () {
    it('should detect spoofed fanout to attacker address', async function (): Promise<void> {
      const keyTriple = testutils.getKeyTriple('default');
      const walletKeys = testutils.getDefaultWalletKeys();
      const attackerKeys = testutils.getWalletKeysForSeed('attacker');

      const wallet = new Wallet(defaultBitGo, coin, {
        id: '5b34252f1bf349930e34020a',
        coin: 'tbtc',
        keys: ['user', 'backup', 'bitgo'],
      });

      // The attacker replaces the legitimate wallet address with their own
      const attackerAddress = getWalletAddress('tbtc', attackerKeys);
      const spoofedPsbt = constructPsbt(
        [{ scriptType: 'p2wsh' as const, value: BigInt(10000) }],
        [{ address: attackerAddress, value: BigInt(9000) }],
        'tbtc',
        walletKeys // Input uses wallet keys (the funds being stolen)
      );
      const spoofedHex: string = Buffer.from(spoofedPsbt.serialize()).toString('hex');

      nockBitGo()
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/fanoutUnspents`)
        .reply(200, { txHex: spoofedHex, fanoutId: 'test' });

      nockBitGo()
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reply((requestBody: any) => {
          if (requestBody?.txHex === spoofedHex) {
            throw new Error('Spoofed transaction was sent: spoofing protection failed');
          }
          return [200, { txid: 'test-txid-123', status: 'signed' }];
        });

      nockWalletKeys(wallet, keyTriple, 'pass');

      await assert.rejects(
        wallet.fanoutUnspents({ walletPassphrase: 'pass' }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) =>
          typeof e?.message === 'string' &&
          e.message.includes('prebuild attempts to spend to unintended external recipients')
      );
    });
  });
});
