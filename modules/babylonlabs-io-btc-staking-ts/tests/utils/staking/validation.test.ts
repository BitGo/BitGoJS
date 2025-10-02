import { validateStakingExpansionCovenantQuorum, validateStakingExpansionInputs, validateStakingTxInputData } from "../../../src/utils/staking/validation";
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

describe("validateStakingExpansionInputs", () => {
  const [mainnet] = testingNetworks;
  const { datagen: { stakingDatagen }, network } = mainnet;

  const babylonAddress = "bbn1cyqgpk0nlsutlm5ymkfpya30fqntanc8slpure";
  const stakerKeyPair = stakingDatagen.generateRandomKeyPair();
  const {
    stakingAmountSat,
    finalityProviderPksNoCoordHex,
    timelock,
    utxos
  } = stakingDatagen.generateRandomStakingTransaction(network, 1, stakerKeyPair);

  it("should pass with valid staking expansion inputs", () => {
    expect(() =>
      validateStakingExpansionInputs({
        babylonBtcTipHeight: 1,
        inputUTXOs: utxos,
        stakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        previousStakingInput: {
          finalityProviderPksNoCoordHex: finalityProviderPksNoCoordHex.slice(0, 1),
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        babylonAddress: babylonAddress,
      })
    ).not.toThrow();
  });

  it("should throw an error if the previous staking has more finality providers than the current staking", () => {
    const extraFp = stakingDatagen.generateRandomFidelityProviderPksNoCoordHex(1);
    expect(() =>
      validateStakingExpansionInputs({
        babylonBtcTipHeight: 1,
        inputUTXOs: utxos,
        stakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        previousStakingInput: {
          finalityProviderPksNoCoordHex: [
            ...finalityProviderPksNoCoordHex,
            ...extraFp,
          ],
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        babylonAddress: babylonAddress,
      })
    ).toThrow(
      `Invalid staking expansion: all finality providers from the previous
      staking must be included. Missing: ${extraFp.join(", ")}`,
    );
  });

  it("should throw an error if the babylon address is invalid", () => {
    expect(() =>
      validateStakingExpansionInputs({
        babylonBtcTipHeight: 1,
        inputUTXOs: utxos,
        stakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        previousStakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        babylonAddress: "invalid",
      })
    ).toThrow("Invalid Babylon address");
  });

  it("should throw an error if the babylon BTC tip height is 0", () => {
    expect(() =>
      validateStakingExpansionInputs({
        babylonBtcTipHeight: 0,
        inputUTXOs: utxos,
        stakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        previousStakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat,
          stakingTimelock: timelock,
        },
      })
    ).toThrow("Babylon BTC tip height cannot be 0");
  });

  it("should throw an error if no input UTXOs are provided", () => {
    expect(() =>
      validateStakingExpansionInputs({
        babylonBtcTipHeight: 1,
        inputUTXOs: [],
        stakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        previousStakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        babylonAddress: babylonAddress,
      })
    ).toThrow("No input UTXOs provided");
  });

  it("should throw an error if the staking amount is not equal to the previous staking amount", () => {
    expect(() =>
      validateStakingExpansionInputs({
        babylonBtcTipHeight: 1,
        inputUTXOs: utxos,
        stakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat: stakingAmountSat - 1,
          stakingTimelock: timelock,
        },
        previousStakingInput: {
          finalityProviderPksNoCoordHex,
          stakingAmountSat,
          stakingTimelock: timelock,
        },
        babylonAddress: babylonAddress,
      })
    ).toThrow("Staking expansion amount must equal the previous staking amount");
  });
});

describe.each(testingNetworks)("validateStakingExpansionCovenantQuorum", (
  { datagen: { stakingDatagen } }
) => {
  const previousParams = stakingDatagen.generateStakingParams(true, 10);
  const {
    covenantQuorum: requiredQuorum,
  } = previousParams;

  it("should pass with valid same staking parameters", () => {
    expect(() =>
      validateStakingExpansionCovenantQuorum(previousParams, previousParams)
    ).not.toThrow();
  });

  it("should throw an error if the previous staking has less covenant members than the required quorum", () => {
    // Replace the previous covenant members with new ones.
    // The replaced number of members matches the quorum.
    const newParams = JSON.parse(JSON.stringify(previousParams));
    const newCovenantNoCoordPks = stakingDatagen.generateRandomCovenantCommittee(requiredQuorum).map(
      (buffer) => buffer.toString("hex"),
    );
    const { covenantNoCoordPks } = newParams;
    
    newParams.covenantNoCoordPks = covenantNoCoordPks.slice(
      requiredQuorum, covenantNoCoordPks.length
    ).concat(newCovenantNoCoordPks);
    
    expect(() =>
      validateStakingExpansionCovenantQuorum(previousParams, newParams)
    ).toThrow(
      `Staking expansion failed: insufficient covenant quorum. ` +
      `Required: ${requiredQuorum}, Available: ${covenantNoCoordPks.length - requiredQuorum}. ` +
      `Too many covenant members have rotated out.`
    );
  });

  it("should pass with number of rotated out covenant members less than the required quorum", () => {
    // Replace the previous covenant members with new ones.
    // The replaced number of members matches the quorum.
    const newParams = JSON.parse(JSON.stringify(previousParams));
    const newCovenantNoCoordPks = stakingDatagen.generateRandomCovenantCommittee(requiredQuorum-1).map(
      (buffer) => buffer.toString("hex"),
    );
    const { covenantNoCoordPks } = newParams;
    
    newParams.covenantNoCoordPks = covenantNoCoordPks.slice(
      0, requiredQuorum
    ).concat(newCovenantNoCoordPks);
    
    expect(() =>
      validateStakingExpansionCovenantQuorum(previousParams, newParams)
    ).not.toThrow();
  });
});