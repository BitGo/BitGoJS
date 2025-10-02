"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OP_RETURN_VALUE_SERIALIZE_SIZE = exports.OP_RETURN_OUTPUT_VALUE_SIZE = exports.WALLET_RELAY_FEE_RATE_THRESHOLD = exports.WITHDRAW_TX_BUFFER_SIZE = exports.MAX_NON_LEGACY_OUTPUT_SIZE = exports.LOW_RATE_ESTIMATION_ACCURACY_BUFFER = exports.TX_BUFFER_SIZE_OVERHEAD = exports.P2TR_INPUT_SIZE = exports.P2WPKH_INPUT_SIZE = exports.DEFAULT_INPUT_SIZE = void 0;
// Estimated size of a non-SegWit input in bytes
exports.DEFAULT_INPUT_SIZE = 180;
// Estimated size of a P2WPKH input in bytes
exports.P2WPKH_INPUT_SIZE = 68;
// Estimated size of a P2TR input in bytes
exports.P2TR_INPUT_SIZE = 58;
// Estimated size of a transaction buffer in bytes
exports.TX_BUFFER_SIZE_OVERHEAD = 11;
// Buffer for estimation accuracy when fee rate <= 2 sat/byte
exports.LOW_RATE_ESTIMATION_ACCURACY_BUFFER = 30;
// Size of a Taproot output, the largest non-legacy output type
exports.MAX_NON_LEGACY_OUTPUT_SIZE = 43;
// Buffer size for withdraw transaction fee calculation
exports.WITHDRAW_TX_BUFFER_SIZE = 17;
// Threshold for wallet relay fee rate. Different buffer fees are used based on this threshold
exports.WALLET_RELAY_FEE_RATE_THRESHOLD = 2;
// Estimated size of the OP_RETURN output value in bytes
exports.OP_RETURN_OUTPUT_VALUE_SIZE = 8;
// Because our OP_RETURN data will always be less than 80 bytes, which is less than 0xfd (253),
// the value serialization size will always be 1 byte.
exports.OP_RETURN_VALUE_SERIALIZE_SIZE = 1;
