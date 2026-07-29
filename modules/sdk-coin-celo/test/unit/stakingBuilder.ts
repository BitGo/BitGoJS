import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';
import { StakingBuilder } from '../../src/lib/stakingBuilder';
import { getOperationConfig, StakingOperationTypes } from '@bitgo/sdk-core';
import * as testData from '../resources/celo';

describe('Celo staking operations builder', function () {
  const coin = coins.get('tcelo');
  let builder: StakingBuilder;
  beforeEach(() => {
    builder = new StakingBuilder(coin);
    builder.type(StakingOperationTypes.LOCK);
    builder.amount('1000');
  });

  const lockOperation = getOperationConfig(StakingOperationTypes.LOCK, coin.network.type);
  const unlockOperation = getOperationConfig(StakingOperationTypes.UNLOCK, coin.network.type);
  const withdrawOperation = getOperationConfig(StakingOperationTypes.WITHDRAW, coin.network.type);
  const voteOperation = getOperationConfig(StakingOperationTypes.VOTE, coin.network.type);
  const unvoteOperation = getOperationConfig(StakingOperationTypes.UNVOTE, coin.network.type);
  const activateOperation = getOperationConfig(StakingOperationTypes.ACTIVATE, coin.network.type);

  it('should build a staking lock operation', () => {
    const staking = builder.build();
    should.equal(staking.address, lockOperation.contractAddress);
    should.equal(staking.serialize(), lockOperation.methodId);
  });

  it('should build a staking unlock operation', () => {
    builder.type(StakingOperationTypes.UNLOCK);
    builder.amount('100');
    const staking = builder.build();
    should.equal(staking.address, unlockOperation.contractAddress);
    staking.serialize().should.startWith(unlockOperation.methodId);
    should.equal(staking.serialize(), testData.UNLOCK_DATA);
  });

  it('should build a staking withdraw operation', () => {
    builder.type(StakingOperationTypes.WITHDRAW);
    builder.index(0);
    const staking = builder.build();
    should.equal(staking.address, withdrawOperation.contractAddress);
    staking.serialize().should.startWith(withdrawOperation.methodId);
    should.equal(staking.serialize(), testData.WITHDRAW_DATA);
  });

  it('should fail if the index is invalid', () => {
    builder.type(StakingOperationTypes.WITHDRAW);
    assert.throws(
      () => {
        builder.index(-1);
      },
      (e: any) => e.message === testData.INVALID_INDEX_ERROR
    );
  });

  it('should build a staking vote operation', () => {
    builder.type(StakingOperationTypes.VOTE);
    builder.group(testData.GROUP_ADDRESS);
    builder.lesser(testData.LESSER_ADDRESS);
    builder.greater(testData.GREATER_ADDRESS);
    const staking = builder.build();
    should.equal(staking.address, voteOperation.contractAddress);
    should.equal(staking.serialize(), testData.VOTE_SERIALIZED_DATA);
  });

  it('should build only setting the lesser', () => {
    builder.type(StakingOperationTypes.VOTE);
    builder.group(testData.GROUP_ADDRESS);
    builder.lesser(testData.LESSER_ADDRESS);
    const staking = builder.build();
    should.equal(staking.address, voteOperation.contractAddress);
    should.equal(staking.serialize(), testData.VOTE_LESSER_SERIALIZED_DATA);
  });

  it('should build only setting the greater', () => {
    builder.type(StakingOperationTypes.VOTE);
    builder.group(testData.GROUP_ADDRESS);
    builder.greater(testData.GREATER_ADDRESS);
    const staking = builder.build();
    should.equal(staking.address, voteOperation.contractAddress);
    should.equal(staking.serialize(), testData.VOTE_GREATER_SERIALIZED_DATA);
  });

  it('should build a staking unvote operation', () => {
    builder.type(StakingOperationTypes.UNVOTE);
    builder.group(testData.GROUP_ADDRESS);
    builder.lesser(testData.LESSER_ADDRESS);
    builder.greater(testData.GREATER_ADDRESS);
    builder.amount('1');
    builder.index(0);
    const staking = builder.build();
    should.equal(staking.address, unvoteOperation.contractAddress);
    should.equal(staking.serialize(), testData.UNVOTE_SERIALIZED_DATA);
  });

  it('should fail if the unvote index is invalid', () => {
    builder.type(StakingOperationTypes.UNVOTE);
    assert.throws(
      () => {
        builder.index(-1);
      },
      (e: any) => e.message === testData.INVALID_INDEX_ERROR
    );
  });

  it(`should throw error when trying to build unvote operation with missing 'index' `, () => {
    builder.type(StakingOperationTypes.UNVOTE);
    builder.group(testData.GROUP_ADDRESS);
    builder.lesser(testData.LESSER_ADDRESS);
    builder.greater(testData.GREATER_ADDRESS);
    builder.amount('1');
    assert.throws(
      () => {
        builder.build();
      },
      (e: any) => e.message === testData.MISSING_INDEX_ERROR
    );
  });

  it(`should throw error when trying to build unvote operation with missing 'group' `, () => {
    builder.type(StakingOperationTypes.UNVOTE);
    builder.lesser(testData.LESSER_ADDRESS);
    builder.greater(testData.GREATER_ADDRESS);
    builder.amount('1');
    builder.index(1);
    assert.throws(
      () => {
        builder.build();
      },
      (e: any) => e.message === testData.MISSING_GROUP_ERROR
    );
  });

  it(`should throw error when trying to build unvote operation with missing 'amount' `, () => {
    builder = new StakingBuilder(coin);
    builder.type(StakingOperationTypes.UNVOTE);
    builder.lesser(testData.LESSER_ADDRESS);
    builder.group(testData.GROUP_ADDRESS);
    builder.greater(testData.GREATER_ADDRESS);
    builder.index(1);
    assert.throws(
      () => {
        builder.build();
      },
      (e: any) => e.message === testData.MISSING_AMOUNT_ERROR
    );
  });

  it('should fail if the address to unvote for is not set', () => {
    builder.type(StakingOperationTypes.UNVOTE);
    assert.throws(
      () => {
        builder.build();
      },
      (e: any) => e.message === testData.MISSING_GROUP_ERROR
    );
  });

  it('should fail if the lesser or greater unvote are not set', () => {
    builder.type(StakingOperationTypes.UNVOTE);
    builder.group(testData.GROUP_ADDRESS);
    assert.throws(
      () => {
        builder.build();
      },
      (e: any) => e.message === testData.GREATER_LESSER_ERROR
    );
  });

  it('should fail if the group to unvote address is invalid', () => {
    builder.type(StakingOperationTypes.UNVOTE);
    assert.throws(
      () => {
        builder.group('invalidaddress');
      },
      (e: any) => e.message === testData.INVALID_GROUP_ERROR
    );
  });

  it('should fail if the lesser unvote address is invalid', () => {
    builder.type(StakingOperationTypes.UNVOTE);
    assert.throws(
      () => {
        builder.lesser('invalidaddress');
      },
      (e: any) => e.message === testData.INVALID_LESSER_ERROR
    );
  });

  it('should fail if the greater unvote address is invalid', () => {
    builder.type(StakingOperationTypes.UNVOTE);
    assert.throws(
      () => {
        builder.greater('invalidaddress');
      },
      (e: any) => e.message === testData.INVALID_GREATER_ERROR
    );
  });

  it('should build a staking activate operation', () => {
    builder.type(StakingOperationTypes.ACTIVATE);
    builder.group(testData.GROUP_ADDRESS);
    const staking = builder.build();
    should.equal(staking.address, activateOperation.contractAddress);
    should.equal(staking.serialize(), testData.ACTIVATE_SERIALIZED_DATA);
  });

  it('should fail if the activate address is not set', () => {
    builder.type(StakingOperationTypes.ACTIVATE);
    assert.throws(
      () => {
        builder.build();
      },
      (e: any) => e.message === testData.MISSING_GROUP_ERROR
    );
  });

  it('should fail if the address to vote for is not set', () => {
    builder.type(StakingOperationTypes.VOTE);
    assert.throws(
      () => {
        builder.build();
      },
      (e: any) => e.message === testData.MISSING_GROUP_ERROR
    );
  });

  it('should fail if the lesser or greater are not set', () => {
    builder.type(StakingOperationTypes.VOTE);
    builder.group(testData.GROUP_ADDRESS);
    assert.throws(
      () => {
        builder.build();
      },
      (e: any) => e.message === testData.GREATER_LESSER_ERROR
    );
  });

  it('should fail if the group to vote address is invalid', () => {
    builder.type(StakingOperationTypes.VOTE);
    assert.throws(
      () => {
        builder.group('invalidaddress');
      },
      (e: any) => e.message === testData.INVALID_GROUP_ERROR
    );
  });

  it('should fail if the lesser address is invalid', () => {
    builder.type(StakingOperationTypes.VOTE);
    assert.throws(
      () => {
        builder.lesser('invalidaddress');
      },
      (e: any) => e.message === testData.INVALID_LESSER_ERROR
    );
  });

  it('should fail if the greater address is invalid', () => {
    builder.type(StakingOperationTypes.VOTE);
    assert.throws(
      () => {
        builder.greater('invalidaddress');
      },
      (e: any) => e.message === testData.INVALID_GREATER_ERROR
    );
  });

  it('should fail if amount is invalid number', () => {
    assert.throws(
      () => {
        builder.amount('asd');
      },
      (e: any) => e.message === testData.INVALID_VALUE_ERROR
    );
  });

  it('should fail to build if type is not supported', function () {
    const NOT_SUPPORTED = 100;
    builder.type(NOT_SUPPORTED as StakingOperationTypes);
    assert.throws(
      () => {
        builder.build();
      },
      (e: any) => e.message === testData.INVALID_OPERATION_100
    );
  });
});
