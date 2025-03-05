import { Staking } from "../../src/staking";
import * as transaction from "../../src/staking/transactions";
import { internalPubkey } from "../../src/constants/internalPubkey";
import { StakingError, StakingErrorCode } from "../../src/error";
import { testingNetworks } from "../helper";
import { NON_RBF_SEQUENCE } from "../../src/constants/psbt";
import * as stakingScript from "../../src/staking/stakingScript";
import { deriveStakingOutputInfo, findMatchingTxOutputIndex } from "../../src/utils/staking";

describe.each(testingNetworks)("Create unbonding transaction", ({
  network, networkName, datagen: { stakingDatagen : dataGenerator }
}) => {
  const feeRate = 1;
  const {
    stakingTx,
    timelock,
    stakerInfo,
    params,
    finalityProviderPkNoCoordHex,
    stakingAmountSat,
  } = dataGenerator.generateRandomStakingTransaction(
    network,
    feeRate,
  );
  let staking: Staking;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPkNoCoordHex, timelock,
    );
  });

  it(`${networkName} should throw an error if fail to build scripts`, async () => {
    jest.spyOn(stakingScript, "StakingScriptData").mockImplementation(() => {
      throw new StakingError(StakingErrorCode.SCRIPT_FAILURE, "build script error");
    });

    expect(() => staking.createUnbondingTransaction(
      stakingTx,
    )).toThrow("build script error");
  });

  it(`${networkName} should throw an error if fail to build unbonding tx`, async () => {
    jest.spyOn(transaction, "unbondingTransaction").mockImplementation(() => {
      throw new Error("fail to build unbonding tx");
    });
    expect(() => staking.createUnbondingTransaction(
      stakingTx,
    )).toThrow("fail to build unbonding tx");
  });

  it(`${networkName} should successfully create an unbonding transaction & psbt`, async () => {
    // Create transaction and psbt
    const { transaction } = staking.createUnbondingTransaction(stakingTx);
    const scripts = staking.buildScripts();
    const psbt = staking.toUnbondingPsbt(transaction, stakingTx);

    // Basic validation
    expect(transaction.version).toBe(2);
    expect(psbt.version).toBe(2);
    expect(transaction.locktime).toBe(0);
    expect(psbt.locktime).toBe(0);

    // Get staking output index
    const stakingOutputIndex = findMatchingTxOutputIndex(
      stakingTx,
      deriveStakingOutputInfo(scripts, network).outputAddress,
      network,
    );

    // Validate inputs
    expect(transaction.ins.length).toBe(1);
    expect(psbt.data.inputs.length).toBe(1);
    expect(transaction.ins[0].hash).toEqual(stakingTx.getHash());
    expect(psbt.txInputs[0].hash).toEqual(stakingTx.getHash());
    expect(transaction.ins[0].index).toEqual(stakingOutputIndex);
    expect(psbt.txInputs[0].index).toEqual(stakingOutputIndex);
    expect(transaction.ins[0].sequence).toEqual(NON_RBF_SEQUENCE);
    expect(psbt.txInputs[0].sequence).toEqual(NON_RBF_SEQUENCE);

    // Validate PSBT input details
    expect(psbt.data.inputs[0].tapInternalKey).toEqual(internalPubkey);
    expect(psbt.data.inputs[0].tapLeafScript?.length).toBe(1);
    expect(psbt.data.inputs[0].witnessUtxo?.value).toEqual(stakingAmountSat);
    expect(psbt.data.inputs[0].witnessUtxo?.script).toEqual(
      stakingTx.outs[stakingOutputIndex].script
    );

    // Validate outputs
    expect(transaction.outs.length).toBe(1);
    expect(psbt.txOutputs.length).toBe(1);
    expect(transaction.outs[0].value).toEqual(stakingAmountSat - params.unbondingFeeSat);
    expect(psbt.txOutputs[0].value).toEqual(stakingAmountSat - params.unbondingFeeSat);

    // Validate transaction and psbt match
    expect(psbt.txOutputs[0].script).toEqual(transaction.outs[0].script);
  });
});