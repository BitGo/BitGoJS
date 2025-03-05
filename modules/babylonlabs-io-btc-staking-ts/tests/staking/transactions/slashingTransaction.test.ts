import { payments } from "bitcoinjs-lib";
import {
  slashEarlyUnbondedTransaction,
  slashTimelockUnbondedTransaction,
  unbondingTransaction,
} from "../../../src";
import { BTC_DUST_SAT } from "../../../src/constants/dustSat";
import { internalPubkey } from "../../../src/constants/internalPubkey";
import { DEFAULT_TEST_FEE_RATE, testingNetworks } from "../../helper";
import { NON_RBF_SEQUENCE, TRANSACTION_VERSION } from "../../../src/constants/psbt";
import { getRandomPaymentScriptHex } from "../../helper/datagen/base";

describe.each(testingNetworks)("Transactions - ", (
  {network, networkName, datagen}
) => {
  describe.each(Object.values(datagen))("slashingTransaction - ", (
    dataGenerator
  ) => {
    const stakerKeyPair = dataGenerator.generateRandomKeyPair();
    const stakingScripts =
      dataGenerator.generateMockStakingScripts(stakerKeyPair);
    const { stakingTx, stakingAmountSat} = dataGenerator.generateRandomStakingTransaction(
      network,
      DEFAULT_TEST_FEE_RATE,
      stakerKeyPair,
    );
    const slashingRate = dataGenerator.generateRandomSlashingRate();
    const slashingAmount = Math.floor(stakingAmountSat * slashingRate);
    const minSlashingFee = dataGenerator.getRandomIntegerBetween(
      1,
      stakingAmountSat - slashingAmount - BTC_DUST_SAT - 1,
    );
    const defaultOutputIndex = 0;
    const slashingPkScriptHex = getRandomPaymentScriptHex(
      dataGenerator.generateRandomKeyPair().publicKey,
    );

    describe(`${networkName} - slashTimelockUnbondedTransaction`, () => {
      it("should throw an error if the slashing rate is not between 0 and 1", () => {
        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            0,
            minSlashingFee,
            network,
            defaultOutputIndex,
          ),
        ).toThrow("Slashing rate must be between 0 and 1");

        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            -0.1,
            minSlashingFee,
            network,
            defaultOutputIndex,
          ),
        ).toThrow("Slashing rate must be between 0 and 1");

        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            1,
            minSlashingFee,
            network,
            defaultOutputIndex,
          ),
        ).toThrow("Slashing rate must be between 0 and 1");

        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            1.1,
            minSlashingFee,
            network,
            defaultOutputIndex,
          ),
        ).toThrow("Slashing rate must be between 0 and 1");
      });

      it("should throw an error if minimum slashing fee is less than 0", () => {
        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            slashingRate,
            0,
            network,
            defaultOutputIndex,
          ),
        ).toThrow("Minimum fee must be a positve integer");
      });

      it("should throw an error if minimum slashing fee is not integer", () => {
        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            slashingRate,
            1.2,
            network,
            defaultOutputIndex,
          ),
        ).toThrow("Minimum fee must be a positve integer");
      });

      it("should throw an error if the output index is less than 0", () => {
        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            slashingRate,
            minSlashingFee,
            network,
            -1,
          ),
        ).toThrow("Output index must be an integer bigger or equal to 0");
      });

      it("should throw an error if the output index is not integer", () => {
        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            slashingRate,
            minSlashingFee,
            network,
            1.2,
          ),
        ).toThrow("Output index must be an integer bigger or equal to 0");

        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            slashingRate,
            minSlashingFee,
            network,
            0.5,
          ),
        ).toThrow("Output index must be an integer bigger or equal to 0");
      });

      it("should throw an error if the output index is greater than the number of outputs", () => {
        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            slashingRate,
            minSlashingFee,
            network,
            stakingTx.outs.length,
          ),
        ).toThrow("Output index is out of range");
      });

      it("should throw error if user funds after slashing and fees is less than dust", () => {
        expect(() =>
          slashTimelockUnbondedTransaction(
            stakingScripts,
            stakingTx,
            slashingPkScriptHex,
            slashingRate,
            Math.ceil(stakingAmountSat * (1 - slashingRate) + 1),
            network,
            0,
          ),
        ).toThrow("User funds are less than dust limit");
      });

      it("should create the slashing time lock unbonded tx psbt successfully", () => {
        const { psbt } = slashTimelockUnbondedTransaction(
          stakingScripts,
          stakingTx,
          slashingPkScriptHex,
          slashingRate,
          minSlashingFee,
          network,
          0,
        );

        expect(psbt).toBeDefined();
        expect(psbt.txOutputs.length).toBe(2);
        // first output shall send slashed amount to the slashing script
        expect(Buffer.from(psbt.txOutputs[0].script).toString("hex")).toBe(slashingPkScriptHex);
        expect(psbt.txOutputs[0].value).toBe(
          Math.floor(stakingAmountSat * slashingRate),
        );

        // second output is the change output which send to unbonding timelock script address
        const changeOutput = payments.p2tr({
          internalPubkey,
          scriptTree: { output: stakingScripts.unbondingTimelockScript },
          network,
        });
        expect(psbt.txOutputs[1].address).toBe(changeOutput.address);
        const expectedChangeOutputValue =
          stakingAmountSat -
          Math.floor(stakingAmountSat * slashingRate) -
          minSlashingFee;
        expect(psbt.txOutputs[1].value).toBe(expectedChangeOutputValue);
      });
    });

    describe(`${networkName} slashEarlyUnbondedTransaction - `, () => {
      const { transaction: unbondingTx } = unbondingTransaction(
        stakingScripts,
        stakingTx,
        1,
        network,
      );

      it("should throw an error if the slashing rate is not between 0 and 1", () => {
        expect(() =>
          slashEarlyUnbondedTransaction(
            stakingScripts,
            unbondingTx,
            slashingPkScriptHex,
            0,
            minSlashingFee,
            network,
          ),
        ).toThrow("Slashing rate must be between 0 and 1");

        expect(() =>
          slashEarlyUnbondedTransaction(
            stakingScripts,
            unbondingTx,
            slashingPkScriptHex,
            -0.1,
            minSlashingFee,
            network,
          ),
        ).toThrow("Slashing rate must be between 0 and 1");

        expect(() =>
          slashEarlyUnbondedTransaction(
            stakingScripts,
            unbondingTx,
            slashingPkScriptHex,
            1,
            minSlashingFee,
            network,
          ),
        ).toThrow("Slashing rate must be between 0 and 1");

        expect(() =>
          slashEarlyUnbondedTransaction(
            stakingScripts,
            unbondingTx,
            slashingPkScriptHex,
            1.1,
            minSlashingFee,
            network,
          ),
        ).toThrow("Slashing rate must be between 0 and 1");
      });

      it("should throw an error if minimum slashing fee is less than 0", () => {
        expect(() =>
          slashEarlyUnbondedTransaction(
            stakingScripts,
            unbondingTx,
            slashingPkScriptHex,
            slashingRate,
            0,
            network,
          ),
        ).toThrow("Minimum fee must be a positve integer");
      });

      it("should throw error if user funds is less than dust", () => {
        const { transaction: unbondingTxWithLimitedAmount } = unbondingTransaction(
          stakingScripts,
          stakingTx,
          1,
          network,
        );
        expect(() =>
          slashEarlyUnbondedTransaction(
            stakingScripts,
            unbondingTxWithLimitedAmount,
            slashingPkScriptHex,
            slashingRate,
            Math.ceil(stakingAmountSat * (1 - slashingRate) + 1),
            network,
          ),
        ).toThrow("User funds are less than dust limit");
      });

      it("should throw if its slashing amount is less than dust", () => {
        const smallSlashingRate = BTC_DUST_SAT / stakingAmountSat;
        expect(() => 
          slashEarlyUnbondedTransaction(
            stakingScripts,
            unbondingTx,
            slashingPkScriptHex,
            smallSlashingRate,
            minSlashingFee,
            network,
          )
        ).toThrow("Slashing amount is less than dust limit");
      });

      it("should create the slashing time lock unbonded tx psbt successfully", () => {
        const { psbt } = slashEarlyUnbondedTransaction(
          stakingScripts,
          unbondingTx,
          slashingPkScriptHex,
          slashingRate,
          minSlashingFee,
          network,
        );

        const unbondingTxOutputValue = unbondingTx.outs[0].value;

        expect(psbt).toBeDefined();
        expect(psbt.txOutputs.length).toBe(2);
        // first output shall send slashed amount to the slashing pk script (i.e burn output)
        expect(Buffer.from(psbt.txOutputs[0].script).toString("hex")).toBe(slashingPkScriptHex);
        expect(psbt.txOutputs[0].value).toBe(
          Math.floor(unbondingTxOutputValue * slashingRate),
        );

        // second output is the change output which send to unbonding timelock script address
        const changeOutput = payments.p2tr({
          internalPubkey,
          scriptTree: { output: stakingScripts.unbondingTimelockScript },
          network,
        });
        expect(psbt.txOutputs[1].address).toBe(changeOutput.address);
        const expectedChangeOutputValue =
          unbondingTxOutputValue -
          Math.floor(unbondingTxOutputValue * slashingRate) -
          minSlashingFee;
        expect(psbt.txOutputs[1].value).toBe(expectedChangeOutputValue);

        expect(psbt.version).toBe(TRANSACTION_VERSION);
        expect(psbt.locktime).toBe(0);
        psbt.txInputs.forEach((input) => {
          expect(input.sequence).toBe(NON_RBF_SEQUENCE);
        });
      });
    });
  });  
});
