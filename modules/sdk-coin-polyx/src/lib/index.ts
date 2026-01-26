export {
  Constants,
  Errors,
  Interface,
  KeyPair,
  SingletonRegistry,
  Transaction,
  TransactionBuilder,
} from '@bitgo/abstract-substrate';

export { TransactionBuilderFactory } from './transactionBuilderFactory';
export { PolyxBaseBuilder } from './baseBuilder';
export { TransferBuilder } from './transferBuilder';
export { RegisterDidWithCDDBuilder } from './registerDidWithCDDBuilder';
export { PreApproveAssetBuilder } from './preApproveAssetBuilder';
export { TokenTransferBuilder } from './tokenTransferBuilder';
export { RejectInstructionBuilder } from './rejectInstructionBuilder';
export { Transaction as PolyxTransaction } from './transaction';
export { BondExtraBuilder } from './bondExtraBuilder';
export { BatchStakingBuilder as BatchBuilder } from './batchStakingBuilder';
export { BatchUnstakingBuilder } from './batchUnstakingBuilder';
export { UnbondBuilder } from './unbondBuilder';
export { WithdrawUnbondedBuilder } from './withdrawUnbondedBuilder';
import polyxUtils from './utils';
export { Utils, default as utils } from './utils';
export * from './iface';

export { BondArgs, NominateArgs, BatchCallObject, BatchArgs } from './iface';

/**
 * Checks if a string is a valid Polymesh DID (Decentralized Identifier)
 * DIDs are 32-byte hex strings (0x prefix + 64 hex characters)
 *
 * @param {string} did - The string to validate
 * @returns {boolean} true if valid DID format, false otherwise
 */
export const isValidDid = (did: string): boolean => polyxUtils.isValidDid(did);
