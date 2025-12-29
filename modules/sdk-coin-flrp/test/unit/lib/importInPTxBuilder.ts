import assert from 'assert';
import 'should';
import { IMPORT_IN_P as testData } from '../../resources/transactionData/importInP';
import { TransactionBuilderFactory, DecodedUtxoObj, Transaction } from '../../../src/lib';
import { coins, FlareNetwork } from '@bitgo/statics';
import signFlowTest from './signFlowTestSuit';
import testUtils from '../../../src/lib/utils';

describe('Flrp Import In P Tx Builder', () => {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);

  describe('default fee', () => {
    const FIXED_FEE = (coinConfig.network as FlareNetwork).txFee;

    it('should set fixedFee (1261000) by default in constructor', () => {
      const txBuilder = factory.getImportInPBuilder();
      // The fixedFee should be set from network.txFee = '1261000'
      const transaction = (txBuilder as any).transaction;
      transaction._fee.fee.should.equal(FIXED_FEE);
    });

    it('should use default fixedFee when fee is not explicitly set', async () => {
      // Create a UTXO with enough balance to cover the default fee
      const utxoAmount = '50000000'; // 0.05 FLR - enough to cover fee and have output

      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
        .externalChainId(testData.sourceChainId)
        // NOTE: .fee() is NOT called - should use default fixedFee
        .utxos([
          {
            outputID: 0,
            amount: utxoAmount,
            txid: testData.outputs[0].txid,
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
    const txBuilder = factory.getImportInPBuilder();

    it('should fail target chain id length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.externalChainId(Buffer.from(testData.INVALID_CHAIN_ID));
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
    transactionType: 'Import P2C',
    newTxFactory: () => new TransactionBuilderFactory(coins.get('tflrp')),
    newTxBuilder: () =>
      new TransactionBuilderFactory(coins.get('tflrp'))
        .getImportInPBuilder()
        .threshold(testData.threshold)
        .locktime(testData.locktime)
        .fromPubKey(testData.pAddresses)
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

  it('Should full sign a import tx from unsigned raw tx', () => {
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
    it('should verify on-chain tx id for signed P-chain import', async () => {
      const signedImportHex =
        '0x0000000000110000007200000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000002e79f04000000000000000000000002000000033329be7d01cd3ebaae6654d7327dd9f17a2e15817e918a5e8083ae4c9f2f0ed77055c24bf3665001c7324437c96c7c8a6a152da2385c1db5c3ab1f91000000000000000078db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da555247900000001063ec620d1892f802c8f0c124d05ce1e73a85686bea2b09380fc58f6d72497db0000000058734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000050000000002faf0800000000200000000000000010000000100000009000000022ed4ebc2c81e38820cc7bd6e952d10bd30382fa0679c8a0ba5dc67990a09125656d47eadcc622af935fd5dad654f9b00d3b9563df38e875ef1964e1c9ded851100ec514ace26baefce3ffeab94e3580443abcc3cea669a87c7c26ef8ffa3fe79b330e4bdbacabfd1cce9f7b6a9f2515b4fdf627f7d2678e9532d861a7673444aa700';
      const txBuilder = new TransactionBuilderFactory(coins.get('tflrp')).from(signedImportHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(signedImportHex);
      tx.id.should.equal('2vwvuXp47dsUmqb4vkaMk7UsukrZNapKXT2ruZhVibbjMDpqr9');
    });

    it('should FAIL with unsorted UTXO addresses - demonstrates AddressMap mismatch issue', async () => {
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
      const utxo: DecodedUtxoObj = {
        outputID: 0,
        amount: '50000000',
        txid: 'zstyYq5riDKYDSR3fUYKKkuXKJ1aJCe8WNrXKqEBJD4CGwzFw',
        outputidx: '0',
        addresses: unsortedUtxoAddresses, // UNSORTED order
        threshold: 2,
      };

      // Build transaction
      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(2)
        .locktime(0)
        .fromPubKey(pAddresses)
        .externalChainId(testData.sourceChainId)
        .fee('1261000')
        .utxos([utxo]);

      // Build unsigned transaction
      const unsignedTx = await txBuilder.build();
      const unsignedHex = unsignedTx.toBroadcastFormat();

      // Parse it back to inspect AddressMaps and sigIndicies
      const parsedBuilder = factory.from(unsignedHex);
      const parsedTx = await parsedBuilder.build();
      const flareTx = (parsedTx as any)._flareTransaction;

      // Get the input to check sigIndicies
      const importTx = flareTx.tx as any;
      const input = importTx.ins[0];
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

      // Now the key test: AddressMap should map addresses based on sigIndicies (UTXO order)
      // NOT based on sorted order
      //
      // Current implementation (WRONG):
      // - Sorts addresses: [0x12cb... (smallest), 0xa6e0... (middle), 0xc386... (largest)]
      // - Maps: sorted[0] -> slot 0, sorted[1] -> slot 1
      // - This means: 0x12cb... -> slot 0, 0xa6e0... -> slot 1 (WRONG!)
      //
      // Expected (CORRECT):
      // - Uses UTXO order via sigIndicies: sigIndicies[0]=0, sigIndicies[1]=1
      // - Maps: address at UTXO index 0 (0xc386...) -> slot 0, address at UTXO index 1 (0x12cb...) -> slot 1
      // - This means: 0xc386... -> slot 0, 0x12cb... -> slot 1 (CORRECT!)

      // Parse addresses
      // Address at UTXO index 0 (0xc386...) should map to signature slot 0
      const pAddr0Bytes = testUtils.parseAddress(pAddresses[0]); // Corresponds to UTXO index 0

      // Address at UTXO index 1 (0x12cb...) should map to signature slot 1
      const pAddr1Bytes = testUtils.parseAddress(pAddresses[1]); // Corresponds to UTXO index 1

      // Get addresses from AddressMap
      const addressesInMap = flareTx.getAddresses();

      // Verify addresses are in the map
      const addr0InMap = addressesInMap.some((addr) => Buffer.compare(Buffer.from(addr), pAddr0Bytes) === 0);
      const addr1InMap = addressesInMap.some((addr) => Buffer.compare(Buffer.from(addr), pAddr1Bytes) === 0);

      addr0InMap.should.be.true('Address at UTXO index 0 should be in AddressMap');
      addr1InMap.should.be.true('Address at UTXO index 1 should be in AddressMap');

      // The critical assertion: AddressMap should map addresses to signature slots based on sigIndicies
      // Since we can't directly access individual AddressMap instances, we verify the behavior
      // by checking that the transaction structure is correct.
      //
      // With current implementation (WRONG):
      // - AddressMap maps sorted addresses: 0x12cb... -> slot 0, 0xa6e0... -> slot 1
      // - But sigIndicies say: slot 0 = UTXO index 0 (0xc386...), slot 1 = UTXO index 1 (0x12cb...)
      // - Mismatch! AddressMap says 0x12cb... -> slot 0, but sigIndicies say slot 0 = 0xc386...
      //
      // This mismatch will cause signing to fail because:
      // - Signing logic uses AddressMap to find which slot to sign
      // - But credentials expect signatures in slots based on sigIndicies (UTXO order)
      // - Result: "wrong signature" error on-chain

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

      // Extract embedded addresses from signature slots
      const embeddedAddresses: string[] = [];

      // Helper function to check if signature has embedded address (same logic as transaction.ts)
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
      // The embedded address should be based on addressesIndex logic, not sorted order
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
