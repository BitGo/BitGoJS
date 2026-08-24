/** POST a GraphQL query and return its `data`, throwing on HTTP or GraphQL errors. */
export declare function gqlRequest<T>(url: string, query: string, variables?: Record<string, unknown>, clientId?: string): Promise<T>;
/**
 * Derive the payment (and stake, when present) key hashes from a bech32 address.
 * Wallet-keyed queries match on any supplied hash.
 */
export declare function ownerKeyHashes(address: string): string[];
//# sourceMappingURL=client.d.ts.map