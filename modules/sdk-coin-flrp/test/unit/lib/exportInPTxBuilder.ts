import assert from 'assert';
import 'should';
import {
  EXPORT_IN_P as testData,
  EXPORT_IN_P_TWO_UTXOS as twoUtxoTestData,
  EXPORT_IN_P_NO_CHANGE as noChangeTestData,
} from '../../resources/transactionData/exportInP';
import { TransactionBuilderFactory, DecodedUtxoObj, Transaction } from '../../../src/lib';
import { coins, FlareNetwork } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';

describe('Flrp Export In P Tx Builder', () => {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);

  describe('default fee', () => {
    const FIXED_FEE = (coinConfig.network as FlareNetwork).txFee;

    it('should set fixedFee (1000000) by default in constructor', () => {
      const txBuilder = factory.getExportInPBuilder();
      // The fixedFee should be set from network.txFee = '1000000'
      const transaction = (txBuilder as any).transaction;
      transaction._fee.fee.should.equal(FIXED_FEE);
    });

    it('should use default fixedFee when fee is not explicitly set', async () => {
      // Create a UTXO with enough balance to cover amount + default fee
      const amount = '500000000'; // 0.5 FLR
      const utxoAmount = (BigInt(amount) + BigInt(FIXED_FEE)).toString(); // amount + fixedFee

      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(amount)
        .externalChainId(testData.sourceChainId)
        // NOTE: .fee() is NOT called - should use default fixedFee
        .utxos([
          {
            outputID: 0,
            amount: utxoAmount,
            txid: '21hcD64N9QzdayPjhKLsBQBa8FyXcsJGNStBZ3vCRdCCEsLru2',
            outputidx: '0',
            addresses: testData.outputs[0].addresses,
            threshold: testData.threshold,
          },
        ]);

      const tx = (await txBuilder.build()) as Transaction;

      // Verify the fee in the built transaction equals the fixedFee
      tx.fee.fee.should.equal(FIXED_FEE);
    });
  });

  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getExportInPBuilder();
    it('should fail amount low than zero', () => {
      assert.throws(
        () => {
          txBuilder.amount('-1');
        },
        (e: any) => e.message === 'Amount must be greater than 0'
      );
    });
    it('should fail target chain id length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(Buffer.from(testData.INVALID_CHAIN_ID.slice(2)));
        },
        (e: any) => e.message === 'Chain id are 32 byte size'
      );
    });

    it('should fail target chain id not a valid base58 string', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.INVALID_CHAIN_ID);
        },
        (e: any) => e.message === 'Non-base58 character'
      );
    });

    it('should fail target chain id cb58 invalid checksum', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(testData.VALID_C_CHAIN_ID.slice(2));
        },
        (e: any) => e.message === 'Invalid checksum'
      );
    });

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
    transactionType: 'Export P2C with changeoutput',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getExportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .amount(testData.amount)
        .externalChainId(testData.sourceChainId)
        .fee(testData.fee)
        .utxos(testData.outputs),
    unsignedTxHex: testData.unsignedHex,
    halfSignedTxHex: testData.halfSigntxHex,
    fullSignedTxHex: testData.fullSigntxHex,
    privateKey: {
      prv1: testData.privateKeys[0],
      prv2: testData.privateKeys[1],
    },
    txHash: testData.txhash,
  });

  signFlowTest({
    transactionType: 'Export P2C with 2 UTXOs',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getExportInPBuilder()
        .threshold(twoUtxoTestData.threshold)
        .locktime(twoUtxoTestData.locktime)
        .fromPubKey(twoUtxoTestData.pAddresses)
        .amount(twoUtxoTestData.amount)
        .externalChainId(twoUtxoTestData.sourceChainId)
        .fee(twoUtxoTestData.fee)
        .utxos(twoUtxoTestData.outputs),
    unsignedTxHex: twoUtxoTestData.unsignedHex,
    halfSignedTxHex: twoUtxoTestData.halfSigntxHex,
    fullSignedTxHex: twoUtxoTestData.fullSigntxHex,
    privateKey: {
      prv1: twoUtxoTestData.privateKeys[0],
      prv2: twoUtxoTestData.privateKeys[1],
    },
    txHash: twoUtxoTestData.txhash,
  });

  signFlowTest({
    transactionType: 'Export P2C with no change output',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getExportInPBuilder()
        .threshold(noChangeTestData.threshold)
        .locktime(noChangeTestData.locktime)
        .fromPubKey(noChangeTestData.pAddresses)
        .amount(noChangeTestData.amount)
        .externalChainId(noChangeTestData.sourceChainId)
        .fee(noChangeTestData.fee)
        .utxos(noChangeTestData.outputs),
    unsignedTxHex: noChangeTestData.unsignedHex,
    halfSignedTxHex: noChangeTestData.halfSigntxHex,
    fullSignedTxHex: noChangeTestData.fullSigntxHex,
    privateKey: {
      prv1: noChangeTestData.privateKeys[0],
      prv2: noChangeTestData.privateKeys[1],
    },
    txHash: noChangeTestData.txhash,
  });

  it('Should full sign a export tx from unsigned raw tx', () => {
    const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(testData.unsignedHex);
    txBuilder.sign({ key: testData.privateKeys[0] });
    txBuilder
      .build()
      .then(() => assert.fail('it can sign'))
      .catch((err) => {
        err.message.should.be.equal('Private key cannot sign the transaction');
      });
  });

  describe('on-chain verified transactions', () => {
    it('should verify on-chain tx id for signed P-chain export', async () => {
      const signedExportHex =
        '0x0000000000120000007200000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd00000007000000001ac6e558000000000000000000000001000000033329be7d01cd3ebaae6654d7327dd9f17a2e15817e918a5e8083ae4c9f2f0ed77055c24bf3665001c7324437c96c7c8a6a152da2385c1db5c3ab1f9100000003862ce86ba2e28884e8b83f5d6266d274b33632a1cc213d4c12996037fc21b2020000000058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd00000005000000001d6c96c60000000100000000a4891dfbd024a53b8e4512427d919910568989b9b4846026ac7bcb8290494c260000000058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd0000000500000000003ffabc0000000100000000c1fb3b438f8f49e1bb657a59106be9f5f91d2efce5e0259fcbbb9458e271f80d0000000058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000050000000000400e7000000001000000000000000078db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da55524790000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000002faf080000000000000000000000002000000033329be7d01cd3ebaae6654d7327dd9f17a2e15817e918a5e8083ae4c9f2f0ed77055c24bf3665001c7324437c96c7c8a6a152da2385c1db5c3ab1f91000000030000000900000001afdf0ac2bdbfb1735081dd859f4d263e587d81ba81c6bd2cb345ee5a66cef4e97a634c740f35ef6ba600796a5add1d91e69a14cfcb22b65e6ae0bcdfbcebfaba000000000900000001afdf0ac2bdbfb1735081dd859f4d263e587d81ba81c6bd2cb345ee5a66cef4e97a634c740f35ef6ba600796a5add1d91e69a14cfcb22b65e6ae0bcdfbcebfaba000000000900000001afdf0ac2bdbfb1735081dd859f4d263e587d81ba81c6bd2cb345ee5a66cef4e97a634c740f35ef6ba600796a5add1d91e69a14cfcb22b65e6ae0bcdfbcebfaba00';
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(signedExportHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(signedExportHex);
      tx.id.should.equal('ka8at5CinmpUc6QMVr33dyUJi156LKMdodrJM59kS6EWr3vHg');
    });

    it('should FAIL with unsorted UTXO addresses - demonstrates AddressMap mismatch issue for export in P-chain tx', async () => {
      // This test uses UTXO addresses in UNSORTED order to demonstrate the issue.
      // With unsorted addresses, the current implementation will create AddressMaps incorrectly
      // because it uses sorted addresses, not UTXO address order.
      //
      // Expected: AddressMap should map addresses to signature slots based on UTXO order (sigIndicies)
      // Current (WRONG): AddressMap uses sorted addresses with sequential slots
      //
      // This test WILL FAIL with current implementation because AddressMaps don't match sigIndicies

      // UTXO addresses in UNSORTED order (different from sorted)
      // Sorted would be: [0x12cb... (smallest), 0xa6e0... (middle), 0xc386... (largest)]
      // Unsorted: [0xc386... (largest), 0x12cb... (smallest), 0xa6e0... (middle)]
      const unsortedUtxoAddresses = [
        '0xc386d58d09a9ae77cf1cf07bf1c9de44ebb0c9f3', // Largest (would be index 2 if sorted)
        '0x12cb32eaf92553064db98d271b56cba079ec78f5', // Smallest (would be index 0 if sorted)
        '0xa6e0c1abd0132f70efb77e2274637ff336a29a57', // Middle (would be index 1 if sorted)
      ];

      // Corresponding P-chain addresses (in same order as UTXO)
      const pAddresses = [
        'P-costwo15msvr27szvhhpmah0c38gcml7vm29xjh7tcek8', // Maps to 0xc386... (UTXO index 0)
        'P-costwo1zt9n96hey4fsvnde35n3k4kt5pu7c784dzewzd', // Maps to 0x12cb... (UTXO index 1)
        'P-costwo1cwrdtrgf4xh80ncu7palrjw7gn4mpj0n4dxghh', // Maps to 0xa6e0... (UTXO index 2)
      ];

      // Create UTXO with UNSORTED addresses
      // Amount must cover export amount + fee
      const exportAmount = '50000000';
      const fee = '1261000';
      const utxoAmount = (BigInt(exportAmount) + BigInt(fee)).toString(); // amount + fee

      const utxo: DecodedUtxoObj = {
        outputID: 0,
        amount: utxoAmount,
        txid: 'zstyYq5riDKYDSR3fUYKKkuXKJ1aJCe8WNrXKqEBJD4CGwzFw',
        outputidx: '0',
        addresses: unsortedUtxoAddresses, // UNSORTED order
        threshold: 2,
      };

      // Build transaction
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(2)
        .locktime(0)
        .fromPubKey(pAddresses)
        .externalChainId(testData.sourceChainId)
        .amount(exportAmount)
        .fee(fee)
        .utxos([utxo]);

      // Build unsigned transaction
      const unsignedTx = await txBuilder.build();
      const unsignedHex = unsignedTx.toBroadcastFormat();

      // Parse it back to inspect AddressMaps and sigIndicies
      const parsedBuilder = factory.from(unsignedHex);
      const parsedTx = await parsedBuilder.build();
      const flareTx = (parsedTx as any)._flareTransaction;

      // Get the input to check sigIndicies
      const exportTx = flareTx.tx as any;
      const input = exportTx.baseTx.inputs[0];
      const transferInput = input.input;
      const sigIndicies = transferInput.sigIndicies();

      // sigIndicies tells us: sigIndicies[slotIndex] = utxoAddressIndex
      // For threshold=2, we need signatures for first 2 addresses in UTXO order
      // UTXO order: [0xc386... (index 0), 0x12cb... (index 1), 0xa6e0... (index 2)]
      // So sigIndicies should be [0, 1] meaning: slot 0 = UTXO index 0, slot 1 = UTXO index 1

      // Verify sigIndicies are [0, 1] (first 2 addresses in UTXO order, NOT sorted order)
      sigIndicies.length.should.equal(2);
      sigIndicies[0].should.equal(0, 'First signature slot should be UTXO address index 0 (0xc386...)');
      sigIndicies[1].should.equal(1, 'Second signature slot should be UTXO address index 1 (0x12cb...)');

      // The critical test: Verify that signature slots have embedded addresses based on UTXO order
      // With unsorted UTXO addresses, this will FAIL if AddressMaps don't match UTXO order
      //
      // sigIndicies tells us: sigIndicies[slotIndex] = utxoAddressIndex
      // For threshold=2, we need signatures for first 2 addresses in UTXO order
      // UTXO order: [0xc386... (index 0), 0x12cb... (index 1), 0xa6e0... (index 2)]
      // So sigIndicies should be [0, 1] meaning: slot 0 = UTXO index 0, slot 1 = UTXO index 1

      // Parse the credential to see which slots have which embedded addresses
      const credential = flareTx.credentials[0];
      const signatures = credential.getSignatures();

      // Helper function to check if signature has embedded address (same logic as transaction.ts)
      const testUtils2 = require('../../../src/lib/utils').default;
      const isEmptySignature = (signature: string): boolean => {
        return !!signature && testUtils2.removeHexPrefix(signature).startsWith('0'.repeat(90));
      };

      const hasEmbeddedAddress = (signature: string): boolean => {
        if (!isEmptySignature(signature)) return false;
        const cleanSig = testUtils2.removeHexPrefix(signature);
        if (cleanSig.length < 130) return false;
        const embeddedPart = cleanSig.substring(90, 130);
        // Check if embedded part is not all zeros
        return embeddedPart !== '0'.repeat(40);
      };

      // Extract embedded addresses from signature slots
      const embeddedAddresses: string[] = [];

      signatures.forEach((sig: string, slotIndex: number) => {
        if (hasEmbeddedAddress(sig)) {
          // Extract embedded address (after position 90, 40 chars = 20 bytes)
          const cleanSig = testUtils2.removeHexPrefix(sig);
          const embeddedAddr = cleanSig.substring(90, 130).toLowerCase();
          embeddedAddresses[slotIndex] = '0x' + embeddedAddr;
        }
      });

      // Verify: Credentials only embed ONE address (user/recovery), not both
      // The embedded address should be based on addressesIndex logic, not sorted order
      //
      // Compute addressesIndex to determine expected signature order
      const utxoAddressBytes = unsortedUtxoAddresses.map((addr) => testUtils2.parseAddress(addr));
      const pAddressBytes = pAddresses.map((addr) => testUtils2.parseAddress(addr));

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
        // Slot 0 should have user address (pAddr0 = 0xc386... = UTXO index 0)
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
      // With the fix, AddressMaps are created using the same addressesIndex logic as credentials
      // This ensures signing works correctly even with unsorted UTXO addresses
    });
  });
});
