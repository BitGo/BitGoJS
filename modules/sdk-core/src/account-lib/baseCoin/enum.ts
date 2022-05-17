/**
 * Internal metadata. Defines the type of transaction.
 */
export enum TransactionType {
  Send,
  // Send ERC721 compliant tokens
  SendERC721,
  // Send ERC1155 compliant tokens
  SendERC1155,
  // Initialize a wallet on-chain (e.g. Multi-sig contract deployment)
  WalletInitialization,
  // Initialize an address on-chain(e.g. Forwarder contract deployment)
  AddressInitialization,
  // Initialized an associated token account
  AssociatedTokenAccountInitialization,
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
  // Deactivate
  StakingDeactivate,
  // Batch of multiple transactions broadcast as a single transaction
  Batch,
  // Claim the staking rewards
  StakingClaim,
}

/**
 * Generic list of encoding formats. Can be used as arguments for methods inputs.
 */
export enum AddressFormat {
  hex = 'hex',
  base58 = 'base58',
  // format for westend addresses
  substrate = 'substrate',
  // format for polkadot mainnet addresses
  polkadot = 'polkadot',
}

export enum StakingOperationTypes {
  LOCK,
  VOTE,
  UNVOTE,
  ACTIVATE,
  UNLOCK,
  WITHDRAW,
}
