/**
 * Staking smart contract method names selected to use on the builders.
 * You can see all methods here
 * @see https://github.com/near/core-contracts/blob/master/staking-pool/README.md
 */
export const StakingContractMethodNames = {
  DepositAndStake: 'deposit_and_stake',
  Unstake: 'unstake',
  Withdraw: 'withdraw',
} as const;

export const FT_TRANSFER = 'ft_transfer';
export const STORAGE_DEPOSIT = 'storage_deposit';
export const FUNGIBLE_TOKEN_RELATED_METHODS = [FT_TRANSFER, STORAGE_DEPOSIT];

export const HEX_REGEX = /^[0-9a-fA-F]+$/;

export const MAX_GAS_LIMIT_FOR_FT_TRANSFER = '30000000000000';
