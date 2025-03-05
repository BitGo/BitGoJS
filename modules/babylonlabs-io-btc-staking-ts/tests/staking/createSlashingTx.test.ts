import * as stakingScript from "../../src/staking/stakingScript";
import { testingNetworks } from "../helper";
import * as transaction from "../../src/staking/transactions";
import { opcodes, payments, script } from "bitcoinjs-lib";
import { internalPubkey } from "../../src/constants/internalPubkey";

describe.each(testingNetworks)("Create slashing transactions", ({
  network, networkName, datagen: { stakingDatagen: dataGenerator }
}) => {
  const {
    stakingTx, timelock, stakingInstance, finalityProviderPkNoCoordHex,
    stakerInfo, params, stakingAmountSat,
  } = dataGenerator.generateRandomStakingTransaction(
    network, 1
  );
  
  const { transaction: unbondingTx } = stakingInstance.createUnbondingTransaction(
    stakingTx,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("Create slash early unbonded transaction", () => {
    it(`${networkName} should throw an error if fail to build scripts`, () => {
      jest.spyOn(stakingScript, "StakingScriptData").mockImplementation(() => {
        throw new Error("slash early unbonded delegation build script error");
      });
      
      expect(() => stakingInstance.createUnbondingOutputSlashingPsbt(
        unbondingTx,
      )).toThrow("slash early unbonded delegation build script error");
    });

    it(`${networkName} should throw an error if fail to build early unbonded slash tx`, () => {
      jest.spyOn(transaction, "slashEarlyUnbondedTransaction").mockImplementation(() => {
        throw new Error("fail to build slash tx");
      });
      expect(() => stakingInstance.createUnbondingOutputSlashingPsbt(
        unbondingTx,
      )).toThrow("fail to build slash tx");
    });

    it(`${networkName} should create slash early unbonded transaction`, () => {
      const slashTx = stakingInstance.createUnbondingOutputSlashingPsbt(
        unbondingTx,
      );
      expect(slashTx.psbt.txInputs.length).toBe(1)
      expect(slashTx.psbt.txInputs[0].hash.toString("hex")).
        toBe(unbondingTx.getHash().toString("hex"));
      expect(slashTx.psbt.txInputs[0].index).toBe(0);
      // verify outputs
      expect(slashTx.psbt.txOutputs.length).toBe(2);
      // slash amount
      const stakingAmountLeftInUnbondingTx = unbondingTx.outs[0].value;
      const slashAmount = Math.floor(stakingAmountLeftInUnbondingTx * params.slashing!.slashingRate);
      expect(slashTx.psbt.txOutputs[0].value).toBe(
        slashAmount,
      );
      expect(Buffer.from(slashTx.psbt.txOutputs[0].script).toString("hex")).toBe(
        params.slashing!.slashingPkScriptHex
      );
      // change output
      const unbondingTimelockScript = script.compile([
        Buffer.from(stakerInfo.publicKeyNoCoordHex, "hex"),
        opcodes.OP_CHECKSIGVERIFY,
        script.number.encode(params.unbondingTime),
        opcodes.OP_CHECKSEQUENCEVERIFY,
      ]);
      const { address } = payments.p2tr({
        internalPubkey,
        scriptTree: { output: unbondingTimelockScript },
        network,
      });
      expect(slashTx.psbt.txOutputs[1].address).toBe(address);
      const userFunds = stakingAmountLeftInUnbondingTx - slashAmount - params.slashing!.minSlashingTxFeeSat;
      expect(slashTx.psbt.txOutputs[1].value).toBe(userFunds);
      expect(slashTx.psbt.locktime).toBe(0);
      expect(slashTx.psbt.version).toBe(2);
    });
  });

  describe("Create slash timelock unbonded transaction", () => {
    it(`${networkName} should throw an error if fail to build scripts`, async () => {
      jest.spyOn(stakingScript, "StakingScriptData").mockImplementation(() => {
        throw new Error("slash timelock unbonded delegation build script error");
      });

      expect(() => stakingInstance.createStakingOutputSlashingPsbt(
        stakingTx,
      )).toThrow("slash timelock unbonded delegation build script error");
    });

    it(`${networkName} should throw an error if fail to build timelock unbonded slash tx`, async () => {
      jest.spyOn(transaction, "slashTimelockUnbondedTransaction").mockImplementation(() => {
        throw new Error("fail to build slash tx");
      });

      expect(() => stakingInstance.createStakingOutputSlashingPsbt(
        stakingTx,
      )).toThrow("fail to build slash tx");
    });

    it(`${networkName} should create slash timelock unbonded transaction`, async () => {
      const slashTx = stakingInstance.createStakingOutputSlashingPsbt(
        stakingTx,
      );
      expect(slashTx.psbt.txInputs.length).toBe(1)
      expect(slashTx.psbt.txInputs[0].hash.toString("hex")).
        toBe(stakingTx.getHash().toString("hex"));
      expect(slashTx.psbt.txInputs[0].index).toBe(0);
      // verify outputs
      expect(slashTx.psbt.txOutputs.length).toBe(2);
      // slash amount
      const slashAmount = Math.floor(stakingAmountSat * params.slashing!.slashingRate);
      expect(slashTx.psbt.txOutputs[0].value).toBe(
        slashAmount,
      );
      expect(Buffer.from(slashTx.psbt.txOutputs[0].script).toString("hex")).toBe(
        params.slashing!.slashingPkScriptHex
      );
      // change output
      const unbondingTimelockScript = script.compile([
        Buffer.from(stakerInfo.publicKeyNoCoordHex, "hex"),
        opcodes.OP_CHECKSIGVERIFY,
        script.number.encode(params.unbondingTime),
        opcodes.OP_CHECKSEQUENCEVERIFY,
      ]);
      const { address } = payments.p2tr({
        internalPubkey,
        scriptTree: { output: unbondingTimelockScript },
        network,
      });
      expect(slashTx.psbt.txOutputs[1].address).toBe(address);
      const userFunds = stakingAmountSat - slashAmount - params.slashing!.minSlashingTxFeeSat;
      expect(slashTx.psbt.txOutputs[1].value).toBe(userFunds);
      expect(slashTx.psbt.locktime).toBe(0);
      expect(slashTx.psbt.version).toBe(2);
    });
  });
});

