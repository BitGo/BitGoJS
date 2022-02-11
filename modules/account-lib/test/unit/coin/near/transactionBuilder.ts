import should from 'should';
import { register } from '../../../../src';
import { TransactionBuilderFactory } from '../../../../src/coin/near';
import { TransactionType } from '../../../../src/coin/baseCoin';
import * as testData from '../../../resources/near';
import BN from 'bn.js';
import * as nearAPI from 'near-api-js';

describe('NEAR Transaction Builder', async () => {
  let builders;

  const factory = register('tnear', TransactionBuilderFactory);

  beforeEach(function (done) {
    builders = [factory.getTransferBuilder()];
    done();
  });

  it('start and build an empty a transfer tx', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address);
    txBuilder.nounce(1);
    txBuilder.publicKey(testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.recentBlockHash(testData.blockHash.block1);
    const actions = [nearAPI.transactions.transfer(new BN(1))];
    txBuilder.actions(actions);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);

    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.transfer.unsigned);
  });

  it('build and sign a transfer tx', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.accounts.account1.address);
    txBuilder.nounce(1);
    txBuilder.publicKey(testData.accounts.account1.publicKey);
    txBuilder.receiverId(testData.accounts.account2.address);
    txBuilder.recentBlockHash(testData.blockHash.block1);
    const actions = [nearAPI.transactions.transfer(new BN(1))];
    txBuilder.actions(actions);
    txBuilder.sign({ key: testData.accounts.account1.secretKey });
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);

    const txBroadcast = tx.toBroadcastFormat();
    should.equal(txBroadcast, testData.rawTx.transfer.signed);
  });

  it('should fail to build if missing sender', async () => {
    for (const txBuilder of builders) {
      txBuilder.nounce(1);
      txBuilder.publicKey(testData.accounts.account1.publicKey);
      txBuilder.receiverId(testData.accounts.account2.address);
      txBuilder.recentBlockHash(testData.blockHash.block1);
      await txBuilder.build().should.rejectedWith('sender is required before building');
    }
  });

  it('build a send from rawTx', async () => {
    const txBuilder = factory.from(testData.rawTx.transfer.unsigned);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.id, undefined);
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: testData.accounts.account1.address,
      value: '0.000000000000000000000001',
      coin: 'tnear',
    });
    builtTx.outputs.length.should.equal(1);
    builtTx.outputs[0].should.deepEqual({
      address: testData.accounts.account2.address,
      value: '0.000000000000000000000001',
      coin: 'tnear',
    });
    const jsonTx = builtTx.toJson();
    jsonTx.signer_id.should.equal(testData.accounts.account1.address);
  });

  it('build a send from signed rawTx', async () => {
    const txBuilder = factory.from(testData.rawTx.transfer.signed);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.id, undefined);
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: testData.accounts.account1.address,
      value: '0.000000000000000000000001',
      coin: 'tnear',
    });
    builtTx.outputs.length.should.equal(1);
    builtTx.outputs[0].should.deepEqual({
      address: testData.accounts.account2.address,
      value: '0.000000000000000000000001',
      coin: 'tnear',
    });
    const jsonTx = builtTx.toJson();

    jsonTx.signer_id.should.equal(testData.accounts.account1.address);
  });
});
