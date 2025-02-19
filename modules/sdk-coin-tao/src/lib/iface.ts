import { BaseTxInfo, TypeRegistry } from '@substrate/txwrapper-core/lib/types';

export { HexString } from '@polkadot/util/types';

/**
 * Method names for the transaction method. Names change based on the type of transaction e.g 'bond' for the staking transaction
 */
export enum MethodNames {
  AddStake = 'addStake',
}

/**
 * Base transaction info shared across all types of transactions
 */
export interface CreateBaseTxInfo {
  baseTxInfo: BaseTxInfo;
  options: {
    metadataRpc: `0x${string}`;
    registry: TypeRegistry;
    isImmortalEra?: boolean;
  };
}

/**
 * Decoded TxMethod from a transaction hex
 */
// export interface TxMethod {
//   args: AddStakeArgs;
//   name: MethodNames;
//   pallet: string;
// }

// export interface AddStakeArgs extends Args {
//   amount_staked: string;
//   hotkey: string;
//   netuid: string;
// }
