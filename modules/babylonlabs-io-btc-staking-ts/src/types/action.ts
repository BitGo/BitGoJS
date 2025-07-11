// Action determines the type of the transaction that is being signed.
// The interface is also defined with unisat
// https://github.com/unisat-wallet/bitcoin-address-verifier/tree/master/src/plugins/babylon
export interface Action {
  name: ActionName;
  // Other metadata fields will be added as needed.
}

export enum ActionName {
  SIGN_BTC_STAKING_TRANSACTION = "sign-btc-staking-transaction",
  SIGN_BTC_UNBONDING_TRANSACTION = "sign-btc-unbonding-transaction",
  SIGN_BTC_WITHDRAW_TRANSACTION = "sign-btc-withdraw-transaction",
  SIGN_BTC_SLASHING_TRANSACTION = "sign-btc-slashing-transaction",
  SIGN_BTC_UNBONDING_SLASHING_TRANSACTION = "sign-btc-unbonding-slashing-transaction",
}