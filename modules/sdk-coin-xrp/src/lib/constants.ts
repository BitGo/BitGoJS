// https://xrpl.org/signerlistset.html
export const MAX_SIGNERS = 32;
export const MIN_SIGNERS = 1;
export const MIN_SIGNER_QUORUM = 1;

// https://xrpl.org/accountset.html#accountset-flags
export const VALID_ACCOUNT_SET_FLAGS = [
  5, // asfAccountTxnID
  16, // asfAllowTrustLineClawback
  10, // asfAuthorizedNFTokenMinter
  8, // asfDefaultRipple
  9, // asfDepositAuth
  4, // asfDisableMaster
  13, // asfDisallowIncomingCheck
  12, // asfDisallowIncomingNFTokenOffer
  14, // asfDisallowIncomingPayChan
  15, // asfDisallowIncomingTrustline
  3, // asfDisallowXRP
  7, // asfGlobalFreeze
  6, // asfNoFreeze
  2, // asfRequireAuth
  1, // asfRequireDest
];

// Global flags for bitgo address
export const USER_KEY_SETTING_FLAG = 65536;
export const MASTER_KEY_DEACTIVATION_FLAG = 1048576;
export const REQUIRE_DESTINATION_TAG_FLAG = 131072;

// TrustSet flags
export const NO_RIPPLE_FLAG = 131072;
