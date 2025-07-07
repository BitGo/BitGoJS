import { address } from "bitcoinjs-lib";
import { ObservableStaking, transactionIdToHash } from "../../../src";
import * as observableStakingScriptData from "../../../src/staking/observable/observableStakingScript";
import { testingNetworks } from "../../helper";
import { ObservableVersionedStakingParams } from "../../../src/types/params";
import { UTXO } from "../../../src/types/UTXO";
import { StakingError, StakingErrorCode } from "../../../src/error";
import { BTC_DUST_SAT } from "../../../src/constants/dustSat";
import { NON_RBF_SEQUENCE } from "../../../src/constants/psbt";
import * as stakingUtils from "../../../src/utils/staking";
import * as staking from "../../../src/staking/transactions";

describe.each(testingNetworks)("Observal - Create staking transaction", ({
  network, networkName, datagen: { observableStakingDatagen: dataGenerator }
}) => {
  let stakerInfo: { address: string, publicKeyNoCoordHex: string, publicKeyWithCoord: string };
  let finalityProviderPkNoCoord: string;
  let params: ObservableVersionedStakingParams;
  let timelock: number;
  let utxos: UTXO[];
  const feeRate = 1;
  let observableStaking: ObservableStaking;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();

    const { publicKey, publicKeyNoCoord} = dataGenerator.generateRandomKeyPair();
    const { address, scriptPubKey } = dataGenerator.getAddressAndScriptPubKey(
      publicKey,
    ).taproot;
    stakerInfo = {
      address,
      publicKeyNoCoordHex: publicKeyNoCoord,
      publicKeyWithCoord: publicKey,
    };
    finalityProviderPkNoCoord = dataGenerator.generateRandomKeyPair().publicKeyNoCoord;
    params = dataGenerator.generateStakingParams(true);
    timelock = dataGenerator.generateRandomTimelock(params);
    utxos = dataGenerator.generateRandomUTXOs(
      params.maxStakingAmountSat * dataGenerator.getRandomIntegerBetween(1, 100),
      dataGenerator.getRandomIntegerBetween(1, 10),
      scriptPubKey,
    );
    observableStaking = new ObservableStaking(
      network, stakerInfo,
      params, finalityProviderPkNoCoord, timelock,
    );
  });

  it(`${networkName} should throw an error if input data validation failed`, async () => {  
    jest.spyOn(stakingUtils, "validateStakingTxInputData").mockImplementation(() => {
      throw new StakingError(StakingErrorCode.INVALID_INPUT, "some error");
    });

    expect(() => observableStaking.createStakingTransaction(
      params.minStakingAmountSat,
      utxos,
      feeRate,
    )).toThrow(
      new StakingError(StakingErrorCode.INVALID_INPUT, "some error")
    );
  });

  it(`${networkName} should throw an error if fail to build scripts`, async () => {
    jest.spyOn(observableStakingScriptData, "ObservableStakingScriptData").mockImplementation(() => {
      throw new StakingError(StakingErrorCode.SCRIPT_FAILURE, "some error");
    });
    expect(() => observableStaking.createStakingTransaction(
      params.minStakingAmountSat,
      utxos,
      feeRate,
    )).toThrow(
      new StakingError(StakingErrorCode.SCRIPT_FAILURE, "some error")
    );
  });

  it(`${networkName} should throw an error if fail to build staking tx`, async () => {
    jest.spyOn(staking, "stakingTransaction").mockImplementation(() => {
      throw new Error("fail to build staking tx");
    });

    expect(() => observableStaking.createStakingTransaction(
      params.minStakingAmountSat,
      utxos,
      feeRate,
    )).toThrow(
      new StakingError(StakingErrorCode.BUILD_TRANSACTION_FAILURE, "fail to build staking tx")
    );
  });

  it(`${networkName} should successfully create a observable staking transaction`, async () => {
    const amount = dataGenerator.getRandomIntegerBetween(
      params.minStakingAmountSat, params.maxStakingAmountSat,
    );
    const { transaction, fee} = observableStaking.createStakingTransaction(
      amount,
      utxos,
      feeRate,
    );

    expect(transaction).toBeDefined();
    expect(fee).toBeGreaterThan(0);
    
    const psbt = observableStaking.toStakingPsbt(transaction, utxos);
    // Check the inputs
    expect(transaction.ins.length).toBeGreaterThan(0);

    // Check the outputs
    expect(transaction.outs.length).toBeGreaterThanOrEqual(1);
    // build the psbt input amount from psbt.data.inputs
    let psbtInputAmount = 0;
    for (let i = 0; i < psbt.data.inputs.length; i++) {
      const newValue = psbt.data.inputs[i].witnessUtxo?.value || 0;
      psbtInputAmount += newValue;
    }
    const psbtChangeAmount = psbtInputAmount - amount - fee;

    let txInputAmount = 0;
    for (let i = 0; i < transaction.ins.length; i++) {
      const input = transaction.ins[i];
      const utxo = utxos.find(u =>
        transactionIdToHash(u.txid).toString("hex") === input.hash.toString("hex")
          && u.vout === input.index,
      );
      txInputAmount += utxo?.value || 0;
    }
    const changeAmount = txInputAmount - amount - fee;
    expect(txInputAmount).toBeGreaterThanOrEqual(amount + fee);
    if (changeAmount > BTC_DUST_SAT) {
      expect(transaction.outs[transaction.outs.length - 1].value).toEqual(changeAmount);
      expect(transaction.outs[transaction.outs.length - 1].script)
        .toEqual(address.toOutputScript(stakerInfo.address, network));
    }
    expect(transaction.outs[0].value).toEqual(amount);
    expect(psbt.txOutputs[0].value).toEqual(amount);


    // Check the psbt properties
    expect(transaction.locktime).toBe(params.btcActivationHeight - 1);
    expect(transaction.version).toBe(2);
    transaction.ins.map((input) => {
      expect(input.sequence).toBe(NON_RBF_SEQUENCE);
    });

    // Check the data embed script(OP_RETURN)
    const scripts = observableStaking.buildScripts();
    const dataEmbedOutput = transaction.outs.find((output) =>
      output.script.equals(scripts.dataEmbedScript),
    );
    expect(dataEmbedOutput).toBeDefined();

    expect(psbtChangeAmount).toEqual(changeAmount);
    expect(psbtInputAmount).toEqual(txInputAmount);
    // lock time and version are the same between psbt and transaction
    expect(psbt.locktime).toEqual(transaction.locktime);
    expect(psbt.version).toEqual(transaction.version);
  });
});