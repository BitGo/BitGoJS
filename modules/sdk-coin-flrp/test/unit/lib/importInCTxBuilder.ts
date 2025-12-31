import assert from 'assert';
import 'should';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { IMPORT_IN_C as testData } from '../../resources/transactionData/importInC';
import signFlowTest from './signFlowTestSuit';
import { UnsignedTx } from '@flarenetwork/flarejs';
import testUtils from '../../../src/lib/utils';

describe('Flrp Import In C Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tflrp'));
  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getImportInCBuilder();

    it('should fail validate Utxos empty string', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e: any) => e.message === 'UTXOs array cannot be empty'
      );
    });

    it('should fail validate Utxos without amount field', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([{ outputID: '' } as any as DecodedUtxoObj]);
        },
        (e: any) => e.message === 'UTXO missing required field: amount'
      );
    });
  });

  signFlowTest({
    transactionType: 'Import C2P',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInCBuilder()
        .threshold(testData.threshold)
        .fromPubKey(testData.pAddresses)
        .utxos(testData.outputs)
        .to(testData.to)
        .feeRate(testData.fee),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[0],
      prv2: testData.privateKeys[1],
    },
    txHash: testData.txhash,
  });

  describe('dynamic fee calculation', () => {
    it('should calculate proper fee using feeRate multiplier (AVAXP approach) to avoid "insufficient unlocked funds" error', async () => {
      const amount = '100000000'; // 100M nanoFLRP (0.1 FLR)
      const feeRate = '1'; // 1 nanoFLRP per cost unit (matching AVAXP's feeRate usage)

      const utxo: DecodedUtxoObj = {
        outputID: 0,
        amount: amount,
        txid: '2vPMx8P63adgBae7GAWFx7qvJDwRmMnDCyKddHRBXWhysjX4BP',
        outputidx: '0',
        addresses: [
          '0x3329be7d01cd3ebaae6654d7327dd9f17a2e1581',
          '0x7e918a5e8083ae4c9f2f0ed77055c24bf3665001',
          '0xc7324437c96c7c8a6a152da2385c1db5c3ab1f91',
        ],
        threshold: 2,
      };

      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(2)
        .fromPubKey(testData.pAddresses)
        .utxos([utxo])
        .to(testData.to)
        .feeRate(feeRate) as any;

      const tx = await txBuilder.build();

      const calculatedFee = BigInt((tx as any).fee.fee);
      const feeRateBigInt = BigInt(feeRate);

      // The fee should be approximately: feeRate × (txSize + inputCost + fixedFee)
      // For 1 input, threshold=2, ~228 bytes: 1 × (228 + 2000 + 10000) = 12,228
      const expectedMinCost = 12000; // Minimum cost units (conservative estimate)
      const expectedMaxCost = 13000; // Maximum cost units (with some buffer)

      const expectedMinFee = feeRateBigInt * BigInt(expectedMinCost);
      const expectedMaxFee = feeRateBigInt * BigInt(expectedMaxCost);

      // Verify fee is in the expected range
      assert(
        calculatedFee >= expectedMinFee,
        `Fee ${calculatedFee} should be at least ${expectedMinFee} (feeRate × minCost)`
      );
      assert(
        calculatedFee <= expectedMaxFee,
        `Fee ${calculatedFee} should not exceed ${expectedMaxFee} (feeRate × maxCost)`
      );

      // Verify the output amount is positive (no "insufficient funds" error)
      const outputs = tx.outputs;
      outputs.length.should.equal(1);
      const outputAmount = BigInt(outputs[0].value);
      assert(
        outputAmount > BigInt(0),
        'Output amount should be positive - transaction should not fail with insufficient funds'
      );

      // Verify the math: input - output = fee
      const inputAmount = BigInt(amount);
      const calculatedOutput = inputAmount - calculatedFee;
      assert(outputAmount === calculatedOutput, 'Output should equal input minus total fee');
    });

    it('should use consistent fee calculation in initBuilder and buildFlareTransaction', async () => {
      const inputAmount = '100000000'; // 100M nanoFLRP (matches real-world transaction)
      const expectedFeeRate = 500; // Real feeRate from working transaction
      const threshold = 2;

      const utxo: DecodedUtxoObj = {
        outputID: 0,
        amount: inputAmount,
        txid: '2vPMx8P63adgBae7GAWFx7qvJDwRmMnDCyKddHRBXWhysjX4BP',
        outputidx: '0',
        addresses: [
          '0x3329be7d01cd3ebaae6654d7327dd9f17a2e1581',
          '0x7e918a5e8083ae4c9f2f0ed77055c24bf3665001',
          '0xc7324437c96c7c8a6a152da2385c1db5c3ab1f91',
        ],
        threshold: threshold,
      };

      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(threshold)
        .fromPubKey(testData.pAddresses)
        .utxos([utxo])
        .to(testData.to)
        .feeRate(expectedFeeRate.toString());

      const tx = await txBuilder.build();
      const calculatedFee = BigInt((tx as any).fee.fee);
      const feeInfo = (tx as any).fee;

      const maxReasonableFee = BigInt(inputAmount) / BigInt(10); // Max 10% of input
      assert(
        calculatedFee < maxReasonableFee,
        `Fee ${calculatedFee} should be less than 10% of input (${maxReasonableFee})`
      );

      const expectedMinFee = BigInt(expectedFeeRate) * BigInt(12000);
      const expectedMaxFee = BigInt(expectedFeeRate) * BigInt(13000);

      assert(calculatedFee >= expectedMinFee, `Fee ${calculatedFee} should be at least ${expectedMinFee}`);
      assert(calculatedFee <= expectedMaxFee, `Fee ${calculatedFee} should not exceed ${expectedMaxFee}`);

      const outputAmount = BigInt(tx.outputs[0].value);
      assert(outputAmount > BigInt(0), 'Output should be positive');

      const expectedOutput = BigInt(inputAmount) - calculatedFee;
      assert(
        outputAmount === expectedOutput,
        `Output ${outputAmount} should equal input ${inputAmount} minus fee ${calculatedFee}`
      );

      const txHex = tx.toBroadcastFormat();
      const parsedBuilder = factory.from(txHex);
      const parsedTx = await parsedBuilder.build();
      const parsedFeeRate = (parsedTx as any).fee.feeRate;

      assert(parsedFeeRate !== undefined && parsedFeeRate > 0, 'Parsed feeRate should be defined and positive');

      const feeRateDiff = Math.abs(parsedFeeRate! - expectedFeeRate);
      const maxAllowedDiff = 10;
      assert(
        feeRateDiff <= maxAllowedDiff,
        `Parsed feeRate ${parsedFeeRate} should be close to original ${expectedFeeRate} (diff: ${feeRateDiff})`
      );

      const feeSize = feeInfo.size!;
      assert(feeSize > 10000, `Fee size ${feeSize} should include fixed cost (10000) + input costs`);
      assert(feeSize < 20000, `Fee size ${feeSize} should be reasonable (< 20000)`);
    });

    it('should prevent artificially inflated feeRate from using wrong calculation', async () => {
      const inputAmount = '100000000'; // 100M nanoFLRP
      const threshold = 2;

      const utxo: DecodedUtxoObj = {
        outputID: 0,
        amount: inputAmount,
        txid: '2vPMx8P63adgBae7GAWFx7qvJDwRmMnDCyKddHRBXWhysjX4BP',
        outputidx: '0',
        addresses: [
          '0x3329be7d01cd3ebaae6654d7327dd9f17a2e1581',
          '0x7e918a5e8083ae4c9f2f0ed77055c24bf3665001',
          '0xc7324437c96c7c8a6a152da2385c1db5c3ab1f91',
        ],
        threshold: threshold,
      };

      const feeRate = 500;

      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(threshold)
        .fromPubKey(testData.pAddresses)
        .utxos([utxo])
        .to(testData.to)
        .feeRate(feeRate.toString());

      let tx;
      try {
        tx = await txBuilder.build();
      } catch (error: any) {
        throw new Error(
          `Transaction build failed (this was the OLD bug behavior): ${error.message}. ` +
            `The fix ensures calculateImportCost() is used consistently.`
        );
      }

      const calculatedFee = BigInt((tx as any).fee.fee);

      const oldBugFee = BigInt(328000000);
      const reasonableFee = BigInt(10000000);

      assert(
        calculatedFee < reasonableFee,
        `Fee ${calculatedFee} should be reasonable (< ${reasonableFee}), not inflated like OLD bug (~${oldBugFee})`
      );

      const outputAmount = BigInt(tx.outputs[0].value);
      assert(
        outputAmount > BigInt(0),
        `Output ${outputAmount} should be positive. OLD bug would make output negative due to excessive fee.`
      );
    });
  });

  describe('on-chain verified transactions', () => {
    it('should verify on-chain tx id for signed C-chain import', async () => {
      const signedImportHex =
        '0x0000000000000000007278db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da555247900000000000000000000000000000000000000000000000000000000000000000000000162ef0c8ced5668d1230c82e274f5c19357df8c005743367421e8a2b48c73989a0000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000050000000002faf0800000000200000000000000010000000117dbd11b9dd1c9be337353db7c14f9fb3662e5b50000000002aea54058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000010000000900000002ab32c15c75c763b24adf26eee85aa7d6a76b366e6b88e34b94f76baec91bae7336a32ed637fc232cccb2f772d3092eee66594070a2be92751148feffc76005b1013ee78fb11f3f9ffd90d970cd5c95e9dee611bb4feafaa0b0220cc641ef054c9f5701fde4fad2fe7f2594db9dafd858c62f9cf6fe6b58334d73da40a5a8412d4600';
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(signedImportHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(signedImportHex);
      tx.id.should.equal('2ks9vW1SVWD4KsNPHgXnV5dpJaCcaxVNbQW4H7t9BMDxApGvfa');
    });

    it('should FAIL with unsorted UTXO addresses - demonstrates AddressMap mismatch issue for import in C-chain tx', async () => {
      // This test uses UTXO addresses in UNSORTED order to demonstrate the issue.
      // With unsorted addresses, the current implementation will create AddressMaps incorrectly
      // because it uses sequential indices, not UTXO address order.
      //
      // Expected: AddressMap should map addresses to signature slots based on UTXO order (addressesIndex)
      // Current (WRONG): AddressMap uses sequential indices (0, 1, 2...)
      //
      // This test WILL FAIL with current implementation because AddressMaps don't match credential order

      // UTXO addresses in UNSORTED order (different from sorted)
      // Sorted would be: [0x3329... (smallest), 0x7e91... (middle), 0xc732... (largest)]
      // Unsorted: [0xc732... (largest), 0x3329... (smallest), 0x7e91... (middle)]
      const unsortedUtxoAddresses = [
        '0xc7324437c96c7c8a6a152da2385c1db5c3ab1f91', // Largest (would be index 2 if sorted)
        '0x3329be7d01cd3ebaae6654d7327dd9f17a2e1581', // Smallest (would be index 0 if sorted)
        '0x7e918a5e8083ae4c9f2f0ed77055c24bf3665001', // Middle (would be index 1 if sorted)
      ];

      // Corresponding P-chain addresses (in same order as _fromAddresses)
      const pAddresses = [
        'P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut', // Maps to 0xc732... (UTXO index 0 in unsorted)
        'P-costwo106gc5h5qswhye8e0pmthq4wzf0ekv5qppsrvpu', // Maps to 0x3329... (UTXO index 1 in unsorted)
        'P-costwo1cueygd7fd37g56s49k3rshqakhp6k8u3adzt6m', // Maps to 0x7e91... (UTXO index 2 in unsorted)
      ];

      // Create UTXO with UNSORTED addresses
      const amount = '500000000'; // 0.5 FLR
      const fee = '5000000'; // Example fee
      const utxoAmount = (BigInt(amount) + BigInt(fee) + BigInt('10000000')).toString(); // amount + fee + some buffer

      const utxo: DecodedUtxoObj = {
        outputID: 0,
        amount: utxoAmount,
        txid: '2vPMx8P63adgBae7GAWFx7qvJDwRmMnDCyKddHRBXWhysjX4BP',
        outputidx: '1',
        addresses: unsortedUtxoAddresses, // UNSORTED order
        threshold: 2,
      };

      // Build transaction
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(2)
        .fromPubKey(pAddresses)
        .utxos([utxo])
        .to(testData.to)
        .feeRate(testData.fee);

      // Build unsigned transaction
      const unsignedTx = await txBuilder.build();
      const unsignedHex = unsignedTx.toBroadcastFormat();

      // Get AddressMaps from the ORIGINAL transaction (before parsing)
      // The parsed transaction's AddressMap only contains the output address, not _fromAddresses
      const originalFlareTx = (unsignedTx as any)._flareTransaction;
      const originalAddressMaps = (originalFlareTx as any as UnsignedTx).addressMaps;

      // Parse it back to inspect AddressMaps and credentials
      const parsedBuilder = factory.from(unsignedHex);
      const parsedTx = await parsedBuilder.build();
      const flareTx = (parsedTx as any)._flareTransaction;

      // Get the input to check sigIndicies (for C-chain imports, inputs are importedInputs)
      const importTx = flareTx.tx as any;
      const input = importTx.importedInputs[0];
      const sigIndicies = input.sigIndicies();

      // sigIndicies tells us: sigIndicies[slotIndex] = utxoAddressIndex
      // For threshold=2, we need signatures for first 2 addresses in UTXO order
      // UTXO order: [0xc732... (index 0), 0x3329... (index 1), 0x7e91... (index 2)]
      // So sigIndicies should be [0, 1] meaning: slot 0 = UTXO index 0, slot 1 = UTXO index 1

      // Verify sigIndicies are [0, 1] (first 2 addresses in UTXO order, NOT sorted order)
      sigIndicies.length.should.equal(2);
      sigIndicies[0].should.equal(0, 'First signature slot should be UTXO address index 0 (0xc732...)');
      sigIndicies[1].should.equal(1, 'Second signature slot should be UTXO address index 1 (0x3329...)');

      // The critical test: Verify that signature slots have embedded addresses based on UTXO order
      // With unsorted UTXO addresses, this will FAIL if AddressMaps don't match UTXO order
      //
      // Parse the credential to see which slots have which embedded addresses
      const credential = flareTx.credentials[0];
      const signatures = credential.getSignatures();

      // Extract embedded addresses from signature slots
      const embeddedAddresses: string[] = [];
      const isEmptySignature = (signature: string): boolean => {
        return !!signature && testUtils.removeHexPrefix(signature).startsWith('0'.repeat(90));
      };

      const hasEmbeddedAddress = (signature: string): boolean => {
        if (!isEmptySignature(signature)) return false;
        const cleanSig = testUtils.removeHexPrefix(signature);
        if (cleanSig.length < 130) return false;
        const embeddedPart = cleanSig.substring(90, 130);
        // Check if embedded part is not all zeros
        return embeddedPart !== '0'.repeat(40);
      };

      signatures.forEach((sig: string, slotIndex: number) => {
        if (hasEmbeddedAddress(sig)) {
          // Extract embedded address (after position 90, 40 chars = 20 bytes)
          const cleanSig = testUtils.removeHexPrefix(sig);
          const embeddedAddr = cleanSig.substring(90, 130).toLowerCase();
          embeddedAddresses[slotIndex] = '0x' + embeddedAddr;
        }
      });

      // Verify: Credentials only embed ONE address (user/recovery), not both
      // The embedded address should be based on addressesIndex logic, not sequential order
      //
      // Compute addressesIndex to determine expected signature order
      const utxoAddressBytes = unsortedUtxoAddresses.map((addr) => testUtils.parseAddress(addr));
      const pAddressBytes = pAddresses.map((addr) => testUtils.parseAddress(addr));

      const addressesIndex: number[] = [];
      pAddressBytes.forEach((pAddr) => {
        const utxoIndex = utxoAddressBytes.findIndex(
          (uAddr) => Buffer.compare(Buffer.from(uAddr), Buffer.from(pAddr)) === 0
        );
        addressesIndex.push(utxoIndex);
      });

      // firstIndex = 0 (user), bitgoIndex = 1
      const firstIndex = 0;
      const bitgoIndex = 1;

      // Determine expected signature order based on addressesIndex
      const userComesFirst = addressesIndex[bitgoIndex] > addressesIndex[firstIndex];

      // Expected credential structure:
      // - If user comes first: [userAddress, zeros]
      // - If bitgo comes first: [zeros, userAddress]
      const userAddressHex = Buffer.from(pAddressBytes[firstIndex]).toString('hex').toLowerCase();
      const expectedUserAddr = '0x' + userAddressHex;

      if (userComesFirst) {
        // Expected: [userAddress, zeros]
        // Slot 0 should have user address (pAddr0 = 0xc732... = UTXO index 0)
        if (embeddedAddresses[0]) {
          embeddedAddresses[0]
            .toLowerCase()
            .should.equal(
              expectedUserAddr,
              `Slot 0 should have user address (${expectedUserAddr}) because user comes first in UTXO order`
            );
        } else {
          throw new Error(`Slot 0 should have embedded user address, but is empty`);
        }
        // Slot 1 should be zeros (no embedded address)
        if (embeddedAddresses[1]) {
          throw new Error(`Slot 1 should be zeros, but has embedded address: ${embeddedAddresses[1]}`);
        }
      } else {
        // Expected: [zeros, userAddress]
        // Slot 0 should be zeros
        if (embeddedAddresses[0]) {
          throw new Error(`Slot 0 should be zeros, but has embedded address: ${embeddedAddresses[0]}`);
        }
        // Slot 1 should have user address
        if (embeddedAddresses[1]) {
          embeddedAddresses[1]
            .toLowerCase()
            .should.equal(
              expectedUserAddr,
              `Slot 1 should have user address (${expectedUserAddr}) because bitgo comes first in UTXO order`
            );
        } else {
          throw new Error(`Slot 1 should have embedded user address, but is empty`);
        }
      }

      // The key verification: AddressMaps should match the credential order
      // Current implementation (WRONG): AddressMaps use sequential indices (0, 1, 2...)
      // Expected (CORRECT): AddressMaps should use addressesIndex logic, matching credential order
      //
      // Get AddressMaps from the ORIGINAL transaction (not parsed, because parsed AddressMap only has output address)
      // For C-chain imports, originalFlareTx is EVMUnsignedTx which has addressMaps property

      const addressMaps = originalAddressMaps;
      addressMaps.toArray().length.should.equal(1, 'Should have one AddressMap for one input');

      const addressMap = addressMaps.toArray()[0];

      // Expected: Based on addressesIndex logic
      // If user comes first: slot 0 = user, slot 1 = bitgo
      // If bitgo comes first: slot 0 = bitgo, slot 1 = user
      const expectedSlot0Addr = userComesFirst ? pAddressBytes[firstIndex] : pAddressBytes[bitgoIndex];
      const expectedSlot1Addr = userComesFirst ? pAddressBytes[bitgoIndex] : pAddressBytes[firstIndex];

      // AddressMap maps: Address -> slot index
      // We need to check which addresses are mapped to slots 0 and 1
      // AddressMap.get() returns the slot index for a given address

      // Verify that AddressMap correctly maps addresses based on credential order (UTXO order)
      // The AddressMap should map the addresses that appear in credentials to the correct slots
      const { Address } = require('@flarenetwork/flarejs');
      const expectedSlot0Address = new Address(expectedSlot0Addr);
      const expectedSlot1Address = new Address(expectedSlot1Addr);
      const expectedSlot0FromMap = addressMap.get(expectedSlot0Address);
      const expectedSlot1FromMap = addressMap.get(expectedSlot1Address);

      // Verify that the expected addresses map to the correct slots
      if (expectedSlot0FromMap === undefined) {
        throw new Error(`Address at UTXO index ${addressesIndex[firstIndex]} not found in AddressMap`);
      }
      if (expectedSlot1FromMap === undefined) {
        throw new Error(`Address at UTXO index ${addressesIndex[bitgoIndex]} not found in AddressMap`);
      }
      expectedSlot0FromMap.should.equal(0, `Address at UTXO index ${addressesIndex[firstIndex]} should map to slot 0`);
      expectedSlot1FromMap.should.equal(1, `Address at UTXO index ${addressesIndex[bitgoIndex]} should map to slot 1`);

      // If addressesIndex is not sequential ([0, 1, ...]), verify that sequential mapping is NOT used incorrectly
      // Sequential mapping means: pAddresses[0] -> slot 0, pAddresses[1] -> slot 1, regardless of UTXO order
      const usesSequentialMapping = addressesIndex[0] === 0 && addressesIndex[1] === 1;

      if (!usesSequentialMapping) {
        // Check if AddressMap uses sequential mapping (array order) instead of UTXO order
        const sequentialSlot0 = addressMap.get(new Address(pAddressBytes[0]));
        const sequentialSlot1 = addressMap.get(new Address(pAddressBytes[1]));

        // Sequential mapping would map pAddresses[0] -> slot 0, pAddresses[1] -> slot 1
        // But we want UTXO order mapping based on addressesIndex
        const isSequential = sequentialSlot0 === 0 && sequentialSlot1 === 1;

        // Check if pAddresses[0] and pAddresses[1] are the expected addresses for slots 0 and 1
        // If they are, then sequential mapping happens to be correct (by coincidence)
        const pAddress0IsExpectedSlot0 =
          Buffer.compare(Buffer.from(pAddressBytes[0]), Buffer.from(expectedSlot0Addr)) === 0;
        const pAddress1IsExpectedSlot1 =
          Buffer.compare(Buffer.from(pAddressBytes[1]), Buffer.from(expectedSlot1Addr)) === 0;

        // If sequential mapping is used but it's NOT correct (doesn't match expected addresses), fail
        if (isSequential && (!pAddress0IsExpectedSlot0 || !pAddress1IsExpectedSlot1)) {
          throw new Error(
            `AddressMap uses sequential mapping (array order) but should use UTXO order. ` +
              `addressesIndex: [${addressesIndex.join(', ')}]. ` +
              `Expected slot 0 = address at UTXO index ${addressesIndex[firstIndex]}, slot 1 = address at UTXO index ${addressesIndex[bitgoIndex]}`
          );
        }
      }
    });
  });
});
