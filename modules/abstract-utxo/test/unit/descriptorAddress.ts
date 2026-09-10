import * as assert from 'node:assert';

import { address as wasmAddress, CoinName } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';
import { IWallet, WalletCoinSpecific } from '@bitgo/sdk-core';

import { descriptor as utxod } from '../../src';
import { Tbtc } from '../../src/impl/btc';
import type { WasmUtxoCoinName } from '../../src/names';

import { defaultBitGo, getUtxoCoin } from './util';

export function getDescriptorAddress(d: string, index: number, coinName: CoinName): string {
  const derivedScript = utxod.Descriptor.fromString(d, 'derivable').atDerivationIndex(index).scriptPubkey();
  return wasmAddress.fromOutputScriptWithCoin(derivedScript, coinName);
}

class RegtestTbtc extends Tbtc {
  constructor() {
    super(defaultBitGo);
  }

  override get wasmName(): WasmUtxoCoinName {
    return 'tbtcreg';
  }
}

describe('descriptor wallets', function () {
  const coin = getUtxoCoin('tbtc');
  const xpubs = testutils.getKeyTriple('setec astronomy').map((k) => k.neutered().toBase58());

  function withChecksum(descriptor: string): string {
    return utxod.Descriptor.fromString(descriptor, 'derivable').toString();
  }

  function getNamedDescriptor2Of2(name: string, a: string, b: string): utxod.NamedDescriptor {
    return {
      name,
      value: withChecksum(`sh(multi(2,${a}/*,${b}/*))`),
      signatures: [],
    };
  }

  function getIWalletWithDescriptors(descriptors: utxod.NamedDescriptor[]): IWallet {
    return {
      coinSpecific() {
        return { descriptors } as unknown as WalletCoinSpecific;
      },
    } as IWallet;
  }

  const descFoo = getNamedDescriptor2Of2('foo', xpubs[0], xpubs[1]);
  const descBar = getNamedDescriptor2Of2('bar', xpubs[1], xpubs[0]);
  const addressFoo0 = getDescriptorAddress(descFoo.value, 0, coin.wasmName);
  const addressFoo1 = getDescriptorAddress(descFoo.value, 1, coin.wasmName);
  const addressBar0 = getDescriptorAddress(descBar.value, 0, coin.wasmName);

  it('has expected values', function () {
    assert.deepStrictEqual(
      [addressFoo0, addressFoo1, addressBar0],
      [
        '2N9b1trWxMJN16mTzGJypFn6pEWfXtgh689',
        '2N1YFzj4ECzcjuruaEvSzGaGGH1topMXMXZ',
        '2N9oN5Kc2fLt2MrxEkuQPsy8Fg2KdrFfeKH',
      ]
    );
  });

  function runTestIsAddress(
    address: string,
    index: number,
    descriptorName: string,
    descriptorChecksum: string,
    expected: true | Error | RegExp
  ) {
    it(`should return ${expected} for address ${address} with index ${index} and descriptor ${descriptorName} with checksum ${descriptorChecksum}`, async function () {
      const wallet = getIWalletWithDescriptors([descFoo, descBar]);
      async function f() {
        return coin.isWalletAddress(
          {
            address,
            index,
            coinSpecific: { descriptorName, descriptorChecksum },
            keychains: xpubs.map((pub) => ({ pub })),
          },
          wallet
        );
      }
      if (expected === true) {
        assert.equal(await f(), expected);
      } else {
        // because isWalletAddress is stupid it actually throws instead of returning false
        await assert.rejects(f, expected);
      }
    });
  }

  runTestIsAddress(addressFoo0, 0, 'foo', descFoo.value.slice(-8), true);
  runTestIsAddress(addressFoo1, 0, 'foo', descFoo.value.slice(-8), /Address mismatch for descriptor/);
  runTestIsAddress(addressBar0, 0, 'bar', descFoo.value.slice(-8), /Descriptor checksum mismatch/);
  runTestIsAddress(addressFoo0, 0, 'bar', descBar.value.slice(-8), /Address mismatch for descriptor/);

  it('uses the coin address codec for descriptor wallet addresses', async function () {
    const regtestCoin = new RegtestTbtc();
    const address = getDescriptorAddress(descFoo.value, 0, regtestCoin.wasmName);
    const wallet = getIWalletWithDescriptors([descFoo, descBar]);

    assert.strictEqual(
      await regtestCoin.isWalletAddress(
        {
          address,
          index: 0,
          coinSpecific: { descriptorName: 'foo', descriptorChecksum: descFoo.value.slice(-8) },
          keychains: xpubs.map((pub) => ({ pub })),
        },
        wallet
      ),
      true
    );
  });
});
