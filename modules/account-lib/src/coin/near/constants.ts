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

export const HEX_REGEX = /^[0-9a-fA-F]+$/;
