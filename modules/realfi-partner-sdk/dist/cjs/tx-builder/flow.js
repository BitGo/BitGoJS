"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.STAKE_VAULT_RATIO_SCALE = exports.DEFAULT_STAKE_SLIPPAGE_TOLERANCE_BPS = void 0;
exports.buildRealFiStakeAction = buildRealFiStakeAction;
exports.buildRealFiTxFlowStep = buildRealFiTxFlowStep;
exports.buildSundaeV3TxFlowStep = buildSundaeV3TxFlowStep;
exports.buildTxFlow = buildTxFlow;
exports.buildTxFlowStep = buildTxFlowStep;
exports.computeStakeMinReceivedFromVaultRatio = computeStakeMinReceivedFromVaultRatio;
exports.txBuilderFlowResultToCoreOutput = txBuilderFlowResultToCoreOutput;
var Data = _interopRequireWildcard(require("@blaze-cardano/data"));
var _sdk = require("@blaze-cardano/sdk");
var _core = require("@sundaeswap/core");
var _index = require("../generated-types/index.js");
var _destination = require("./destination.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Output produced by one flow step. The previous step consumes only this
 * result's address and datum as its continuation destination. The value is the
 * Cardano assets locked at this step's output; after the right fold, only the
 * outermost folded result is converted into the transaction output.
 */

var STAKE_VAULT_RATIO_SCALE = exports.STAKE_VAULT_RATIO_SCALE = 1000000n;
var DEFAULT_STAKE_SLIPPAGE_TOLERANCE_BPS = exports.DEFAULT_STAKE_SLIPPAGE_TOLERANCE_BPS = 50n;
var BPS_DENOMINATOR = 10000n;

/**
 * @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper.
 */

/** @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper. */

/**
 * Computes stake order `min_received` from the current vault exchange rate.
 *
 * `vaultRatio` is USDr per sUSDr scaled by 1e6, so the natural sUSDr output is
 * `amount * 1e6 / vaultRatio`. The tolerance is applied to that output floor.
 *
 * @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper.
 */
function computeStakeMinReceivedFromVaultRatio(amount, vaultRatio) {
  var slippageToleranceBps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_STAKE_SLIPPAGE_TOLERANCE_BPS;
  if (amount <= 0n) {
    throw new Error("Stake amount must be positive");
  }
  if (vaultRatio <= 0n) {
    throw new Error("Vault ratio must be positive");
  }
  if (slippageToleranceBps < 0n || slippageToleranceBps > BPS_DENOMINATOR) {
    throw new Error("Slippage tolerance must be between 0 and 10000 bps");
  }
  var expected = amount * STAKE_VAULT_RATIO_SCALE / vaultRatio;
  var minReceived = expected * (BPS_DENOMINATOR - slippageToleranceBps) / BPS_DENOMINATOR;
  // WTB-1764: stake.ak requires min_received > 0 and crashes the entire
  // execution transaction (not just this request) when it is not, so a floor
  // that rounds or tolerances down to zero must not become an order.
  if (minReceived <= 0n) {
    throw new Error("Quoted min_received must be positive (got ".concat(minReceived, "); the stake amount ") + "is too small for this vault ratio and tolerance to quote a non-zero floor");
  }
  return minReceived;
}

/** @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper. */
function buildRealFiStakeAction(_ref) {
  var amount = _ref.amount,
    vaultRatio = _ref.vaultRatio,
    slippageToleranceBps = _ref.slippageToleranceBps;
  return {
    OStake: {
      amount: amount,
      min_received: computeStakeMinReceivedFromVaultRatio(amount, vaultRatio, slippageToleranceBps)
    }
  };
}

/**
 * Builds the final flow result by folding from the final step backward through
 * each requested flow step.
 */
function buildTxFlow(steps, finalStep) {
  return steps.reduceRight(function (nextStep, step) {
    return buildTxFlowStep(step, nextStep);
  }, finalStep);
}

/**
 * Builds one flow step using the already-built next step as its continuation.
 */
function buildTxFlowStep(step, nextStep) {
  switch (step.kind) {
    case "realfi":
      return buildRealFiTxFlowStep(step, nextStep);
    case "sundae-v3":
      return buildSundaeV3TxFlowStep(step, nextStep);
    default:
      {
        var unreachable = step;
        return unreachable;
      }
  }
}

/**
 * Builds a RealFi order flow result whose destination points to the next step.
 *
 * @deprecated V1_0 only. Prefer the SDK-backed stake continuation helper.
 */
function buildRealFiTxFlowStep(step, nextStep) {
  var _step$data;
  var orderDatum = {
    owner: step.owner,
    destination: (0, _destination.realfiDestinationFromStepResult)(nextStep),
    action: step.action,
    data: (_step$data = step.data) !== null && _step$data !== void 0 ? _step$data : Data.Void()
  };
  return {
    address: step.address,
    datum: Data.serialize(_index.V1_0Types.OrderDatumV1, orderDatum),
    value: step.value
  };
}

/**
 * Builds a Sundae V3 flow result by injecting the next step as the order
 * destination and serializing the selected order datum.
 */
function buildSundaeV3TxFlowStep(step, nextStep) {
  var builder = new _core.DatumBuilderV3(step.network);
  var destinationAddress = (0, _destination.sundaeV3DestinationAddressFromStepResult)(nextStep);
  var inlineDatum;
  switch (step.orderKind) {
    case "swap":
      inlineDatum = builder.buildSwapDatum({
        destinationAddress: destinationAddress,
        ident: step.ident,
        order: step.order,
        ownerAddress: step.ownerAddress,
        scooperFee: step.scooperFee
      }).inline;
      break;
    case "deposit":
      inlineDatum = builder.buildDepositDatum({
        destinationAddress: destinationAddress,
        ident: step.ident,
        order: step.order,
        ownerAddress: step.ownerAddress,
        scooperFee: step.scooperFee
      }).inline;
      break;
    case "withdraw":
      inlineDatum = builder.buildWithdrawDatum({
        destinationAddress: destinationAddress,
        ident: step.ident,
        order: step.order,
        ownerAddress: step.ownerAddress,
        scooperFee: step.scooperFee
      }).inline;
      break;
    default:
      {
        var unreachable = step;
        return unreachable;
      }
  }
  return {
    address: step.address,
    datum: (0, _destination.plutusDataFromCbor)(inlineDatum),
    value: step.value
  };
}

/**
 * Converts the folded flow result into a transaction output with an inline
 * datum when the result includes one.
 */
function txBuilderFlowResultToCoreOutput(result) {
  var output = new _sdk.Core.TransactionOutput(result.address, result.value);
  if (result.datum) {
    output.setDatum(_sdk.Core.Datum.newInlineData(result.datum));
  }
  return output;
}
//# sourceMappingURL=flow.js.map