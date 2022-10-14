import { EddsaUtils } from './eddsa';
/** @deprecated use EddsaUtilsTypes */
export * as TssUtilsTypes from './types';
export * as EddsaUtilsTypes from './types';

export default EddsaUtils;
export * from './eddsaThirdPartyBackup';

// exporting this types for backward compatibility.
export { ITssUtils, IEddsaUtils, EddsaUnsignedTransaction } from './types';
export {
  PrebuildTransactionWithIntentOptions,
  SignatureShareRecord,
  SignatureShareType,
  TxRequest,
} from '../baseTypes';
