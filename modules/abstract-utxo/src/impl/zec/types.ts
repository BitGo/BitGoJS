/** A Zcash coin name — the only UTXO coins with shielded (Orchard/Ironwood) support. */
export type ZcashCoinName = 'zec' | 'tzec';

/** How a Zcash Unified Address recipient should be resolved: to its shielded (Orchard/Ironwood) receiver or its transparent receiver. */
export type UnifiedRecipientPreference = 'shielded' | 'transparent';
