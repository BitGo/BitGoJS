"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSACTION_VERSION = exports.NON_RBF_SEQUENCE = exports.RBF_SEQUENCE = void 0;
// This sequence enables both the locktime field and also replace-by-fee
exports.RBF_SEQUENCE = 0xfffffffd;
// This sequence means the transaction is not replaceable
exports.NON_RBF_SEQUENCE = 0xffffffff;
// The Transaction version number used across the library(to be set in the psbt)
exports.TRANSACTION_VERSION = 2;
