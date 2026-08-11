// Re-export the production helper so tests can resolve via './util'
// without a separate, drifting copy.
export { generateRedPallasDKGKeyShares } from '../../../../src/tss/redpallas-mps/util';
