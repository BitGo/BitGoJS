import { BitGoBase } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

/**
 * Pearl (Duplex) is a taproot-only UTXO chain, a btcd fork using BIP-340 Schnorr
 * signatures and BIP-341 script-path spending with a NUMS internal key.
 *
 * Unlike the other utxo coins, Pearl has no `@bitgo/utxo-lib` network registration -
 * it is served entirely through `@bitgo/wasm-utxo`. No script type override is needed
 * here: `supportsAddressType` delegates to `fixedScriptWallet.supportsScriptType`,
 * which already reports only p2tr and p2trMusig2 for this coin.
 */
export class Pearl extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'pearl';

  static createInstance(bitgo: BitGoBase): Pearl {
    return new Pearl(bitgo);
  }
}
