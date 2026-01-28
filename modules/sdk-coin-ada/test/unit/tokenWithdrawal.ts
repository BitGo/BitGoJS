import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import * as testData from '../resources';
import { TransactionBuilderFactory, AdaToken } from '../../src';
import { coins } from '@bitgo/statics';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { Transaction } from '../../src/lib/transaction';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('ADA Token Operations', async () => {
  const factory = new TransactionBuilderFactory(coins.get('tada'));

  const receiverAddress = testData.rawTx.outputAddress2.address;
  const senderAddress = testData.rawTx.outputAddress1.address;

  const policyId = 'e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72';
  const policyScriptHash = CardanoWasm.ScriptHash.from_hex(policyId);
  const assetName = 'tada:water';
  const name = 'WATER';
  const asciiEncodedName = Buffer.from(name, 'ascii').toString('hex');
  const fingerprint = 'asset1n69xf60d0760xvn8v2ffd5frvsm0cl2r8hfjf6';

  const unsupportedPolicyId = '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f';
  const unsupportedPolicyScriptHash = CardanoWasm.ScriptHash.from_hex(unsupportedPolicyId);
  const unsupportedName = 'BITGO';
  const unsupportedAsciiEncodedName = Buffer.from(unsupportedName, 'ascii').toString('hex');
  const unsupportedFingerprint = 'asset1m8h0gk7f6x5j5qg0x5m4q5f5j5qg0x5m4q5f5j';

  it(`should build a transaction with token ${assetName} - ada + ${assetName}`, async () => {
    const quantity = '20';
    const totalInput = 20000000;
    const totalAssetList = {
      [fingerprint]: {
        quantity: '100',
        policy_id: policyId,
        asset_name: asciiEncodedName,
      },
    };
    const expectedChangeAda = (
      totalInput -
      1500000 /* min ada for change token utxo */ -
      1500000 /* min ada for recipient token utxo*/ -
      173597
    ) /* fee */
      .toString();
    const expectedChangeToken = '80';

    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });

    txBuilder.output({
      address: receiverAddress,
      amount: '0', // Set ADA amount to 0 for token transfer (min ADA is handled in sdk build)
      multiAssets: {
        asset_name: asciiEncodedName,
        policy_id: policyId,
        quantity,
        fingerprint,
      },
    });

    txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
    txBuilder.ttl(800000000);
    txBuilder.isTokenTransaction();
    const tx = (await txBuilder.build()) as Transaction;

    should.equal(tx.type, TransactionType.Send);
    const txData = tx.toJson();

    // Check outputs (should include multi-asset and regular change)
    txData.outputs.length.should.equal(3);
    txData.inputs.length.should.equal(1);

    // One output should have the multi-asset change and the other for the transfer
    const assetOutput = txData.outputs.filter((output) => output.multiAssets !== undefined);
    assetOutput!.length.should.equal(2);

    // Verify inputs and outputs
    const input = txData.inputs[0];
    input.transaction_id.should.equal('3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21');
    input.transaction_index.should.equal(1);

    // Validate receiver output
    const receiverOutput = txData.outputs.filter((output) => output.address === receiverAddress);
    receiverOutput.length.should.equal(1);
    receiverOutput[0].amount.should.equal('1500000'); // Minimum ADA for asset output
    (receiverOutput[0].multiAssets! as CardanoWasm.MultiAsset)
      .get_asset(policyScriptHash, CardanoWasm.AssetName.new(Buffer.from(asciiEncodedName, 'hex')))
      .to_str()
      .should.equal(quantity);

    // Validate change outputs (one with asset and one without)
    const changeOutput = txData.outputs.filter((output) => output.address === senderAddress);
    changeOutput.length.should.equal(2);
    const changeWithAsset = changeOutput.find((output) => output.multiAssets !== undefined);
    should.exist(changeWithAsset);
    changeWithAsset!.amount.should.equal('1500000'); // Minimum ADA for asset output
    (changeWithAsset!.multiAssets! as CardanoWasm.MultiAsset)
      .get_asset(policyScriptHash, CardanoWasm.AssetName.new(Buffer.from(asciiEncodedName, 'hex')))
      .to_str()
      .should.equal(expectedChangeToken);

    const changeWithoutAsset = changeOutput.find((output) => output.multiAssets === undefined);
    should.exist(changeWithoutAsset);
    changeWithoutAsset!.amount.should.equal(expectedChangeAda); // Remaining ADA after fees and min ADAs
  });

  it(`should build a transaction with token ${assetName} - ada + ${assetName} + unsupported token`, async () => {
    const quantity = '20';
    const totalInput = 20000000;
    const totalAssetList = {
      [fingerprint]: {
        quantity: '100',
        policy_id: policyId,
        asset_name: asciiEncodedName,
      },
      [unsupportedFingerprint]: {
        quantity: '10000',
        policy_id: unsupportedPolicyId,
        asset_name: unsupportedAsciiEncodedName,
      },
    };
    const expectedChangeAda = (
      totalInput -
      1500000 /* min ada for change token utxo */ -
      1500000 /* min ada for recipient token utxo*/ -
      1500000 /* min ada for unsupported token change utxo */ -
      179889
    ) /* fee */
      .toString();
    const expectedChangeToken = '80';

    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba22',
      transaction_index: 1,
    });

    txBuilder.output({
      address: receiverAddress,
      amount: '0', // Set ADA amount to 0 for token transfer (min ADA is handled in sdk build)
      multiAssets: {
        asset_name: asciiEncodedName,
        policy_id: policyId,
        quantity,
        fingerprint,
      },
    });

    txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
    txBuilder.ttl(800000000);
    txBuilder.isTokenTransaction();
    const tx = (await txBuilder.build()) as Transaction;

    should.equal(tx.type, TransactionType.Send);
    const txData = tx.toJson();

    // Check outputs (should include multi-asset and regular change)
    txData.outputs.length.should.equal(4);
    txData.inputs.length.should.equal(2);

    // One output should have the multi-asset change and the other for the transfer
    const assetOutput = txData.outputs.filter((output) => output.multiAssets !== undefined);
    assetOutput!.length.should.equal(3);

    // Verify inputs and outputs
    txData.inputs[0].transaction_id.should.equal('3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21');
    txData.inputs[0].transaction_index.should.equal(1);

    txData.inputs[1].transaction_id.should.equal('3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba22');
    txData.inputs[1].transaction_index.should.equal(1);

    // Validate receiver output
    const receiverOutput = txData.outputs.filter((output) => output.address === receiverAddress);
    receiverOutput.length.should.equal(1);
    receiverOutput[0].amount.should.equal('1500000'); // Minimum ADA for asset output
    (receiverOutput[0].multiAssets! as CardanoWasm.MultiAsset)
      .get_asset(policyScriptHash, CardanoWasm.AssetName.new(Buffer.from(asciiEncodedName, 'hex')))
      .to_str()
      .should.equal(quantity);

    // Validate change outputs (one with supported token, one with unsupported token and one for pure ada)
    const changeOutput = txData.outputs.filter((output) => output.address === senderAddress);
    changeOutput.length.should.equal(3);

    const changeWithAsset = changeOutput.filter((output) => output.multiAssets !== undefined);
    changeWithAsset.length.should.equal(2);
    let tokens = 0;
    changeWithAsset.forEach((output) => {
      output!.amount.should.equal('1500000'); // Minimum ADA for asset output
      const supportedTokenChangeQty = (output!.multiAssets! as CardanoWasm.MultiAsset)
        .get_asset(policyScriptHash, CardanoWasm.AssetName.new(Buffer.from(asciiEncodedName, 'hex')))
        .to_str();
      const unsupportedTokenChangeQty = (output!.multiAssets! as CardanoWasm.MultiAsset)
        .get_asset(
          unsupportedPolicyScriptHash,
          CardanoWasm.AssetName.new(Buffer.from(unsupportedAsciiEncodedName, 'hex'))
        )
        .to_str();
      if (supportedTokenChangeQty !== '0') {
        supportedTokenChangeQty.should.equal(expectedChangeToken);
        tokens++;
      } else {
        unsupportedTokenChangeQty!.should.equal('10000');
        tokens++;
      }
    });
    tokens.should.equal(2);

    const changeWithoutAsset = changeOutput.find((output) => output.multiAssets === undefined);
    should.exist(changeWithoutAsset);
    changeWithoutAsset!.amount.should.equal(expectedChangeAda); // Remaining ADA after fees and min ADAs
  });

  it(`should fail to build a transaction with ${assetName} token and insufficient minimum ADA`, async () => {
    const quantity = '20';
    const totalInput = 2000000;
    const totalAssetList = {
      [fingerprint]: {
        quantity: '100',
        policy_id: policyId,
        asset_name: asciiEncodedName,
      },
    };

    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });

    txBuilder.output({
      address: receiverAddress,
      amount: '0', // Set ADA amount to 0 for token transfer (min ADA is handled in sdk build)
      multiAssets: {
        asset_name: asciiEncodedName,
        policy_id: policyId,
        quantity,
        fingerprint,
      },
    });

    txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
    txBuilder.ttl(800000000);
    txBuilder.isTokenTransaction();

    await txBuilder
      .build()
      .should.rejectedWith(
        'Insufficient funds: need a minimum of 1500000 lovelace per output to construct token transactions'
      );
  });

  it(`should fail to build a transaction with ${assetName} and insufficient token qty`, async () => {
    const quantity = '20';
    const totalInput = 20000000;
    const totalAssetList = {
      [fingerprint]: {
        quantity: '5',
        policy_id: policyId,
        asset_name: asciiEncodedName,
      },
    };

    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });

    txBuilder.output({
      address: receiverAddress,
      amount: '0', // Set ADA amount to 0 for token transfer (min ADA is handled in sdk build)
      multiAssets: {
        asset_name: asciiEncodedName,
        policy_id: policyId,
        quantity,
        fingerprint,
      },
    });

    txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
    txBuilder.ttl(800000000);
    txBuilder.isTokenTransaction();

    await txBuilder.build().should.rejectedWith('Insufficient qty: not enough token qty to cover receiver output');
  });

  it(`should build a transaction with ${assetName} when the token qty is exactly the qty in withdrawal`, async () => {
    const quantity = '1';
    const totalInput = 20000000;
    const totalAssetList = {
      [fingerprint]: {
        quantity: '1',
        policy_id: policyId,
        asset_name: asciiEncodedName,
      },
    };

    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });

    txBuilder.output({
      address: receiverAddress,
      amount: '0', // Set ADA amount to 0 for token transfer (min ADA is handled in sdk build)
      multiAssets: {
        asset_name: asciiEncodedName,
        policy_id: policyId,
        quantity,
        fingerprint,
      },
    });

    txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
    txBuilder.ttl(800000000);
    txBuilder.isTokenTransaction();

    await txBuilder.build().should.not.be.rejected();
  });

  it(`should build a sponsored token transaction where fee address sponsors min ADA for receiver`, async () => {
    const feeAddress =
      'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp';
    const quantity = '20';
    const senderInputBalance = 5000000;
    const feeAddressInputBalance = 20000000; // Fee address has enough ADA to sponsor
    const totalAssetList = {
      [fingerprint]: {
        quantity: '100',
        policy_id: policyId,
        asset_name: asciiEncodedName,
      },
    };

    const txBuilder = factory.getTransferBuilder();
    // Sender input (has tokens)
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    // Fee address input (sponsors fees and min ADA)
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba22',
      transaction_index: 0,
    });

    txBuilder.output({
      address: receiverAddress,
      amount: '0', // Set ADA amount to 0 for token transfer (min ADA is handled by fee address)
      multiAssets: {
        asset_name: asciiEncodedName,
        policy_id: policyId,
        quantity,
        fingerprint,
      },
    });

    txBuilder.changeAddress(senderAddress, senderInputBalance.toString(), totalAssetList);
    txBuilder.sponsorshipInfo({
      feeAddress: feeAddress,
      feeAddressInputBalance: feeAddressInputBalance.toString(),
    });
    txBuilder.ttl(800000000);
    txBuilder.isTokenTransaction();
    const tx = (await txBuilder.build()) as Transaction;

    should.equal(tx.type, TransactionType.Send);
    const txData = tx.toJson();

    txData.inputs.length.should.equal(2);
    txData.outputs.length.should.equal(4);

    // Validate receiver output - min ADA should be sponsored by fee address
    const receiverOutput = txData.outputs.filter((output) => output.address === receiverAddress);
    receiverOutput.length.should.equal(1);
    receiverOutput[0].amount.should.equal('1500000'); // Minimum ADA for asset output (sponsored by fee address)
    (receiverOutput[0].multiAssets! as CardanoWasm.MultiAsset)
      .get_asset(policyScriptHash, CardanoWasm.AssetName.new(Buffer.from(asciiEncodedName, 'hex')))
      .to_str()
      .should.equal(quantity);

    // Validate sender change output - should have full sender balance (tokens only, no ADA deduction for receiver)
    const senderChangeOutput = txData.outputs.filter((output) => output.address === senderAddress);
    senderChangeOutput.length.should.be.equal(2);

    // Validate fee address change output - should have remaining ADA after fees and min ADA for receiver
    const feeAddressChangeOutput = txData.outputs.filter((output) => output.address === feeAddress);
    feeAddressChangeOutput.length.should.equal(1);
    // Fee address change should not have any tokens
    should.not.exist(feeAddressChangeOutput[0].multiAssets);

    tx.getFee.should.equal('182485'); // Fee with two witnesses
  });

  describe('AdaToken verifyTransaction', () => {
    let bitgo: TestBitGoAPI;
    let adaToken;

    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
      bitgo.initializeTestVars();
      const tokenConfig = {
        type: 'tada:water',
        coin: 'tada',
        network: 'Testnet' as const,
        name: 'WATER',
        decimalPlaces: 0,
        policyId: policyId,
        assetName: name, // ASCII 'WATER', not hex-encoded
        contractAddress: `${policyId}:${asciiEncodedName}`,
      };
      adaToken = new AdaToken(bitgo, tokenConfig);
    });

    it('should verify a token transaction with correct token amount', async () => {
      const quantity = '20';
      const totalInput = 20000000;
      const totalAssetList = {
        [fingerprint]: {
          quantity: '100',
          policy_id: policyId,
          asset_name: asciiEncodedName,
        },
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.input({
        transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
        transaction_index: 1,
      });

      txBuilder.output({
        address: receiverAddress,
        amount: '0',
        multiAssets: {
          asset_name: asciiEncodedName,
          policy_id: policyId,
          quantity,
          fingerprint,
        },
      });

      txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
      txBuilder.ttl(800000000);
      txBuilder.isTokenTransaction();
      const tx = (await txBuilder.build()) as Transaction;
      const txHex = tx.toBroadcastFormat();

      // Verify transaction with correct token amount
      const txParams = {
        recipients: [
          {
            address: receiverAddress,
            amount: quantity, // Token amount, not ADA amount
          },
        ],
      };

      const txPrebuild = { txHex };
      const mockWallet = { coinSpecific: () => ({ baseAddress: senderAddress }) };
      const isVerified = await adaToken.verifyTransaction({ txParams, txPrebuild, wallet: mockWallet as any });
      isVerified.should.equal(true);
    });

    it('should fail to verify a token transaction with incorrect token amount', async () => {
      const quantity = '20';
      const totalInput = 20000000;
      const totalAssetList = {
        [fingerprint]: {
          quantity: '100',
          policy_id: policyId,
          asset_name: asciiEncodedName,
        },
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.input({
        transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
        transaction_index: 1,
      });

      txBuilder.output({
        address: receiverAddress,
        amount: '0',
        multiAssets: {
          asset_name: asciiEncodedName,
          policy_id: policyId,
          quantity,
          fingerprint,
        },
      });

      txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
      txBuilder.ttl(800000000);
      txBuilder.isTokenTransaction();
      const tx = (await txBuilder.build()) as Transaction;
      const txHex = tx.toBroadcastFormat();

      // Verify transaction with WRONG token amount (should fail)
      const txParams = {
        recipients: [
          {
            address: receiverAddress,
            amount: '999', // Wrong amount
          },
        ],
      };

      const txPrebuild = { txHex };
      const mockWallet = { coinSpecific: () => ({ baseAddress: senderAddress }) };
      await adaToken
        .verifyTransaction({ txParams, txPrebuild, wallet: mockWallet as any })
        .should.be.rejectedWith('cannot find recipient in expected output');
    });

    it('should fail to verify when address does not match', async () => {
      const quantity = '20';
      const totalInput = 20000000;
      const totalAssetList = {
        [fingerprint]: {
          quantity: '100',
          policy_id: policyId,
          asset_name: asciiEncodedName,
        },
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.input({
        transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
        transaction_index: 1,
      });

      txBuilder.output({
        address: receiverAddress,
        amount: '0',
        multiAssets: {
          asset_name: asciiEncodedName,
          policy_id: policyId,
          quantity,
          fingerprint,
        },
      });

      txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
      txBuilder.ttl(800000000);
      txBuilder.isTokenTransaction();
      const tx = (await txBuilder.build()) as Transaction;
      const txHex = tx.toBroadcastFormat();

      // Verify with wrong address (should fail)
      const txParams = {
        recipients: [
          {
            address:
              'addr_test1qqa86e3d7lfpwu0k2rhjz76ecmfxdr74s9kf9yfcp5hj5vmnh6xccjcclrk8jtaw9jgeuy99p2n8smtdpylmy45qjjfsfmp3g6',
            amount: quantity,
          },
        ],
      };

      const txPrebuild = { txHex };
      const mockWallet = { coinSpecific: () => ({ baseAddress: senderAddress }) };
      await adaToken
        .verifyTransaction({ txParams, txPrebuild, wallet: mockWallet as any })
        .should.be.rejectedWith('cannot find recipient in expected output');
    });

    it('should verify transaction when policyId has concatenated assetName (crypto compare format)', async () => {
      // This tests the case where policyId in tokenConfig contains policyId + asciiEncodedAssetName
      // which is consistent with crypto compare format
      const concatenatedPolicyId = policyId + asciiEncodedName; // e.g., 'e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed725741544552'

      const tokenConfigWithConcatenatedPolicyId = {
        type: 'tada:water',
        coin: 'tada',
        network: 'Testnet' as const,
        name: 'WATER',
        decimalPlaces: 0,
        policyId: concatenatedPolicyId, // policyId + assetName hex
        assetName: name, // ASCII name 'WATER' (not hex encoded)
        contractAddress: `${policyId}:${asciiEncodedName}`,
      };
      const adaTokenWithConcatenatedPolicyId = new AdaToken(bitgo, tokenConfigWithConcatenatedPolicyId);

      const quantity = '20';
      const totalInput = 20000000;
      const totalAssetList = {
        [fingerprint]: {
          quantity: '100',
          policy_id: policyId,
          asset_name: asciiEncodedName,
        },
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.input({
        transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
        transaction_index: 1,
      });

      txBuilder.output({
        address: receiverAddress,
        amount: '0',
        multiAssets: {
          asset_name: asciiEncodedName,
          policy_id: policyId,
          quantity,
          fingerprint,
        },
      });

      txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
      txBuilder.ttl(800000000);
      txBuilder.isTokenTransaction();
      const tx = (await txBuilder.build()) as Transaction;
      const txHex = tx.toBroadcastFormat();

      // Verify transaction - the verifyTransaction should strip the assetName from policyId
      const txParams = {
        recipients: [
          {
            address: receiverAddress,
            amount: quantity,
          },
        ],
      };

      const txPrebuild = { txHex };
      const mockWallet = { coinSpecific: () => ({ baseAddress: senderAddress }) };
      const isVerified = await adaTokenWithConcatenatedPolicyId.verifyTransaction({
        txParams,
        txPrebuild,
        wallet: mockWallet as any,
      });
      isVerified.should.equal(true);
    });

    it('should verify transaction with policyId that does not have concatenated assetName', async () => {
      // This tests the case where policyId is just the 28-byte policy ID (no assetName appended)
      const tokenConfigWithPlainPolicyId = {
        type: 'tada:water',
        coin: 'tada',
        network: 'Testnet' as const,
        name: 'WATER',
        decimalPlaces: 0,
        policyId: policyId, // Just the policy ID without assetName
        assetName: name, // ASCII name 'WATER'
        contractAddress: `${policyId}:${asciiEncodedName}`,
      };
      const adaTokenWithPlainPolicyId = new AdaToken(bitgo, tokenConfigWithPlainPolicyId);

      const quantity = '20';
      const totalInput = 20000000;
      const totalAssetList = {
        [fingerprint]: {
          quantity: '100',
          policy_id: policyId,
          asset_name: asciiEncodedName,
        },
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.input({
        transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
        transaction_index: 1,
      });

      txBuilder.output({
        address: receiverAddress,
        amount: '0',
        multiAssets: {
          asset_name: asciiEncodedName,
          policy_id: policyId,
          quantity,
          fingerprint,
        },
      });

      txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
      txBuilder.ttl(800000000);
      txBuilder.isTokenTransaction();
      const tx = (await txBuilder.build()) as Transaction;
      const txHex = tx.toBroadcastFormat();

      // Verify transaction - should work with plain policyId as well
      const txParams = {
        recipients: [
          {
            address: receiverAddress,
            amount: quantity,
          },
        ],
      };

      const txPrebuild = { txHex };
      const mockWallet = { coinSpecific: () => ({ baseAddress: senderAddress }) };
      const isVerified = await adaTokenWithPlainPolicyId.verifyTransaction({
        txParams,
        txPrebuild,
        wallet: mockWallet as any,
      });
      isVerified.should.equal(true);
    });

    it('should verify token consolidation transaction when all outputs go to base address', async () => {
      const quantity = '100';
      const totalInput = 20000000;
      const totalAssetList = {
        [fingerprint]: {
          quantity: '100',
          policy_id: policyId,
          asset_name: asciiEncodedName,
        },
      };

      // Build a consolidation transaction - all outputs go to sender (base) address
      const txBuilder = factory.getTransferBuilder();
      txBuilder.input({
        transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
        transaction_index: 1,
      });

      // For consolidation, tokens go back to the sender's base address
      txBuilder.output({
        address: senderAddress,
        amount: '0',
        multiAssets: {
          asset_name: asciiEncodedName,
          policy_id: policyId,
          quantity,
          fingerprint,
        },
      });

      txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
      txBuilder.ttl(800000000);
      txBuilder.isTokenTransaction();
      const tx = (await txBuilder.build()) as Transaction;
      const txHex = tx.toBroadcastFormat();

      // Mock wallet with coinSpecific returning base address
      const mockWallet = {
        coinSpecific: () => ({
          baseAddress: senderAddress,
        }),
      };

      // Verify consolidation transaction - no recipients, but consolidationToBaseAddress is true
      const txParams = {
        recipients: undefined,
      };

      const txPrebuild = { txHex };
      const verification = { consolidationToBaseAddress: true };

      const isVerified = await adaToken.verifyTransaction({
        txParams,
        txPrebuild,
        verification,
        wallet: mockWallet as any,
      });
      isVerified.should.equal(true);
    });

    it('should fail token consolidation when output address does not match base address', async () => {
      const quantity = '100';
      const totalInput = 20000000;
      const totalAssetList = {
        [fingerprint]: {
          quantity: '100',
          policy_id: policyId,
          asset_name: asciiEncodedName,
        },
      };

      // Build a transaction with output to receiver (not base address)
      const txBuilder = factory.getTransferBuilder();
      txBuilder.input({
        transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
        transaction_index: 1,
      });

      txBuilder.output({
        address: receiverAddress, // Output goes to receiver, not base address
        amount: '0',
        multiAssets: {
          asset_name: asciiEncodedName,
          policy_id: policyId,
          quantity,
          fingerprint,
        },
      });

      txBuilder.changeAddress(senderAddress, totalInput.toString(), totalAssetList);
      txBuilder.ttl(800000000);
      txBuilder.isTokenTransaction();
      const tx = (await txBuilder.build()) as Transaction;
      const txHex = tx.toBroadcastFormat();

      // Mock wallet with different base address
      const mockWallet = {
        coinSpecific: () => ({
          baseAddress: senderAddress, // Base address is sender, but output goes to receiver
        }),
      };

      const txParams = {
        recipients: undefined,
      };

      const txPrebuild = { txHex };
      const verification = { consolidationToBaseAddress: true };

      await adaToken
        .verifyTransaction({
          txParams,
          txPrebuild,
          verification,
          wallet: mockWallet as any,
        })
        .should.be.rejectedWith('tx outputs does not match with expected address');
    });
  });
});
