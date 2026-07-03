import assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType, TokenTransferProgrammableTransaction } from '../../../src/lib/iface';

describe('Sui Token Transfer Builder', () => {
  const factory = getBuilderFactory('tsui:deep');

  describe('Succeed', () => {
    it('should build a token transfer', async function () {
      const amount = 1000000000;
      const numberOfRecipients = 10;
      const numberOfInputObjects = 100;
      const numberOfGasPaymentObjects = 10;

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);

      const recipients = new Array(numberOfRecipients).fill({
        address: testData.sender.address,
        amount: amount.toString(),
      });

      const gasData = {
        ...testData.gasData,
        payment: testData.generateObjects(numberOfGasPaymentObjects),
      };

      const inputObjects = testData.generateObjects(numberOfInputObjects);

      txBuilder.send(recipients);
      txBuilder.gasData(gasData);
      txBuilder.inputObjects(inputObjects);

      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.Send);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.sender.address,
        value: (amount * numberOfRecipients).toString(),
        coin: 'tsui:deep',
      });
      tx.outputs.length.should.equal(10);
      tx.outputs.forEach((output) =>
        output.should.deepEqual({
          coin: 'tsui:deep',
          address: testData.sender.address,
          value: amount.toString(),
        })
      );
      tx.suiTransaction.gasData.owner.should.equal(gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(10);

      const programmableTx = tx.suiTransaction.tx;

      // objects sent as input + no. of recipient amounts(pure arg) + no. of unique recipient addresses(de-duped objects = 1)
      programmableTx.inputs.length.should.equal(numberOfInputObjects + numberOfRecipients + 1);
      programmableTx.transactions[0].kind.should.equal('MergeCoins');
      programmableTx.transactions[0].sources.length.should.equal(numberOfInputObjects - 1);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      rebuiltTx.toJson().gasData.payment.length.should.equal(numberOfGasPaymentObjects);
      rebuiltTx.toJson().inputObjects.length.should.equal(numberOfInputObjects);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getTokenTransferBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid payTx', async function () {
      const builder = factory.getTokenTransferBuilder();
      should(() => builder.send([testData.invalidRecipients[0]])).throwError(
        'Invalid or missing address, got: randomString'
      );
      should(() => builder.send([testData.invalidRecipients[1]])).throwError('Invalid recipient amount');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getTokenTransferBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getTokenTransferBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getTokenTransferBuilder();
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
      const builder = factory.getTokenTransferBuilder();
      const invalidInputObjects = [
        {
          objectId: 'objectId',
          version: 1,
        },
      ];
      // @ts-expect-error - testing invalid input
      should(() => builder.inputObjects(invalidInputObjects)).throwError('Invalid input object, missing digest');
    });

    it('should fail when neither inputObjects nor fundsInAddressBalance is provided', async function () {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: '1000' }]);
      txBuilder.gasData(testData.gasData);
      await txBuilder.build().should.be.rejectedWith('input objects or fundsInAddressBalance required before building');
    });
  });

  describe('fundsInAddressBalance', () => {
    const FUNDS_IN_ADDRESS_BALANCE = '450000000';
    // tsui:deep coin type: 0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP
    const TOKEN_COIN_TYPE = '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP';

    it('should build a token transfer using only address balance (no coin objects)', async function () {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: '1000' }]);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);
      // No inputObjects

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TokenTransferProgrammableTransaction>;

      // MoveCall(redeem_funds) must be first — it's the only coin source
      const programmableTx = suiTx.suiTransaction.tx;
      (programmableTx.transactions[0] as any).kind.should.equal('MoveCall');
      (programmableTx.transactions[0] as any).target.should.equal('0x2::coin::redeem_funds');
      // typeArguments should contain the token coin type
      (programmableTx.transactions[0] as any).typeArguments[0].should.equal(TOKEN_COIN_TYPE);

      // No MergeCoins since there's only one coin (the address-balance coin)
      (programmableTx.transactions[1] as any).kind.should.equal('SplitCoins');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // Round-trip
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build a token transfer with coin objects + address balance', async function () {
      const numberOfInputObjects = 3;
      const inputObjects = testData.generateObjects(numberOfInputObjects);

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: '1000' }]);
      txBuilder.gasData(testData.gasData);
      txBuilder.inputObjects(inputObjects);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TokenTransferProgrammableTransaction>;
      const programmableTx = suiTx.suiTransaction.tx;

      // MoveCall(redeem_funds) first, then MergeCoins (coin objects + addrCoin), then SplitCoins
      (programmableTx.transactions[0] as any).kind.should.equal('MoveCall');
      (programmableTx.transactions[0] as any).target.should.equal('0x2::coin::redeem_funds');
      (programmableTx.transactions[1] as any).kind.should.equal('MergeCoins');
      // sources = remaining inputObjects (numberOfInputObjects - 1) + addrCoin (1)
      (programmableTx.transactions[1] as any).sources.length.should.equal(numberOfInputObjects - 1 + 1);
      (programmableTx.transactions[2] as any).kind.should.equal('SplitCoins');

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // Round-trip: rebuilt tx should produce same serialized output and recover inputObjects
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
      rebuiltTx.toJson().inputObjects.length.should.equal(numberOfInputObjects);
    });

    it('should build a token transfer using only address balance when sending the full amount (no SplitCoins)', async function () {
      const fullAmount = '82402000000';

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: fullAmount }]);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(fullAmount);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TokenTransferProgrammableTransaction>;
      const programmableTx = suiTx.suiTransaction.tx;

      // Cmd 0: MoveCall(redeem_funds)
      (programmableTx.transactions[0] as any).kind.should.equal('MoveCall');
      (programmableTx.transactions[0] as any).target.should.equal('0x2::coin::redeem_funds');

      // Cmd 1: TransferObjects directly — no SplitCoins
      (programmableTx.transactions[1] as any).kind.should.equal('TransferObjects');
      programmableTx.transactions.some((t: any) => t.kind === 'SplitCoins').should.be.false();

      // getRecipients must recover the correct amount and address
      const recipients = utils.getRecipients(suiTx.suiTransaction);
      recipients.length.should.equal(1);
      recipients[0].address.should.equal(testData.recipients[0].address);
      recipients[0].amount.should.equal(fullAmount);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      // Round-trip: rebuilt tx must produce the same serialized output
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build a token transfer using only address balance when sending the full amount to multiple recipients (no unused Coin<T>)', async function () {
      const amounts = ['30000000000', '52402000000'];
      const total = (BigInt(amounts[0]) + BigInt(amounts[1])).toString();

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([
        { address: testData.recipients[0].address, amount: amounts[0] },
        { address: testData.recipients[1].address, amount: amounts[1] },
      ]);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(total);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TokenTransferProgrammableTransaction>;
      const cmds = suiTx.suiTransaction.tx.transactions as any[];

      // Cmd 0: MoveCall(redeem_funds)
      cmds[0].kind.should.equal('MoveCall');
      cmds[0].target.should.equal('0x2::coin::redeem_funds');

      // Cmd 1+2: SplitCoins + TransferObjects for first recipient
      cmds[1].kind.should.equal('SplitCoins');
      cmds[2].kind.should.equal('TransferObjects');

      // Cmd 3: TransferObjects directly for last recipient — no SplitCoins for it
      cmds[3].kind.should.equal('TransferObjects');
      cmds.length.should.equal(4);

      // getRecipients must recover both amounts and addresses
      const recipients = utils.getRecipients(suiTx.suiTransaction);
      recipients.length.should.equal(2);
      recipients[0].address.should.equal(testData.recipients[0].address);
      recipients[0].amount.should.equal(amounts[0]);
      recipients[1].address.should.equal(testData.recipients[1].address);
      recipients[1].amount.should.equal(amounts[1]);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build a token transfer using partial address balance (single recipient) and return change to sender', async function () {
      const addrBal = '100000000000';
      const sendAmount = '82402000000'; // less than addrBal → change = 17598000000

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: sendAmount }]);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(addrBal);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TokenTransferProgrammableTransaction>;
      const cmds = suiTx.suiTransaction.tx.transactions as any[];

      // Cmd 0: MoveCall(redeem_funds)
      cmds[0].kind.should.equal('MoveCall');
      cmds[0].target.should.equal('0x2::coin::redeem_funds');
      // Cmd 1: SplitCoins for the recipient
      cmds[1].kind.should.equal('SplitCoins');
      // Cmd 2: TransferObjects to recipient
      cmds[2].kind.should.equal('TransferObjects');
      // Cmd 3: TransferObjects([addrCoin], sender) — returns change, consumes addrCoin
      cmds[3].kind.should.equal('TransferObjects');
      cmds.length.should.equal(4);

      // Verify the last TransferObjects goes to the sender (not the recipient)
      const lastCmd = cmds[3] as any;
      const changeAddrInput = suiTx.suiTransaction.tx.inputs[lastCmd.address.index] as any;
      utils.getAddress(changeAddrInput).should.equal(testData.sender.address);

      // getRecipients must return only the actual recipient, not the change transfer
      const recipients = utils.getRecipients(suiTx.suiTransaction);
      recipients.length.should.equal(1);
      recipients[0].address.should.equal(testData.recipients[0].address);
      recipients[0].amount.should.equal(sendAmount);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should build a token transfer using partial address balance (multiple recipients) and return change to sender', async function () {
      const amounts = ['30000000000', '40000000000'];
      const addrBal = '100000000000'; // more than total → change = 30000000000

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([
        { address: testData.recipients[0].address, amount: amounts[0] },
        { address: testData.recipients[1].address, amount: amounts[1] },
      ]);
      txBuilder.gasData(testData.gasData);
      txBuilder.fundsInAddressBalance(addrBal);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      const suiTx = tx as SuiTransaction<TokenTransferProgrammableTransaction>;
      const cmds = suiTx.suiTransaction.tx.transactions as any[];

      // MoveCall + 2×(SplitCoins+TransferObjects) + TransferObjects(change to sender)
      cmds[0].kind.should.equal('MoveCall');
      cmds[1].kind.should.equal('SplitCoins');
      cmds[2].kind.should.equal('TransferObjects');
      cmds[3].kind.should.equal('SplitCoins');
      cmds[4].kind.should.equal('TransferObjects');
      cmds[5].kind.should.equal('TransferObjects'); // change
      cmds.length.should.equal(6);

      // Last command returns change to sender
      const lastCmd = cmds[5] as any;
      const changeAddrInput = suiTx.suiTransaction.tx.inputs[lastCmd.address.index] as any;
      utils.getAddress(changeAddrInput).should.equal(testData.sender.address);

      // getRecipients must return only the 2 actual recipients
      const recipients = utils.getRecipients(suiTx.suiTransaction);
      recipients.length.should.equal(2);
      recipients[0].address.should.equal(testData.recipients[0].address);
      recipients[0].amount.should.equal(amounts[0]);
      recipients[1].address.should.equal(testData.recipients[1].address);
      recipients[1].amount.should.equal(amounts[1]);

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);

      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    });

    it('should correctly reconstruct fundsInAddressBalance from raw transaction', async function () {
      const inputObjects = testData.generateObjects(2);

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send([{ address: testData.recipients[0].address, amount: '500' }]);
      txBuilder.gasData(testData.gasData);
      txBuilder.inputObjects(inputObjects);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      // Rebuild from raw — initBuilder must reconstruct fundsInAddressBalance
      const rebuilder = factory.from(rawTx) as any;
      rebuilder._fundsInAddressBalance.toString().should.equal(FUNDS_IN_ADDRESS_BALANCE);
    });

    it('should build a token transfer with multiple recipients and address balance', async function () {
      const inputObjects = testData.generateObjects(2);
      const amount = 1000;
      const recipients = testData.recipients.map((r) => ({ ...r, amount: amount.toString() }));

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.type(SuiTransactionType.TokenTransfer);
      txBuilder.sender(testData.sender.address);
      txBuilder.send(recipients);
      txBuilder.gasData(testData.gasData);
      txBuilder.inputObjects(inputObjects);
      txBuilder.fundsInAddressBalance(FUNDS_IN_ADDRESS_BALANCE);

      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.Send);

      tx.outputs.length.should.equal(recipients.length);
      tx.outputs.forEach((output, i) => {
        output.address.should.equal(recipients[i].address);
        output.value.should.equal(amount.toString());
      });

      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
    });
  });
});
