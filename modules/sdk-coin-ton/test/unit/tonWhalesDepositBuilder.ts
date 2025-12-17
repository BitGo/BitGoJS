import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory } from '../../src'; // Adjust path as needed
import { coins } from '@bitgo/statics';
import * as testData from '../resources/ton';
import { TON_WHALES_DEPOSIT_OPCODE } from '../../src/lib/constants';

describe('Ton Whales Deposit Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tton'));
  const fixture = testData.signedTonWhalesDepositTransaction;

  it('should parse a raw transaction and extract correct parameters', async function () {
    const txBuilder = factory.from(fixture.tx);
    const builtTx = await txBuilder.build();
    const jsonTx = builtTx.toJson();

    // Verify Business Logic Fields
    should.equal(builtTx.type, TransactionType.TonWhalesDeposit);
    should.equal(jsonTx.amount, fixture.recipient.amount);
    should.equal(jsonTx.destination, fixture.recipient.address);
    should.equal(jsonTx.sender, fixture.sender);

    // Verify Network Constraints
    should.equal(jsonTx.seqno, fixture.seqno);
    should.equal(jsonTx.expirationTime, fixture.expireTime);
    should.equal(jsonTx.bounceable, fixture.bounceable);

    // Verify Payload Structure (OpCode Check)
    const msg = builtTx['message'] || '';
    should.equal(msg.startsWith(TON_WHALES_DEPOSIT_OPCODE), true);
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
    should.equal(builtTx2.type, TransactionType.TonWhalesDeposit);
  });

  it('should build a transaction from scratch that byte-for-byte matches the raw fixture', async function () {
    const builder = factory.getTonWhalesDepositBuilder();

    // Set Header Info from Fixture
    builder.sender(fixture.sender);
    builder.publicKey(fixture.publicKey);
    builder.sequenceNumber(fixture.seqno);
    builder.expireTime(fixture.expireTime);
    builder.bounceable(fixture.bounceable);

    // Set Staking Info from Fixture
    builder.send({
      address: fixture.recipient.address,
      amount: fixture.recipient.amount,
    });
    builder.setDepositAmount(fixture.recipient.amount);

    // Set the specific QueryID from Fixture so binary hash matches
    builder.setDepositMessage(fixture.queryId);

    // Attach Signature from Fixture (Mocking the HSM signing process)
    if (fixture.signature) {
      builder.addSignature({ pub: fixture.publicKey }, Buffer.from(fixture.signature, 'hex'));
    }

    // Build Signed Transaction
    const signedBuiltTx = await builder.build();

    // Final Assertion: Byte-for-byte equality with the Sandbox output
    should.equal(signedBuiltTx.toBroadcastFormat(), fixture.tx);
    should.equal(signedBuiltTx.type, TransactionType.TonWhalesDeposit);
  });

  it('should parse the bounceable flag correctly', async function () {
    const txBuilder = factory.from(fixture.tx);
    const tx = await txBuilder.build();

    // The fixture is set to true, so the parser must reflect that
    const isBounceable = tx.toJson().bounceable;
    should.equal(isBounceable, fixture.bounceable);
    should.equal(typeof isBounceable, 'boolean');
  });
});
