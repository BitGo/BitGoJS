/**
 * TransactionBuilder build/sign/rebuild tests for ZAMA ERC-4626 staking delegate flow.
 *
 * Tests the generic staking() API end-to-end through the ETH TransactionBuilder
 * pipeline: build -> sign -> serialize -> deserialize.
 */
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';
import { approveMethodId, depositMethodId, ZamaStakingBuilder, ZamaStakingOperationType } from '@bitgo/abstract-eth';
import { getBuilder } from '../getBuilder';

const TOKEN_ADDRESS = '0x94167129172A35ab093B44b8b96213DDbc3cD387';
const OPERATOR_ADDRESS = '0x1111111111111111111111111111111111111111';
const RECEIVER_ADDRESS = '0x2222222222222222222222222222222222222222';
const AMOUNT = '1000000000000000000';

describe('ZAMA Staking TransactionBuilder', () => {
  let txBuilder: TransactionBuilder;

  beforeEach(() => {
    txBuilder = getBuilder('hteth') as TransactionBuilder;
    txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
    txBuilder.counter(1);
  });

  // ---- Flow 1: ERC20 approve -------------------------------------------

  it('Flow 1: should build a ContractCall tx via staking(approve)', async () => {
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.staking(
      new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_ADDRESS)
        .spenderAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
    );

    const tx = await txBuilder.build();
    const json = tx.toJson();

    should.equal(tx.type, TransactionType.ContractCall);
    json.to.should.equal(TOKEN_ADDRESS.toLowerCase());
    json.data.should.startWith(approveMethodId);
    json.value.should.equal('0');
  });

  it('Flow 1: should rebuild from hex — approve round-trip', async () => {
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.staking(
      new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_ADDRESS)
        .spenderAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
    );

    const originalTx = await txBuilder.build();
    const rawHex = originalTx.toBroadcastFormat();

    const rebuiltBuilder = getBuilder('hteth') as TransactionBuilder;
    rebuiltBuilder.from(rawHex);
    const rebuiltTx = await rebuiltBuilder.build();

    should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
    rebuiltTx.toJson().to.should.equal(TOKEN_ADDRESS.toLowerCase());
    rebuiltTx.toJson().data.should.startWith(approveMethodId);
  });

  it('Flow 1: should build, deserialize, sign, and serialize approve tx', async () => {
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.staking(
      new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.APPROVE)
        .tokenContractAddress(TOKEN_ADDRESS)
        .spenderAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
    );
    const txUnsigned = await txBuilder.build();

    const builderFrom = getBuilder('hteth') as TransactionBuilder;
    builderFrom.from(txUnsigned.toBroadcastFormat());
    builderFrom.sign({ key: '064A3BF8B08A3426E8A719AE5E4115228A75E7A1449CB1B734E51C7DC8A867BE' });
    const txSigned = await builderFrom.build();

    const json = txSigned.toJson();
    json.to.should.equal(TOKEN_ADDRESS.toLowerCase());
    json.data.should.startWith(approveMethodId);
    should.exist(json.v);
    should.exist(json.r);
    should.exist(json.s);
  });

  // ---- Flow 2: ERC4626 deposit -----------------------------------------

  it('Flow 2: should build a ContractCall tx via staking(deposit)', async () => {
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.staking(
      new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.DEPOSIT)
        .operatorAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .receiverAddress(RECEIVER_ADDRESS)
    );

    const tx = await txBuilder.build();
    const json = tx.toJson();

    should.equal(tx.type, TransactionType.ContractCall);
    json.to.should.equal(OPERATOR_ADDRESS.toLowerCase());
    json.data.should.startWith(depositMethodId);
    json.value.should.equal('0');
  });

  it('Flow 2: should rebuild from hex — deposit round-trip', async () => {
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.staking(
      new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.DEPOSIT)
        .operatorAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .receiverAddress(RECEIVER_ADDRESS)
    );

    const originalTx = await txBuilder.build();
    const rawHex = originalTx.toBroadcastFormat();

    const rebuiltBuilder = getBuilder('hteth') as TransactionBuilder;
    rebuiltBuilder.from(rawHex);
    const rebuiltTx = await rebuiltBuilder.build();

    should.equal(rebuiltTx.toBroadcastFormat(), rawHex);
    rebuiltTx.toJson().to.should.equal(OPERATOR_ADDRESS.toLowerCase());
    rebuiltTx.toJson().data.should.startWith(depositMethodId);
  });

  it('Flow 2: should build, deserialize, sign, and serialize deposit tx', async () => {
    txBuilder.type(TransactionType.ContractCall);
    txBuilder.staking(
      new ZamaStakingBuilder()
        .type(ZamaStakingOperationType.DEPOSIT)
        .operatorAddress(OPERATOR_ADDRESS)
        .amount(AMOUNT)
        .receiverAddress(RECEIVER_ADDRESS)
    );
    const txUnsigned = await txBuilder.build();

    const builderFrom = getBuilder('hteth') as TransactionBuilder;
    builderFrom.from(txUnsigned.toBroadcastFormat());
    builderFrom.sign({ key: '064A3BF8B08A3426E8A719AE5E4115228A75E7A1449CB1B734E51C7DC8A867BE' });
    const txSigned = await builderFrom.build();

    const json = txSigned.toJson();
    json.to.should.equal(OPERATOR_ADDRESS.toLowerCase());
    json.data.should.startWith(depositMethodId);
    should.exist(json.v);
    should.exist(json.r);
    should.exist(json.s);
  });

  // ---- Validation -------------------------------------------------------

  it('should throw when staking() is called on non-ContractCall type', () => {
    should.throws(
      () =>
        txBuilder.staking(
          new ZamaStakingBuilder()
            .type(ZamaStakingOperationType.APPROVE)
            .tokenContractAddress(TOKEN_ADDRESS)
            .spenderAddress(OPERATOR_ADDRESS)
            .amount(AMOUNT)
        ),
      /Staking can only be set for ContractCall transactions/
    );
  });
});
