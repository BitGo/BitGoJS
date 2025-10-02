import { BTC_DUST_SAT } from "../../../src/constants/dustSat";
import { NON_RBF_SEQUENCE } from "../../../src/constants/psbt";
import { stakingExpansionTransaction } from "../../../src/staking/transactions";
import { transactionIdToHash } from "../../../src/utils/btc";
import { testingNetworks } from "../../helper";

describe("stakingExpansionTransaction", () => {
  const [mainnet] = testingNetworks;
  const { datagen: { stakingDatagen }, network } = mainnet;
  const stakerKeyPair = stakingDatagen.generateRandomKeyPair();
  const {
    stakingTx: previousStakingTx,
    stakingAmountSat,
    stakerInfo,
    scriptPubKey,
    stakingInstance: previousStakingInstance,
  } = stakingDatagen.generateRandomStakingTransaction(
    network,
    1,
    stakerKeyPair,
  );

  const previousStakingScript = previousStakingInstance.buildScripts();
  const utxos = stakingDatagen.generateRandomUTXOs(
    10000, // Big enough to cover the fees
    stakingDatagen.getRandomIntegerBetween(1, 10),
    scriptPubKey,
  );

  it("should successfully expand a staking transaction", () => {
    const {
      transaction: stakingExpansionTx,
      fee: stakingExpansionTxFee,
      fundingUTXO,
    } = stakingExpansionTransaction(
      network,
      previousStakingScript,
      stakingAmountSat,
      stakerInfo.address,
      1,
      utxos,
      {
        stakingTx: previousStakingTx,
        scripts: previousStakingScript,
      },
    )
    expect(stakingExpansionTx).toBeDefined();
    expect(stakingExpansionTxFee).toBeGreaterThan(0);
    // Must have two inputs:
    // 1. The previous staking transaction output
    // 2. The funding UTXO
    expect(stakingExpansionTx.ins.length).toBe(2);
    // First output must be the previous staking transaction output
    expect(stakingExpansionTx.ins[0].hash).toEqual(previousStakingTx.getHash());
    // First output amount must match the previous staking amount

    // Must have more than or equal to 1 output
    expect(stakingExpansionTx.outs.length).toBeGreaterThanOrEqual(1);
    // Must match the same staking amount as previous staking transaction
    expect(stakingExpansionTx.outs[0].value).toBe(stakingAmountSat);

    // Find the matching UTXO from the inputUTXOs list so that we know the amount.
    const fundingUtxo = utxos.find(
      (utxo) => transactionIdToHash(utxo.txid).equals(stakingExpansionTx.ins[1].hash)
    );
    expect(fundingUtxo).toBeDefined();
    if (fundingUtxo!.value - stakingExpansionTxFee > BTC_DUST_SAT) {
      // Must have a change output as the last output
      expect(stakingExpansionTx.outs[
        stakingExpansionTx.outs.length - 1
      ].value).toBe(fundingUtxo!.value - stakingExpansionTxFee);
    }

    // Both inputs should have the same sequence number (non-RBF)
    expect(stakingExpansionTx.ins[0].sequence).toBe(NON_RBF_SEQUENCE);
    expect(stakingExpansionTx.ins[1].sequence).toBe(NON_RBF_SEQUENCE);
    // Should use standard transaction version
    expect(stakingExpansionTx.version).toBe(2);

    expect(fundingUTXO).toBeDefined();
    expect(fundingUTXO.value).toBeGreaterThan(0);

    // Funding UTXO should be the same as the selected UTXO
    expect(fundingUTXO.txid).toEqual(utxos.find(
      (utxo) => transactionIdToHash(utxo.txid).equals(stakingExpansionTx.ins[1].hash)
    )!.txid);
    expect(fundingUTXO.value).toEqual(utxos.find(
      (utxo) => transactionIdToHash(utxo.txid).equals(stakingExpansionTx.ins[1].hash)
    )!.value);
  });

  it("should throw error when amount is less than or equal to 0", () => {
    expect(() =>
      stakingExpansionTransaction(
        network,
        previousStakingScript,
        0, // Invalid amount
        stakerInfo.address,
        1,
        utxos,
        {
          stakingTx: previousStakingTx,
          scripts: previousStakingScript,
        },
      )
    ).toThrow("Amount and fee rate must be bigger than 0");
  });

  it("should throw error when fee rate is less than or equal to 0", () => {
    expect(() =>
      stakingExpansionTransaction(
        network,
        previousStakingScript,
        stakingAmountSat,
        stakerInfo.address,
        0, // Invalid fee rate
        utxos,
        {
          stakingTx: previousStakingTx,
          scripts: previousStakingScript,
        },
      )
    ).toThrow("Amount and fee rate must be bigger than 0");
  });

  it("should throw error when change address is invalid", () => {
    expect(() =>
      stakingExpansionTransaction(
        network,
        previousStakingScript,
        stakingAmountSat,
        "invalid_address", // Invalid address
        1,
        utxos,
        {
          stakingTx: previousStakingTx,
          scripts: previousStakingScript,
        },
      )
    ).toThrow("Invalid BTC change address");
  });

  it("should throw error when expansion amount does not match previous staking amount", () => {
    const differentAmount = stakingAmountSat + 1000; // Different amount
    expect(() =>
      stakingExpansionTransaction(
        network,
        previousStakingScript,
        differentAmount,
        stakerInfo.address,
        1,
        utxos,
        {
          stakingTx: previousStakingTx,
          scripts: previousStakingScript,
        },
      )
    ).toThrow("Expansion staking transaction amount must be equal to the previous staking amount");
  });

  it("should throw error when no UTXOs are available for funding", () => {
    expect(() =>
      stakingExpansionTransaction(
        network,
        previousStakingScript,
        stakingAmountSat,
        stakerInfo.address,
        1,
        [], // Empty UTXOs
        {
          stakingTx: previousStakingTx,
          scripts: previousStakingScript,
        },
      )
    ).toThrow("Insufficient funds");
  });

  it("should throw error when no UTXOs can cover the required fees", () => {
    // Create a UTXO with a value less than the fees
    const smallUtxo = stakingDatagen.generateRandomUTXOs(
      100, // Much less than the fees
      1,
      scriptPubKey,
    );
    expect(() =>
      stakingExpansionTransaction(
        network,
        previousStakingScript,
        stakingAmountSat,
        stakerInfo.address,
        1,
        smallUtxo,
        {
          stakingTx: previousStakingTx,
          scripts: previousStakingScript,
        },
      )
    ).toThrow("Insufficient funds: unable to find a UTXO to cover the fees");
  });
});