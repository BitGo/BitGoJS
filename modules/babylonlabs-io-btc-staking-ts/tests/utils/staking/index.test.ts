import { validateStakingTxInputData } from "../../../src/utils/staking";
import { testingNetworks } from "../../helper";

describe.each(testingNetworks)('validateStakingTxInputData', (
  { datagen }
) => {
  describe.each(Object.values(datagen))('validateStakingTxInputData', (
    dataGenerator
  ) => {
    const params = dataGenerator.generateStakingParams();
    const balance = dataGenerator.getRandomIntegerBetween(
      params.maxStakingAmountSat, params.maxStakingAmountSat + 100000000,
    );
    const numberOfUTXOs = dataGenerator.getRandomIntegerBetween(1, 10);
    const validInputUTXOs = dataGenerator.generateRandomUTXOs(balance, numberOfUTXOs);
    const feeRate = 1;

    it('should pass with valid staking amount, term, UTXOs, and fee rate', () => {
      expect(() =>
        validateStakingTxInputData(
          params.minStakingAmountSat,
          params.minStakingTimeBlocks,
          params,
          validInputUTXOs,
          feeRate,
        )
      ).not.toThrow();
    });

    it('should throw an error if staking amount is less than the minimum', () => {
      expect(() =>
        validateStakingTxInputData(
          params.minStakingAmountSat -1 ,
          params.minStakingTimeBlocks,
          params,
          validInputUTXOs,
          feeRate,
        )
      ).toThrow('Invalid staking amount');
    });

    it('should throw an error if staking amount is greater than the maximum', () => {
      expect(() =>
        validateStakingTxInputData(
          params.maxStakingAmountSat + 1 ,
          params.minStakingTimeBlocks,
          params,
          validInputUTXOs,
          feeRate,
        )
      ).toThrow('Invalid staking amount');
    });

    it('should throw an error if time lock is less than the minimum', () => {
      expect(() =>
        validateStakingTxInputData(
          params.maxStakingAmountSat,
          params.minStakingTimeBlocks -1 ,
          params,
          validInputUTXOs,
          feeRate,
        )
      ).toThrow('Invalid timelock');
    });

    it('should throw an error if time lock is greater than the maximum', () => {
      expect(() =>
        validateStakingTxInputData(
          params.maxStakingAmountSat,
          params.maxStakingTimeBlocks + 1 ,
          params,
          validInputUTXOs,
          feeRate,
        )
      ).toThrow('Invalid timelock');
    });

    it('should throw an error if no input UTXOs are provided', () => {
      expect(() =>
        validateStakingTxInputData(
          params.maxStakingAmountSat,
          params.maxStakingTimeBlocks,
          params,
          [],
          feeRate,
        )
      ).toThrow('No input UTXOs provided');
    });

    it('should throw an error if fee rate is less than or equal to zero', () => {
      expect(() =>
        validateStakingTxInputData(
          params.maxStakingAmountSat,
          params.maxStakingTimeBlocks,
          params,
          validInputUTXOs,
          0,
        )
      ).toThrow('Invalid fee rate');
    });
  });
});