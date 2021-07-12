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
  // Flush native coins (eg. ETH) from a forwarder address to base address
  FlushCoins,
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
  // Handle smart contract calls
  ContractCall,
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
