import { address } from "bitcoinjs-lib";
import * as stakingScript from "../../src/staking/stakingScript";
import { testingNetworks } from "../helper";
import { StakingParams } from "../../src/types/params";
import { UTXO } from "../../src/types/UTXO";
import { StakingError, StakingErrorCode } from "../../src/error";
import { BTC_DUST_SAT } from "../../src/constants/dustSat";
import { NON_RBF_SEQUENCE } from "../../src/constants/psbt";
import * as stakingUtils from "../../src/utils/staking";
import * as stakingTx from "../../src/staking/transactions";
import { transactionIdToHash } from "../../src";
import { Staking } from "../../src/staking";

describe.each(testingNetworks)("Create staking transaction", ({
  network, networkName, datagen: { stakingDatagen: dataGenerator }
}) => {
  let stakerInfo: { address: string, publicKeyNoCoordHex: string, publicKeyWithCoord: string };
  let finalityProviderPublicKey: string;
  let params: StakingParams;
  let timelock: number;
  let utxos: UTXO[];
  const feeRate = 1;

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
    finalityProviderPublicKey = dataGenerator.generateRandomKeyPair().publicKeyNoCoord;
    params = dataGenerator.generateStakingParams(true);
    timelock = dataGenerator.generateRandomTimelock(params);
    utxos = dataGenerator.generateRandomUTXOs(
      params.maxStakingAmountSat * dataGenerator.getRandomIntegerBetween(1, 100),
      dataGenerator.getRandomIntegerBetween(1, 10),
      scriptPubKey,
    );
  });

  it(`${networkName} throw StakingError if stakerInfo is incorrect`, async () => {
    const stakerInfoWithCoordPk = {
      address: stakerInfo.address,
      publicKeyNoCoordHex: stakerInfo.publicKeyWithCoord,
    };
    expect(() => new Staking(
      network, stakerInfoWithCoordPk,
      params, finalityProviderPublicKey, timelock,
    )).toThrow(
      "Invalid staker public key"
    );

    const stakerInfoWithInvalidAddress = {
      address: "abc",
      publicKeyNoCoordHex: stakerInfo.publicKeyNoCoordHex,
    };
    expect(() => new Staking(
      network, stakerInfoWithInvalidAddress,
      params, finalityProviderPublicKey, timelock,
    )).toThrow(
      "Invalid staker bitcoin address"
    );
  });

  it(`${networkName} should throw an error if input data validation failed`, async () => {  
    jest.spyOn(stakingUtils, "validateStakingTxInputData").mockImplementation(() => {
      throw new StakingError(StakingErrorCode.INVALID_INPUT, "some error");
    });
    const staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPublicKey, timelock,
    );

    expect(() => staking.createStakingTransaction(
      params.minStakingAmountSat,
      utxos,
      feeRate,
    )).toThrow(
      new StakingError(StakingErrorCode.INVALID_INPUT, "some error")
    );
  });

  it(`${networkName} should throw an error if fail to build scripts`, async () => {
    jest.spyOn(stakingScript, "StakingScriptData").mockImplementation(() => {
      throw new StakingError(StakingErrorCode.SCRIPT_FAILURE, "some error");
    });
    const staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPublicKey, timelock,
    );

    expect(() => staking.createStakingTransaction(
      params.minStakingAmountSat,
      utxos,
      feeRate,
    )).toThrow(
      new StakingError(StakingErrorCode.SCRIPT_FAILURE, "some error")
    );
  });

  it(`${networkName} should throw an error if fail to build staking tx`, async () => {
    jest.spyOn(stakingTx, "stakingTransaction").mockImplementation(() => {
      throw new Error("fail to build staking tx");
    });
    const staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPublicKey, timelock,
    );

    expect(() => staking.createStakingTransaction(
      params.minStakingAmountSat,
      utxos,
      feeRate,
    )).toThrow(
      new StakingError(StakingErrorCode.BUILD_TRANSACTION_FAILURE, "fail to build staking tx")
    );
  });

  it(`${networkName} should throw an error if fail to validate staking output`, async () => {
    // Setup
    const staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPublicKey, timelock,
    );
    const amount = dataGenerator.getRandomIntegerBetween(
      params.minStakingAmountSat, params.maxStakingAmountSat,
    );

    // Create transaction and psbt
    const { transaction } = staking.createStakingTransaction(
      amount,
      utxos,
      feeRate,
    );

    // Setup a different param
    const wrongParams = dataGenerator.generateStakingParams();
    const wrongTimelock = dataGenerator.generateRandomTimelock(wrongParams);
    const wrongStaking = new Staking(
      network, stakerInfo,
      wrongParams, finalityProviderPublicKey, wrongTimelock,
    );

    expect(() => wrongStaking.toStakingPsbt(transaction, utxos)).toThrow(
      expect.objectContaining({
        code: StakingErrorCode.INVALID_OUTPUT,
        message: expect.stringContaining("Matching output not found")
      })
    );
  });

  it(`${networkName} should successfully create a staking transaction & psbt`, async () => {
    // Setup
    const staking = new Staking(
      network, stakerInfo,
      params, finalityProviderPublicKey, timelock,
    );
    const amount = dataGenerator.getRandomIntegerBetween(
      params.minStakingAmountSat, params.maxStakingAmountSat,
    );

    // Create transaction and psbt
    const { transaction, fee } = staking.createStakingTransaction(
      amount,
      utxos,
      feeRate,
    );
    const psbt = staking.toStakingPsbt(transaction, utxos);

    // Basic validation
    expect(transaction).toBeDefined();
    expect(fee).toBeGreaterThan(0);
    expect(transaction.version).toBe(2);
    expect(psbt.version).toBe(2);

    // Validate inputs
    expect(transaction.ins.length).toBeGreaterThan(0);
    expect(psbt.data.inputs.length).toBe(transaction.ins.length);
    expect(psbt.data.inputs[0].tapInternalKey?.toString("hex")).toEqual(stakerInfo.publicKeyNoCoordHex);
    expect(psbt.data.inputs[0].witnessUtxo?.script.toString("hex")).toEqual(utxos[0].scriptPubKey);

    // Validate sequences
    transaction.ins.forEach(input => expect(input.sequence).toBe(NON_RBF_SEQUENCE));
    psbt.txInputs.forEach(input => expect(input.sequence).toBe(NON_RBF_SEQUENCE));

    // Calculate and validate amounts
    const psbtInputAmount = psbt.data.inputs.reduce((sum, input) => 
      sum + (input.witnessUtxo?.value || 0), 0);
    const txInputAmount = transaction.ins.reduce((sum, input) => {
      const matchingUtxo = utxos.find(utxo => 
        transactionIdToHash(utxo.txid).toString("hex") === input.hash.toString("hex")
          && utxo.vout === input.index);
      return sum + (matchingUtxo?.value || 0);
    }, 0);

    expect(psbtInputAmount).toBeGreaterThanOrEqual(amount + fee);
    expect(txInputAmount).toBeGreaterThanOrEqual(amount + fee);

    // Validate change outputs if present
    const psbtChangeAmount = psbtInputAmount - amount - fee;
    const txChangeAmount = txInputAmount - amount - fee;
    expect(psbtChangeAmount).toEqual(txChangeAmount);

    if (psbtChangeAmount > BTC_DUST_SAT) {
      const lastPsbtOutput = psbt.txOutputs[psbt.txOutputs.length - 1];
      const lastTxOutput = transaction.outs[transaction.outs.length - 1];

      expect(lastPsbtOutput.value).toEqual(psbtChangeAmount);
      expect(lastPsbtOutput.address).toEqual(stakerInfo.address);
      expect(lastTxOutput.value).toEqual(txChangeAmount);
      expect(lastTxOutput.script).toEqual(address.toOutputScript(stakerInfo.address, network));
    }

    // Validate staking amount output
    expect(psbt.txOutputs[0].value).toEqual(amount);
    expect(transaction.outs[0].value).toEqual(amount);

    // Validate transaction and psbt match
    expect(psbt.locktime).toEqual(transaction.locktime);
    expect(psbt.txOutputs.length).toEqual(transaction.outs.length);

    // Validate all inputs match between psbt and transaction
    psbt.txInputs.forEach((input, i) => {
      const txInput = transaction.ins[i];
      expect(input.hash).toEqual(txInput.hash);
      expect(input.index).toEqual(txInput.index);
      expect(input.sequence).toEqual(txInput.sequence);
    });

    // Validate all outputs match between psbt and transaction  
    psbt.txOutputs.forEach((output, i) => {
      const txOutput = transaction.outs[i];
      expect(output.value).toEqual(txOutput.value);
      expect(output.script).toEqual(txOutput.script);
    });
  });
});