import type { AddressCodecOutput } from '../../transaction/recipient';

/** A Zcash coin name — the only UTXO coins with shielded (Orchard/Ironwood) support. */
export type ZcashCoinName = 'zec' | 'tzec';

/** Parsed output metadata used to distinguish Zcash transparent and shielded receivers. */
export interface ZecAddressCodecOutput extends AddressCodecOutput {
  isShielded?: boolean;
}
