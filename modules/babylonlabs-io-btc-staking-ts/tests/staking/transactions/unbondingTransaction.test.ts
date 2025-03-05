import { initBTCCurve, unbondingTransaction } from "../../../src";
import { BTC_DUST_SAT } from "../../../src/constants/dustSat";
import { NON_RBF_SEQUENCE, TRANSACTION_VERSION } from "../../../src/constants/psbt";
import { testingNetworks } from "../../helper";

describe.each(testingNetworks)("Transactions - ", (
  { networkName, network, datagen }
) => {
  describe.each(Object.values(datagen))("unbondingTransaction", (
    dataGenerator
  ) => {
    beforeAll(() => {
      initBTCCurve();
    });
    const stakerKeyPair = dataGenerator.generateRandomKeyPair();
    const { stakingTx, stakingAmountSat } = dataGenerator.generateRandomStakingTransaction(
      network, 1, stakerKeyPair
    );
    const stakingScripts =
      dataGenerator.generateMockStakingScripts(stakerKeyPair);

    describe(`${networkName} - `, () => {
      it("should throw an error if the unbonding fee is not postive number", () => {
        expect(() =>
          unbondingTransaction(stakingScripts, stakingTx, 0, network),
        ).toThrow("Unbonding fee must be bigger than 0");
      });
  
      it("should throw if output index is negative", () => {
        expect(() =>
          unbondingTransaction(
            stakingScripts,
            stakingTx,
            dataGenerator.getRandomIntegerBetween(1, 10000),
            network,
            -1,
          ),
        ).toThrow("Output index must be bigger or equal to 0");
      });
  
      it("should throw if output is less than dust limit", () => {
        const unbondingFee = stakingAmountSat - BTC_DUST_SAT + 1;
        expect(() =>
          unbondingTransaction(
            stakingScripts,
            stakingTx,
            unbondingFee,
            network,
            0,
          ),
        ).toThrow("Output value is less than dust limit");
      });
  
      it("should return psbt for unbonding transaction", () => {
        const unbondingFee =
          dataGenerator.getRandomIntegerBetween(
            1,
            stakingAmountSat - BTC_DUST_SAT - 1,
          );
        const { transaction } = unbondingTransaction(
          stakingScripts,
          stakingTx,
          unbondingFee,
          network,
          0,
        );
        expect(transaction).toBeDefined();
        expect(transaction.outs.length).toBe(1);
        // check output value
        expect(transaction.outs[0].value).toBe(stakingAmountSat - unbondingFee);
  
        expect(transaction.locktime).toBe(0);
        expect(transaction.version).toBe(TRANSACTION_VERSION);
        transaction.ins.forEach((input) => {
          expect(input.sequence).toBe(NON_RBF_SEQUENCE);
        });
      });
    });
  });  
});
