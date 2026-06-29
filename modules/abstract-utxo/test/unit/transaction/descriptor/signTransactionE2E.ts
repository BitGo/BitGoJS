import 'mocha';
import assert from 'assert';

import { Psbt } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import type { UtxoWallet } from '../../../../src/wallet';
import { getUtxoCoin } from '../../util/utxoCoins';
import { nockBitGo } from '../../util/nockBitGo';

const { getDescriptorMap, mockPsbtDefaultWithDescriptorTemplate } = testutils.descriptor;
const { getKeyTriple } = testutils;

// End-to-end coverage for descriptor wallet signing through the
// top-level coin.signTransaction entry point (T1-3401). Locks in the
// wasm-utxo decode path that T1-3400 broke.
describe('signTransaction E2E: descriptor wallet (wasm-utxo backend)', function () {
  it('produces a signed PSBT with valid user signatures on every input', async function () {
    const coin = getUtxoCoin('btc');
    // mockPsbtDefaultWithDescriptorTemplate uses getDefaultXPubs('a') —
    // i.e. getKeyTriple('a') — so we sign with the same triple.
    const keychain = getKeyTriple('a');
    const userKey = keychain[0];
    const descriptorMap = getDescriptorMap('Wsh2Of3', keychain);

    const unsignedPsbt = mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3');
    const psbtHex = Buffer.from(unsignedPsbt.serialize()).toString('hex');

    const keyIds = ['kU', 'kB', 'kG'];
    const wallet = {
      coinSpecific: () => ({
        descriptors: [...descriptorMap.entries()].map(([name, descriptor]) => ({
          name,
          value: descriptor.toString(),
        })),
      }),
      keyIds: () => keyIds,
    } as unknown as UtxoWallet;

    // Mock the keychain fetch — fetchKeychains pulls each key by id.
    keyIds.forEach((id, i) => {
      nockBitGo().get(`/api/v2/${coin.getChain()}/key/${id}`).reply(200, { pub: keychain[i].neutered().toBase58() });
    });

    // decodeWith: 'wasm-utxo' is explicit to lock in the BitGoPsbt
    // decode path that T1-3400 broke; this is also the production
    // default after 1702a08009.
    const result = await coin.signTransaction({
      txPrebuild: { txHex: psbtHex, decodeWith: 'wasm-utxo' },
      prv: userKey.toBase58(),
      wallet,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    assert.ok('txHex' in result, 'expected signTransaction to return { txHex }');
    const signedPsbt = Psbt.deserialize(Buffer.from(result.txHex, 'hex'));

    const inputs = signedPsbt.getInputs();
    assert.ok(inputs.length > 0, 'expected at least one input');
    inputs.forEach((_input, vin) => {
      assert.ok(signedPsbt.hasPartialSignatures(vin), `input ${vin} has no partial signatures`);
      const sigs = signedPsbt.getPartialSignatures(vin);
      assert.ok(sigs.length > 0, `input ${vin} returned empty partial signatures`);
      // Pubkeys in partial sigs are the descriptor-derived child keys, not
      // the user master pubkey; assert that each sig validates at its claimed
      // pubkey, which is the strongest "signing actually worked" check.
      for (const sig of sigs) {
        assert.ok(
          signedPsbt.validateSignatureAtInput(vin, sig.pubkey),
          `input ${vin} has an invalid signature for pubkey ${Buffer.from(sig.pubkey).toString('hex')}`
        );
      }
    });
  });
});
