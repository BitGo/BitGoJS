/**
 * Static, off-chain mirror of the per-request predicates the v1-family
 * protocol validators apply to each request in an execution batch.
 *
 * Why this exists (WTB-1764): `process_exchange_requests`,
 * `process_stake_requests` and `process_treasury_requests`
 * (`contracts/lib/v1_0/utilities.ak`) validate every request in the batch
 * inside one `zip_fold` via `expect validation(request)`. There is no
 * per-request graceful exclusion — the first request that fails its predicate
 * crashes the WHOLE execution transaction, taking down every valid order
 * bundled alongside it. Order creation is permissionless and has no on-chain
 * gate (sending funds + an inline datum to the order script address is a plain
 * payment; no validator runs on receipt), so a single order carrying, say,
 * `min_received = 0` is a cheap, repeatable denial-of-service against the whole
 * execution pipeline.
 *
 * Every request that reaches a batch must therefore be screened off-chain
 * first. This module is the one place that mirrors the on-chain predicates, so
 * a validator change has a single off-chain counterpart to update.
 *
 * Two screens live here, because the validators abort the whole transaction from
 * two kinds of check and only one of them is answerable from the datum alone:
 *
 * 1. {@link screenOrderAction} — the `process_*_requests` per-request predicates.
 *    Pure, datum-only.
 * 2. {@link screenOrderUtxoFacts} — the checks that also need the order UTxO's
 *    value and (for mint/burn) the reserve multiplier: input funding and the
 *    statically-knowable deliverability ceiling. Callers derive the facts, since
 *    that is where the asset ids and settings live; `RealfiSDKV1Family`
 *    .screenOrderForExecution does both in one call.
 *
 * Still deliberately NOT covered, because it is not decidable from the order in
 * isolation: predicates that move with live protocol state — unstake's
 * `forfeit <= request_usdr`, and the stake/unstake deliverability ceilings,
 * which follow the vault exchange rate between screening and execution.
 *
 * A caller with a narrower policy (the approvals cron accepts just the
 * zero-principal, positive-yield deposit shape) also keeps that policy to
 * itself; folding it in here would reject orders other first-party flows
 * legitimately create and execute.
 *
 * | action   | on-chain predicate                                      | source                        |
 * | -------- | ------------------------------------------------------- | ----------------------------- |
 * | mint     | `amount > 0 && min_received > 0`                        | `v1_0/mint.ak:86`             |
 * | burn     | `amount < 0 && min_received > 0`                        | `v1_0/burn.ak:90`             |
 * | stake    | `amount > 0 && min_received > 0 && forfeit == 0`        | `v1_0/stake.ak:45-47`         |
 * | unstake  | `amount > 0 && min_received > 0` (+ `forfeit >= 0`)     | `v1_0/unstake.ak:77,101`      |
 * | deposit  | `amount >= 0`                                           | `v1_0/deposit.ak:67`          |
 * | withdraw | `amount > 0 && yield == 0`                              | `v1_0/withdraw.ak:73`         |
 *
 * v1_1_rc1 carries the identical predicates. v1_0_rc1 does NOT — its datum has
 * no `min_received` field at all and its predicates are amount-only
 * (`v1_0_rc1/stake.ak:64`, `unstake.ak:64`), which is why an absent floor is
 * treated as "no floor to check" below rather than as zero.
 */
/** Machine-stable reason token for a rejected request. */
export type TOrderRejectCode = "amount_not_positive" | "min_received_not_positive" | "forfeit_negative" | "deposit_principal_negative" | "deposit_batch_empty" | "withdraw_yield_not_zero" | "input_underfunded" | "min_received_above_max_delivered" | "order_facts_unresolvable";
/**
 * The subset of `IClassifiedOrderAction` the screen reads. Structural, so a
 * full classified action is assignable without this module depending on the
 * SDK family module (and without a test needing to construct one).
 *
 * Sign convention follows `classifyOrderAction`, which matches the on-chain
 * request shape: `amount` is already negated for burn.
 */
