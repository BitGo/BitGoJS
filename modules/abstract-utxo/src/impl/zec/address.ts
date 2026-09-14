import { address as wasmAddress, fixedScriptWallet, isCoinName, zcashAddress } from '@bitgo/wasm-utxo';
import type { UnifiedRecipientPreference } from '@bitgo/sdk-core';

import { AddressCodec } from '../../transaction/recipient';
import { UtxoCoinName, WasmUtxoCoinName } from '../../names';

export type ZcashAddressKind = 'transparent' | 'shielded';

/**
 * Address codec for Zcash coins ('zec'/'tzec') that understands ZIP-316
 * Unified Addresses in addition to ordinary transparent addresses.
 *
 * - `decode` resolves the bytes a recipient pays to (see its doc): by default
 *   the transparent scriptPubKey; with `unifiedRecipientPreference: 'shielded'`
 *   the raw Orchard/Ironwood receiver of a Unified Address.
 * - `encode`/`toExtendedAddressFormat` are unchanged: scripts can only be
 *   written back out as transparent addresses.
 * - `isValidAddress` accepts transparent addresses and Unified Addresses with
 *   a transparent or Orchard receiver.
 */
export class ZecAddressCodec extends AddressCodec {
  /** The Zcash network name for wasm calls — 'zec' or 'tzec'. */
  private readonly zcashNetworkName: fixedScriptWallet.ZcashNetworkName;
  /** How Unified Address recipients resolve when this codec decodes them. */
  private readonly unifiedRecipientPreference: UnifiedRecipientPreference;

  constructor(
    coinName: UtxoCoinName,
    wasmName: WasmUtxoCoinName,
    unifiedRecipientPreference: UnifiedRecipientPreference = 'transparent'
  ) {
    super(coinName, wasmName);
    this.zcashNetworkName = wasmName as fixedScriptWallet.ZcashNetworkName;
    this.unifiedRecipientPreference = unifiedRecipientPreference;
  }

  /**
   * Whether `address` is a valid Zcash address for this coin's network.
   *
   * Mirrors the pre-codec `Zec.isValidAddress` logic exactly: the address is
   * valid iff it has a usable transparent receiver (an ordinary transparent
   * address, or a UA carrying a transparent receiver) or an Orchard receiver
   * (a UA carrying one).
   */
  override isValidAddress(address: string): boolean {
    return (
      zcashAddress.hasTransparentReceiver(address, this.wasmName) ||
      zcashAddress.hasOrchardReceiver(address, this.wasmName)
    );
  }

  /**
   * Resolve `address` to the bytes this codec's unified-recipient preference pays to.
   *
   * - `'transparent'` (default) resolves the scriptPubKey: an ordinary
   *   transparent address decodes to its own script, and a UA with a
   *   transparent receiver decodes to that receiver's script. A UA without a
   *   transparent receiver (e.g. Orchard-only) throws, since a shielded
   *   output has no script.
   * - `'shielded'` resolves the raw Orchard (Ironwood) receiver — the
   *   43-byte diversifier + `pk_d` — of a UA carrying one. Any other address
   *   (plain transparent, transparent-only UA, malformed, wrong network)
   *   throws, since it has no Orchard receiver to resolve.
   */
  override decode(address: string): Uint8Array {
    if (this.unifiedRecipientPreference !== 'shielded') {
      return zcashAddress.toTransparentReceiverWithCoin(address, this.wasmName);
    }
    // The raw Orchard receiver exists only for a Unified Address carrying one; anything else
    // (plain transparent address, transparent-only UA, malformed, wrong network) throws.
    let unified: fixedScriptWallet.ZcashUnifiedAddress | undefined;
    try {
      unified = fixedScriptWallet.ZcashUnifiedAddress.parse(address, this.zcashNetworkName);
    } catch {
      throw new Error(`address ${address} is not a valid address for network ${this.zcashNetworkName}`);
    }
    if (!unified?.hasOrchardReceiver) {
      throw new Error(`address ${address} has no Orchard receiver to resolve as shielded`);
    }
    return zcashAddress.toShieldedReceiverWithCoin(address, this.wasmName);
  }
}

/**
 * Whether `address` is a well-formed ZIP-316 Unified Address for `network`
 * with an Orchard receiver. BitGo only supports Orchard, so a UA without one
 * (e.g. Sapling- or transparent-only) is not considered valid here.
 */
export function isShieldedZcashAddress(address: string, network: fixedScriptWallet.ZcashNetworkName): boolean {
  try {
    return fixedScriptWallet.ZcashUnifiedAddress.parse(address, network).hasOrchardReceiver;
  } catch {
    return false;
  }
}

/**
 * Classify a Zcash address string as transparent or shielded, validating it in
 * the process. Returns undefined if the address is neither a valid transparent
 * address nor a well-formed ZIP-316 Unified Address for `network`.
 */
export function getZcashAddressKind(
  address: string,
  network: fixedScriptWallet.ZcashNetworkName
): ZcashAddressKind | undefined {
  // ZcashNetworkName also permits 'zcash'/'zcashTest', which toOutputScriptWithCoin
  // doesn't accept (it takes a CoinName, i.e. 'zec'/'tzec'). Skip straight to the
  // shielded check for those rather than relying on an unsafe cast + caught throw.
  if (isCoinName(network)) {
    try {
      wasmAddress.toOutputScriptWithCoin(address, network);
      return 'transparent';
    } catch {
      // not a valid transparent address; fall through to shielded check
    }
  }
  return isShieldedZcashAddress(address, network) ? 'shielded' : undefined;
}

/**
 * Standalone counterpart to `Zec.isValidAddress`, parameterized by `network`
 * instead of requiring a coin instance. Accepts transparent addresses and
 * shielded ZIP-316 Unified Addresses.
 *
 * Not structurally identical to `Zec.isValidAddress`: the base class also
 * round-trips the parsed script through each known encoding format (see
 * `AbstractUtxoCoin.isValidAddress`), whereas this only calls
 * `toOutputScriptWithCoin` once via `getZcashAddressKind`. They agree in
 * practice since zec/tzec have no alternate transparent-address encoding to
 * round-trip against, but that's not guaranteed to remain true.
 */
export function isValidZcashAddress(address: string, network: fixedScriptWallet.ZcashNetworkName): boolean {
  return getZcashAddressKind(address, network) !== undefined;
}
