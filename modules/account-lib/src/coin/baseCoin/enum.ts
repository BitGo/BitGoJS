/**
 * Internal metadata. Defines the type of transaction.
 */
export enum TransactionType {
  Send,
  // Initialize a wallet on-chain (e.g. Multi-sig contract deployment)
  WalletInitialization,
  // Initialize an address on-chain(e.g. Forwarder contract deployment)
  AddressInitialization,
  // Flush tokens from a forwarder address to its base address
  FlushTokens,
  // Send a raw single-sig transaction
  SingleSigSend,
  // Update an account on-chain (e.g. Public key revelation operation for Tezos)
  AccountUpdate,
  // Lock
  StakingLock,
  // Vote
  StakingVote,
  // Unvote
  StakingUnvote,
  // Activate
  StakingActivate,
  // Unlock
  StakingUnlock,
  // Withdraw
  StakingWithdraw,
  // Confirm or Reject a Mint Request
  MintRequest,
  // Confirm or Reject a Burn Request
  BurnRequest,
  // Update a Custodian Custodian (e.g. Set Custodian Btc Deposit Address, add Merchant or remove Merchant for wrapped coins)
  CustodianUpdate,
  // Update a Merchant (e.g. set deposit Addres, add Mint Request, cancel Mint Request or burn for wrapped coins)
  MerchantUpdate,
}

/**
 * Generic list of encoding formats. Can be used as arguments for methods inputs.
 */
export enum AddressFormat {
  hex = 'hex',
  base58 = 'base58',
}

export enum StakingOperationTypes {
  LOCK,
  VOTE,
  UNVOTE,
  ACTIVATE,
  UNLOCK,
  WITHDRAW,
}
