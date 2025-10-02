export declare enum StakingErrorCode {
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    INVALID_OUTPUT = "INVALID_OUTPUT",
    SCRIPT_FAILURE = "SCRIPT_FAILURE",
    BUILD_TRANSACTION_FAILURE = "BUILD_TRANSACTION_FAILURE",
    INVALID_PARAMS = "INVALID_PARAMS"
}
export declare class StakingError extends Error {
    code: StakingErrorCode;
    constructor(code: StakingErrorCode, message?: string);
    static fromUnknown(error: unknown, code: StakingErrorCode, fallbackMsg?: string): StakingError;
}
