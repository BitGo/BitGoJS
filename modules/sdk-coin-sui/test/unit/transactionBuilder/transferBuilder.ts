import assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType, TransferProgrammableTransaction } from '../../../src/lib/iface';
import { MAX_COMMAND_ARGS, MAX_GAS_OBJECTS } from '../../../src/lib/constants';

describe('Sui Transfer Builder', () => {
  const factory = getBuilderFactory('tsui');

  describe('Succeed', () => {
    it('should build a transfer tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);
      (tx as SuiTransaction<TransferProgrammableTransaction>).suiTransaction.gasData.payment!.should.deepEqual(
        testData.coinsGasPayment
      );

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (testData.AMOUNT * 2).toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(2);
      tx.outputs[0].should.deepEqual({
        address: testData.recipients[0].address,
        value: testData.recipients[0].amount,
        coin: 'tsui',
      });
      tx.outputs[1].should.deepEqual({
        address: testData.recipients[1].address,
        value: testData.recipients[1].amount,
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TRANSFER);
    });

    it('should build a sponsored transfer tx with inputObjects', async function () {
      const inputObjects = [
        {
          objectId: '0000000000000000000000001234567890abcdef1234567890abcdef12345678',
          version: 100,
          digest: '2B8XKQJ7mfxQPUWqJJAGjzBAzivkWKq2cEa3W8LLz1yB',
        },
        {
          objectId: '000000000000000000000000abcdef1234567890abcdef1234567890abcdef12',
          version: 200,
          digest: 'DoJwXuz9oU5Y5v5vBRiTgisVTQuZQLmHZWeqJzzD5QUE',
        },
      ];

      // Create gas data with different owner (sponsor)
      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address, // Different from sender
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address); // Sender
      txBuilder.send(testData.recipients);
      txBuilder.gasData(sponsoredGasData); // Gas paid by sponsor
      txBuilder.inputObjects(inputObjects); // Required for sponsored tx

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;

      // Verify transaction structure for sponsored transaction
      const programmableTx = suiTx.suiTransaction.tx;
      programmableTx.transactions.length.should.be.greaterThan(0);

      // Verify sponsored transaction characteristics
      suiTx.suiTransaction.sender.should.equal(testData.sender.address);
      suiTx.suiTransaction.gasData.owner.should.equal(testData.feePayer.address);

      // Should have transactions for merging/splitting and transferring when using inputObjects
      programmableTx.transactions.length.should.be.greaterThan(0);

      // Verify we have transfer operations (the exact structure varies with API versions)
      should.exist(programmableTx.transactions);

      // Verify inputObjects are not used in gas payment (they're separate)
      suiTx.suiTransaction.gasData.payment.should.not.containDeep(inputObjects);

      const rawTx = tx.toBroadcastFormat();
      should.exist(rawTx);
      should.equal(typeof rawTx, 'string');
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build a split coin tx', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      const amount = 1000000000;
      const recipients = new Array(100).fill({ address: testData.sender.address, amount: amount.toString() });
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);
      (tx as SuiTransaction<TransferProgrammableTransaction>).suiTransaction.gasData.payment!.should.deepEqual(
        testData.coinsGasPayment
      );

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (amount * 100).toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(100);
      tx.outputs.forEach((output) =>
        output.should.deepEqual({
          address: testData.sender.address,
          value: amount.toString(),
          coin: 'tsui',
        })
      );
    });

    it('should build a split coin tx with more than 255 input objects', async function () {
      const amount = 1000000000;
      const numberOfRecipients = 10;
      const numberOfPaymentObjects = 1000;

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);

      const recipients = new Array(numberOfRecipients).fill({
        address: testData.sender.address,
        amount: amount.toString(),
      });

      const gasData = {
        ...testData.gasData,
        payment: testData.generateObjects(numberOfPaymentObjects),
      };

      txBuilder.send(recipients);
      txBuilder.gasData(gasData);
      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.Send);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (amount * 10).toString(),
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(10);
      tx.outputs.forEach((output) =>
        output.should.deepEqual({
          coin: 'tsui',
          address: testData.sender.address,
          value: amount.toString(),
        })
      );
      tx.suiTransaction.gasData.owner.should.equal(gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(MAX_GAS_OBJECTS - 1);

      const programmableTx = tx.suiTransaction.tx;

      // total objects - objects sent as gas payment + no. of recipient amounts(pure)
      // + no. of unique recipient addresses(de-duped objects)
      programmableTx.inputs.length.should.equal(
        numberOfPaymentObjects - (MAX_GAS_OBJECTS - 1) + numberOfRecipients + 1
      );
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

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid payTx', async function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.send([testData.invalidRecipients[0]])).throwError(
        'Invalid or missing address, got: randomString'
      );
      should(() => builder.send([testData.invalidRecipients[1]])).throwError('Invalid recipient amount');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getTransferBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getTransferBuilder();
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

    it('should fail for invalid inputObjects', function () {
      const builder = factory.getTransferBuilder();
      const invalidInputObjects = [
        {
          objectId: '',
          version: -1,
          digest: '',
        },
      ];
      should(() => builder.inputObjects(invalidInputObjects)).throwError(
        'Invalid input object, invalid or missing version'
      );
    });

    it('should build transfer with different gas owner but no inputObjects', async function () {
      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address, // Different from sender
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address); // Sender
      txBuilder.send(testData.recipients);
      txBuilder.gasData(sponsoredGasData); // Gas paid by sponsor
      // Note: NOT providing inputObjects - should still work (fee sponsorship without coin sponsorship)

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      should.not.exist(suiTx.suiTransaction.inputObjects);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should extract inputObjects from transaction data via toJson', async function () {
      const inputObjects = [
        {
          objectId: '0x1234567890abcdef1234567890abcdef12345678',
          version: 100,
          digest: '2B8XKQJ7mfxQPUWqJJAGjzBAzivkWKq2cEa3W8LLz1yB',
        },
      ];
      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address, // Different from sender
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(sponsoredGasData);
      txBuilder.inputObjects(inputObjects);

      const tx = await txBuilder.build();

      // Test that toJson extracts inputObjects from transaction structure
      const txData = (tx as any).toJson();
      should.exist(txData.inputObjects);

      // The toJson should extract the inputObjects from the transaction structure
      // This tests our new getInputObjectsFromTx method
      should.exist(txData.inputObjects);
      Array.isArray(txData.inputObjects).should.equal(true);
    });
  });

  describe('fundsInAddressBalance', () => {
    const FUNDS_IN_ADDRESS_BALANCE = '5000000000'; // 5 SUI

    it('should build a self-pay transfer using only address balance (empty payment)', async function () {
      const gasDataNoPayment = {
        ...testData.gasDataWithoutGasPayment,
        payment: [],
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(gasDataNoPayment);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      suiTx.suiTransaction.gasData.payment.length.should.equal(0);

      // Self-pay path: SplitCoins(GasCoin, [amount]) — no MoveCall needed
      const programmableTx = suiTx.suiTransaction.tx;
      (programmableTx.transactions[0] as any).kind.should.equal('SplitCoins');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // Round-trip: rebuild from raw
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build a self-pay transfer with coin objects + address balance', async function () {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;

      // Self-pay path: SplitCoins(GasCoin) — protocol merges coin objects + address balance automatically
      const programmableTx = suiTx.suiTransaction.tx;
      (programmableTx.transactions[0] as any).kind.should.equal('SplitCoins');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should build a sponsored transfer with coin objects + address balance', async function () {
      const inputObjects = testData.generateObjects(2);
      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address,
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(sponsoredGasData);
      txBuilder.inputObjects(inputObjects);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      suiTx.suiTransaction.gasData.owner.should.equal(testData.feePayer.address);

      // Sponsored path: MoveCall(redeem_funds) + MergeCoins + SplitCoins
      const programmableTx = suiTx.suiTransaction.tx;
      (programmableTx.transactions[0] as any).kind.should.equal('MoveCall');
      (programmableTx.transactions[0] as any).target.should.equal('0x2::coin::redeem_funds');
      (programmableTx.transactions[1] as any).kind.should.equal('MergeCoins');
      (programmableTx.transactions[2] as any).kind.should.equal('SplitCoins');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // Round-trip
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build a sponsored transfer with address balance only (no coin inputObjects)', async function () {
      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address,
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(sponsoredGasData);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      // Path 1b: withdrawal → redeem_funds → SplitCoins(addrCoin) → TransferObjects
      // Sponsor's gas coins remain in gasData.payment; tx.gas is NOT used for the transfer amount.
      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      suiTx.suiTransaction.gasData.owner.should.equal(testData.feePayer.address);
      const programmableTx = suiTx.suiTransaction.tx;
      (programmableTx.transactions[0] as any).kind.should.equal('MoveCall');
      (programmableTx.transactions[0] as any).target.should.equal('0x2::coin::redeem_funds');
      (programmableTx.transactions[1] as any).kind.should.equal('SplitCoins');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // Round-trip: rebuild from raw
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build Path 1b send-all: sponsored addr-balance-only, no change (MergeCoins consumes addrCoin)', async function () {
      // Reproduces the real on-chain failure: UnusedValueWithoutDrop { result_idx: 0 }
      // Occurs when redeem_funds returns addrCoin, SplitCoins drains it completely, and the
      // 0-balance source coin is never consumed.  Fix: MergeCoins(gas, [addrCoin]) at the end.
      const SEND_AMOUNT = '1000000'; // 0.001 SUI — same as the failing tx
      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address,
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: SEND_AMOUNT }]);
      txBuilder.gasData(sponsoredGasData);
      txBuilder.fundsInAddressBalance(SEND_AMOUNT); // send-all: balance == recipient amount

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      const cmds = suiTx.suiTransaction.tx.transactions as any[];

      // Expected command sequence for Path 1b send-all:
      //   0: MoveCall (redeem_funds)     — withdraw addrCoin
      //   1: SplitCoins(addrCoin)        — split recipient amount off addrCoin
      //   2: TransferObjects([split])    — send to recipient
      //   3: MergeCoins(gas, [addrCoin]) — consume the now-zero-balance addrCoin
      cmds[0].kind.should.equal('MoveCall');
      cmds[0].target.should.equal('0x2::coin::redeem_funds');
      cmds[1].kind.should.equal('SplitCoins');
      cmds[2].kind.should.equal('TransferObjects');
      cmds[3].kind.should.equal('MergeCoins', 'expected MergeCoins to consume 0-balance addrCoin after send-all');

      // Recipient parsing must not be affected by the trailing MergeCoins
      const recipients = utils.getRecipients(suiTx.suiTransaction);
      recipients.length.should.equal(1);
      recipients[0].address.should.equal(testData.recipients[0].address);
      recipients[0].amount.should.equal(SEND_AMOUNT);

      // Round-trip
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build Path 1b with change: sponsored addr-balance-only, excess returned to sender', async function () {
      // fundsInAddressBalance exceeds the total recipient amount → change must be returned to
      // the sender as an extra TransferObjects([addrCoin], sender).  The transaction parser must
      // skip this change transfer and only report actual recipients.
      const SEND_AMOUNT = '100'; // each of the two testData.recipients gets 100
      const EXCESS = '9999900'; // fundsInAddressBalance = 10_000_000, total send = 200
      const FUNDS_BALANCE = (Number(SEND_AMOUNT) * testData.recipients.length + Number(EXCESS)).toString();

      const sponsoredGasData = {
        ...testData.gasData,
        owner: testData.feePayer.address,
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients); // 2 recipients × 100 MIST = 200 MIST total
      txBuilder.gasData(sponsoredGasData);
      txBuilder.fundsInAddressBalance(FUNDS_BALANCE); // 10_000_000 > 200 → has change

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      const cmds = suiTx.suiTransaction.tx.transactions as any[];

      // Expected sequence for Path 1b with change (2 recipients):
      //   0: MoveCall (redeem_funds)
      //   1: SplitCoins  —  recipient 0
      //   2: TransferObjects  —  recipient 0
      //   3: SplitCoins  —  recipient 1
      //   4: TransferObjects  —  recipient 1
      //   5: TransferObjects([addrCoin], sender)  —  change back to sender
      cmds[0].kind.should.equal('MoveCall');
      cmds[0].target.should.equal('0x2::coin::redeem_funds');
      const lastCmd = cmds[cmds.length - 1];
      lastCmd.kind.should.equal('TransferObjects', 'last command must be the change transfer');

      // The last TransferObjects returns change to the *sender*, not a recipient
      const changeAddrInput = suiTx.suiTransaction.tx.inputs[lastCmd.address.index] as any;
      const changeAddr = utils.getAddress(changeAddrInput);
      changeAddr.should.equal(testData.sender.address, 'change must go back to sender');

      // Parser must return only the actual recipients, not the change transfer
      const recipients = utils.getRecipients(suiTx.suiTransaction);
      recipients.length.should.equal(testData.recipients.length);
      recipients[0].address.should.equal(testData.recipients[0].address);
      recipients[0].amount.should.equal(SEND_AMOUNT);
      recipients[1].address.should.equal(testData.recipients[1].address);
      recipients[1].amount.should.equal(SEND_AMOUNT);

      // Round-trip
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build a sponsored tx gas paid from sponsor address balance (empty payment)', async function () {
      const inputObjects = testData.generateObjects(1);
      const sponsoredGasDataNoPayment = {
        payment: [],
        owner: testData.feePayer.address,
        price: testData.gasData.price,
        budget: testData.gasData.budget,
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(sponsoredGasDataNoPayment);
      txBuilder.inputObjects(inputObjects);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      suiTx.suiTransaction.gasData.owner.should.equal(testData.feePayer.address);
      suiTx.suiTransaction.gasData.payment.length.should.equal(0);

      // Sponsored path with coin objects, no address balance withdrawal
      const programmableTx = suiTx.suiTransaction.tx;
      (programmableTx.transactions[0] as any).kind.should.equal('SplitCoins');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should round-trip a self-pay transfer with Epoch expiration via fromBytes', async function () {
      // Regression test for the BigInt round-trip bug:
      // BCS.U64 deserializes u64 as BigInt, but the previous superstruct schema used integer()
      // which rejected BigInt, causing fromBytes() to throw a StructError at "expiration".
      // StringEncodedBigint now accepts string | number | bigint, fixing the round-trip.
      const gasDataNoPayment = {
        ...testData.gasDataWithoutGasPayment,
        payment: [],
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(gasDataNoPayment);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);
      txBuilder.expiration({ Epoch: 324 }); // number input

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // fromBytes must not throw StructError — this was the failing case before the fix
      should.doesNotThrow(() => {
        const rebuilder = factory.from(rawTx);
        should.exist(rebuilder);
      });

      // Full round-trip: rebuilt tx must serialize identically
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);

      // Epoch value must survive the round-trip regardless of BigInt/number representation
      const rebuiltJson = rebuiltTx.toJson();
      const epochVal = (rebuiltJson.expiration as any)?.Epoch;
      should.exist(epochVal);
      Number(epochVal).should.equal(324);
    });

    it('should round-trip a self-pay transfer with ValidDuring expiration via fromBytes', async function () {
      // Verifies the full 6-field ValidDuringExpiration BCS schema:
      //   minEpoch/maxEpoch as Option<u64>, minTimestamp/maxTimestamp as Option<u64> (None),
      //   chain as 32-byte Base58 ObjectDigest, nonce as u32.
      // Uses a real mainnet genesis checkpoint digest (32 bytes, Base58).
      const GENESIS_CHAIN_ID = 'GAFpCCcRCxTdFfUEMbQbkLBaZy2RNiGAfvFBhMNpq2kT';
      const FUNDS_IN_ADDRESS_BALANCE = '5000000000';
      const gasDataNoPayment = {
        ...testData.gasDataWithoutGasPayment,
        payment: [],
      };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(testData.recipients);
      txBuilder.gasData(gasDataNoPayment);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);
      txBuilder.expiration({
        ValidDuring: {
          minEpoch: { Some: 500 },
          maxEpoch: { Some: 501 },
          minTimestamp: { None: null },
          maxTimestamp: { None: null },
          chain: GENESIS_CHAIN_ID,
          nonce: 0xdeadbeef,
        },
      });

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // fromBytes must not throw — ValidDuring fields must survive deserialization
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();

      // BCS round-trip: serialized bytes must be identical
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);

      // All ValidDuring fields must survive the round-trip
      const expiration = (rebuiltTx.toJson().expiration as any)?.ValidDuring;
      should.exist(expiration);
      Number(expiration.minEpoch?.Some ?? expiration.minEpoch).should.equal(500);
      Number(expiration.maxEpoch?.Some ?? expiration.maxEpoch).should.equal(501);
      expiration.chain.should.equal(GENESIS_CHAIN_ID);
      Number(expiration.nonce).should.equal(0xdeadbeef);
    });
  });

  describe('BalanceWithdrawal BCS encoding (FundsWithdrawal format)', () => {
    const AMOUNT = '100000000'; // 0.1 SUI in MIST
    const sponsoredGasData = {
      ...testData.gasData,
      owner: testData.feePayer.address,
    };

    async function buildSponsoredTxWithAddressBalance() {
      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: AMOUNT }]);
      txBuilder.gasData(sponsoredGasData);
      txBuilder.fundsInAddressBalance(AMOUNT);
      return txBuilder.build();
    }

    it('should encode BalanceWithdrawal input with FundsWithdrawal structure (reservation/typeArg/withdrawFrom)', async function () {
      const tx = await buildSponsoredTxWithAddressBalance();
      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      const inputs = suiTx.suiTransaction.tx.inputs as any[];

      const bwInput = inputs.find(
        (inp) => inp?.BalanceWithdrawal !== undefined || inp?.value?.BalanceWithdrawal !== undefined
      );
      should.exist(bwInput, 'BalanceWithdrawal input must be present');

      const bw = bwInput.BalanceWithdrawal ?? bwInput.value?.BalanceWithdrawal;

      should.exist(bw.reservation, 'reservation field must exist');
      should.exist(bw.reservation.MaxAmountU64, 'reservation.MaxAmountU64 must exist');
      bw.reservation.MaxAmountU64.toString().should.equal(AMOUNT);

      should.exist(bw.typeArg, 'typeArg field must exist');
      should.exist(bw.typeArg.Balance, 'typeArg.Balance must exist');

      should.exist(bw.withdrawFrom, 'withdrawFrom field must exist');
      should.exist(
        bw.withdrawFrom.Sender !== undefined || bw.withdrawFrom.Sponsor !== undefined,
        'withdrawFrom must be Sender or Sponsor'
      );

      // Old format fields must NOT exist directly on bw
      should.not.exist(bw.amount, 'old "amount" field must not exist on BalanceWithdrawal');
      should.not.exist(bw.type_, 'old "type_" field must not exist on BalanceWithdrawal');
    });

    it('should produce BCS bytes that decode back to FundsWithdrawal with correct amount', async function () {
      const tx = await buildSponsoredTxWithAddressBalance();
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      const deserialized = SuiTransaction.deserializeSuiTransaction(rawTx);
      const inputs = deserialized.tx.inputs as any[];

      const bwInput = inputs.find(
        (inp) => inp?.BalanceWithdrawal !== undefined || inp?.value?.BalanceWithdrawal !== undefined
      );
      should.exist(bwInput, 'BalanceWithdrawal must be present in deserialized inputs');

      const bw = bwInput.BalanceWithdrawal ?? bwInput.value?.BalanceWithdrawal;

      // FundsWithdrawal structure (not old {amount, type_})
      should.exist(bw.reservation, 'reservation must survive BCS round-trip');
      should.exist(bw.reservation.MaxAmountU64, 'MaxAmountU64 must survive BCS round-trip');
      bw.reservation.MaxAmountU64.toString().should.equal(AMOUNT);

      should.exist(bw.typeArg, 'typeArg must survive BCS round-trip');
      should.exist(bw.typeArg.Balance, 'typeArg.Balance must survive BCS round-trip');

      should.exist(bw.withdrawFrom, 'withdrawFrom must survive BCS round-trip');
    });

    it('should serialize toJson() without a BigInt replacer (no TypeError)', async function () {
      const tx = await buildSponsoredTxWithAddressBalance();
      should.doesNotThrow(
        () => JSON.stringify(tx.toJson()),
        'JSON.stringify(tx.toJson()) must not throw — BalanceWithdrawal amount must not be stored as BigInt'
      );
    });

    it('should preserve fundsInAddressBalance amount through full round-trip', async function () {
      const tx = await buildSponsoredTxWithAddressBalance();
      const rawTx = tx.toBroadcastFormat();

      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();

      rebuiltTx.toBroadcastFormat().should.equal(rawTx);

      const suiTx = rebuiltTx as SuiTransaction<TransferProgrammableTransaction>;
      const inputs = suiTx.suiTransaction.tx.inputs as any[];
      const bwInput = inputs.find(
        (inp) => inp?.BalanceWithdrawal !== undefined || inp?.value?.BalanceWithdrawal !== undefined
      );
      should.exist(bwInput);
      const bw = bwInput.BalanceWithdrawal ?? bwInput.value?.BalanceWithdrawal;
      bw.reservation.MaxAmountU64.toString().should.equal(AMOUNT);
    });

    it('should encode gas-from-address-balance (self-pay, empty payment) with no FundsWithdrawal input', async function () {
      // When gasData.payment=[] and sender===gasData.owner, the Sui runtime automatically
      // uses address balance to fund both gas and the transfer via GasCoin.
      // No BalanceWithdrawal CallArg is needed — the runtime handles it implicitly.
      const selfPayNoPayment = { ...testData.gasDataWithoutGasPayment, payment: [] };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: AMOUNT }]);
      txBuilder.gasData(selfPayNoPayment);
      txBuilder.fundsInAddressBalance(AMOUNT);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;

      // Gas owner must equal sender (self-pay)
      suiTx.suiTransaction.gasData.owner.should.equal(testData.sender.address);
      // Payment must be empty — gas funded from address balance by the runtime
      suiTx.suiTransaction.gasData.payment.length.should.equal(0);

      // No BalanceWithdrawal input — runtime handles address balance automatically
      const inputs = suiTx.suiTransaction.tx.inputs as any[];
      const bwInput = inputs.find(
        (inp) => inp?.BalanceWithdrawal !== undefined || inp?.value?.BalanceWithdrawal !== undefined
      );
      should.not.exist(bwInput, 'self-pay must NOT have a BalanceWithdrawal input — runtime handles it');

      // First command must be SplitCoins(GasCoin) — no redeem_funds needed
      const commands = suiTx.suiTransaction.tx.transactions as any[];
      commands[0].kind.should.equal('SplitCoins');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      const deserialized = SuiTransaction.deserializeSuiTransaction(rawTx);
      deserialized.sender.should.equal(testData.sender.address);
      deserialized.gasData.owner.should.equal(testData.sender.address);
      deserialized.gasData.payment.length.should.equal(0);

      // No FundsWithdrawal in decoded inputs — only Pure args
      const decodedInputs = deserialized.tx.inputs as any[];
      decodedInputs
        .every((inp: any) => inp?.BalanceWithdrawal === undefined && inp?.value?.BalanceWithdrawal === undefined)
        .should.be.true('decoded inputs must contain no FundsWithdrawal for self-pay path');

      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should encode gas-from-address-balance with ValidDuring expiration (self-pay, empty payment)', async function () {
      // When gasData.payment=[] the Sui node requires a ValidDuring expiration to prevent
      // replay attacks. Gas and transfer are both funded from address balance via GasCoin.
      const GENESIS_CHAIN_ID = 'GAFpCCcRCxTdFfUEMbQbkLBaZy2RNiGAfvFBhMNpq2kT';
      const selfPayNoPayment = { ...testData.gasDataWithoutGasPayment, payment: [] };

      const txBuilder = factory.getTransferBuilder();
      txBuilder.type(SuiTransactionType.Transfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: AMOUNT }]);
      txBuilder.gasData(selfPayNoPayment);
      txBuilder.fundsInAddressBalance(AMOUNT);
      txBuilder.expiration({
        ValidDuring: {
          minEpoch: { Some: 500 },
          maxEpoch: { Some: 501 },
          minTimestamp: { None: null },
          maxTimestamp: { None: null },
          chain: GENESIS_CHAIN_ID,
          nonce: 0xdeadbeef,
        },
      });

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;

      // Self-pay: owner === sender, payment empty
      suiTx.suiTransaction.gasData.owner.should.equal(testData.sender.address);
      suiTx.suiTransaction.gasData.payment.length.should.equal(0);

      // No BalanceWithdrawal input — runtime handles GasCoin from address balance
      const inputs = suiTx.suiTransaction.tx.inputs as any[];
      const bwInput = inputs.find(
        (inp) => inp?.BalanceWithdrawal !== undefined || inp?.value?.BalanceWithdrawal !== undefined
      );
      should.not.exist(bwInput, 'self-pay must NOT have a BalanceWithdrawal input');

      // First command: SplitCoins(GasCoin) — no redeem_funds for self-pay
      const commands = suiTx.suiTransaction.tx.transactions as any[];
      commands[0].kind.should.equal('SplitCoins');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      const deserialized = SuiTransaction.deserializeSuiTransaction(rawTx);
      deserialized.sender.should.equal(testData.sender.address);
      deserialized.gasData.payment.length.should.equal(0);

      const expiration = (deserialized.expiration as any)?.ValidDuring;
      should.exist(expiration, 'ValidDuring expiration must survive BCS round-trip');
      Number(expiration.minEpoch?.Some ?? expiration.minEpoch).should.equal(500);
      Number(expiration.maxEpoch?.Some ?? expiration.maxEpoch).should.equal(501);
      expiration.chain.should.equal(GENESIS_CHAIN_ID);
      Number(expiration.nonce).should.equal(0xdeadbeef);

      // Inputs must contain no FundsWithdrawal — only Pure args
      const decodedInputs = deserialized.tx.inputs as any[];
      decodedInputs
        .every((inp: any) => inp?.BalanceWithdrawal === undefined && inp?.value?.BalanceWithdrawal === undefined)
        .should.be.true('decoded inputs must contain no FundsWithdrawal for self-pay path');

      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build and correctly decode a MoveCall to 0x2::coin::redeem_funds with BalanceWithdrawal arg', async function () {
      const tx = await buildSponsoredTxWithAddressBalance();
      const suiTx = tx as SuiTransaction<TransferProgrammableTransaction>;
      const commands = suiTx.suiTransaction.tx.transactions as any[];

      commands[0].kind.should.equal('MoveCall');
      commands[0].target.should.equal('0x2::coin::redeem_funds');
      commands[0].typeArguments[0].should.equal('0x2::sui::SUI');

      // The argument to redeem_funds must reference the BalanceWithdrawal input (index 0)
      const arg = commands[0].arguments[0];
      arg.kind.should.equal('Input');
      arg.index.should.equal(0);
      arg.type.should.equal('object');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });
  });
});
