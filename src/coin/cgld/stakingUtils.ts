import { NetworkType } from '@bitgo/statics';
import { StakingOperationTypes } from '../baseCoin';
import { ContractMethodConfig } from '../eth/iface';

export const LockMethodId = '0xf83d08ba';
export const VoteMethodId = '0x580d747a';

const operations = {
  [StakingOperationTypes.LOCK]: {
    [NetworkType.TESTNET]: {
      contractAddress: '0x94c3e6675015d8479b648657e7ddfcd938489d0d',
      methodId: LockMethodId,
      types: [],
    },
    [NetworkType.MAINNET]: {
      contractAddress: '0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e',
      methodId: LockMethodId,
      types: [],
    },
  },
  [StakingOperationTypes.VOTE]: {
    [NetworkType.TESTNET]: {
      contractAddress: '0x11fe523f93cac185d12cb39cc3bd279d2de524f8',
      methodId: VoteMethodId,
      types: ['address', 'uint256', 'address', 'address'],
    },
    [NetworkType.MAINNET]: {
      contractAddress: '0x8d6677192144292870907e3fa8a5527fe55a7ff6',
      methodId: VoteMethodId,
      types: ['address', 'uint256', 'address', 'address'],
    },
  },
};

/**
 * @param type
 * @param network
 */
export function getOperationConfig(type: StakingOperationTypes, network: NetworkType): ContractMethodConfig {
  return operations[type][network];
}
