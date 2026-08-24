import type { Provider } from "@blaze-cardano/query";
import { Core } from "@blaze-cardano/sdk";

/**
 * The slot/time conversions a slot-alignment needs. Structural (rather than the
 * `Provider` class) so callers can pass any provider — Blockfrost, Kupmios,
 * `EmulatorProvider` — and tests can pass a plain object with a known slot
 * config. Note that `Emulator` (the clock, not its provider) also satisfies this
 * shape while rounding the other way; {@link slotFloor} handles both.
 */
export type TSlotClock = Pick<Provider, "unixToSlot" | "slotToUnix">;

/**
 * The integer slot that contains `timeMs`: the latest slot that has already
 * started at `timeMs`.
 *
 * `provider.unixToSlot` does **not** floor — it returns
 * `(ms - zeroTime) / slotLength + zeroSlot`, so for any wall-clock time that is
 * not exactly on a slot boundary it yields a **fractional** slot. Two things
 * then go wrong if that value is used as-is:
 *
 * 1. A tx body stores `invalid_before` / `invalid_hereafter` as **integer**
 *    slots, and the CBOR writer silently truncates the fraction. The value the
 *    validator reads is therefore not the value the SDK computed with.
 * 2. The round-trip `slotToUnix(unixToSlot(t))` — the natural way to express
 *    "snap `t` to its slot" — is the *identity* on `t`, not an alignment.
 *
 * That combination cost us a crashed windowed deposit on preview: the vault
 * output's `diffusion_start` kept the sub-slot remainder while the tx's validity
 * lower bound was floored, so `validate_deposit_diffusion`'s
 * `diffusion_start == now` check failed by that remainder (REALFI-653). The
 * emulator hid it because the clock injected in tests is already slot-aligned —
 * not because of any provider difference: `EmulatorProvider` extends the same
 * `Provider` base and returns the same fractional slots.
 *
 * Flooring alone would not be enough for a clock that ROUNDS UP: `Emulator`
 * itself (as opposed to the `EmulatorProvider` Blaze hands the SDK) implements
 * `unixToSlot` with `Math.ceil`, and being structural, `TSlotClock` accepts it.
 * Flooring a ceiled slot is a no-op, which would hand back a slot that has not
 * started yet. So the candidate is checked against its own start time and walked
 * back when it overshoots — a branch no real provider ever takes, and the reason
 * the contract above holds for *any* clock rather than only the fractional ones.
 *
 * **Audit invariant:** `unixToSlot` must not be called anywhere else in the SDK.
 * `rg 'unixToSlot' src/` matching only this file *is* the audit — keep it that
 * way so a future time→slot conversion cannot reintroduce the bug.
 */
export function slotFloor(
  clock: TSlotClock,
  timeMs: bigint | number,
): Core.Slot {
  const candidate = Math.floor(Number(clock.unixToSlot(timeMs)));
  const overshoots =
    Number(clock.slotToUnix(Core.Slot(candidate))) > Number(timeMs);
  return Core.Slot(overshoots ? candidate - 1 : candidate);
}

/**
 * `timeMs` snapped back to the start of its slot, as POSIX ms — exactly the
 * "now" a validator reads from a tx whose validity bound is
 * `slotFloor(clock, timeMs)`. Use this for any timestamp that has to equal a
 * validity bound on-chain (a diffusion window's `diffusion_start`, a rate quote
 * time), so the datum and the tx body cannot disagree.
 *
 * Idempotent — aligning an already-aligned time is a no-op — so a time derived
 * from an aligned one (a backoff, a forward window) can be aligned again safely.
 */
export function slotAlignedTimeMs(
  clock: TSlotClock,
  timeMs: bigint | number,
): bigint {
  return BigInt(clock.slotToUnix(slotFloor(clock, timeMs)));
}
