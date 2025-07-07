import { address } from "bitcoinjs-lib";
import { BTC_DUST_SAT } from "../../../src/constants/dustSat";
import { NON_RBF_SEQUENCE } from "../../../src/constants/psbt";
import { StakingScripts, stakingTransaction, transactionIdToHash, UTXO } from "../../../src/index";
import { ObservableStakingScripts } from "../../../src/staking/observable";
import { TransactionResult } from "../../../src/types/transaction";
import { getStakingTxInputUTXOsAndFees } from "../../../src/utils/fee";
import { buildStakingTransactionOutputs } from "../../../src/utils/staking";
import { DEFAULT_TEST_FEE_RATE, testingNetworks } from "../../helper";

describe("StakingTransaction - Cross env error", () => {
  const [mainnet, testnet] = testingNetworks;
  const envPairs = [
    {
      mainnetDataGenerator: mainnet.datagen.observableStakingDatagen,
      testnetDataGenerator: testnet.datagen.observableStakingDatagen,
    },
    {
      mainnetDataGenerator: mainnet.datagen.stakingDatagen,
      testnetDataGenerator: testnet.datagen.stakingDatagen,
    },
  ];

  envPairs.map(({ mainnetDataGenerator, testnetDataGenerator }) => {
    const randomAmount = Math.floor(Math.random() * 100000000) + 1000;

    it("should throw an error if the testnet inputs are used on mainnet", () => {
      const randomChangeAddress =
        testnetDataGenerator.getAddressAndScriptPubKey(
          mainnetDataGenerator.generateRandomKeyPair().publicKey,
        ).nativeSegwit.address;
      const utxos = testnetDataGenerator.generateRandomUTXOs(
        randomAmount + 1000000,
        Math.floor(Math.random() * 10) + 1,
      );
      expect(() =>
        stakingTransaction(
          testnetDataGenerator.generateMockStakingScripts(),
          randomAmount,
          randomChangeAddress,
          utxos,
          mainnet.network,
          1,
        ),
      ).toThrow("Invalid change address");
    });

    it("should throw an error if the mainnet inputs are used on testnet", () => {
      const randomChangeAddress =
        mainnetDataGenerator.getAddressAndScriptPubKey(
          mainnetDataGenerator.generateRandomKeyPair().publicKey,
        ).nativeSegwit.address;
      const utxos = mainnetDataGenerator.generateRandomUTXOs(
        randomAmount + 1000000,
        Math.floor(Math.random() * 10) + 1,
      );
      expect(() =>
        stakingTransaction(
          mainnetDataGenerator.generateMockStakingScripts(),
          randomAmount,
          randomChangeAddress,
          utxos,
          testnet.network,
          1,
        ),
      ).toThrow("Invalid change address");
    });
  });
});

