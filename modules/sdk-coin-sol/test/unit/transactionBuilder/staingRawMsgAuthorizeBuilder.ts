import should from 'should';
import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';
import { Utils, Transaction } from '../../../src';

describe('Sol Staking Raw Message Authorize Builder', () => {
  const factory = getBuilderFactory('tsol');

  it('should build a create staking authorization unsigned tx', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    txBuilder.transactionMessage(testData.STAKING_AUTHORIZE_RAW_MSG);
    const tx = await txBuilder.build();
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const rawTx = tx.toBroadcastFormat();
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    should.equal(rawTx, testData.STAKING_AUTHORIZE_RAW_MSG_TXN);
    const explain = tx.explainTransaction();
    should.equal(explain.type, 'StakingAuthorizeRaw');
    should.equal(explain.blockhash, '35zHbmNtFNB9ADux97UbdY1bQSobfYR2SUmuCnqVfpUB');
    should.deepEqual(explain.durableNonce, {
      walletNonceAddress: 'J8cECxcT6Q6H4fcQCvd4LbhmmSjsHL63kpJtrUcrF74Q',
      authWalletAddress: '5uUQw7ZtTRYduT6MrsPQeGKAavRek2VzxAqgUxQE2szv',
    });
    should.deepEqual(explain.stakingAuthorize, {
      stakingAddress: 'J8cECxcT6Q6H4fcQCvd4LbhmmSjsHL63kpJtrUcrF74Q',
      oldWithdrawAddress: '6xgesG4vajCYfAQpknodrarD49ZCnXGvYA4H1DLuGV7Y',
      newWithdrawAddress: '4p1VdN6BngTAbWR7Q5JPpbB6dc4k4y8wn1knmmWEjc9i',
      custodianAddress: 'DHCVjKy7kN6D6vM69nHcEeEeS685qtonFbiFNBW5bGiq',
    });
  });

  it('should build from an unsigned transaction', async () => {
    const txBuilder = factory.from(testData.STAKING_AUTHORIZE_RAW_MSG_TXN);
    const tx = await txBuilder.build();
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const rawTx = tx.toBroadcastFormat();
    const signable = tx.signablePayload.toString('base64');
    should.equal(signable, testData.STAKING_AUTHORIZE_RAW_MSG);
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    should.equal(rawTx, testData.STAKING_AUTHORIZE_RAW_MSG_TXN);
  });

  it('should explain a transaction', async () => {
    const txBuilder = factory.from(testData.STAKING_AUTHORIZE_RAW_MSG_TXN);
    const tx = await txBuilder.build();
    const explain = tx.explainTransaction();
    should.equal(explain.type, 'StakingAuthorizeRaw');
    should.equal(explain.blockhash, '35zHbmNtFNB9ADux97UbdY1bQSobfYR2SUmuCnqVfpUB');
    should.deepEqual(explain.durableNonce, {
      walletNonceAddress: 'J8cECxcT6Q6H4fcQCvd4LbhmmSjsHL63kpJtrUcrF74Q',
      authWalletAddress: '5uUQw7ZtTRYduT6MrsPQeGKAavRek2VzxAqgUxQE2szv',
    });
    should.deepEqual(explain.stakingAuthorize, {
      stakingAddress: 'J8cECxcT6Q6H4fcQCvd4LbhmmSjsHL63kpJtrUcrF74Q',
      oldWithdrawAddress: '6xgesG4vajCYfAQpknodrarD49ZCnXGvYA4H1DLuGV7Y',
      newWithdrawAddress: '4p1VdN6BngTAbWR7Q5JPpbB6dc4k4y8wn1knmmWEjc9i',
      custodianAddress: 'DHCVjKy7kN6D6vM69nHcEeEeS685qtonFbiFNBW5bGiq',
    });
  });

  it('should generate json from transaction', async () => {
    const txBuilder = factory.from(testData.STAKING_AUTHORIZE_RAW_MSG_TXN);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    should.deepEqual(txJson.durableNonce, {
      walletNonceAddress: 'J8cECxcT6Q6H4fcQCvd4LbhmmSjsHL63kpJtrUcrF74Q',
      authWalletAddress: '5uUQw7ZtTRYduT6MrsPQeGKAavRek2VzxAqgUxQE2szv',
    });
    should.equal(txJson.instructionsData.length, 2);
    should.deepEqual(txJson.instructionsData[1].params, {
      stakingAddress: 'J8cECxcT6Q6H4fcQCvd4LbhmmSjsHL63kpJtrUcrF74Q',
      oldAuthorizeAddress: '6xgesG4vajCYfAQpknodrarD49ZCnXGvYA4H1DLuGV7Y',
      newAuthorizeAddress: '4p1VdN6BngTAbWR7Q5JPpbB6dc4k4y8wn1knmmWEjc9i',
      custodianAddress: 'DHCVjKy7kN6D6vM69nHcEeEeS685qtonFbiFNBW5bGiq',
    });
  });

  it('should validate raw transaction', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    txBuilder.validateRawTransaction(testData.STAKING_AUTHORIZE_RAW_MSG_TXN);
    should(() => txBuilder.validateRawTransaction(testData.STAKING_AUTHORIZE_UNSIGNED_TX)).throwError(
      'Invalid staking instruction data: 0100000064c9ead9aa6b65445acf4fa526080bcf53baaad5e0bdb99578c9fc233f9c1df500000000'
    );
    should.throws(() => txBuilder.validateRawTransaction(testData.ATA_INIT_SIGNED_DIFF_OWNER_TX));
    should.throws(() => txBuilder.validateRawTransaction(testData.TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE));
    should.throws(() => txBuilder.validateRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITHOUT_MEMO));
  });

  it('should fail wrong transaction message data', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    should.throws(() => txBuilder.transactionMessage('wrong data'));
    const txBuilder2 = factory.from(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO);
    const msg = ((await txBuilder2.build()) as Transaction).signablePayload.toString('base64');
    should.throws(() => txBuilder.transactionMessage(msg));
  });

  it('should fail from transaction data', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    should.throws(() => txBuilder.from(testData.ATA_INIT_SIGNED_DIFF_OWNER_TX));
    should.throws(() => txBuilder.from(testData.TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE));
    should.throws(() => txBuilder.from(testData.TRANSFER_UNSIGNED_TX_WITHOUT_MEMO));
  });
});
