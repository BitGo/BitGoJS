import { bip32, Descriptor } from '@bitgo/wasm-utxo';

import { createSbtcDepositDescriptor, SbtcDepositDescriptorParams } from './descriptor';

type BIP32Interface = bip32.BIP32Interface;

/**
 * Compile the sBTC deposit Taproot scriptPubKey.
 *
 * If `params.walletKeys` contains BIP32 xpubs, the descriptor is derivable and
 * `derivationIndex` selects which child keys go into the reclaim leaf. If
 * `params.walletKeys` contains raw 32-byte x-only Buffers, the descriptor is
 * definite and `derivationIndex` is ignored.
 *
 * We can't use `Descriptor.fromStringDetectType()` here: that path doesn't
 * enable the `drop` ExtParams flag, so it rejects `r:older` and `payload_drop`
 * fragments. We branch on the input shape instead — that's the same signal
 * the descriptor library would use, just observable to us before parsing.
 */
export function createSbtcDepositScriptPubKey(params: SbtcDepositDescriptorParams, derivationIndex = 0): Buffer {
  const descString = createSbtcDepositDescriptor(params);
  const isDefinite = params.walletKeys.every(Buffer.isBuffer);
  if (isDefinite) {
    return Buffer.from(Descriptor.fromString(descString, 'definite').scriptPubkey());
  }
  const desc = Descriptor.fromString(descString, 'derivable');
  return Buffer.from(desc.atDerivationIndex(derivationIndex).scriptPubkey());
}

/**
 * Derive the three concrete x-only reclaim pubkeys at the given derivation
 * index from a triple of BIP32 xpubs.
 *
 * The descriptor library performs this derivation internally when computing
 * `scriptPubkey()`; this helper exposes the same derivation for callers that
 * need the keys directly (e.g., constructing a witness for the reclaim leaf).
 */
export function deriveReclaimKeys(
  walletKeys: [BIP32Interface, BIP32Interface, BIP32Interface],
  index: number
): [Buffer, Buffer, Buffer] {
  const [k1, k2, k3] = walletKeys.map((k) => {
    const child = k.derive(index);
    return Buffer.from(child.publicKey.subarray(1));
  });
  return [k1, k2, k3];
}
