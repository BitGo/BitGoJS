"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakingError = exports.StakingErrorCode = void 0;
var StakingErrorCode;
(function (StakingErrorCode) {
    StakingErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    StakingErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    StakingErrorCode["INVALID_OUTPUT"] = "INVALID_OUTPUT";
    StakingErrorCode["SCRIPT_FAILURE"] = "SCRIPT_FAILURE";
    StakingErrorCode["BUILD_TRANSACTION_FAILURE"] = "BUILD_TRANSACTION_FAILURE";
    StakingErrorCode["INVALID_PARAMS"] = "INVALID_PARAMS";
})(StakingErrorCode || (exports.StakingErrorCode = StakingErrorCode = {}));
class StakingError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
    // Static method to safely handle unknown errors
    static fromUnknown(error, code, fallbackMsg) {
        if (error instanceof StakingError) {
            return error;
        }
        if (error instanceof Error) {
            return new StakingError(code, error.message);
        }
        return new StakingError(code, fallbackMsg);
    }
}
exports.StakingError = StakingError;
