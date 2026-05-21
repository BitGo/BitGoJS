import 'mocha';
import assert from 'assert';

import * as testutils from '@bitgo/wasm-utxo/testutils';

import { signTransaction } from '../../../../src/transaction/signTransaction';
import type { UtxoWallet } from '../../../../src/wallet';
import { defaultBitGo, getUtxoCoin } from '../../util/utxoCoins';
import { getDefaultWalletKeys } from '../../util/keychains';

const { getDescriptorMap, mockPsbtDefaultWithDescriptorTemplate } = testutils.descriptor;

// Regression test for T1-3400. The descriptor sign guard previously
// only accepted utxo-lib PSBTs (UtxoLibPsbt) and Uint8Array, throwing
// `descriptor wallets require PSBT format transactions` when the
// decoded prebuild was a wasm-utxo BitGoPsbt — the default after
// defaultSdkBackend flipped to 'wasm-utxo' for all coins.
describe('signTransaction: descriptor wallet with BitGoPsbt prebuild (T1-3400)', function () {
  it('does not reject BitGoPsbt with the descriptor PSBT guard', async function () {
    const coin = getUtxoCoin('btc');
    const descriptorMap = getDescriptorMap('Wsh2Of3');
    const psbt = mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3');
    const psbtHex = Buffer.from(psbt.serialize()).toString('hex');

    const wallet = {
      coinSpecific: () => ({
        descriptors: [...descriptorMap.entries()].map(([name, descriptor]) => ({
          name,
          value: descriptor.toString(),
        })),
      }),
      keyIds: () => ['k0', 'k1', 'k2'],
    } as unknown as UtxoWallet;

    const userPrv = getDefaultWalletKeys().user.toBase58();

    let caught: Error | undefined;
    try {
      // decodeWith: 'wasm-utxo' forces decodeTransactionFromPrebuild to
      // return fixedScriptWallet.BitGoPsbt (the path that used to trip
      // the guard).
      await signTransaction(coin, defaultBitGo, {
        txPrebuild: { txHex: psbtHex, decodeWith: 'wasm-utxo' },
        prv: userPrv,
        wallet,
      } as any);
    } catch (e) {
      caught = e as Error;
    }

    assert.ok(
      !caught || !/descriptor wallets require PSBT format transactions/.test(caught.message),
      `descriptor sign guard incorrectly rejected BitGoPsbt: ${caught?.message}`
    );
  });
});
