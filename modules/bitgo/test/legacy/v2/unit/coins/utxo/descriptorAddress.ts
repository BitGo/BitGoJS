import * as assert from 'node:assert';

import { TestBitGo } from '@bitgo/sdk-test';
import { AbstractUtxoCoin, descriptor as utxod } from '@bitgo/abstract-utxo';
import * as utxolib from '@bitgo/utxo-lib';
import { IWallet, WalletCoinSpecific } from '@bitgo/sdk-core';

import { BitGo } from '../../../../../../src';

export function getDescriptorAddress(d: string, index: number, network: utxolib.Network): string {
  const derivedScript = Buffer.from(
    utxod.Descriptor.fromString(d, 'derivable').atDerivationIndex(index).scriptPubkey()
  );
  return utxolib.address.fromOutputScript(derivedScript, network);
}

describe('descriptor wallets', function () {
  const bitgo: BitGo = TestBitGo.decorate(BitGo, { env: 'mock' });
  const coin = bitgo.coin('tbtc') as AbstractUtxoCoin;
  const xpubs = utxolib.testutil.getKeyTriple('setec astronomy').map((k) => k.neutered().toBase58());

  function withChecksum(descriptor: string): string {
    return utxod.Descriptor.fromString(descriptor, 'derivable').toString();
  }

  function getNamedDescriptor2Of2(name: string, a: string, b: string): utxod.NamedDescriptor {
    return {
      name,
      value: withChecksum(`sh(multi(2,${a}/*,${b}/*))`),
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
  const addressFoo0 = getDescriptorAddress(descFoo.value, 0, coin.network);
  const addressFoo1 = getDescriptorAddress(descFoo.value, 1, coin.network);
  const addressBar0 = getDescriptorAddress(descBar.value, 0, coin.network);

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
        return coin.isWalletAddress({ address, index, coinSpecific: { descriptorName, descriptorChecksum } }, wallet);
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
});
