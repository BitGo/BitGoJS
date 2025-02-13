export enum StakingErrorCode {
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_OUTPUT = "INVALID_OUTPUT",
  SCRIPT_FAILURE = "SCRIPT_FAILURE",
  BUILD_TRANSACTION_FAILURE = "BUILD_TRANSACTION_FAILURE",
  INVALID_PARAMS = "INVALID_PARAMS",
}

export class StakingError extends Error {
  public code: StakingErrorCode;
  constructor(code: StakingErrorCode, message?: string) {
    super(message);
    this.code = code;
  }

  // Static method to safely handle unknown errors
  static fromUnknown(
    error: unknown, code: StakingErrorCode, fallbackMsg?: string
  ): StakingError {
    if (error instanceof StakingError) {
      return error;
    }

    if (error instanceof Error) {
      return new StakingError(code, error.message);
    }
    return new StakingError(code, fallbackMsg);
  }
}