export interface IOrderActionSanityInput {
    actionType: string;
    amount: bigint;
    minReceived?: bigint;
    forfeit?: bigint;
    yield?: bigint;
}
export type TOrderSanityResult = {
    ok: true;
} | {
    ok: false;
    code: TOrderRejectCode;
    reason: string;
};
/**
 * Screen one classified order action against the predicates the validator will
 * apply to it.
 *
 * Unknown actions pass through. Every known action is checked because
 * `getSignedPayloadFromOrderInputs` packages both the approvals and
 * treasury-admin flows.
 */
export declare function screenOrderAction(action: IOrderActionSanityInput): TOrderSanityResult;
/**
 * Screen deposit predicates that the validator applies to the complete batch,
 * after it has summed every request. This must not run per order: offsetting
 * yields can make a non-empty pair unexecutable, while a zero/zero order can
 * validly accompany a principal-bearing one.
 */
export declare function screenDepositBatch(actions: readonly IOrderActionSanityInput[]): TOrderSanityResult;
/**
 * The value-dependent facts about an order UTxO that the validator checks but
 * the datum alone cannot answer. The caller derives these because it owns the
 * asset ids and the reserve multiplier from settings.
 */
export interface IOrderUtxoFacts {
    /**
     * Quantity of the consumed asset the validator will require this UTxO to
     * hold. Per action: mint → `usdr_to_reserve_ceil(amount, ra)` of the reserve
     * asset; burn → `|amount|` USDr; stake → `amount` USDr; unstake → `amount`
     * sUSDr. Zero for actions with no such check (treasury, direct).
     */
    consumedRequired: bigint;
    /** Quantity of that same asset actually locked in the UTxO. */
    consumedLocked: bigint;
    /**
     * Ceiling on what may be delivered to the destination, when it is knowable
     * without live vault state: mint → `amount`, burn →
     * `usdr_to_reserve(|amount|, ra)`. `undefined` where the ceiling follows the
     * vault exchange rate (stake, unstake) and so cannot be screened here.
     */
    maxDelivered?: bigint;
    /**
     * Set when the facts could not be derived from the datum at all — the reserve
     * asset it names is not in settings, or its policy id is malformed. Every
     * field of the datum is attacker-chosen, so this must be a REJECTION, never a
     * thrown error: a throw from a screen would abort the caller's whole sweep,
     * which is a strictly worse denial of service than the batch-kill the screen
     * exists to prevent. The validator reaches the same conclusion via
     * `expect Some(ra) = find_reserve_asset(...)` (`v1_0/mint.ak:29`).
     */
    unresolvable?: string;
}
/**
 * Screen the value-dependent aborts. Run alongside {@link screenOrderAction} —
 * neither subsumes the other.
 *
 * Both conditions kill the whole transaction, not just the offending order:
 *
 * - **Underfunded input.** `validate_stake_inputs` / `validate_unstake_inputs`
 *   (`v1_0/utilities.ak:417`, `:443`) `expect` the locked quantity to cover
 *   `request.amount`; mint (`mint.ak:32`) and burn (`burn.ak:31`) fold the same
 *   comparison into an `and {}` whose `False` fails the enclosing `expect`. An
 *   order UTxO holding min-ADA and none of the consumed asset is therefore a
 *   complete batch-killer that costs the planter nothing but the min-ADA.
 * - **Unsatisfiable floor.** `validate_destination_value`
 *   (`v1_0/utilities.ak:594-595`) `expect`s `min_delivered <= delivered <=
 *   max_delivered`. A `min_received` above the ceiling makes the pair
 *   unsatisfiable no matter what the operator builds.
 */
export declare function screenOrderUtxoFacts(action: IOrderActionSanityInput, facts: IOrderUtxoFacts): TOrderSanityResult;
//# sourceMappingURL=order-sanity.d.ts.map