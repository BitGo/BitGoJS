import assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { StakingProgrammableTransaction, SuiTransactionType } from '../../../src/lib/iface';
import { MAX_COMMAND_ARGS, MAX_GAS_OBJECTS } from '../../../src/lib/constants';

describe('Sui Staking Builder', () => {
  const factory = getBuilderFactory('tsui');

  describe('Succeed', () => {
    it('should build a staking tx', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingAdd);
      (tx as SuiTransaction<StakingProgrammableTransaction>).suiTransaction.gasData.payment!.should.deepEqual(
        testData.coinsGasPayment
      );

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.requestAddStake.validatorAddress,
        value: testData.requestAddStake.amount.toString(),
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.ADD_STAKE);
    });

    it('should build a staking tx with more than 255 input objects', async function () {
      const numberOfPaymentObjects = 1000;
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);

      const gasData = {
        ...testData.gasData,
        payment: testData.generateObjects(numberOfPaymentObjects),
      };

      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(gasData);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingAdd);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.requestAddStake.validatorAddress,
        value: testData.requestAddStake.amount.toString(),
        coin: 'tsui',
      });

      tx.suiTransaction.gasData.owner.should.equal(gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(MAX_GAS_OBJECTS - 1);

      const programmableTx = tx.suiTransaction.tx;

      // total objects - objects sent as gas payment
      // + (staked amount object + SUI system state object + validator address = 3)
      programmableTx.inputs.length.should.equal(numberOfPaymentObjects - (MAX_GAS_OBJECTS - 1) + 3);
      programmableTx.transactions[0].kind.should.equal('MergeCoins');
      programmableTx.transactions[0].sources.length.should.equal(MAX_COMMAND_ARGS - 1);
      programmableTx.transactions[1].kind.should.equal('MergeCoins');
      programmableTx.transactions[1].sources.length.should.equal(
        numberOfPaymentObjects - (MAX_COMMAND_ARGS - 1) - (MAX_GAS_OBJECTS - 1)
      );

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      rebuiltTx.toJson().gasData.payment.length.should.equal(numberOfPaymentObjects);
    });
  });

  describe('fundsInAddressBalance', () => {
    const FUNDS_IN_ADDRESS_BALANCE = '5000000000'; // 5 SUI in MIST

    it('should build AddStake with mixed coin objects + address balance (redeem → merge → split → add_stake)', async function () {
      // When fundsInAddressBalance > 0, the PTB must insert redeem_funds + mergeCoins into gas
      // coin BEFORE the splitCoins + request_add_stake commands, so the full balance is available.
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingAdd);

      const suiTx = tx as SuiTransaction<StakingProgrammableTransaction>;

      // Expected PTB command sequence:
      //   0: MoveCall(redeem_funds)       — materialise Coin<SUI> from address balance
      //   1: MergeCoins(gas, [addrCoin])  — merge address-balance coin into gas coin
      //   2: SplitCoins(gas, [amount])    — split stake amount from gas coin
      //   3: MoveCall(request_add_stake)  — stake to validator
      const cmds = suiTx.suiTransaction.tx.transactions as any[];
      cmds.length.should.equal(4, 'expected 4 commands: redeem, merge, split, add_stake');
      cmds[0].kind.should.equal('MoveCall', 'command 0 must be MoveCall(redeem_funds)');
      cmds[0].target.should.equal('0x2::coin::redeem_funds');
      cmds[1].kind.should.equal('MergeCoins', 'command 1 must be MergeCoins(gas, [addrCoin])');
      cmds[2].kind.should.equal('SplitCoins', 'command 2 must be SplitCoins(gas, [amount])');
      cmds[3].kind.should.equal('MoveCall', 'command 3 must be MoveCall(request_add_stake)');
      cmds[3].target.should.endWith('::sui_system::request_add_stake');

      // fundsInAddressBalance must be persisted on the SuiTransaction
      suiTx.suiTransaction.fundsInAddressBalance!.should.equal(FUNDS_IN_ADDRESS_BALANCE);

      // getStakeRequests must still correctly identify the request despite the extra commands
      const requests = utils.getStakeRequests(suiTx.suiTransaction.tx);
      requests.length.should.equal(1);
      requests[0].validatorAddress.should.equal(testData.requestAddStake.validatorAddress);
      requests[0].amount.should.equal(testData.requestAddStake.amount);

      // toJson must emit fundsInAddressBalance
      const json = tx.toJson();
      json.fundsInAddressBalance!.should.equal(FUNDS_IN_ADDRESS_BALANCE);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should round-trip: build → serialize → initBuilder restores fundsInAddressBalance', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // Deserialize and rebuild
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);

      // initBuilder must have restored fundsInAddressBalance
      const rebuiltSuiTx = rebuiltTx as SuiTransaction<StakingProgrammableTransaction>;
      rebuiltSuiTx.suiTransaction.fundsInAddressBalance!.should.equal(FUNDS_IN_ADDRESS_BALANCE);

      // stake requests must still be intact
      const requests = utils.getStakeRequests(rebuiltSuiTx.suiTransaction.tx);
      requests.length.should.equal(1);
      requests[0].validatorAddress.should.equal(testData.requestAddStake.validatorAddress);
    });

    it('should build multiple stake requests with fundsInAddressBalance (multi-stake)', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake(testData.requestAddStakeMany);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingAdd);

      const suiTx = tx as SuiTransaction<StakingProgrammableTransaction>;
      const cmds = suiTx.suiTransaction.tx.transactions as any[];

      // Command sequence: redeem_funds, mergeCoins, then for each stake: splitCoins + request_add_stake
      cmds[0].kind.should.equal('MoveCall', 'command 0 must be redeem_funds');
      cmds[0].target.should.equal('0x2::coin::redeem_funds');
      cmds[1].kind.should.equal('MergeCoins', 'command 1 must be mergeCoins');

      const numStakes = testData.requestAddStakeMany.length;
      // After redeem+merge, each stake adds 2 commands: splitCoins + MoveCall
      cmds.length.should.equal(2 + numStakes * 2);

      const requests = utils.getStakeRequests(suiTx.suiTransaction.tx);
      requests.length.should.equal(numStakes);
      for (let i = 0; i < numStakes; i++) {
        requests[i].validatorAddress.should.equal(testData.requestAddStakeMany[i].validatorAddress);
        requests[i].amount.should.equal(testData.requestAddStakeMany[i].amount);
      }
    });

    it('should not insert redeem_funds when fundsInAddressBalance is 0 (default behavior unchanged)', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(testData.gasData);
      // No fundsInAddressBalance call — default is 0

      const tx = await txBuilder.build();
      const suiTx = tx as SuiTransaction<StakingProgrammableTransaction>;
      const cmds = suiTx.suiTransaction.tx.transactions as any[];

      // Original 2-command sequence: splitCoins + request_add_stake
      cmds.length.should.equal(2);
      cmds[0].kind.should.equal('SplitCoins');
      cmds[1].kind.should.equal('MoveCall');
      cmds[1].target.should.endWith('::sui_system::request_add_stake');

      should.equal(suiTx.suiTransaction.fundsInAddressBalance, undefined);
    });

    it('should build Case 2 (addr-bal only, empty payment): redeem → merge → split → add_stake', async function () {
      // Case 2: gasData.payment=[] — the stake amount comes entirely from address balance.
      // SplitCoins(GasCoin) is unsafe with empty payment because GasCoin only carries up to
      // gas-budget-worth of balance. The same redeem_funds → mergeCoins(gas) path is used,
      // after which GasCoin holds the full address balance and SplitCoins works correctly.
      const gasDataNoPayment = {
        ...testData.gasDataWithoutGasPayment,
        payment: [],
      };
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestAddStake]);
      txBuilder.gasData(gasDataNoPayment);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingAdd);

      const suiTx = tx as SuiTransaction<StakingProgrammableTransaction>;
      suiTx.suiTransaction.gasData.payment.length.should.equal(0);

      // Command sequence: redeem_funds, mergeCoins, splitCoins, request_add_stake
      const cmds = suiTx.suiTransaction.tx.transactions as any[];
      cmds.length.should.equal(4);
      cmds[0].kind.should.equal('MoveCall');
      cmds[0].target.should.equal('0x2::coin::redeem_funds');
      cmds[1].kind.should.equal('MergeCoins');
      cmds[2].kind.should.equal('SplitCoins');
      cmds[3].kind.should.equal('MoveCall');
      cmds[3].target.should.endWith('::sui_system::request_add_stake');

      suiTx.suiTransaction.fundsInAddressBalance!.should.equal(FUNDS_IN_ADDRESS_BALANCE);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // Round-trip
      const rebuilder = factory.from(rawTx);
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getStakingBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getStakingBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getStakingBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getStakingBuilder();
      const invalidGasPayment = {
        ...testData.gasDataWithoutGasPayment,
        payment: [
          {
            objectId: '',
            version: -1,
            digest: '',
          },
        ],
      };
      should(() => builder.gasData(invalidGasPayment)).throwError('Invalid payment, invalid or missing version');
    });
  });
});
