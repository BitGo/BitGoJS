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

  it('should build a create staking authorization unsigned tx to change staking authority', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    txBuilder.transactionMessage(testData.STAKING_AUTHORIZE_RAW_MSG2);
    const tx = await txBuilder.build();
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const rawTx = tx.toBroadcastFormat();
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    should.equal(rawTx, testData.STAKING_AUTHORIZE_RAW_MSG_TXN2);
    const explain = tx.explainTransaction();
    should.equal(explain.type, 'StakingAuthorizeRaw');
    should.equal(explain.blockhash, '8RfZkx3guikmKR8Wi1ikx5m7SkmLyn12D3SkimK1f1SE');
    should.deepEqual(explain.durableNonce, {
      walletNonceAddress: 'Fb3xp4p3b3mu7gQNDDphMUuW9NHjUk7wAgtmFgZx4Ysf',
      authWalletAddress: 'CGAEgUMaCW4T94RKKEQ4PnMDayWNYxB8vuLNA7TEC1th',
    });
    should.deepEqual(explain.stakingAuthorize, {
      stakingAddress: '3Huxg6259FBzwaoBxAdGaEwjgSYgrrg5qd9kX6chsf4K',
      oldWithdrawAddress: '',
      newWithdrawAddress: '',
      oldStakingAuthorityAddress: 'G62LeCBehaarj5iVh58s7QTC61upEJiJhuK3BCQ2GqW6',
      newStakingAuthorityAddress: 'EEjayTmZjNyFmA44fbPxFxsW18Ku5SVj1g5VVCpefbVn',
    });
  });

  it('should build the same signable from serialized', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    const txMessage = testData.STAKING_AUTHORIZE_RAW_MSG;
    txBuilder.transactionMessage(txMessage);
    const tx = await txBuilder.build();
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const rawTx = tx.toBroadcastFormat();
    const signable = tx.signablePayload;
    const signableHex = signable.toString('base64');
    should.equal(signableHex, txMessage);
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    const unsignedTxHex = Buffer.from(rawTx, 'base64').toString('hex');

    const txBuilder2 = factory.from(Buffer.from(unsignedTxHex, 'hex').toString('base64'));
    const tx2 = await txBuilder2.build();

    const signable2 = tx2.signablePayload;
    should.equal(signable2.toString('base64'), txMessage);
  });

  it('should build the same signable from serialized for change staking authority', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    const txMessage = testData.STAKING_AUTHORIZE_RAW_MSG2;
    txBuilder.transactionMessage(txMessage);
    const tx = await txBuilder.build();
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const rawTx = tx.toBroadcastFormat();
    const signable = tx.signablePayload;
    const signableHex = signable.toString('base64');
    should.equal(signableHex, txMessage);
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    const unsignedTxHex = Buffer.from(rawTx, 'base64').toString('hex');

    const txBuilder2 = factory.from(Buffer.from(unsignedTxHex, 'hex').toString('base64'));
    const tx2 = await txBuilder2.build();

    const signable2 = tx2.signablePayload;
    should.equal(signable2.toString('base64'), txMessage);
  });

  it('should build the same signable from serialized for change staking authority with only old staking authority', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    const txMessage =
      'AwIECbZUs4LtRe9+UioPSy2m6K6F7iQd8/mBQo4UkcsRoWu7xKyh5llTYqoyu1i2FxsS0OLrLADlMByubjb3WCU27a3j0nRBRADfmtBBJQtQo/SchIvD5HD+7+z6yOE5VfQ2r8bppEBr0RwuVORQTtBPznEMy+u9+wstd8sIxiCk71VMyGLRKRwyNmh40eeGFTuqIhRwuGxh38mmSeTpsSEn+FsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAah2BeRN1QqmDQ3vf4qerJVf1NcinhyK2ikncAAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAPjn5uoR7/6SxOU7WPigQNKFTZcdrQNRCAmkevrN7G+3AgUDAwgABAQAAAAGBAQHAQIICgAAAAAAAAA=';
    txBuilder.transactionMessage(txMessage);
    const tx = await txBuilder.build();
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const rawTx = tx.toBroadcastFormat();
    const signable = tx.signablePayload;
    const signableHex = signable.toString('base64');
    should.equal(signableHex, txMessage);
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    const unsignedTxHex = Buffer.from(rawTx, 'base64').toString('hex');

    const txBuilder2 = factory.from(Buffer.from(unsignedTxHex, 'hex').toString('base64'));
    const tx2 = await txBuilder2.build();

    const signable2 = tx2.signablePayload;
    should.equal(signable2.toString('base64'), txMessage);
  });

  it('should build the same signable from serialized for change staking and withdraw authority with custodial authority', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    const txMessage =
      'BAMECrZUs4LtRe9+UioPSy2m6K6F7iQd8/mBQo4UkcsRoWu7BUdHZ+Tx/Eaem+0Vb6TThw9npPPveW2WCR3KCfOulqPErKHmWVNiqjK7WLYXGxLQ4ussAOUwHK5uNvdYJTbtrePSdEFEAN+a0EElC1Cj9JyEi8PkcP7v7PrI4TlV9DavxumkQGvRHC5U5FBO0E/OcQzL6737Cy13ywjGIKTvVUzIYtEpHDI2aHjR54YVO6oiFHC4bGHfyaZJ5OmxISf4WwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABqHYF5E3VCqYNDe9/ip6slV/U1yKeHIraKSdwAAAAAAGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAAan1RcZLFaO4IqEX3PSl4jPA1wxRbIas0TYBi6pQAAA+Ofm6hHv/pLE5TtY+KBA0oVNlx2tA1EICaR6+s3sb7cDBgMECQAEBAAAAAcFBQgCAwEICgAAAAAAAAAHBQUIAgMBCAoAAAABAAAA';
    txBuilder.transactionMessage(txMessage);
    const tx = await txBuilder.build();
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const rawTx = tx.toBroadcastFormat();
    const signable = tx.signablePayload;
    const signableHex = signable.toString('base64');
    should.equal(signableHex, txMessage);
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    const unsignedTxHex = Buffer.from(rawTx, 'base64').toString('hex');

    const txBuilder2 = factory.from(Buffer.from(unsignedTxHex, 'hex').toString('base64'));
    const tx2 = await txBuilder2.build();

    const signable2 = tx2.signablePayload;
    should.equal(signable2.toString('base64'), txMessage);
  });

  it('should build the same signable from serialized for change staking and withdraw authority without custodial authority', async () => {
    const txBuilder = factory.getStakingRawMsgAuthorizeBuilder();
    const txMessage =
      'AwIECbZUs4LtRe9+UioPSy2m6K6F7iQd8/mBQo4UkcsRoWu7xKyh5llTYqoyu1i2FxsS0OLrLADlMByubjb3WCU27a3j0nRBRADfmtBBJQtQo/SchIvD5HD+7+z6yOE5VfQ2r8bppEBr0RwuVORQTtBPznEMy+u9+wstd8sIxiCk71VMyGLRKRwyNmh40eeGFTuqIhRwuGxh38mmSeTpsSEn+FsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAah2BeRN1QqmDQ3vf4qerJVf1NcinhyK2ikncAAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAPjn5uoR7/6SxOU7WPigQNKFTZcdrQNRCAmkevrN7G+3AwUDAwgABAQAAAAGBAQHAQIICgAAAAAAAAAGBAQHAQIICgAAAAEAAAA=';
    txBuilder.transactionMessage(txMessage);
    const tx = await txBuilder.build();
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const rawTx = tx.toBroadcastFormat();
    const signable = tx.signablePayload;
    const signableHex = signable.toString('base64');
    should.equal(signableHex, txMessage);
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    const unsignedTxHex = Buffer.from(rawTx, 'base64').toString('hex');

    const txBuilder2 = factory.from(Buffer.from(unsignedTxHex, 'hex').toString('base64'));
    const tx2 = await txBuilder2.build();

    const signable2 = tx2.signablePayload;
    should.equal(signable2.toString('base64'), txMessage);
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

  it('should build from an unsigned transaction for nwe staking authority', async () => {
    const txBuilder = factory.from(testData.STAKING_AUTHORIZE_RAW_MSG_TXN2);
    const tx = await txBuilder.build();
    tx.inputs.length.should.equal(0);
    tx.outputs.length.should.equal(0);
    const rawTx = tx.toBroadcastFormat();
    const signable = tx.signablePayload.toString('base64');
    should.equal(signable, testData.STAKING_AUTHORIZE_RAW_MSG2);
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    should.equal(rawTx, testData.STAKING_AUTHORIZE_RAW_MSG_TXN2);
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
