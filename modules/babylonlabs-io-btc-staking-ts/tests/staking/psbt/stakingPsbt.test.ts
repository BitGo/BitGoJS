import { address, Psbt } from "bitcoinjs-lib";
import { BTC_DUST_SAT } from "../../../src/constants/dustSat";
import { NON_RBF_SEQUENCE } from "../../../src/constants/psbt";
import { StakingScripts, stakingTransaction } from "../../../src/index";
import { ObservableStakingScripts } from "../../../src/staking/observable";
import { DEFAULT_TEST_FEE_RATE, testingNetworks } from "../../helper";
import { stakingPsbt } from "../../../src/staking/psbt";

describe.each(testingNetworks)("Transactions - ", (
  {network, networkName, datagen}
) => {
  describe.each(Object.values(datagen))("stakingPsbt", (
    dataGenerator
  ) => {
    const mockScripts = dataGenerator.generateMockStakingScripts();
    const feeRate = DEFAULT_TEST_FEE_RATE;
    const randomAmount = Math.floor(Math.random() * 100000000) + 1000;
    // Create enough utxos to cover the amount
    const utxos = dataGenerator.generateRandomUTXOs(
      randomAmount + 1000000, // let's give enough satoshis to cover the fee
      Math.floor(Math.random() * 10) + 1,
    );
    describe("Error path", () => {
      const randomChangeAddress = dataGenerator.getAddressAndScriptPubKey(
        dataGenerator.generateRandomKeyPair().publicKey,
      ).taproot.address;

      it(`${networkName} - should throw an error if the public key is invalid`, () => {
        const tx = stakingTransaction(
          mockScripts,
          randomAmount,
          randomChangeAddress,
          utxos,
          network,
          feeRate,
        );
        const invalidPublicKey = Buffer.from("invalidPublicKey", "hex");
        expect(() =>
          stakingPsbt(tx.transaction, network, utxos, invalidPublicKey),
        ).toThrow("Invalid public key");
      });

      it(`${networkName} - should throw an error if the input utxos are not found`, () => {
        const tx = stakingTransaction(
          mockScripts,
          randomAmount,
          randomChangeAddress,
          utxos,
          network,
          feeRate,
        );
        const anotherUTXO = dataGenerator.generateRandomUTXOs(
          randomAmount + 1000000, // let's give enough satoshis to cover the fee
          Math.floor(Math.random() * 10) + 1,
        );

        expect(() =>
          stakingPsbt(tx.transaction, network, anotherUTXO),
        ).toThrow(/Input UTXO not found for txid:/);
      });
    });

    describe("Happy path", () => {
      const { taproot, nativeSegwit } =
        dataGenerator.getAddressAndScriptPubKey(
          dataGenerator.generateRandomKeyPair().publicKey,
        );

      it(`${networkName} - should return a valid psbt result with tapInternalKey`, () => {
        let txResult = stakingTransaction(
          mockScripts,
          randomAmount,
          taproot.address,
          utxos,
          network,
          feeRate,
        );

        let psbtResult = stakingPsbt(
          txResult.transaction,
          network,
          utxos,
          Buffer.from(
            dataGenerator.generateRandomKeyPair().publicKeyNoCoord,
            "hex",
          ),
        );

        validateCommonFields(
          psbtResult,
          randomAmount,
          txResult.fee,
          taproot.address,
          mockScripts,
        );

        txResult = stakingTransaction(
          mockScripts,
          randomAmount,
          nativeSegwit.address,
          utxos,
          network,
          feeRate,
        );

        psbtResult = stakingPsbt(
          txResult.transaction,
          network,
          utxos,
          Buffer.from(
            dataGenerator.generateRandomKeyPair().publicKeyNoCoord,
            "hex",
          ),
        );

        validateCommonFields(
          psbtResult,
          randomAmount,
          txResult.fee,
          nativeSegwit.address,
          mockScripts,
        );
      });
    });
  });

  const validateCommonFields = (
    psbt: Psbt,
    randomAmount: number,
    estimatedFee: number,
    changeAddress: string,
    mockScripts: StakingScripts | ObservableStakingScripts,
  ) => {
    expect(psbt).toBeDefined();
    // make sure the input amount is greater than the output amount
    const inputAmount = psbt.data.inputs.reduce(
      (sum, input) => sum + input.witnessUtxo!.value || 0,
      0,
    );

    const outputAmount = psbt.txOutputs.reduce(
      (sum, output) => sum + output.value,
      0,
    );
    expect(inputAmount).toBeGreaterThan(outputAmount);
    expect(inputAmount - outputAmount - estimatedFee).toBeLessThan(BTC_DUST_SAT);
    // check the change amount is correct and send to the correct address
    if (inputAmount - (randomAmount + estimatedFee) > BTC_DUST_SAT) {
      const expectedChangeAmount = inputAmount - (randomAmount + estimatedFee);
      const changeOutput = psbt.txOutputs.find(
        (output) => output.value === expectedChangeAmount,
      );
      expect(changeOutput).toBeDefined();
      // also make sure the change address is correct by look up the `address`
      expect(
        psbt.txOutputs.find(
          (output) => output.script.toString('hex') === address.toOutputScript(
            changeAddress,
            network,
          ).toString('hex'),
        ),
      ).toBeDefined();
    }

    // check data embed output added to the transaction if the dataEmbedScript is provided
    if ((mockScripts as any).dataEmbedScript) {
      expect(
        psbt.txOutputs.find((output) =>
          output.script.equals((mockScripts as any).dataEmbedScript),
        ),
      ).toBeDefined();
    }
    // Check the staking amount is correct
    expect(
      psbt.txOutputs.find((output) => output.value === randomAmount),
    ).toBeDefined();

    psbt.txInputs.map((input) => {
      expect(input.sequence).toBe(NON_RBF_SEQUENCE);
    });
    expect(psbt.version).toBe(2);
  };
});
