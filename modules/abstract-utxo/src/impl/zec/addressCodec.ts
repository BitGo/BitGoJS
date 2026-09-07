import { fixedScriptWallet, zcashAddress as wasmZcashAddress } from '@bitgo/wasm-utxo';

import { AddressCodec, type UnifiedRecipientPreference } from '../../transaction/recipient';

/**
 * Parse `address` as a ZIP-316 Unified Address for `network`, or return `undefined` if it isn't
 * one (malformed, wrong network, or not bech32m-shaped at all).
 */
export function tryParseUnifiedAddress(
  address: string,
  network: 'zec' | 'tzec'
): fixedScriptWallet.ZcashUnifiedAddress | undefined {
  try {
    return fixedScriptWallet.ZcashUnifiedAddress.parse(address, network);
  } catch (e) {
    return undefined;
  }
}

export class ZcashAddressCodec extends AddressCodec {
  constructor(coinName: 'zec' | 'tzec', private readonly unifiedRecipientPreference?: UnifiedRecipientPreference) {
    super(coinName);
  }

  override decode(address: string): Uint8Array {
    if (
      this.unifiedRecipientPreference === 'shielded' &&
      tryParseUnifiedAddress(address, this.coinName as 'zec' | 'tzec')
    ) {
      return wasmZcashAddress.toShieldedReceiverWithCoin(address, this.coinName);
    }
    return wasmZcashAddress.toTransparentReceiverWithCoin(address, this.coinName);
  }
}
