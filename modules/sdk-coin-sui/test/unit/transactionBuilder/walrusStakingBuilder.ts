import assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType } from '../../../src/lib/iface';

describe('Walrus Staking Builder', () => {
  const factory = getBuilderFactory('tsui:wal');

  describe('Succeed', () => {
    it('should build a staking tx', async function () {
      const txBuilder = factory.getWalrusStakingBuilder();
      txBuilder.type(SuiTransactionType.WalrusStakeWithPool);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestWalrusStakeWithPool]);
      txBuilder.gasData(testData.gasData);
      txBuilder.inputObjects([testData.walToken]);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingAdd);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui:wal',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.requestWalrusStakeWithPool.validatorAddress,
        value: testData.requestWalrusStakeWithPool.amount.toString(),
        coin: 'tsui:wal',
      });

      const rawTx = tx.toBroadcastFormat();
      utils.isValidRawTransaction(rawTx).should.be.true();
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);

      tx.suiTransaction.gasData.owner.should.equal(testData.gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(testData.gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(testData.gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(testData.gasData.payment.length);

      const ptb = tx.suiTransaction.tx;
      ptb.inputs.length.should.equal(5); // WAL object, Staking shared object, Amount, Validator
      ptb.transactions[0].kind.should.equal('SplitCoins'); // Only providing one WAL token
      should.not.exist(tx.suiTransaction.fundsInAddressBalance);
    });

    it('should build a staking tx for multiple gas objects and WAL tokens', async function () {
      const numberOfInputObjects = 100;
      const numberOfGasPaymentObjects = 10;

      const txBuilder = factory.getWalrusStakingBuilder();
      txBuilder.type(SuiTransactionType.WalrusStakeWithPool);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestWalrusStakeWithPool]);

      const gasData = {
        ...testData.gasData,
        payment: testData.generateObjects(numberOfGasPaymentObjects),
      };
      txBuilder.gasData(gasData);
      txBuilder.inputObjects(testData.generateObjects(numberOfInputObjects));
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingAdd);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui:wal',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.requestWalrusStakeWithPool.validatorAddress,
        value: testData.requestWalrusStakeWithPool.amount.toString(),
        coin: 'tsui:wal',
      });
      tx.suiTransaction.gasData.owner.should.equal(gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(10);

      const ptb = tx.suiTransaction.tx;
      ptb.inputs.length.should.equal(numberOfInputObjects + 4);
      ptb.transactions[0].kind.should.equal('MergeCoins'); // Merge all input objects provided
      ptb.transactions[0].sources.length.should.equal(numberOfInputObjects - 1);
      ptb.transactions[1].kind.should.equal('SplitCoins'); // Split the desired amount off of the input object

      const rawTx = tx.toBroadcastFormat();
      utils.isValidRawTransaction(rawTx).should.be.true();
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      rebuiltTx.toJson().gasData.payment.length.should.equal(numberOfGasPaymentObjects);
      rebuiltTx.toJson().inputObjects!.length.should.equal(numberOfInputObjects);
    });

    it('should build a staking tx with mixed WAL coin objects and address balance', async function () {
      const addrBal = testData.STAKING_AMOUNT.toString();

      const txBuilder = factory.getWalrusStakingBuilder();
      txBuilder.type(SuiTransactionType.WalrusStakeWithPool);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestWalrusStakeWithPool]);
      txBuilder.gasData(testData.gasData);
      txBuilder.inputObjects([testData.walToken]);
      txBuilder.fundsInAddressBalance(addrBal);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingAdd);
      should.exist(tx.suiTransaction.fundsInAddressBalance);
      tx.suiTransaction.fundsInAddressBalance!.should.equal(addrBal);

      const ptb = tx.suiTransaction.tx;
      // redeem_funds MoveCall, mergeCoins(walCoin, redeemedCoin), splitCoins, stake_with_pool MoveCall,
      // transferObjects(stakedWals), transferObjects(residualWal)
      const kinds = ptb.transactions.map((t: any) => t.kind);
      kinds.should.containEql('MoveCall'); // redeem_funds
      kinds.should.containEql('MergeCoins'); // merge redeemed into existing coin
      kinds.should.containEql('SplitCoins');
      kinds.filter((k: string) => k === 'TransferObjects').length.should.equal(2); // staked WALs + residual WAL

      const rawTx = tx.toBroadcastFormat();
      utils.isValidRawTransaction(rawTx).should.be.true();

      // Round-trip: rebuild from raw transaction
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      should.exist(rebuiltTx.toJson().fundsInAddressBalance);
      rebuiltTx.toJson().fundsInAddressBalance!.should.equal(addrBal);
      rebuiltTx.toJson().inputObjects!.length.should.equal(1);
    });

    it('should build a staking tx with address balance only (exact amount)', async function () {
      const addrBal = testData.STAKING_AMOUNT.toString();

      const txBuilder = factory.getWalrusStakingBuilder();
      txBuilder.type(SuiTransactionType.WalrusStakeWithPool);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestWalrusStakeWithPool]);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(addrBal);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingAdd);
      should.exist(tx.suiTransaction.fundsInAddressBalance);
      tx.suiTransaction.fundsInAddressBalance!.should.equal(addrBal);

      const ptb = tx.suiTransaction.tx;
      // No coin object inputs — first tx is MoveCall (redeem_funds)
      ptb.transactions[0].kind.should.equal('MoveCall');

      // Verify redeem_funds uses WAL type, not SUI
      const redeemCall = ptb.transactions[0] as any;
      redeemCall.typeArguments[0].should.containEql('::wal::WAL');

      // BalanceWithdrawal input must carry the WAL coin type, not SUI
      const withdrawalInput = ptb.inputs.find((i: any) => {
        const v = i?.BalanceWithdrawal ?? i?.value?.BalanceWithdrawal;
        return v !== undefined;
      }) as any;
      should.exist(withdrawalInput);
      const bw = withdrawalInput.BalanceWithdrawal ?? withdrawalInput.value?.BalanceWithdrawal;
      // typeArg is { Balance: <TypeTag> } where TypeTag encodes the coin type
      JSON.stringify(bw.typeArg).should.containEql('wal');

      // Two TransferObjects: staked WALs + residual WAL
      const transferTxs = ptb.transactions.filter((t: any) => t.kind === 'TransferObjects');
      transferTxs.length.should.equal(2);

      should.not.exist(tx.toJson().inputObjects);

      const rawTx = tx.toBroadcastFormat();
      utils.isValidRawTransaction(rawTx).should.be.true();

      // Round-trip: rebuild from raw transaction
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      should.exist(rebuiltTx.toJson().fundsInAddressBalance);
      rebuiltTx.toJson().fundsInAddressBalance!.should.equal(addrBal);
    });

    it('should build a staking tx with address balance only (partial / residual transfer)', async function () {
      // Request is for STAKING_AMOUNT but we fund double that from addr-bal — residual goes back to sender
      const addrBal = (testData.STAKING_AMOUNT * 2).toString();

      const txBuilder = factory.getWalrusStakingBuilder();
      txBuilder.type(SuiTransactionType.WalrusStakeWithPool);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestWalrusStakeWithPool]);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(addrBal);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      should.exist(tx.suiTransaction.fundsInAddressBalance);
      tx.suiTransaction.fundsInAddressBalance!.should.equal(addrBal);

      const ptb = tx.suiTransaction.tx;
      // residual WAL coin must be transferred back to sender
      const transferTxs = ptb.transactions.filter((t: any) => t.kind === 'TransferObjects');
      transferTxs.length.should.equal(2);

      const rawTx = tx.toBroadcastFormat();
      utils.isValidRawTransaction(rawTx).should.be.true();

      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      should.exist(rebuiltTx.toJson().fundsInAddressBalance);
      rebuiltTx.toJson().fundsInAddressBalance!.should.equal(addrBal);
    });

    it('should have default fundsInAddressBalance of 0 when setter not called', async function () {
      const txBuilder = factory.getWalrusStakingBuilder();
      txBuilder.type(SuiTransactionType.WalrusStakeWithPool);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestWalrusStakeWithPool]);
      txBuilder.gasData(testData.gasData);
      txBuilder.inputObjects([testData.walToken]);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      should.not.exist(tx.suiTransaction.fundsInAddressBalance);

      // PTB should not contain a redeem_funds call
      const ptb = tx.suiTransaction.tx;
      const moveCalls = ptb.transactions.filter((t: any) => t.kind === 'MoveCall');
      moveCalls.every((mc: any) => !mc.target?.includes('redeem_funds')).should.be.true();
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getWalrusStakingBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getWalrusStakingBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getWalrusStakingBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getWalrusStakingBuilder();
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

    it('should fail when neither inputObjects nor fundsInAddressBalance is provided', async function () {
      const txBuilder = factory.getWalrusStakingBuilder();
      txBuilder.type(SuiTransactionType.WalrusStakeWithPool);
      txBuilder.sender(testData.sender.address);
      txBuilder.stake([testData.requestWalrusStakeWithPool]);
      txBuilder.gasData(testData.gasData);
      await txBuilder
        .build()
        .should.be.rejectedWith('either inputObjects or fundsInAddressBalance is required before building');
    });
  });
});
