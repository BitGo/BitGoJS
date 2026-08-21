"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SUSDR_EXCHANGE_RATE_PRECISION = exports.MAX_DIFFUSION_RATE_SPAN_MS = void 0;
exports.calculateSusdrExchangeRate = calculateSusdrExchangeRate;
exports.nextDepositDiffusion = nextDepositDiffusion;
exports.pendingRemaining = pendingRemaining;
exports.settledBacking = settledBacking;
var SUSDR_EXCHANGE_RATE_PRECISION = exports.SUSDR_EXCHANGE_RATE_PRECISION = 1000000n;

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
var MAX_DIFFUSION_RATE_SPAN_MS = exports.MAX_DIFFUSION_RATE_SPAN_MS = 3600000n;

/**
 * USDr not yet diffused into the exchange rate at `atTimeMs`. Releases linearly
 * from `diffusion_start` (full `pending_yield`) to `diffusion_end` (zero),
 * rounded UP so settled backing is never overstated (conservative on unstake).
 *
 * Port of `pending_remaining` (utilities.ak:1082).
 */
function pendingRemaining(vault, atTimeMs) {
  var pending_yield = vault.pending_yield,
    diffusion_start = vault.diffusion_start,
    diffusion_end = vault.diffusion_end;
  if (pending_yield <= 0n || atTimeMs >= diffusion_end) {
    return 0n;
  }
  if (atTimeMs <= diffusion_start) {
    return pending_yield;
  }
  var span = diffusion_end - diffusion_start;
  // Round up: (a + span - 1) / span with BigInt truncating division.
  return (pending_yield * (diffusion_end - atTimeMs) + span - 1n) / span;
}

/**
 * Settled backing — the USDr currently backing sUSDr — given the full vault
 * USDr balance and diffusion state at `atTimeMs`. Port of `settled_backing`
 * (utilities.ak:1099). When no window is active the whole balance is settled
 * and `atTimeMs` is irrelevant (matches the validator, which then requires no
 * validity bound).
 */
function settledBacking(usdrBalance, vault, atTimeMs) {
  if (vault.pending_yield <= 0n) {
    return usdrBalance;
  }
  return usdrBalance - pendingRemaining(vault, atTimeMs);
}

/**
 * Diffusion-aware USDr-per-sUSDr exchange rate, scaled by `precision`.
 * Returns 1:1 when no sUSDr is circulating, matching the on-chain convention.
 */
function calculateSusdrExchangeRate(inputs, atTimeMs) {
  var precision = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : SUSDR_EXCHANGE_RATE_PRECISION;
  if (inputs.circulatingSusdr <= 0n) {
    return precision;
  }
  var vault = {
    circulating_susdr: inputs.circulatingSusdr,
    pending_yield: inputs.pendingYield,
    diffusion_start: inputs.diffusionStartUnixMilli,
    diffusion_end: inputs.diffusionEndUnixMilli
  };
  return settledBacking(inputs.vaultUsdr, vault, atTimeMs) * precision / inputs.circulatingSusdr;
}

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
function nextDepositDiffusion(vaultIn, stakedYieldShare, totalYield, windowEndMs, nowMs) {
  if (totalYield >= 0n) {
    if (vaultIn.pending_yield <= 0n && windowEndMs <= 0n) {
      return {
        pending_yield: 0n,
        diffusion_start: 0n,
        diffusion_end: 0n
      };
    }
    if (windowEndMs > nowMs) {
      return {
        pending_yield: pendingRemaining(vaultIn, nowMs) + stakedYieldShare,
        diffusion_start: nowMs,
        diffusion_end: windowEndMs
      };
    }
    return {
      pending_yield: 0n,
      diffusion_start: 0n,
      diffusion_end: 0n
    };
  }
  // Loss: freeze the existing window.
  return {
    pending_yield: vaultIn.pending_yield,
    diffusion_start: vaultIn.diffusion_start,
    diffusion_end: vaultIn.diffusion_end
  };
}
//# sourceMappingURL=diffusion.js.map