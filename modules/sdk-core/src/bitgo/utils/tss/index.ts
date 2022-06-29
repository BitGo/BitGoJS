import TssUtils, { TssUtilsTypes } from './eddsa';
export { TssUtils, TssUtilsTypes };

export * as ECDSAUtils from './ecdsa';

// exporting this types for backward compatibility.
export {
  ITssUtils,
  PrebuildTransactionWithIntentOptions,
  SignatureShareRecord,
  SignatureShareType,
  TxRequest,
  EddsaUnsignedTransaction,
} from './eddsa';
