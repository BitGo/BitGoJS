import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import * as testData from '../resources';
import { KeyPair, TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { Transaction } from '../../src/lib/transaction';

describe('ADA Transaction Builder', async () => {
  const factory = new TransactionBuilderFactory(coins.get('tada'));
  it('start and build an unsigned transfer tx', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    const outputAmount = 7823121;
    txBuilder.output({
      address: testData.rawTx.outputAddress1.address,
      amount: outputAmount.toString(),
    });
    const totalInput = 21032023;
    txBuilder.changeAddress(testData.rawTx.outputAddress2.address, totalInput.toString());
    txBuilder.ttl(800000000);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.Send);
    const txData = tx.toJson();
    txData.witnesses.length.should.equal(0);
    txData.certs.length.should.equal(0);
    txData.withdrawals.length.should.equal(0);
    txData.outputs.length.should.equal(2);
    txData.outputs[0].address.should.equal(testData.rawTx.outputAddress1.address);
    txData.outputs[1].address.should.equal(testData.rawTx.outputAddress2.address);
    const fee = tx.getFee;
    txData.outputs[1].amount.should.equal((totalInput - outputAmount - Number(fee)).toString());
    fee.should.equal('167261');
    txData.id.should.equal(testData.rawTx.txHash2);
    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.unsignedTx2);
  });

  it('build a tx with single asset', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    const outputAmount = 7823121;
    txBuilder.output({
      address: testData.rawTx.outputAddress1.address,
      amount: outputAmount.toString(),
    });
    const policyId = '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f';
    const assetName = '534e454b';
    const quantity = '6000000';
    txBuilder.assets({
      policy_id: policyId,
      asset_name: assetName,
      quantity: quantity,
    });
    const totalInput = 21032023;
    txBuilder.changeAddress(testData.rawTx.outputAddress2.address, totalInput.toString());
    txBuilder.ttl(800000000);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.Send);
    const txData = tx.toJson();
    txData.witnesses.length.should.equal(0);
    txData.certs.length.should.equal(0);
    txData.withdrawals.length.should.equal(0);
    txData.outputs.length.should.equal(3);
    txData.outputs[0].address.should.equal(testData.rawTx.outputAddress1.address);
    txData.outputs[1].address.should.equal(testData.rawTx.outputAddress2.address);
    txData.outputs[2].address.should.equal(testData.rawTx.outputAddress1.address);

    // token assertion
    const expectedAssetName = CardanoWasm.AssetName.new(Buffer.from(assetName, 'hex'));
    const expectedPolicyId = CardanoWasm.ScriptHash.from_bytes(Buffer.from(policyId, 'hex'));
    txData.outputs[2].should.have.property('multiAssets');
    (txData.outputs[2].multiAssets as CardanoWasm.MultiAsset)
      .get_asset(expectedPolicyId, expectedAssetName)
      .to_str()
      .should.equal(quantity);

    const fee = tx.getFee;
    txData.outputs[1].amount.should.equal((totalInput - outputAmount - Number(fee)).toString());
    fee.should.equal('167261');
    txData.id.should.equal(testData.rawTx.txHash3);
    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.unsignedTx3);
  });

  it('build a tx with multiple assets', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    const outputAmount = 7823121;
    txBuilder.output({
      address: testData.rawTx.outputAddress1.address,
      amount: outputAmount.toString(),
    });
    const asset1_policyId = '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f';
    const asset1_assetName = '534e454b';
    const asset1_quantity = '6000000';
    const asset2_policyId = '1f7a58a1aa1e6b047a42109ade331ce26c9c2cce027d043ff264fb1f';
    const asset2_assetName = '425249434b53';
    const asset2_quantity = '5000000';

    txBuilder.assets({
      policy_id: asset1_policyId,
      asset_name: asset1_assetName,
      quantity: asset1_quantity,
    });
    txBuilder.assets({
      policy_id: asset2_policyId,
      asset_name: asset2_assetName,
      quantity: asset2_quantity,
    });

    const totalInput = 21032023;
    txBuilder.changeAddress(testData.rawTx.outputAddress2.address, totalInput.toString());
    txBuilder.ttl(800000000);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.Send);
    const txData = tx.toJson();
    txData.witnesses.length.should.equal(0);
    txData.certs.length.should.equal(0);
    txData.withdrawals.length.should.equal(0);
    txData.outputs.length.should.equal(4);
    txData.outputs[0].address.should.equal(testData.rawTx.outputAddress1.address);
    txData.outputs[1].address.should.equal(testData.rawTx.outputAddress2.address);
    txData.outputs[2].address.should.equal(testData.rawTx.outputAddress1.address);

    // token assertion
    const asset1_expectedAssetName = CardanoWasm.AssetName.new(Buffer.from(asset1_assetName, 'hex'));
    const asset1_expectedPolicyId = CardanoWasm.ScriptHash.from_bytes(Buffer.from(asset1_policyId, 'hex'));
    txData.outputs[2].should.have.property('multiAssets');
    (txData.outputs[2].multiAssets as CardanoWasm.MultiAsset)
      .get_asset(asset1_expectedPolicyId, asset1_expectedAssetName)
      .to_str()
      .should.equal(asset1_quantity);
    const asset2_expectedAssetName = CardanoWasm.AssetName.new(Buffer.from(asset2_assetName, 'hex'));
    const asset2_expectedPolicyId = CardanoWasm.ScriptHash.from_bytes(Buffer.from(asset2_policyId, 'hex'));
    txData.outputs[3].should.have.property('multiAssets');
    (txData.outputs[3].multiAssets as CardanoWasm.MultiAsset)
      .get_asset(asset2_expectedPolicyId, asset2_expectedAssetName)
      .to_str()
      .should.equal(asset2_quantity);

    const fee = tx.getFee;
    txData.outputs[1].amount.should.equal((totalInput - outputAmount - Number(fee)).toString());
    fee.should.equal('167261');
    txData.id.should.equal(testData.rawTx.txHash4);
    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.unsignedTx4);
  });

  it('build and sign a transfer tx', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    const outputAmount = 7823121;
    txBuilder.output({
      address: testData.rawTx.outputAddress1.address,
      amount: outputAmount.toString(),
    });
    const totalInput = 21032023;
    txBuilder.changeAddress(testData.rawTx.outputAddress2.address, totalInput.toString());
    txBuilder.ttl(800000000);
    txBuilder.sign({ key: testData.privateKeys.prvKey4 });
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.Send);
    const txData = tx.toJson();
    txData.witnesses.length.should.equal(1);
    txData.certs.length.should.equal(0);
    txData.withdrawals.length.should.equal(0);
    txData.outputs.length.should.equal(2);
    txData.outputs[0].address.should.equal(testData.rawTx.outputAddress1.address);
    txData.outputs[1].address.should.equal(testData.rawTx.outputAddress2.address);
    const fee = tx.getFee;
    txData.outputs[1].amount.should.equal((totalInput - outputAmount - Number(fee)).toString());
    fee.should.equal('167261');
    txData.id.should.equal(testData.rawTx.txHash2);
    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.signedTx2);
  });

  it('should initialize a fee properly, not as zero', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    txBuilder.output({
      address:
        'addr1q8rm9z7w4yx5gz652kn2q238efvms6t0qelur9nlglun8eu4tr5knj4fu4adelzqhxg8adu5xca4jra0gtllfrpcawyq9psz23',
      amount: '7328383',
    });
    txBuilder.changeAddress(testData.address.address2, '1000000000');
    txBuilder.ttl(800000000);
    txBuilder.sign({ key: testData.privateKeys.prvKey4 });
    const builtTx = (await txBuilder.build()) as Transaction;
    builtTx.getFee.should.equal('168493');
  });

  it('should not calculate fee and use one passed in', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    txBuilder.output({
      address:
        'addr1q8rm9z7w4yx5gz652kn2q238efvms6t0qelur9nlglun8eu4tr5knj4fu4adelzqhxg8adu5xca4jra0gtllfrpcawyq9psz23',
      amount: '7328383',
    });
    txBuilder.changeAddress(testData.address.address2, '1000000000');
    txBuilder.ttl(800000000);
    txBuilder.fee('170000');
    txBuilder.sign({ key: testData.privateKeys.prvKey4 });
    const builtTx = (await txBuilder.build()) as Transaction;
    builtTx.getFee.should.equal('170000');
  });

  it('build a send from unsigned rawTx', async () => {
    const txBuilder = factory.from(testData.rawTx.unsignedTx2);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.id, testData.rawTx.txHash2);
    builtTx.outputs.length.should.equal(2);
    builtTx.outputs[0].address.should.equal(testData.rawTx.outputAddress1.address);
    builtTx.outputs[1].address.should.equal(testData.rawTx.outputAddress2.address);
  });

  it('match signature', async () => {
    const txRaw = '582070081eeb1f312ec75af1b4f94a7963db3b264f2451369e4ea244a54de5d0';
    const keyPair = new KeyPair();

    const pkey = CardanoWasm.PrivateKey.from_normal_bytes(Buffer.from(keyPair.getKeys().prv!, 'hex'));
    const vkeyw = CardanoWasm.make_vkey_witness(
      CardanoWasm.TransactionHash.from_bytes(Buffer.from(txRaw, 'hex')),
      pkey
    );
    const sig1 = vkeyw.signature().to_hex();

    const sig2 = Buffer.from(keyPair.signMessage(txRaw)).toString('hex');
    should.equal(sig1, sig2);
  });

  // NOTE: The tests below have been commented out as they are for testing during development changes. We don't
  // want full node tests as part of our sdk unit tests. If you are commenting these back in, add axios and
  // AddressFormat imports.

  // xit('should submit a transaction', async () => {
  //   const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey4 });
  //   const senderAddress = keyPair.getAddress(AddressFormat.testnet);
  //
  //   const axiosConfig = {
  //     headers: {
  //       'Content-Type': 'application/cbor',
  //     },
  //     timeout: 10000,
  //   };
  //
  //   const txBuilder = factory.getTransferBuilder();
  //   const utxoData = await axios.get('https://testnet.koios.rest/api/v0/address_info?_address=' + senderAddress);
  //   const senderBalance = utxoData.data[0].balance;
  //   txBuilder.changeAddress(senderAddress, senderBalance);
  //   const utxoSet = utxoData.data[0].utxo_set;
  //   for (const utxo of utxoSet) {
  //     txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
  //   }
  //
  //   txBuilder.output({
  //     address:
  //       'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp',
  //     amount: '5000000',
  //   });
  //
  //   txBuilder.ttl(800000000);
  //   txBuilder.sign({ key: keyPair.getKeys().prv });
  //
  //   const tx = await txBuilder.build();
  //   const serializedTx = tx.toBroadcastFormat();
  //   const bytes = Uint8Array.from(Buffer.from(serializedTx, 'hex'));
  //
  //   try {
  //     const res = await axios.post('https://testnet.koios.rest/api/v0/submittx', bytes, axiosConfig);
  //     console.log(res.data);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // });
  //
  // xit('should submit a transaction using signature interface', async () => {
  //   const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey4 });
  //   const senderAddress = keyPair.getAddress(AddressFormat.testnet);
  //   const axiosConfig = {
  //     headers: {
  //       'Content-Type': 'application/cbor',
  //     },
  //     timeout: 10000,
  //   };
  //   const txBuilder = factory.getTransferBuilder();
  //   const utxoData = await await axios.get('https://testnet.koios.rest/api/v0/address_info?_address=' + senderAddress);
  //   const senderBalance = utxoData.data[0].balance;
  //   txBuilder.changeAddress(senderAddress, senderBalance);
  //   const utxoSet = utxoData.data[0].utxo_set;
  //   for (const utxo of utxoSet) {
  //     txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
  //   }
  //   txBuilder.output({
  //     address:
  //       'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp',
  //     amount: '5000000',
  //   });
  //
  //   txBuilder.ttl(800000000);
  //
  //   const unsignedTx = await txBuilder.build();
  //   const serializedTx = unsignedTx.toBroadcastFormat();
  //
  //   const txBuilder2 = factory.from(serializedTx);
  //   const tx = await txBuilder2.build();
  //   const signableHex = tx.signablePayload.toString('hex');
  //   const signature = keyPair.signMessage(signableHex);
  //   txBuilder2.addSignature({ pub: keyPair.getKeys().pub }, Buffer.from(signature));
  //   const signedTransaction = await txBuilder2.build();
  //   const serializedTransaction = signedTransaction.toBroadcastFormat();
  //   const bytes = Uint8Array.from(Buffer.from(serializedTransaction, 'hex'));
  //
  //   try {
  //     const res = await axios.post('https://testnet.koios.rest/api/v0/submittx', bytes, axiosConfig);
  //     console.log(res.data);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // });
});
