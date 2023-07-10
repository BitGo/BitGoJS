import should from 'should';
import { AddressFormat, TransactionType } from '@bitgo/sdk-core';
import * as testData from '../resources';
import { KeyPair, TransactionBuilderFactory, Utils } from '../../src';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../src/lib/transaction';

describe('ADA Staking Withdraw Transaction Builder', async () => {
  const factory = new TransactionBuilderFactory(coins.get('tada'));

  it('start and build an unsigned staking withdraw tx', async () => {
    const keyPairStake = new KeyPair({ prv: testData.privateKeys.prvKey2 });
    const txBuilder = factory.getStakingWithdrawBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    const totalInput = '4000000';
    txBuilder.changeAddress(
      'addr1q8rm9z7w4yx5gz652kn2q238efvms6t0qelur9nlglun8eu4tr5knj4fu4adelzqhxg8adu5xca4jra0gtllfrpcawyq9psz23',
      totalInput
    );
    const reward = 1239239;
    txBuilder.addWithdrawal(keyPairStake.getKeys().pub, reward.toString());
    txBuilder.ttl(800000000);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.StakingWithdraw);
    const txData = tx.toJson();
    const fee = tx.getFee;
    txData.certs.length.should.equal(0);
    txData.withdrawals.length.should.equal(1);
    txData.withdrawals[0].value.should.equal(reward.toString());

    txData.outputs.length.should.equal(1);
    txData.outputs[0].amount.should.equal((Number(totalInput) + reward - Number(fee)).toString());
    fee.should.equal('171749');
    tx.toBroadcastFormat().should.equal(testData.rawTx.unsignedStakingWithdrawTx);
    should.equal(tx.id, testData.rawTx.unsignedStakingWithdrawTxHash);
  });

  it('build a staingDEactivate from rawTx', async () => {
    const txBuilder = factory.from(testData.rawTx.unsignedStakingWithdrawTx);
    const builtTx = (await txBuilder.build()) as Transaction;
    should.equal(builtTx.type, TransactionType.StakingWithdraw);
    should.equal(builtTx.id, testData.rawTx.unsignedStakingWithdrawTxHash);
    const txData = builtTx.toJson();
    const fee = builtTx.getFee;
    txData.certs.length.should.equal(0);

    txData.outputs.length.should.equal(1);
    const totalInput = '4000000';
    const reward = 1239239;
    txData.outputs[0].amount.should.equal((Number(totalInput) + reward - Number(fee)).toString());
    fee.should.equal('171749');
    txData.withdrawals.length.should.equal(1);
    txData.withdrawals[0].value.should.equal(reward.toString());
  });

  // xit('should withdraw rewards from a stake address', async () => {
  //   const axiosConfig = {
  //     headers: {
  //       'Content-Type': 'application/cbor',
  //     },
  //     timeout: 10000,
  //   };
  //   const keyPairPayment = new KeyPair({ prv: testData.stakingAccount.paymentKey });
  //   const keyPairStake = new KeyPair({ prv: testData.stakingAccount.stakeKey });
  //   const enterpriseAddress = keyPairPayment.getAddress(AddressFormat.testnet);
  //   const txBuilder = factory.getStakingWithdrawBuilder();
  //   const utxoData = await axios.get('https://testnet.koios.rest/api/v0/address_info?_address=' + enterpriseAddress);
  //   const senderBalance = utxoData.data[0].balance;
  //   const utxoSet = utxoData.data[0].utxo_set;
  //   for (const utxo of utxoSet) {
  //     txBuilder.input({ transaction_id: utxo.tx_hash, transaction_index: utxo.tx_index });
  //   }
  //   txBuilder.changeAddress(enterpriseAddress, senderBalance);
  //
  //   const fullAddress = Utils.default.createBaseAddressWithStakeAndPaymentKey(
  //     keyPairStake,
  //     keyPairPayment,
  //     AddressFormat.testnet
  //   );
  //   const rewardAcctData = await axios.get('https://testnet.koios.rest/api/v0/account_info?_address=' + fullAddress);
  //   console.log(rewardAcctData);
  //   const stakeAddressBalance = rewardAcctData.data[0].rewards;
  //   console.log('Stake account balance: ' + stakeAddressBalance);
  //   txBuilder.addWithdrawal(keyPairStake.getKeys().pub, stakeAddressBalance);
  //
  //   txBuilder.ttl(900000000);
  //   txBuilder.sign({ key: keyPairPayment.getKeys().prv });
  //   txBuilder.sign({ key: keyPairStake.getKeys().prv });
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

  it('should submit a staking withdraw using signature interface', async () => {
    const keyPairPayment = new KeyPair({ prv: testData.privateKeys.prvKey9 });
    const keyPairStake = new KeyPair({ prv: testData.privateKeys.prvKey10 });
    const senderAddress = Utils.default.createBaseAddressWithStakeAndPaymentKey(
      keyPairStake,
      keyPairPayment,
      AddressFormat.testnet
    );
    const txBuilder = factory.getStakingWithdrawBuilder();
    const senderBalance = '22122071';
    const reward = '1232323';
    txBuilder.changeAddress(senderAddress, senderBalance);
    txBuilder.addWithdrawal(keyPairStake.getKeys().pub, reward);

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
    tx.type.should.equal(TransactionType.StakingWithdraw);
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
});
