import * as stakingScript from "../../src/staking/stakingScript";
import { testingNetworks } from "../helper";
import * as transaction from "../../src/staking/transactions";
import { getWithdrawTxFee } from "../../src/utils/fee";

describe.each(testingNetworks)("Create withdrawal transactions", ({
  network, networkName, datagen: { stakingDatagen: dataGenerator }
}) => {
  const feeRate = 1;
  const {
    stakingTx,
    stakerInfo,
    stakingInstance,
  } = dataGenerator.generateRandomStakingTransaction(
    network, feeRate,
  );
  
  const { transaction: unbondingTx } = stakingInstance.createUnbondingTransaction(
    stakingTx,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("Create withdraw early unbonded transaction", () => {
    it(`${networkName} should throw an error if fail to build scripts`, () => {
      jest.spyOn(stakingScript, "StakingScriptData").mockImplementation(() => {
        throw new Error("withdraw early unbonded delegation build script error");
      });
      
      expect(() => stakingInstance.createWithdrawEarlyUnbondedTransaction(
        unbondingTx,
        feeRate,
      )).toThrow("withdraw early unbonded delegation build script error");
    });

    it(`${networkName} should throw an error if fail to build early unbonded withdraw tx`, () => {
      jest.spyOn(transaction, "withdrawEarlyUnbondedTransaction").mockImplementation(() => {
        throw new Error("fail to build withdraw tx");
      });
      expect(() => stakingInstance.createWithdrawEarlyUnbondedTransaction(
        unbondingTx,
        feeRate,
      )).toThrow("fail to build withdraw tx");
    });

    it(`${networkName} should create withdraw early unbonded transaction`, () => {
      const withdrawTx = stakingInstance.createWithdrawEarlyUnbondedTransaction(
        unbondingTx,
        feeRate,
      );
      expect(withdrawTx.psbt.txInputs.length).toBe(1)
      expect(withdrawTx.psbt.txInputs[0].hash.toString("hex")).
        toBe(unbondingTx.getHash().toString("hex"));
      expect(withdrawTx.psbt.txInputs[0].index).toBe(0);
      expect(withdrawTx.psbt.txOutputs.length).toBe(1);
      const fee = getWithdrawTxFee(feeRate);
      expect(withdrawTx.psbt.txOutputs[0].value).toBe(
        unbondingTx.outs[0].value - fee,
      );
      expect(withdrawTx.psbt.txOutputs[0].address).toBe(stakerInfo.address);
      expect(withdrawTx.psbt.locktime).toBe(0);
      expect(withdrawTx.psbt.version).toBe(2);
    });
  });

  describe("Create timelock unbonded transaction", () => {
    it(`${networkName} should throw an error if fail to build scripts`, async () => {
      jest.spyOn(stakingScript, "StakingScriptData").mockImplementation(() => {
        throw new Error("withdraw timelock unbonded delegation build script error");
      });
      expect(() => stakingInstance.createWithdrawStakingExpiredPsbt(
        stakingTx,
        feeRate,
      )).toThrow("withdraw timelock unbonded delegation build script error");
    });

    it(`${networkName} should throw an error if fail to build timelock unbonded withdraw tx`, async () => {
      jest.spyOn(transaction, "withdrawTimelockUnbondedTransaction").mockImplementation(() => {
        throw new Error("fail to build withdraw tx");
      });

      expect(() => stakingInstance.createWithdrawStakingExpiredPsbt(
        stakingTx,
        feeRate,
      )).toThrow("fail to build withdraw tx");
    });

    it(`${networkName} should create withdraw timelock unbonded transaction`, async () => {
      const withdrawTx = stakingInstance.createWithdrawStakingExpiredPsbt(
        stakingTx,
        feeRate,
      );
      expect(withdrawTx.psbt.txInputs.length).toBe(1)
      expect(withdrawTx.psbt.txInputs[0].hash.toString("hex")).
        toBe(stakingTx.getHash().toString("hex"));
      expect(withdrawTx.psbt.txInputs[0].index).toBe(0);
      expect(withdrawTx.psbt.txOutputs.length).toBe(1);
      const fee = getWithdrawTxFee(feeRate);
      expect(withdrawTx.psbt.txOutputs[0].value).toBe(
        stakingTx.outs[0].value - fee,
      );
      expect(withdrawTx.psbt.txOutputs[0].address).toBe(stakerInfo.address);
      expect(withdrawTx.psbt.locktime).toBe(0);
      expect(withdrawTx.psbt.version).toBe(2);
    });
  });
});

