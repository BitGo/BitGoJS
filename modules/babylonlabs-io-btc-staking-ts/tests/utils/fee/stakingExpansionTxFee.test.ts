import { BTC_DUST_SAT } from "../../../src/constants/dustSat";
import { UTXO } from "../../../src/types/UTXO";
import { TransactionOutput } from "../../../src/types/psbtOutputs";
import { getStakingExpansionTxFundingUTXOAndFees } from "../../../src/utils/fee";
import { buildStakingTransactionOutputs, deriveStakingOutputInfo } from "../../../src/utils/staking";
import { DEFAULT_TEST_FEE_RATE, testingNetworks } from "../../helper";

describe.each(testingNetworks)("utils - fee - ", (
  { networkName, network, datagen },
) => {
  describe(`${networkName} - getStakingExpansionTxFundingUTXOAndFees`, () => {
    Object.entries(datagen).forEach(([_, dataGenerator]) => {
      const mockScripts = dataGenerator.generateMockStakingScripts();
      const feeRate = DEFAULT_TEST_FEE_RATE;

      it("should throw an error if there are no available UTXOs", () => {
        const availableUTXOs: UTXO[] = [];
        const outputs: TransactionOutput[] = [];
        expect(() =>
          getStakingExpansionTxFundingUTXOAndFees(
            availableUTXOs,
            feeRate,
            outputs,
          ),
        ).toThrow("Insufficient funds");
      });

      it("should throw if no UTXO can cover the required fees", () => {
        const availableUTXOs: UTXO[] = dataGenerator.generateRandomUTXOs(
          100,
          2,
        );
        const outputs = buildStakingTransactionOutputs(mockScripts, network, 50000);
        expect(() =>
          getStakingExpansionTxFundingUTXOAndFees(
            availableUTXOs,
            feeRate,
            outputs,
          ),
        ).toThrow(
          "Insufficient funds: unable to find a UTXO to cover the fees for the staking expansion transaction.",
        );
      });

      it("should successfully select the smallest UTXO that can cover the fee", () => {
        const availableUTXOs: UTXO[] = [
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey(),
            value: 1000000, // Large UTXO
          },
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 1,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey(),
            value: 50000, // Medium UTXO that should be selected
          },
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 2,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey(),
            value: 100000, // Larger UTXO
          },
        ];
        const outputs = buildStakingTransactionOutputs(mockScripts, network, 50000);

        const result = getStakingExpansionTxFundingUTXOAndFees(
          availableUTXOs,
          feeRate,
          outputs,
        );

        // Should select the smallest UTXO that can cover the fee
        expect(result.selectedUTXO).toEqual(availableUTXOs[1]); // The 50000 satoshi UTXO
        expect(result.fee).toBeGreaterThan(0);
        expect(result.fee).toBeLessThanOrEqual(result.selectedUTXO.value);
      });

      it("should successfully return the accurate fee for native segwit input", () => {
        const availableUTXOs = [
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey(),
            value: 10000,
          },
        ];

        const outputs = buildStakingTransactionOutputs(mockScripts, network, 2000);
        const result = getStakingExpansionTxFundingUTXOAndFees(
          availableUTXOs,
          1,
          outputs,
        );
        
        expect(result.fee).toBe(463);
        expect(result.selectedUTXO).toEqual(availableUTXOs[0]);
      });

      it("should successfully return the accurate fee for taproot input", () => {
        const availableUTXOs = [
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey({
              isTaproot: true,
            }),
            value: 10000,
          },
        ];

        const outputs = buildStakingTransactionOutputs(mockScripts, network, 2000);
        const result = getStakingExpansionTxFundingUTXOAndFees(
          availableUTXOs,
          1,
          outputs,
        );
        
        expect(result.fee).toBe(453);
        expect(result.selectedUTXO).toEqual(availableUTXOs[0]);
      });

      it("should successfully return the accurate fee without change", () => {
        const availableUTXOs = [
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey(),
            value: 420, // Just enough to cover fee without change
          },
        ];

        const outputs = buildStakingTransactionOutputs(mockScripts, network, 2000);
        const result = getStakingExpansionTxFundingUTXOAndFees(
          availableUTXOs,
          1,
          outputs,
        );
        
        expect(result.fee).toBe(420); // Without change output, hence smaller
        expect(result.selectedUTXO).toEqual(availableUTXOs[0]);
      });

      it("should successfully return the fee without change when remaining balance is below dust threshold", () => {
        const availableUTXOs = [
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey(),
            value: 420 + BTC_DUST_SAT,
          },
        ];

        const outputs = buildStakingTransactionOutputs(mockScripts, network, 2000);
        const result = getStakingExpansionTxFundingUTXOAndFees(
          availableUTXOs,
          1,
          outputs,
        );
        
        expect(result.fee).toBe(420); // Without change output, hence smaller
        expect(result.selectedUTXO).toEqual(availableUTXOs[0]);
      });

      it("should successfully return the accurate fee with change output", () => {
        const availableUTXOs = [
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey(),
            value: 420 + BTC_DUST_SAT + 1, // More than dust threshold
          },
        ];

        const outputs = buildStakingTransactionOutputs(mockScripts, network, 2000);
        const result = getStakingExpansionTxFundingUTXOAndFees(
          availableUTXOs,
          1,
          outputs,
        );

        expect(result.fee).toBe(463);
        expect(result.selectedUTXO).toEqual(availableUTXOs[0]);
      });

      it("should filter out invalid UTXOs with non-decompilable scripts", () => {
        const availableUTXOs = [
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            scriptPubKey: "invalid_script", // Invalid script
            value: 10000,
          },
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 1,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey(),
            value: 10000,
          },
        ];

        const outputs = buildStakingTransactionOutputs(mockScripts, network, 2000);
        const result = getStakingExpansionTxFundingUTXOAndFees(
          availableUTXOs,
          1,
          outputs,
        );

        // Should select the valid UTXO
        expect(result.selectedUTXO).toEqual(availableUTXOs[1]);
        expect(result.fee).toEqual(463);
      });

      it("should throw error when no valid UTXOs are available", () => {
        const availableUTXOs = [
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            scriptPubKey: "invalid_script_1", // Invalid script
            value: 10000,
          },
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 1,
            scriptPubKey: "invalid_script_2", // Invalid script
            value: 10000,
          },
        ];

        const outputs = buildStakingTransactionOutputs(mockScripts, network, 2000);
        expect(() =>
          getStakingExpansionTxFundingUTXOAndFees(
            availableUTXOs,
            feeRate,
            outputs,
          ),
        ).toThrow("Insufficient funds: no valid UTXOs available for staking");
      });

      it("should handle multiple outputs correctly in fee calculation", () => {
        const availableUTXOs: UTXO[] = [
          {
            txid: dataGenerator.generateRandomTxId(),
            vout: 0,
            scriptPubKey: dataGenerator.generateRandomScriptPubKey(),
            value: 10000,
          },
        ];

        // Create multiple outputs to test fee calculation
        const stakingOutputInfo = deriveStakingOutputInfo(mockScripts, network);
        const outputs: TransactionOutput[] = [
          {
            scriptPubKey: stakingOutputInfo.scriptPubKey,
            value: 2000,
          },
          {
            scriptPubKey: Buffer.from(
              dataGenerator.generateRandomScriptPubKey(), "hex"
            ),
            value: 1000,
          },
        ];

        const result = getStakingExpansionTxFundingUTXOAndFees(
          availableUTXOs,
          1,
          outputs,
        );
        expect(result.fee).toBe(506);
        expect(result.selectedUTXO).toEqual(availableUTXOs[0]);
      });
    });
  });
}); 