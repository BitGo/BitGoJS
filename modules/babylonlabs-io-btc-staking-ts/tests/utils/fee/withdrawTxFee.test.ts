import {
  LOW_RATE_ESTIMATION_ACCURACY_BUFFER,
  MAX_NON_LEGACY_OUTPUT_SIZE,
  P2TR_INPUT_SIZE,
  TX_BUFFER_SIZE_OVERHEAD,
  WITHDRAW_TX_BUFFER_SIZE,
} from "../../../src/constants/fee";
import { getWithdrawTxFee } from "../../../src/utils/fee";

describe("getWithdrawTxFee", () => {
  it("should calculate the correct withdraw transaction fee for a given fee rate", () => {
    const feeRate = Math.floor(Math.random() * 100);
    let expectedTotalFee =
      feeRate *
      (P2TR_INPUT_SIZE +
        MAX_NON_LEGACY_OUTPUT_SIZE +
        WITHDRAW_TX_BUFFER_SIZE +
        TX_BUFFER_SIZE_OVERHEAD);
    if (feeRate <= 2) {
      expectedTotalFee += LOW_RATE_ESTIMATION_ACCURACY_BUFFER;
    }
    const actualFee = getWithdrawTxFee(feeRate);

    expect(actualFee).toBe(expectedTotalFee);
  });
});
