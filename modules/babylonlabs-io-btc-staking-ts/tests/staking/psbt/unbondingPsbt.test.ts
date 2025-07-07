import { NON_RBF_SEQUENCE } from "../../../src/constants/psbt";
import { stakingTransaction, unbondingTransaction } from "../../../src/index";
import { DEFAULT_TEST_FEE_RATE, testingNetworks } from "../../helper";
import { unbondingPsbt } from "../../../src/staking/psbt";
import { internalPubkey } from "../../../src/constants/internalPubkey";
import { BTC_DUST_SAT } from "../../../src/constants/dustSat";
import { Transaction } from "bitcoinjs-lib";

describe.each(testingNetworks)("Transactions - ", (
  {network, networkName, datagen}
) => {
  describe.each(Object.values(datagen))("unbondingPsbt", (
    dataGenerator
  ) => {
    const mockScripts = dataGenerator.generateMockStakingScripts();
    const feeRate = DEFAULT_TEST_FEE_RATE;
    const params = dataGenerator.generateStakingParams();
    const randomAmount = Math.floor(
      Math.random() * 100000000
    ) + 1000 + params.unbondingFeeSat + BTC_DUST_SAT;
    // Create enough utxos to cover the amount
    const utxos = dataGenerator.generateRandomUTXOs(
      randomAmount + 1000000, // let's give enough satoshis to cover the fee
      Math.floor(Math.random() * 10) + 1,
    );
    const randomChangeAddress = dataGenerator.getAddressAndScriptPubKey(
      dataGenerator.generateRandomKeyPair().publicKey,
    ).taproot.address;
    
    const tx = stakingTransaction(
      mockScripts,
      randomAmount,
      randomChangeAddress,
      utxos,
      network,
      feeRate,
    );
    const unbondingTx = unbondingTransaction(
      mockScripts,
      tx.transaction,
      params.unbondingFeeSat,
      network,
    );

    it(`${networkName} - should return a valid psbt result with correct inputs and outputs`, () => {
      const psbt = unbondingPsbt(
        mockScripts,
        unbondingTx.transaction,
        tx.transaction,
        network,
      );

      expect(psbt).toBeDefined();

      // Check the psbt inputs
      expect(psbt.txInputs.length).toBe(1);
      expect(psbt.txInputs[0].hash).toEqual(tx.transaction.getHash());
      expect(psbt.data.inputs[0].tapInternalKey).toEqual(internalPubkey);
      expect(psbt.data.inputs[0].tapLeafScript?.length).toBe(1);
      expect(psbt.data.inputs[0].witnessUtxo?.value).toEqual(randomAmount);
      expect(psbt.data.inputs[0].witnessUtxo?.script).toEqual(
        tx.transaction.outs[0].script,
      );
      expect(psbt.txInputs[0].sequence).toEqual(NON_RBF_SEQUENCE);
      expect(psbt.txInputs[0].index).toEqual(0);
      // Check the psbt outputs
      expect(psbt.txOutputs.length).toBe(1);
      expect(psbt.txOutputs[0].value).toEqual(randomAmount - params.unbondingFeeSat);

      // Check the psbt properties
      expect(psbt.locktime).toBe(0);
      expect(psbt.version).toBe(2);
    });

    it(`${networkName} - should throw error if unbonding tx has more than one output`, () => {
      // Create a copy of unbonding tx and add another output
      const invalidUnbondingTx = Transaction.fromBuffer(unbondingTx.transaction.toBuffer());
      invalidUnbondingTx.addOutput(
        tx.transaction.outs[0].script,
        1000
      );

      expect(() => unbondingPsbt(
        mockScripts,
        invalidUnbondingTx,
        tx.transaction,
        network,
      )).toThrow("Unbonding transaction must have exactly one output");
    });

    it(`${networkName} - should throw error if unbonding tx has more than one input`, () => {
      // Create a copy of unbonding tx and add another input
      const invalidUnbondingTx = Transaction.fromBuffer(unbondingTx.transaction.toBuffer());
      invalidUnbondingTx.addInput(
        tx.transaction.getHash(),
        1,
        NON_RBF_SEQUENCE
      );

      expect(() => unbondingPsbt(
        mockScripts,
        invalidUnbondingTx,
        tx.transaction,
        network,
      )).toThrow("Unbonding transaction must have exactly one input");
    });

    it(`${networkName} - should throw error if unbonding output script does 
      not match the expected script`, () => {
      const differentScripts = dataGenerator.generateMockStakingScripts();
      expect(() => unbondingPsbt(
        differentScripts,
        unbondingTx.transaction,
        tx.transaction,
        network,
      )).toThrow("Unbonding output script does not match the expected script while building psbt");
    });
  });
});