describe.each(testingNetworks)("Transactions - ", (
  {network, networkName, datagen}
) => {
  describe.each(Object.values(datagen))("stakingTransaction", (
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

      it(`${networkName} - should throw an error if the change address is invalid`, () => {
        const validAddress = dataGenerator.getAddressAndScriptPubKey(
          dataGenerator.generateRandomKeyPair().publicKey,
        ).taproot.address;
        const invalidCharInAddress = validAddress.replace(validAddress[0], "I"); // I is an invalid character in base58
        const invalidAddressLegnth = validAddress.slice(0, -1);
        const invalidAddresses = [
          "",
          " ",
          "banana",
          invalidCharInAddress,
          invalidAddressLegnth,
        ];
        invalidAddresses.map((a) => {
          expect(() =>
            stakingTransaction(
              mockScripts,
              randomAmount,
              a, // Invalid address
              utxos,
              network,
              feeRate,
            ),
          ).toThrow("Invalid change address");
        });
      });

      it(`${networkName} - should throw an error if the utxo value is too low`, () => {
        // generate a UTXO that is too small to cover the fee
        const scriptPubKey = dataGenerator.getAddressAndScriptPubKey(
          dataGenerator.generateRandomKeyPair().publicKey,
        ).taproot.scriptPubKey;
        const utxo = {
          txid: dataGenerator.generateRandomTxId(),
          vout: Math.floor(Math.random() * 10),
          scriptPubKey: scriptPubKey,
          value: 1,
        };
        expect(() =>
          stakingTransaction(
            mockScripts,
            randomAmount,
            randomChangeAddress,
            [utxo],
            network,
            1,
          ),
        ).toThrow(
          "Insufficient funds: unable to gather enough UTXOs to cover the staking amount and fees",
        );
      });

      it(`${networkName} - should ignore the invalid utxo if the utxo scriptPubKey is invalid`, () => {
        const utxo = {
          txid: dataGenerator.generateRandomTxId(),
          vout: Math.floor(Math.random() * 10),
          scriptPubKey: `abc${dataGenerator.generateRandomKeyPair().publicKey}`, // this is not a valid scriptPubKey
          value: 10000000000000,
        };
        expect(() =>
          stakingTransaction(
            mockScripts,
            randomAmount,
            randomChangeAddress,
            [utxo],
            network,
            1,
          ),
        ).toThrow("Insufficient funds: no valid UTXOs available for staking")
      });

      it(`${networkName} - should throw an error if UTXO is empty`, () => {
        expect(() =>
          stakingTransaction(
            mockScripts,
            randomAmount,
            randomChangeAddress,
            [],
            network,
            1,
          ),
        ).toThrow("Insufficient funds");
      });

      it(`${networkName} - should throw an error if the lock height is invalid`, () => {
        // 500000000 is the maximum lock height in btc
        const invalidLockHeight = 500000000 + 1;
        expect(() =>
          stakingTransaction(
            mockScripts,
            randomAmount,
            randomChangeAddress,
            utxos,
            network,
            feeRate,
            invalidLockHeight,
          ),
        ).toThrow("Invalid lock height");
      });

      it(`${networkName} - should throw an error if the amount is less than or equal to 0`, () => {
        // Test case: amount is 0
        expect(() =>
          stakingTransaction(
            mockScripts,
            0, // Invalid amount
            randomChangeAddress,
            utxos,
            network,
            dataGenerator.generateRandomFeeRates(), // Valid fee rate
          ),
        ).toThrow("Amount and fee rate must be bigger than 0");

        // Test case: amount is -1
        expect(() =>
          stakingTransaction(
            mockScripts,
            -1, // Invalid amount
            randomChangeAddress,
            utxos,
            network,
            dataGenerator.generateRandomFeeRates(), // Valid fee rate
          ),
        ).toThrow("Amount and fee rate must be bigger than 0");
      });

      it("should throw an error if the fee rate is less than or equal to 0", () => {
        // Test case: fee rate is 0
        expect(() =>
          stakingTransaction(
            mockScripts,
            randomAmount,
            randomChangeAddress,
            utxos,
            network,
            0, // Invalid fee rate
          ),
        ).toThrow("Amount and fee rate must be bigger than 0");

        // Test case: fee rate is -1
        expect(() =>
          stakingTransaction(
            mockScripts,
            randomAmount,
            randomChangeAddress,
            utxos,
            network,
            -1, // Invalid fee rate
          ),
        ).toThrow("Amount and fee rate must be bigger than 0");
      });
    });

    describe("Happy path", () => {
      // build the outputs
      const outputs = buildStakingTransactionOutputs(mockScripts, network, randomAmount);
      // A rough estimating of the fee, the end result should not be too far from this
      const { fee: estimatedFee } = getStakingTxInputUTXOsAndFees(
        utxos,
        randomAmount,
        feeRate,
        outputs,
      );
      const { taproot, nativeSegwit } =
        dataGenerator.getAddressAndScriptPubKey(
          dataGenerator.generateRandomKeyPair().publicKey,
        );

      it(`${networkName} - should return a valid transaction result`, () => {
        const transactionResultTaproot = stakingTransaction(
          mockScripts,
          randomAmount,
          taproot.address,
          utxos,
          network,
          feeRate,
        );
        validateCommonFields(
          transactionResultTaproot,
          utxos,
          randomAmount,
          estimatedFee,
          taproot.address,
          mockScripts,
        );

        const transactionResultNativeSegwit = stakingTransaction(
          mockScripts,
          randomAmount,
          nativeSegwit.address,
          utxos,
          network,
          feeRate,
        );
        validateCommonFields(
          transactionResultNativeSegwit,
          utxos,
          randomAmount,
          estimatedFee,
          nativeSegwit.address,
          mockScripts,
        );
      });

      it(`${networkName} - should return a valid transaction result with lock field`, () => {
        const lockHeight = Math.floor(Math.random() * 1000000) + 100;
        const transactionResult = stakingTransaction(
          mockScripts,
          randomAmount,
          taproot.address,
          utxos,
          network,
          feeRate,
          lockHeight,
        );
        validateCommonFields(
          transactionResult,
          utxos,
          randomAmount,
          estimatedFee,
          taproot.address,
          mockScripts,
        );
        // check the lock height is correct
        expect(transactionResult.transaction.locktime).toEqual(lockHeight);
      });
    });
  });

  const validateCommonFields = (
    transactionResult: TransactionResult,
    utxos: UTXO[],
    randomAmount: number,
    estimatedFee: number,
    changeAddress: string,
    mockScripts: StakingScripts | ObservableStakingScripts,
  ) => {
    expect(transactionResult).toBeDefined();
    // expect the estimated fee and the actual fee is the same
    expect(transactionResult.fee).toBe(estimatedFee);
    // make sure the input amount is greater than the output amount
    const { transaction, fee } = transactionResult;
    const inputAmount = transaction.ins.reduce(
      (sum, input) => {
        const id = input.hash.toString("hex");
        const utxo = utxos.find((utxo) =>
          transactionIdToHash(utxo.txid).toString("hex") === id
            && utxo.vout === input.index,
        );
        return sum + utxo!.value;
      },
      0,
    );
    const outputAmount = transaction.outs.reduce(
      (sum, output) => sum + output.value,
      0,
    );
    expect(inputAmount).toBeGreaterThan(outputAmount);
    expect(inputAmount - outputAmount - fee).toBeLessThan(BTC_DUST_SAT);
    // check the change amount is correct and send to the correct address
    if (inputAmount - (randomAmount + fee) > BTC_DUST_SAT) {
      const expectedChangeAmount = inputAmount - (randomAmount + fee);
      const changeOutput = transaction.outs.find(
        (output) => output.value === expectedChangeAmount,
      );
      expect(changeOutput).toBeDefined();
      // also make sure the change address is correct by look up the `address`
      expect(
        transaction.outs.find(
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
        transaction.outs.find((output) =>
          output.script.equals((mockScripts as any).dataEmbedScript),
        ),
      ).toBeDefined();
    }
    // Check the staking amount is correct
    expect(
      transaction.outs.find((output) => output.value === randomAmount),
    ).toBeDefined();

    transaction.ins.map((input) => {
      expect(input.sequence).toBe(NON_RBF_SEQUENCE);
    });
    expect(transaction.version).toBe(2);
  };
});
