import { Transaction } from "bitcoinjs-lib";
import { NON_RBF_SEQUENCE } from "../../../src/constants/psbt";
import { stakingExpansionTransaction } from "../../../src/staking/transactions";
import { transactionIdToHash } from "../../../src/utils/btc";
import { testingNetworks } from "../../helper";
import { stakingExpansionPsbt } from "../../../src/staking/psbt";
import { internalPubkey } from "../../../src/constants/internalPubkey";

describe.each(testingNetworks)("Transactions - ", (
  {network, networkName, datagen}
) => {
  describe.each(Object.values(datagen))("stakingExpansionPsbt", (
    dataGenerator
  ) => {
    const feeRate = 1;
    const stakerKeyPair = dataGenerator.generateRandomKeyPair();
    const {
      stakingTx: previousStakingTx,
      stakingAmountSat,
      stakerInfo,
      scriptPubKey,
      stakingInstance: previousStakingInstance,
    } = dataGenerator.generateRandomStakingTransaction(
      network,
      feeRate,
      stakerKeyPair,
    );

    const previousStakingScript = previousStakingInstance.buildScripts();
    const utxos = dataGenerator.generateRandomUTXOs(
      10000, // Big enough to cover the fees
      dataGenerator.getRandomIntegerBetween(1, 10),
      scriptPubKey,
    );

    describe("Error path", () => {
      it(`${networkName} - should throw an error if the public key is invalid`, () => {
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        const invalidPublicKey = Buffer.from("invalidPublicKey", "hex");
        expect(() =>
          stakingExpansionPsbt(
            network,
            stakingExpansionTx,
            {
              stakingTx: previousStakingTx,
              outputIndex: 0,
            },
            utxos,
            previousStakingScript,
            invalidPublicKey,
          ),
        ).toThrow("Invalid public key");
      });

      it(`${networkName} - should throw an error if previous staking output not found`, () => {
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        expect(() =>
          stakingExpansionPsbt(
            network,
            stakingExpansionTx,
            {
              stakingTx: previousStakingTx,
              outputIndex: 999, // Invalid output index
            },
            utxos,
            previousStakingScript,
          ),
        ).toThrow("Previous staking output not found");
      });

      it(`${networkName} - should throw an error if previous staking output is not P2TR`, () => {
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        // Create a modified previous staking transaction with non-P2TR output
        const modifiedPreviousTx = Transaction.fromBuffer(previousStakingTx.toBuffer());
        const { nativeSegwit } = dataGenerator.getAddressAndScriptPubKey(
          dataGenerator.generateRandomKeyPair().publicKey,
        );
        modifiedPreviousTx.outs[0] = {
          script: Buffer.from(nativeSegwit.scriptPubKey, "hex"),
          value: stakingAmountSat,
        };

        expect(() =>
          stakingExpansionPsbt(
            network,
            stakingExpansionTx,
            {
              stakingTx: modifiedPreviousTx,
              outputIndex: 0,
            },
            utxos,
            previousStakingScript,
          ),
        ).toThrow("Previous staking output script type is not P2TR");
      });

      it(`${networkName} - should throw an error if staking expansion transaction doesn't have exactly 2 inputs`, () => {
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        // Create a modified expansion transaction with only 1 input
        const modifiedExpansionTx = Transaction.fromBuffer(stakingExpansionTx.toBuffer());
        modifiedExpansionTx.ins = [modifiedExpansionTx.ins[0]]; // Remove second input

        expect(() =>
          stakingExpansionPsbt(
            network,
            modifiedExpansionTx,
            {
              stakingTx: previousStakingTx,
              outputIndex: 0,
            },
            utxos,
            previousStakingScript,
          ),
        ).toThrow("Staking expansion transaction must have exactly 2 inputs");
      });

      it(`${networkName} - should throw an error if previous staking input hash doesn't match`, () => {
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        // Create a modified expansion transaction with wrong hash
        const modifiedExpansionTx = Transaction.fromBuffer(stakingExpansionTx.toBuffer());
        modifiedExpansionTx.ins[0].hash = Buffer.from("0".repeat(64), "hex");

        expect(() =>
          stakingExpansionPsbt(
            network,
            modifiedExpansionTx,
            {
              stakingTx: previousStakingTx,
              outputIndex: 0,
            },
            utxos,
            previousStakingScript,
          ),
        ).toThrow("Previous staking input hash does not match");
      });

      it(`${networkName} - should throw an error if previous staking input index doesn't match`, () => {
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        // Create a modified expansion transaction with wrong index
        const modifiedExpansionTx = Transaction.fromBuffer(stakingExpansionTx.toBuffer());
        modifiedExpansionTx.ins[0].index = 999;

        expect(() =>
          stakingExpansionPsbt(
            network,
            modifiedExpansionTx,
            {
              stakingTx: previousStakingTx,
              outputIndex: 0,
            },
            utxos,
            previousStakingScript,
          ),
        ).toThrow("Previous staking input index does not match");
      });

      it(`${networkName} - should throw an error if input UTXO is not found`, () => {
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        // Use different UTXOs that don't match the transaction inputs
        const differentUtxos = dataGenerator.generateRandomUTXOs(
          10000,
          dataGenerator.getRandomIntegerBetween(1, 10),
        );

        expect(() =>
          stakingExpansionPsbt(
            network,
            stakingExpansionTx,
            {
              stakingTx: previousStakingTx,
              outputIndex: 0,
            },
            differentUtxos,
            previousStakingScript,
          ),
        ).toThrow(/Input UTXO not found for txid:/);
      });

    });

    describe("Happy path", () => {
      it(`${networkName} - should return a valid PSBT with correct inputs and outputs`, () => {
        const {
          transaction: stakingExpansionTx,
          fundingUTXO,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        const psbt = stakingExpansionPsbt(
          network,
          stakingExpansionTx,
          {
            stakingTx: previousStakingTx,
            outputIndex: 0,
          },
          utxos,
          previousStakingScript,
          Buffer.from(stakerKeyPair.publicKeyNoCoord, "hex"),
        );

        expect(psbt).toBeDefined();

        // Check PSBT properties
        expect(psbt.version).toBe(2);
        expect(psbt.locktime).toBe(0);

        // Check inputs
        expect(psbt.txInputs.length).toBe(2);

        // First input (previous staking output)
        expect(psbt.txInputs[0].hash).toEqual(previousStakingTx.getHash());
        expect(psbt.txInputs[0].index).toBe(0);
        expect(psbt.txInputs[0].sequence).toBe(NON_RBF_SEQUENCE);
        expect(psbt.data.inputs[0].tapInternalKey).toEqual(internalPubkey);
        expect(psbt.data.inputs[0].tapLeafScript?.length).toBe(1);
        expect(psbt.data.inputs[0].witnessUtxo?.value).toEqual(stakingAmountSat);
        expect(psbt.data.inputs[0].witnessUtxo?.script).toEqual(
          previousStakingTx.outs[0].script,
        );

        // Second input (funding UTXO)
        expect(psbt.txInputs[1].hash).toEqual(transactionIdToHash(fundingUTXO.txid));
        expect(psbt.txInputs[1].index).toBe(fundingUTXO.vout);
        expect(psbt.txInputs[1].sequence).toBe(NON_RBF_SEQUENCE);

        // Check outputs
        expect(psbt.txOutputs.length).toBe(stakingExpansionTx.outs.length);
        stakingExpansionTx.outs.forEach((output, index) => {
          expect(psbt.txOutputs[index].value).toEqual(output.value);
          expect(psbt.txOutputs[index].script).toEqual(output.script);
        });
      });

      it(`${networkName} - should work without publicKeyNoCoord parameter`, () => {
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        const psbt = stakingExpansionPsbt(
          network,
          stakingExpansionTx,
          {
            stakingTx: previousStakingTx,
            outputIndex: 0,
          },
          utxos,
          previousStakingScript,
        );

        expect(psbt).toBeDefined();
        expect(psbt.txInputs.length).toBe(2);

        // First input should still have internalPubkey
        expect(psbt.data.inputs[0].tapInternalKey).toEqual(internalPubkey);

        // Second input should not have tapInternalKey when publicKeyNoCoord is not provided
        expect(psbt.data.inputs[1].tapInternalKey).toBeUndefined();
      });

      it(`${networkName} - should have tapInternalKey for second input when publicKeyNoCoord is provided`, () => {
        const { taproot } = dataGenerator.getAddressAndScriptPubKey(stakerKeyPair.publicKey);
        
        // Generate UTXOs with P2TR scriptPubKey for Taproot
        const taprootUtxos = dataGenerator.generateRandomUTXOs(
          10000000, // Big enough to cover the fees
          dataGenerator.getRandomIntegerBetween(1, 10),
          taproot.scriptPubKey, // Use P2TR scriptPubKey
        );
        
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          taproot.address,
          feeRate,
          taprootUtxos, // Use the P2TR UTXOs
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        const psbt = stakingExpansionPsbt(
          network,
          stakingExpansionTx,
          {
            stakingTx: previousStakingTx,
            outputIndex: 0,
          },
          taprootUtxos, // Use the P2TR UTXOs
          previousStakingScript,
          Buffer.from(stakerKeyPair.publicKeyNoCoord, "hex"),
        );

        expect(psbt).toBeDefined();
        expect(psbt.txInputs.length).toBe(2);

        // First input should have internalPubkey
        expect(psbt.data.inputs[0].tapInternalKey).toEqual(internalPubkey);

        // Second input should have tapInternalKey when publicKeyNoCoord is provided
        expect(psbt.data.inputs[1].tapInternalKey).toEqual(
          Buffer.from(stakerKeyPair.publicKeyNoCoord, "hex"),
        );
      });

      it(`${networkName} - should preserve transaction version and locktime`, () => {
        const {
          transaction: stakingExpansionTx,
        } = stakingExpansionTransaction(
          network,
          previousStakingScript,
          stakingAmountSat,
          stakerInfo.address,
          feeRate,
          utxos,
          {
            stakingTx: previousStakingTx,
            scripts: previousStakingScript,
          },
        );

        // Modify version and locktime
        stakingExpansionTx.version = 1;
        stakingExpansionTx.locktime = 1000;

        const psbt = stakingExpansionPsbt(
          network,
          stakingExpansionTx,
          {
            stakingTx: previousStakingTx,
            outputIndex: 0,
          },
          utxos,
          previousStakingScript,
        );

        expect(psbt.version).toBe(1);
        expect(psbt.locktime).toBe(1000);
      });
    });
  });
});
