import { address as wasmAddress, fixedScriptWallet, isCoinName } from '@bitgo/wasm-utxo';

export type ZcashAddressKind = 'transparent' | 'shielded';

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
