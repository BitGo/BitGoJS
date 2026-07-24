// Contracts are parameters that were used to derive a transaction input/output
// address. For example, the tapscript address of the staking transaction.
// The interface for the contract is defined with unisat
// https://github.com/unisat-wallet/bitcoin-address-verifier/tree/master/src/plugins/babylon
export interface Contract {
  id: ContractId;
  params: ContractData;
}

export enum ContractId {
  STAKING = "babylon:staking",
  UNBONDING = "babylon:unbonding",
  SLASHING = "babylon:slashing",
  WITHDRAW = "babylon:withdraw",
  SLASHING_BURN = "babylon:slashing-burn",
}

export type ContractData = Record<
  string,
  string | number | string[] | number[]
>;