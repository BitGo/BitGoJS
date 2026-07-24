import * as EDDSAMethods from './eddsa';
export * as EDDSAMethodTypes from './types';

export default EDDSAMethods;

// exporting this types for backward compatibility.
export {
  createCombinedKey,
  createUserSignShare,
  createUserToBitGoGShare,
  offerUserToBitgoRShare,
  getBitgoToUserRShare,
  sendUserToBitgoGShare,
  getTxRequest,
  sendSignatureShare,
  encryptYShare,
} from './eddsa';

export { EncryptedYShare, DecryptableYShare, CombinedKey, SigningMaterial } from './types';
