import TssUtils, { TssUtilsTypes, EddsaUtilsTypes } from './eddsa';
export * as ECDSAUtils from './ecdsa';
export * as EDDSAUtils from './eddsa';

/** @deprecated use EDDSAUtils */
export { TssUtils };
/** @deprecated use EDDSAUtilsTypes */
export { TssUtilsTypes };
export { EddsaUtilsTypes };

// exporting this types for backward compatibility.
/** @deprecated use EDDSAUtils.<type/method> */
export { ITssUtils, IEddsaUtils, TxRequest, EddsaUnsignedTransaction } from './eddsa';

export * as BaseTssUtils from './baseTSSUtils';
export * from './baseTypes';
