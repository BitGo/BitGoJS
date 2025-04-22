/**
 * Contract type describes a class of contract in a Transaction. This structure is used to identify what the Contract is.
 */
export enum ContractType {
  /**
   * This is a transfer of TRX contract.
   */
  Transfer,
  /**
   * This is the multi-sig initialization contract.
   */
  AccountPermissionUpdate,
  /**
   * This is a smart contract type.
   */
  TriggerSmartContract,
  /**
   * This is the contract for unfreezing balances
   */
  UnfreezeBalanceV2,
  /**
   * This is the contract for withdrawing expired unfrozen balances
   */
  WithdrawExpireUnfreeze,
}

export enum PermissionType {
  Owner,
  Witness,
  Active,
}
