"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.screenDepositBatch = screenDepositBatch;
exports.screenOrderAction = screenOrderAction;
exports.screenOrderUtxoFacts = screenOrderUtxoFacts;
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

/**
 * The subset of `IClassifiedOrderAction` the screen reads. Structural, so a
 * full classified action is assignable without this module depending on the
 * SDK family module (and without a test needing to construct one).
 *
 * Sign convention follows `classifyOrderAction`, which matches the on-chain
 * request shape: `amount` is already negated for burn.
 */

var OK = {
  ok: true
};
function reject(code, reason) {
  return {
    ok: false,
    code: code,
    reason: reason
  };
}

/**
 * Screen one classified order action against the predicates the validator will
 * apply to it.
 *
 * Unknown actions pass through. Every known action is checked because
 * `getSignedPayloadFromOrderInputs` packages both the approvals and
 * treasury-admin flows.
 */
function screenOrderAction(action) {
  var _action$forfeit, _action$yield;
  var actionType = action.actionType;

  // Mint, burn, stake and unstake carry a user-signed output floor that the
  // validator requires to be strictly positive — in the versions that HAVE one.
  // v1_0_rc1's datum has no min_received field and its validators have no
  // min_received predicate, so `undefined` means "this version has no floor to
  // check", not "the floor is zero". The v1_0 / v1_1_rc1 schemas make the field
  // mandatory, so a genuinely poisoned order always arrives as 0.
  var floor = action.minReceived;
  switch (actionType) {
    case "mint":
    case "stake":
    case "unstake":
      if (action.amount <= 0n) {
        return reject("amount_not_positive", "Invalid ".concat(actionType, " amount (<= 0)"));
      }
      if (floor !== undefined && floor <= 0n) {
        return reject("min_received_not_positive", "Invalid ".concat(actionType, " min_received (<= 0)"));
      }
      // Unstake's forfeit is user-supplied in the datum; a negative one crashes
      // the batch on `expect r.forfeit >= 0` exactly like a zero min_received
      // does. (Stake requests carry no datum forfeit — OStake has no such
      // field, so the validator's `forfeit == 0` holds by construction.)
      if (actionType === "unstake" && ((_action$forfeit = action.forfeit) !== null && _action$forfeit !== void 0 ? _action$forfeit : 0n) < 0n) {
        return reject("forfeit_negative", "Invalid unstake forfeit (< 0)");
      }
      return OK;
    case "burn":
      // classifyOrderAction negates ORedeem.amount, so the on-chain
      // `amount < 0` check is the raw datum amount being positive.
      if (action.amount >= 0n) {
        return reject("amount_not_positive", "Invalid burn amount (<= 0)");
      }
      if (floor !== undefined && floor <= 0n) {
        return reject("min_received_not_positive", "Invalid burn min_received (<= 0)");
      }
      return OK;
    case "withdraw":
      if (action.amount <= 0n) {
        return reject("amount_not_positive", "Invalid withdraw amount (<= 0)");
      }
      if (((_action$yield = action["yield"]) !== null && _action$yield !== void 0 ? _action$yield : 0n) !== 0n) {
        return reject("withdraw_yield_not_zero", "Invalid withdraw request (yield must be 0)");
      }
      return OK;
    case "deposit":
      if (action.amount < 0n) {
        return reject("deposit_principal_negative", "Invalid deposit principal (< 0)");
      }
      return OK;
    case "direct_mint":
      if (action.amount <= 0n) {
        return reject("amount_not_positive", "Invalid direct_mint amount (<= 0)");
      }
      return OK;
    case "direct_burn":
      // classifyOrderAction negates ODirectBurn.amount to match the signed
      // request and direct_burn.ak's required negative amount.
      if (action.amount >= 0n) {
        return reject("amount_not_positive", "Invalid direct_burn amount (<= 0)");
      }
      return OK;
    default:
      return OK;
  }
}

/**
 * Screen deposit predicates that the validator applies to the complete batch,
 * after it has summed every request. This must not run per order: offsetting
 * yields can make a non-empty pair unexecutable, while a zero/zero order can
 * validly accompany a principal-bearing one.
 */
function screenDepositBatch(actions) {
  var _actions$reduce = actions.reduce(function (totals, action) {
      var _action$yield2;
      return {
        principal: totals.principal + action.amount,
        totalYield: totals.totalYield + ((_action$yield2 = action["yield"]) !== null && _action$yield2 !== void 0 ? _action$yield2 : 0n)
      };
    }, {
      principal: 0n,
      totalYield: 0n
    }),
    principal = _actions$reduce.principal,
    totalYield = _actions$reduce.totalYield;
  if (principal === 0n && totalYield === 0n) {
    return reject("deposit_batch_empty", "Invalid deposit batch (principal and yield both total 0)");
  }
  return OK;
}

/**
 * The value-dependent facts about an order UTxO that the validator checks but
 * the datum alone cannot answer. The caller derives these because it owns the
 * asset ids and the reserve multiplier from settings.
 */

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
function screenOrderUtxoFacts(action, facts) {
  if (facts.unresolvable !== undefined) {
    return reject("order_facts_unresolvable", "Order datum cannot be resolved against protocol settings: ".concat(facts.unresolvable));
  }
  if (facts.consumedRequired > 0n && facts.consumedLocked < facts.consumedRequired) {
    return reject("input_underfunded", "Order UTxO locks ".concat(facts.consumedLocked, " of the consumed asset but its ") + "".concat(action.actionType, " datum requires ").concat(facts.consumedRequired));
  }
  var floor = action.minReceived;
  if (floor !== undefined && facts.maxDelivered !== undefined && floor > facts.maxDelivered) {
    return reject("min_received_above_max_delivered", "Invalid ".concat(action.actionType, " min_received (").concat(floor, ") \u2014 above the maximum ") + "deliverable ".concat(facts.maxDelivered, ", so no execution can satisfy it"));
  }
  return OK;
}
//# sourceMappingURL=order-sanity.js.map