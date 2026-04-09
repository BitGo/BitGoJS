import { NetworkType } from '@bitgo/statics';
import { StakingOperationTypes } from '../baseCoin';

export interface ContractMethodConfig {
  contractAddress: string;
  methodId: string;
  types: string[];
}

export const LockMethodId = '0xf83d08ba'; // lock()
export const UnlockMethodId = '0x6198e339'; // unlock()
export const VoteMethodId = '0x580d747a'; // vote()
export const UnvoteMethodId = '0x6e198475'; // revokeActive()
export const ActivateMethodId = '0x1c5a9d9c'; // activate()
export const WithdrawMethodId = '0x2e1a7d4d'; // withdraw()

const LockedGoldTestnetAddress = '0x94c3e6675015d8479b648657e7ddfcd938489d0d';
const LockedGoldMainnetAddress = '0x6cc083aed9e3ebe302a6336dbc7c921c9f03349e';
const ElectionTestnetAddress = '0x11fe523f93cac185d12cb39cc3bd279d2de524f8';
const ElectionMainnetAddress = '0x8d6677192144292870907e3fa8a5527fe55a7ff6';

const operations = {
  [StakingOperationTypes.LOCK]: {
    [NetworkType.TESTNET]: {
      contractAddress: LockedGoldTestnetAddress,
      methodId: LockMethodId,
      types: [],
    },
    [NetworkType.MAINNET]: {
      contractAddress: LockedGoldMainnetAddress,
      methodId: LockMethodId,
      types: [],
    },
  },
  [StakingOperationTypes.UNLOCK]: {
    [NetworkType.TESTNET]: {
      contractAddress: LockedGoldTestnetAddress,
      methodId: UnlockMethodId,
      types: ['uint256'],
    },
    [NetworkType.MAINNET]: {
      contractAddress: LockedGoldMainnetAddress,
      methodId: UnlockMethodId,
      types: ['uint256'],
    },
  },
  [StakingOperationTypes.VOTE]: {
    [NetworkType.TESTNET]: {
      contractAddress: ElectionTestnetAddress,
      methodId: VoteMethodId,
      types: ['address', 'uint256', 'address', 'address'],
    },
    [NetworkType.MAINNET]: {
      contractAddress: ElectionMainnetAddress,
      methodId: VoteMethodId,
      types: ['address', 'uint256', 'address', 'address'],
    },
  },
  [StakingOperationTypes.UNVOTE]: {
    [NetworkType.TESTNET]: {
      contractAddress: ElectionTestnetAddress,
      methodId: UnvoteMethodId,
      types: ['address', 'uint256', 'address', 'address', 'uint256'],
    },
    [NetworkType.MAINNET]: {
      contractAddress: ElectionMainnetAddress,
      methodId: UnvoteMethodId,
      types: ['address', 'uint256', 'address', 'address', 'uint256'],
    },
  },
  [StakingOperationTypes.ACTIVATE]: {
    [NetworkType.TESTNET]: {
      contractAddress: ElectionTestnetAddress,
      methodId: ActivateMethodId,
      types: ['address'],
    },
    [NetworkType.MAINNET]: {
      contractAddress: ElectionMainnetAddress,
      methodId: ActivateMethodId,
      types: ['address'],
    },
  },
  [StakingOperationTypes.WITHDRAW]: {
    [NetworkType.TESTNET]: {
      contractAddress: LockedGoldTestnetAddress,
      methodId: WithdrawMethodId,
      types: ['uint256'],
    },
    [NetworkType.MAINNET]: {
      contractAddress: LockedGoldMainnetAddress,
      methodId: WithdrawMethodId,
      types: ['uint256'],
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
