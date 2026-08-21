import type { VaultDatumV1 } from "../../generated-types/v1_1_rc1/index.js";
export interface ISusdrExchangeRateInputs {
    circulatingSusdr: bigint;
    vaultUsdr: bigint;
    pendingYield: bigint;
    diffusionStartUnixMilli: bigint;
    diffusionEndUnixMilli: bigint;
}
export declare const SUSDR_EXCHANGE_RATE_PRECISION = 1000000n;
/**
 * Time-diffused yield — a verbatim TypeScript port of the on-chain helpers in
 * `contracts/lib/v1_1_rc1/utilities.ak`. Deposited staked yield does not hit
 * the exchange rate instantly; it releases linearly over a window so a large
 * deposit cannot be sniped by staking right before it and unstaking right
 * after. The SDK must reproduce this math exactly to build vault datums and
 * rate quotes the validators accept.
 *
 * All timestamps are absolute POSIX milliseconds, matching the on-chain datum
 * and the Plutus validity range (the ledger presents tx validity bounds to the
 * script in POSIX ms, not slots).
 */
/**
 * Maximum tx validity-range span (ms) tolerated while a diffusion window is
 * active. Mirrors `max_diffusion_rate_span` (utilities.ak). The validator
 * rejects a wider range so an interpolated rate can't be read from a stale,
 * far-future lower bound.
 */
export declare const MAX_DIFFUSION_RATE_SPAN_MS = 3600000n;
/**
 * USDr not yet diffused into the exchange rate at `atTimeMs`. Releases linearly
 * from `diffusion_start` (full `pending_yield`) to `diffusion_end` (zero),
 * rounded UP so settled backing is never overstated (conservative on unstake).
 *
 * Port of `pending_remaining` (utilities.ak:1082).
 */
export declare function pendingRemaining(vault: VaultDatumV1, atTimeMs: bigint): bigint;
/**
 * Settled backing — the USDr currently backing sUSDr — given the full vault
 * USDr balance and diffusion state at `atTimeMs`. Port of `settled_backing`
 * (utilities.ak:1099). When no window is active the whole balance is settled
 * and `atTimeMs` is irrelevant (matches the validator, which then requires no
 * validity bound).
 */
export declare function settledBacking(usdrBalance: bigint, vault: VaultDatumV1, atTimeMs: bigint): bigint;
/**
 * Diffusion-aware USDr-per-sUSDr exchange rate, scaled by `precision`.
 * Returns 1:1 when no sUSDr is circulating, matching the on-chain convention.
 */
export declare function calculateSusdrExchangeRate(inputs: ISusdrExchangeRateInputs, atTimeMs: bigint, precision?: bigint): bigint;
/**
 * The diffusion fields (`pending_yield`, `diffusion_start`, `diffusion_end`)
 * the vault output must carry after a deposit. Port of the field expectations
 * inside `validate_deposit_diffusion` (utilities.ak:1117).
 *
 * - Positive yield: the staked share rolls into `pending` on top of whatever
 *   hasn't diffused yet, and the window becomes `[nowMs, windowEndMs]`. If no
 *   window is requested (`windowEndMs <= 0`) and none is active, or the
 *   requested window has already elapsed by execution (`windowEndMs <= nowMs`),
 *   it collapses to instant `(0, 0, 0)`.
 * - Loss (negative yield): the window is frozen (carried over unchanged); the
 *   loss is recognised immediately rather than diffused.
 *
 * `windowEndMs` is the max `diffusion_end` across the batch's deposit requests
 * (`max_end` in deposit.ak); `nowMs` is the execution time (the tx validity
 * lower bound).
 */
export declare function nextDepositDiffusion(vaultIn: VaultDatumV1, stakedYieldShare: bigint, totalYield: bigint, windowEndMs: bigint, nowMs: bigint): {
    pending_yield: bigint;
    diffusion_start: bigint;
    diffusion_end: bigint;
};
//# sourceMappingURL=diffusion.d.ts.map