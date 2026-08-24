// GraphQL operations + their raw response shapes (field names match the schema).
// The clean SDK-facing types live in ./types; the API class maps raw -> clean.

export const STAKE_TIMES_QUERY = `{
  stakeTimes {
    CurrentCooldownPeriodEnd { slot }
    NextCooldownPeriodEnd { slot }
  }
}`;
export const ORDER_FEES_QUERY = `{ orderFees { mintBps redeemBps } }`;
export const SUSDR_EXCHANGE_RATE_INPUTS_QUERY = `{
  susdrExchangeRateInputs {
    circulatingSusdr
    vaultUsdr
    pendingYield
    diffusionStartUnixMilli
    diffusionEndUnixMilli
  }
}`;
export const YIELD_BREAKDOWN_QUERY = `query ($owner: String!) {
  susdrYieldBreakdown(owner: $owner) {
    totalSUSDr
    totalUSDrValue
    principal
    yield
    yieldPercent
  }
}`;
export const ORDERS_BY_OWNER_QUERY = `query ($owner: String!, $status: OrderStatus!) {
  ordersByOwner(owner: $owner, status: $status) {
    status
    order {
      Owner
      Action
      Amount
      Principal
      Yield
      Slot
      Forfeit
      UnlockSlot
      MatureSlot
      ClaimTxHash
      Version
      utxo { txHash index }
      resultUtxo { txHash index }
    }
  }
}`;
export const POINTS_BALANCE_QUERY = `query ($value: String!) {
  V_WALLET_POINTS_BALANCE(
    filters: [{ field: "WALLET_ADDRESS", operator: IN, value: $value }]
  ) {
    nodes { WALLET_POINTS_BALANCE }
  }
}`;
export const REFERRER_CODE_QUERY = `query ($walletAddress: String!) {
  referrerCode(walletAddress: $walletAddress) { code createdAt }
}`;
export const REFERRAL_REWARDS_QUERY = `query ($walletAddress: String!) {
  referralRewards(walletAddress: $walletAddress)
}`;
export const INVITED_COUNT_QUERY = `query ($walletAddress: String!) {
  invitedCount(walletAddress: $walletAddress)
}`;
//# sourceMappingURL=queries.js.map