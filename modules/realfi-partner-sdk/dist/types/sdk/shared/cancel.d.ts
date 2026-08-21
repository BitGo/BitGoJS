import type { Core } from "@blaze-cardano/sdk";
import type { TMultisigScript, TProtocolVersion } from "./types.js";
/**
 * Parse an order owner for cancel flows.
 *
 * Behavior:
 * - no version hint: use strict generic owner parsing immediately
 * - with version hint: try the hinted schema first
 * - hinted parse failure: fall back to strict generic owner parsing
 */
export declare function parseCancelOwner(utxo: Core.TransactionUnspentOutput, versionHint?: TProtocolVersion): Promise<TMultisigScript>;
export declare const parseOrderOwnerWithHint: typeof parseCancelOwner;
//# sourceMappingURL=cancel.d.ts.map