"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.YIELD_BREAKDOWN_QUERY = exports.SUSDR_EXCHANGE_RATE_INPUTS_QUERY = exports.STAKE_TIMES_QUERY = exports.REFERRER_CODE_QUERY = exports.REFERRAL_REWARDS_QUERY = exports.POINTS_BALANCE_QUERY = exports.ORDER_FEES_QUERY = exports.ORDERS_BY_OWNER_QUERY = exports.INVITED_COUNT_QUERY = void 0;
// GraphQL operations + their raw response shapes (field names match the schema).
// The clean SDK-facing types live in ./types; the API class maps raw -> clean.

var STAKE_TIMES_QUERY = exports.STAKE_TIMES_QUERY = "{\n  stakeTimes {\n    CurrentCooldownPeriodEnd { slot }\n    NextCooldownPeriodEnd { slot }\n  }\n}";
var ORDER_FEES_QUERY = exports.ORDER_FEES_QUERY = "{ orderFees { mintBps redeemBps } }";
var SUSDR_EXCHANGE_RATE_INPUTS_QUERY = exports.SUSDR_EXCHANGE_RATE_INPUTS_QUERY = "{\n  susdrExchangeRateInputs {\n    circulatingSusdr\n    vaultUsdr\n    pendingYield\n    diffusionStartUnixMilli\n    diffusionEndUnixMilli\n  }\n}";
var YIELD_BREAKDOWN_QUERY = exports.YIELD_BREAKDOWN_QUERY = "query ($owner: String!) {\n  susdrYieldBreakdown(owner: $owner) {\n    totalSUSDr\n    totalUSDrValue\n    principal\n    yield\n    yieldPercent\n  }\n}";
var ORDERS_BY_OWNER_QUERY = exports.ORDERS_BY_OWNER_QUERY = "query ($owner: String!, $status: OrderStatus!) {\n  ordersByOwner(owner: $owner, status: $status) {\n    status\n    order {\n      Owner\n      Action\n      Amount\n      Principal\n      Yield\n      Slot\n      Forfeit\n      UnlockSlot\n      MatureSlot\n      ClaimTxHash\n      Version\n      utxo { txHash index }\n      resultUtxo { txHash index }\n    }\n  }\n}";
var POINTS_BALANCE_QUERY = exports.POINTS_BALANCE_QUERY = "query ($value: String!) {\n  V_WALLET_POINTS_BALANCE(\n    filters: [{ field: \"WALLET_ADDRESS\", operator: IN, value: $value }]\n  ) {\n    nodes { WALLET_POINTS_BALANCE }\n  }\n}";
var REFERRER_CODE_QUERY = exports.REFERRER_CODE_QUERY = "query ($walletAddress: String!) {\n  referrerCode(walletAddress: $walletAddress) { code createdAt }\n}";
var REFERRAL_REWARDS_QUERY = exports.REFERRAL_REWARDS_QUERY = "query ($walletAddress: String!) {\n  referralRewards(walletAddress: $walletAddress)\n}";
var INVITED_COUNT_QUERY = exports.INVITED_COUNT_QUERY = "query ($walletAddress: String!) {\n  invitedCount(walletAddress: $walletAddress)\n}";
//# sourceMappingURL=queries.js.map