export { PsbtInput, PsbtOutput } from 'bip174/src/lib/interfaces';

export * as bcashAddress from './bitcoincash';
export * as keyutil from './keyutil';
export * as nonStandardHalfSigned from './nonStandardHalfSigned';
export * as outputScripts from './outputScripts';
export * as legacySafe from './legacysafe';
export * as musig2 from './Musig2';
export * from './dash';
export * from './parseInput';
export * from './signature';
export * from './transaction';
export * from './types';
export * from './Unspent';
export * from './UtxoPsbt';
export * from './UtxoTransaction';
export * from './UtxoTransactionBuilder';
export * from './wallet';
export * from './zcash';
export * from './tnumber';
export * from './litecoin';
export * from './PsbtUtil';

import { PsbtInput } from 'bip174/src/lib/interfaces';
/**
 * alias for PsbtInput type to avoid direct bip174 library dependency by users of the util functions
 * @deprecated use PsbtInput instead
 */
export type PsbtInputType = PsbtInput;
