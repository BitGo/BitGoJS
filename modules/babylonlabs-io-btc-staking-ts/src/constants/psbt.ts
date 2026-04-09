// This sequence enables both the locktime field and also replace-by-fee
export const RBF_SEQUENCE = 0xfffffffd;
// This sequence means the transaction is not replaceable
export const NON_RBF_SEQUENCE = 0xffffffff;
// The Transaction version number used across the library(to be set in the psbt)
export const TRANSACTION_VERSION = 2;