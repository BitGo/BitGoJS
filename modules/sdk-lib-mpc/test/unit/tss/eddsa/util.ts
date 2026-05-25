// Re-export the production helper so existing tests can resolve via './util'
// without a separate, drifting copy.
export { generateEdDsaDKGKeyShares } from '../../../../src/tss/eddsa-mps/util';
