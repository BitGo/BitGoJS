import should from 'should';
import { TransactionType, AddressFormat } from '@bitgo/sdk-core';
import * as testData from '../resources';
import { KeyPair, TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../src/lib/transaction';
import * as Utils from '../../src/lib/utils';

describe('ADA Staking Activate Transaction Builder', async () => {
  const factory = new TransactionBuilderFactory(coins.get('tada'));

  it('start and build an unsigned staking activate tx', async () => {
    const keyPairStake = new KeyPair({ prv: testData.privateKeys.prvKey2 });
    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    const totalInput = '4000000';
    txBuilder.changeAddress(
      'addr1q8rm9z7w4yx5gz652kn2q238efvms6t0qelur9nlglun8eu4tr5knj4fu4adelzqhxg8adu5xca4jra0gtllfrpcawyq9psz23',
      totalInput
    );
    txBuilder.stakingCredential(keyPairStake.getKeys().pub, '7a623c48348501c2380e60ac2307fcd1b67df4218f819930821a15b3');
    txBuilder.ttl(800000000);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.StakingActivate);
    const txData = tx.toJson();
    const fee = tx.getFee;
    txData.certs.length.should.equal(2);
    txData.certs[0].type.should.equal(0);
    txData.certs[1].type.should.equal(1);

    txData.outputs.length.should.equal(1);
    txData.outputs[0].amount.should.equal((Number(totalInput) - 2000000 - Number(fee)).toString());
    fee.should.equal('174389');
    tx.toBroadcastFormat().should.equal(testData.rawTx.unsignedStakingActiveTx);
    should.equal(tx.id, testData.rawTx.unsignedStakingActiveTxHash);
  });

  it('should explain a tx', async () => {
    const keyPairStake = new KeyPair({ prv: testData.privateKeys.prvKey2 });
    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    const totalInput = '4000000';
    txBuilder.changeAddress(
      'addr1q8rm9z7w4yx5gz652kn2q238efvms6t0qelur9nlglun8eu4tr5knj4fu4adelzqhxg8adu5xca4jra0gtllfrpcawyq9psz23',
      totalInput
    );
    txBuilder.stakingCredential(keyPairStake.getKeys().pub, '7a623c48348501c2380e60ac2307fcd1b67df4218f819930821a15b3');
    txBuilder.ttl(800000000);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.StakingActivate);
    tx.explainTransaction();
  });

  // it('build a stakingActivate from rawTx', async () => {
  //   const txBuilder = factory.from(testData.rawTx.unsignedStakingActiveTx);
  //   const builtTx = (await txBuilder.build()) as Transaction;
  //   should.equal(builtTx.type, TransactionType.StakingActivate);
  //   should.equal(builtTx.id, testData.rawTx.unsignedStakingActiveTxHash);
  //   const txData = builtTx.toJson();
  //   const fee = builtTx.getFee;
  //   txData.certs.length.should.equal(2);
  //   txData.certs[0].type.should.equal(0);
  //   txData.certs[1].type.should.equal(1);
  //
  //   txData.outputs.length.should.equal(1);
  //   const totalInput = '4000000';
  //   txData.outputs[0].amount.should.equal((Number(totalInput) - 2000000 - Number(fee)).toString());
  //   fee.should.equal('174389');
  // });

  // it('should submit a staking activate transaction', async () => {
  //   const keyPair = new KeyPair({ prv: testData.privateKeys.prvKey9 });
  //   const keyPairStaking = new KeyPair({ prv: testData.privateKeys.prvKey10 });
  //   const senderAddress = Utils.default.createBaseAddressWithStakeAndPaymentKey(
  //     keyPairStaking,
  //     keyPair,
  //     AddressFormat.testnet
  //   );
  //   const axiosConfig = {
  //     headers: {
  //       'Content-Type': 'application/cbor',
  //     },
  //     timeout: 10000,
  //   };
  //
  //   const txBuilder = factory.getStakingActivateBuilder();
  //   const utxoData = await axios.get('https://testnet.koios.rest/api/v0/address_info?_address=' + senderAddress);
  //   const senderBalance = utxoData.data[0].balance;
  //   txBuilder.changeAddress(senderAddress, senderBalance);
  //   const utxoSet = utxoData.data[0].utxo_set;
  //   for (const utxo of utxoSet) {
  //     txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
  //   }
  //
  //   txBuilder.ttl(800000000);
  //   txBuilder.stakingCredential(
  //     keyPairStaking.getKeys().pub,
  //     '7a623c48348501c2380e60ac2307fcd1b67df4218f819930821a15b3'
  //   );
  //   txBuilder.sign({ key: keyPair.getKeys().prv });
  //   txBuilder.sign({ key: keyPairStaking.getKeys().prv });
  //
  //   const tx = await txBuilder.build();
  //   const serializedTx = tx.toBroadcastFormat();
  //   const bytes = Uint8Array.from(Buffer.from(serializedTx, 'hex'));
  //
  //   try {
  //     const res = await axios.post('https://testnet.koios.rest/api/v0/submittx', bytes, axiosConfig);
  //     console.log(res);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // });

  it('should submit a staking transaction using signature interface', async () => {
    const keyPairPayment = new KeyPair({ prv: testData.privateKeys.prvKey9 });
    const keyPairStake = new KeyPair({ prv: testData.privateKeys.prvKey10 });
    const senderAddress = Utils.default.createBaseAddressWithStakeAndPaymentKey(
      keyPairStake,
      keyPairPayment,
      AddressFormat.testnet
    );
    const txBuilder = factory.getStakingActivateBuilder();
    const senderBalance = '22122071';
    txBuilder.changeAddress(senderAddress, senderBalance);
    txBuilder.stakingCredential(keyPairStake.getKeys().pub, '7a623c48348501c2380e60ac2307fcd1b67df4218f819930821a15b3');

    txBuilder.input({
      transaction_id: '0a4f80d83ba9ce1f83306a79252909241308d7eff317d04c9ea018966d687fe3',
      transaction_index: 0,
    });

    txBuilder.ttl(900000000);

    const unsignedTx = await txBuilder.build();
    const signableHex = unsignedTx.signablePayload.toString('hex');
    const serializedTx = unsignedTx.toBroadcastFormat();
    txBuilder.sign({ key: keyPairPayment.getKeys().prv });
    txBuilder.sign({ key: keyPairStake.getKeys().prv });
    const signedTransaction = await txBuilder.build();
    const serializedTransaction = signedTransaction.toBroadcastFormat();

    const txBuilder2 = factory.from(serializedTx);
    const tx = await txBuilder2.build();
    tx.type.should.equal(TransactionType.StakingActivate);
    const signableHex2 = tx.signablePayload.toString('hex');
    signableHex.should.equal(signableHex2);
    const signaturePayment = keyPairPayment.signMessage(signableHex2);
    const signatureStake = keyPairStake.signMessage(signableHex2);
    txBuilder2.addSignature({ pub: keyPairPayment.getKeys().pub }, Buffer.from(signaturePayment));
    txBuilder2.addSignature({ pub: keyPairStake.getKeys().pub }, Buffer.from(signatureStake));
    const signedTransaction2 = await txBuilder2.build();
    signedTransaction.id.should.equal(tx.id);
    const serializedTransaction2 = signedTransaction2.toBroadcastFormat();
    serializedTransaction2.should.equal(serializedTransaction);
  });

  it('should submit a staking transaction using one signature', async () => {
    const keyPairPayment = new KeyPair({ prv: testData.privateKeys.prvKey9 });
    const keyPairStake = keyPairPayment;
    const senderAddress = Utils.default.createBaseAddressWithStakeAndPaymentKey(
      keyPairStake,
      keyPairPayment,
      AddressFormat.testnet
    );
    const txBuilder = factory.getStakingActivateBuilder();
    const senderBalance = '22122071';
    txBuilder.changeAddress(senderAddress, senderBalance);
    txBuilder.stakingCredential(keyPairStake.getKeys().pub, '7a623c48348501c2380e60ac2307fcd1b67df4218f819930821a15b3');

    txBuilder.input({
      transaction_id: '0a4f80d83ba9ce1f83306a79252909241308d7eff317d04c9ea018966d687fe3',
      transaction_index: 0,
    });

    txBuilder.ttl(900000000);

    const unsignedTx = await txBuilder.build();
    const signableHex = unsignedTx.signablePayload.toString('hex');
    const serializedTx = unsignedTx.toBroadcastFormat();
    txBuilder.sign({ key: keyPairPayment.getKeys().prv });
    const signedTransaction = await txBuilder.build();
    const serializedTransaction = signedTransaction.toBroadcastFormat();

    const txBuilder2 = factory.from(serializedTx);
    const tx = await txBuilder2.build();
    tx.type.should.equal(TransactionType.StakingActivate);
    const signableHex2 = tx.signablePayload.toString('hex');
    signableHex.should.equal(signableHex2);
    const signaturePayment = keyPairPayment.signMessage(signableHex2);
    txBuilder2.addSignature({ pub: keyPairPayment.getKeys().pub }, Buffer.from(signaturePayment));
    const signedTransaction2 = await txBuilder2.build();
    signedTransaction.id.should.equal(tx.id);
    const serializedTransaction2 = signedTransaction2.toBroadcastFormat();
    serializedTransaction2.should.equal(serializedTransaction);
  });
});
