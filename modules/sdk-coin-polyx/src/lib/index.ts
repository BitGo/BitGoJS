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
export { HexTransferBuilder } from './hexTransferBuilder';
export { RegisterDidWithCDDBuilder } from './registerDidWithCDDBuilder';
export { PreApproveAssetBuilder } from './preApproveAssetBuilder';
export { TokenTransferBuilder } from './tokenTransferBuilder';
export { HexTokenTransferBuilder } from './hexTokenTransferBuilder';
export { RejectInstructionBuilder } from './rejectInstructionBuilder';
export { Transaction as PolyxTransaction } from './transaction';
export { BondExtraBuilder } from './bondExtraBuilder';
export { BatchStakingBuilder as BatchBuilder } from './batchStakingBuilder';
export { NominateBuilder } from './nominateBuilder';
export { BatchUnstakingBuilder } from './batchUnstakingBuilder';
export { UnbondBuilder } from './unbondBuilder';
export { WithdrawUnbondedBuilder } from './withdrawUnbondedBuilder';
export { V8TransferBuilder } from './v8TransferBuilder';
export { V8HexTransferBuilder } from './v8HexTransferBuilder';
export { V8RegisterDidWithCDDBuilder } from './v8RegisterDidWithCDDBuilder';
export { V8RegisterDidBuilder } from './v8RegisterDidBuilder';
export { V8TokenTransferBuilder } from './v8TokenTransferBuilder';
export { V8HexTokenTransferBuilder } from './v8HexTokenTransferBuilder';
export { V8PreApproveAssetBuilder } from './v8PreApproveAssetBuilder';
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
