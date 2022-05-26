import Eddsa, { EDDSA } from './eddsa';

// exporting all eddsa types and making eddsa as default for backward compatibility
export * from './eddsa/types';
export default Eddsa;

export { Eddsa, EDDSA };
