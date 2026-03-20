export { explainPsbt, explainLegacyTx, ChangeAddressInfo } from './explainTransaction.js';
export {
  explainPsbtWasm,
  explainPsbtWasmBigInt,
  aggregateTransactionExplanations,
  type ExplainedInput,
  type TransactionExplanationBigInt,
  type AggregatedTransactionExplanation,
} from './explainPsbtWasm.js';
export { parseTransaction } from './parseTransaction.js';
export { CustomChangeOptions } from './parseOutput.js';
export { verifyTransaction } from './verifyTransaction.js';
export { signTransaction } from './signTransaction.js';
export * from './signLegacyTransaction.js';
export * from './SigningError.js';
export * from './replayProtection.js';
