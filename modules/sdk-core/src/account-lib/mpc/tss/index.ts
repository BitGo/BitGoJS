import Eddsa, { EDDSA } from './eddsa';
import Ecdsa, { ECDSA, rangeProof } from './ecdsa';

// exporting all eddsa types and making eddsa as default for backward compatibility
export * from './eddsa/types';
export default Eddsa;

export { Eddsa, EDDSA, Ecdsa, ECDSA, rangeProof };
