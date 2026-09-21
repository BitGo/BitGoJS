import { address as wasmAddress, fixedScriptWallet, isCoinName, zcashAddress } from '@bitgo/wasm-utxo';
import type { UnifiedRecipientPreference } from '@bitgo/sdk-core';

import { AddressCodec } from '../../transaction/recipient';
import { UtxoCoinName, WasmUtxoCoinName } from '../../names';

import type { ZecAddressCodecOutput } from './types';

export type ZcashAddressKind = 'transparent' | 'shielded';

export interface ZecAddressCodecOptions {
  /**
   * Resolve an address that does not carry the preferred receiver via its other receiver
   * instead of throwing.
   *
   * Only the transaction-verification codec sets this (see `Zec.parseTransaction`). Output
   * comparison resolves both the requested recipients and the transaction's actual outputs
   * through `decode`, and an actual output legitimately need not match the preference: a
   * shielded transaction can carry a transparent pay-as-you-go output, and a tampered
   * prebuild can carry a transparent output where a shielded one was requested. Both must
   * resolve to the bytes they pay so they surface as an output difference
   * (TxIntentMismatchError in verifyTransaction) — or as an allowed implicit external output —
   * rather than aborting verification with a decode error.
   *
   * This never relaxes what the caller asked for: `Zec.parseTransaction` validates every
   * requested recipient against the preference with a strict codec first, so the fallback can
   * only ever apply to an actual transaction output.
   */
  resolveOtherReceiverType?: boolean;
}

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
  /** See `ZecAddressCodecOptions.resolveOtherReceiverType`. */
  private readonly resolveOtherReceiverType: boolean;

  constructor(
    coinName: UtxoCoinName,
    wasmName: WasmUtxoCoinName,
    unifiedRecipientPreference: UnifiedRecipientPreference = 'transparent',
    options: ZecAddressCodecOptions = {}
  ) {
    super(coinName, wasmName);
    this.zcashNetworkName = wasmName as fixedScriptWallet.ZcashNetworkName;
    this.unifiedRecipientPreference = unifiedRecipientPreference;
    this.resolveOtherReceiverType = options.resolveOtherReceiverType ?? false;
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
   *
   * With `resolveOtherReceiverType` an address that does not carry the preferred receiver
   * resolves via its other receiver instead of throwing; the preference-bound error is still
   * what surfaces when the address carries neither. See the option's doc for why only the
   * transaction-verification codec sets it.
   *
   * Note the trade-off the fallback makes: within a single dual-receiver Unified Address, a
   * payment moved between its own transparent and Orchard receivers resolves identically
   * under either preference, so output comparison cannot see the substitution. Both receivers
   * belong to the address the caller supplied, so this is not a theft vector, but it does mean
   * a shielded payment can be settled transparently (or the reverse) without verification
   * objecting. Detecting it would require comparing against each output's raw script, which
   * the shared output shape does not carry.
   */
  override decode(address: string): Uint8Array {
    try {
      return this.decodePreferredReceiver(address);
    } catch (preferredReceiverError) {
      if (this.resolveOtherReceiverType) {
        try {
          return this.decodeOtherReceiver(address);
        } catch {
          // carries neither receiver type — report the preference-bound reason below
        }
      }
      throw preferredReceiverError;
    }
  }

  /** Resolve `address` under this codec's unified-recipient preference. */
  private decodePreferredReceiver(address: string): Uint8Array {
    if (this.unifiedRecipientPreference !== 'shielded') {
      return zcashAddress.toTransparentReceiverWithCoin(address, this.wasmName);
    }
    // The raw Orchard receiver exists only for a Unified Address carrying one. Distinguish a
    // perfectly valid transparent address — which simply has no Orchard receiver — from a
    // malformed or wrong-network address, so callers see the accurate reason instead of a
    // misleading "invalid address" for a valid address. `hasTransparentReceiver` never throws
    // and is network-aware, so a wrong-network transparent address still reports as invalid.
    let unified: fixedScriptWallet.ZcashUnifiedAddress | undefined;
    try {
      unified = fixedScriptWallet.ZcashUnifiedAddress.parse(address, this.zcashNetworkName);
    } catch {
      if (zcashAddress.hasTransparentReceiver(address, this.wasmName)) {
        throw new Error(`address ${address} has no Orchard receiver to resolve as shielded`);
      }
      throw new Error(`address ${address} is not a valid address for network ${this.zcashNetworkName}`);
    }
    if (!unified?.hasOrchardReceiver) {
      throw new Error(`address ${address} has no Orchard receiver to resolve as shielded`);
    }
    return zcashAddress.toShieldedReceiverWithCoin(address, this.wasmName);
  }

  /** Resolve `address` under the receiver type this codec's preference does not name. */
  private decodeOtherReceiver(address: string): Uint8Array {
    return this.unifiedRecipientPreference === 'shielded'
      ? zcashAddress.toTransparentReceiverWithCoin(address, this.wasmName)
      : zcashAddress.toShieldedReceiverWithCoin(address, this.wasmName);
  }

  /** Change addresses are always transparent wallet addresses. */
  override decodeChangeAddress(address: string): Uint8Array {
    return zcashAddress.toTransparentReceiverWithCoin(address, this.wasmName);
  }
  override isMatchingScript(output: ZecAddressCodecOutput): boolean {
    const address = output.address;
    if (address === undefined || address === null) {
      return true;
    }
    if (AddressCodec.isScriptRecipient(address)) {
      return super.isMatchingScript(output);
    }

    const matchesOutput = (decode: () => Uint8Array): boolean => {
      try {
        return Buffer.from(decode()).equals(Buffer.from(output.script));
      } catch {
        return false;
      }
    };
    const isShielded = output.isShielded;
    if (isShielded === true) {
      return matchesOutput(() => zcashAddress.toShieldedReceiverWithCoin(address, this.wasmName));
    }
    if (isShielded === false) {
      return matchesOutput(() => zcashAddress.toTransparentReceiverWithCoin(address, this.wasmName));
    }
    return (
      matchesOutput(() => zcashAddress.toTransparentReceiverWithCoin(address, this.wasmName)) ||
      matchesOutput(() => zcashAddress.toShieldedReceiverWithCoin(address, this.wasmName))
    );
  }

  /** Preserve a shielded output's original UA only after validating it against the raw script. */
  override toExtendedAddressFormat(script: Buffer, address?: string): string {
    if (address !== undefined && !this.isMatchingScript({ address, script })) {
      throw new Error(`address ${address} does not match the output script`);
    }
    return address ?? super.toExtendedAddressFormat(script);
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
