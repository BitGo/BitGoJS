import { SerializedType } from 'avalanche/dist/utils';

export const DEFAULT_CHAIN_NAMES = {
  testnet: 'tavaxp',
  mainnet: 'avaxp',
};

export const serializedType: SerializedType = 'bech32';
export const chainID = 'P';
export const testnet = 'fuji';
export const mainnet = 'avax';

export const validatorTransactionTypeId = 12;

export const avaxAssetID = 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z';
export const networkID = 1;

export const txFee = BigInt(1000000); // 1 MILLIAVAX
export const createSubnetTx = BigInt(1000000000); // 1 AVAX
export const createChainTx = BigInt(1000000000); // 1 AVAX
export const creationTxFee = BigInt(10000000); // 1 CENTIAVAX
export const minConsumption = 0.1;
export const maxConsumption = 0.12;
export const maxStakingDuration = BigInt(31536000); // 1 year
export const maxSupply = BigInt(720000000) * BigInt(1000000000); // 720 mil tokens
export const minStake = BigInt(1000000000) * BigInt(2000);
export const minStakeDuration = 2 * 7 * 24 * 60 * 60; // 2 weeks
export const maxStakeDuration = 365 * 24 * 60 * 60; // 1 year
export const minDelegationStake = BigInt(1000000000) * BigInt(25);
export const minDelegationFee = BigInt(2);
