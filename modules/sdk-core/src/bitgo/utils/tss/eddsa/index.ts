import { TssUtils } from './eddsa';
export * as TssUtilsTypes from './types';

export default TssUtils;

// exporting this types for backward compatibility.
export {
  ITssUtils,
  PrebuildTransactionWithIntentOptions,
  SignatureShareRecord,
  SignatureShareType,
  TxRequest,
  UnsignedTransaction,
} from './types';
