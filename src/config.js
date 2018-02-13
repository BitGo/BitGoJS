// Estimate for virtual sizes of various tx inputs
exports.tx = {
  P2SH_INPUT_SIZE: 296,
  P2SH_P2WSH_INPUT_SIZE: 138,
  P2PKH_INPUT_SIZE: 160, // Uncompressed
  OUTPUT_SIZE: 34,
  TX_OVERHEAD_SIZE: 10
};

// The derivation paths of the different address chains
exports.chains = {
  CHAIN_P2SH: 0,
  CHANGE_CHAIN_P2SH: 1,
  CHAIN_SEGWIT: 10,
  CHANGE_CHAIN_SEGWIT: 11
};

