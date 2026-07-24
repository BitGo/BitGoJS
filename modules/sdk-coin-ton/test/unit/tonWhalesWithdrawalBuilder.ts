import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory } from '../../src'; // Adjust path as needed
import { coins } from '@bitgo/statics';
import * as testData from '../resources/ton';
import { TON_WHALES_WITHDRAW_OPCODE } from '../../src/lib/constants';

describe('Ton Whales Withdrawal Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tton'));

  // Define the scenarios we want to test
  const scenarios = [
    {
      name: 'Partial Withdrawal (10 TON)',
      fixture: testData.signedTonWhalesWithdrawalTransaction,
    },
    {
      name: 'Full Withdrawal (Amount 0)',
      fixture: testData.signedTonWhalesFullWithdrawalTransaction,
    },
  ];

  scenarios.forEach((scenario) => {
    describe(scenario.name, () => {
      const fixture = scenario.fixture;

      it('should parse a raw transaction and extract correct parameters', async function () {
        const txBuilder = factory.from(fixture.tx);
        const builtTx = await txBuilder.build();
        const jsonTx = builtTx.toJson();

        // Verify Business Logic Fields
        should.equal(builtTx.type, TransactionType.TonWhalesWithdrawal);

        // NOTE: In withdrawals, recipient.amount is the FEE, withdrawAmount is the STAKE
        should.equal(jsonTx.amount, fixture.recipient.amount);
        should.equal(jsonTx.withdrawAmount, fixture.withdrawAmount);

        should.equal(jsonTx.destination, fixture.recipient.address);
        should.equal(jsonTx.sender, fixture.sender);

        // Verify Network Constraints
        should.equal(jsonTx.seqno, fixture.seqno);
        should.equal(jsonTx.expirationTime, fixture.expireTime);
        should.equal(jsonTx.bounceable, fixture.bounceable);

        // Verify Payload Structure
        // Logic: DecimalOpCode + HexQueryId + DecimalAmount
        const msg = builtTx['message'] || '';
        should.equal(msg.startsWith(TON_WHALES_WITHDRAW_OPCODE), true);

        // Ensure the payload ENDS with the decimal amount (either "1000..." or "0")
        should.equal(msg.endsWith(fixture.withdrawAmount), true);
      });

      it('should parse and rebuild the transaction resulting in the same hex', async function () {
        const txBuilder = factory.from(fixture.tx);
        const builtTx = await txBuilder.build();

        // Verify the parser extracted the signature
        const signature = builtTx.signature[0];
        should.exist(signature);
        signature.should.not.be.empty();

        // Rebuild from the parsed object
        const builder2 = factory.from(builtTx.toBroadcastFormat());
        const builtTx2 = await builder2.build();

        // The output of the second build should match the original raw transaction
        should.equal(builtTx2.toBroadcastFormat(), fixture.tx);
        should.equal(builtTx2.type, TransactionType.TonWhalesWithdrawal);
      });

      it('should build a transaction from scratch that byte-for-byte matches the raw fixture', async function () {
        // Get the specific Withdrawal Builder
        const builder = factory.getTonWhalesWithdrawalBuilder();

        // Set Header Info from Fixture
        builder.sender(fixture.sender);
        builder.publicKey(fixture.publicKey);
        builder.sequenceNumber(fixture.seqno);
        builder.expireTime(fixture.expireTime);
        builder.bounceable(fixture.bounceable);

        // Set Destination and ATTACHED VALUE (The Fee)
        builder.send({
          address: fixture.recipient.address,
          amount: fixture.recipient.amount,
        });

        // Set Payload Data (The Unstake Amount)
        // Note: This works for both partial (amount > 0) and full (amount = "0")
        builder.setWithdrawalMessage(fixture.withdrawAmount, fixture.queryId);

        // Attach Signature from Fixture (Mocking the HSM signing process)
        if (fixture.signature) {
          builder.addSignature({ pub: fixture.publicKey }, Buffer.from(fixture.signature, 'hex'));
        }

        // Build Signed Transaction
        const signedBuiltTx = await builder.build();
        const jsonTx = signedBuiltTx.toJson();

        // Verify that the builder correctly set the withdrawal amount on the transaction object
        should.equal(jsonTx.withdrawAmount, fixture.withdrawAmount);

        // Byte-for-byte equality with the Sandbox output
        should.equal(signedBuiltTx.toBroadcastFormat(), fixture.tx);
        should.equal(signedBuiltTx.type, TransactionType.TonWhalesWithdrawal);
      });
    });
  });
});
