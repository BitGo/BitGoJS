import should from 'should';
import { KeyPair, Transaction } from '../../src';
import * as testData from '../resources/sol';
import { getBuilderFactory } from './getBuilderFactory';
import base58 from 'bs58';
const { VersionedTransaction } = require('@solana/web3.js');

describe('Sol Jupiter Swap Transaction', () => {
  const walletKeyPair = new KeyPair(testData.authAccount);
  const wallet = walletKeyPair.getKeys();

  it('should preserve instructions and ALTs when building and signing', async function () {
    // Jupiter Swap Transaction (Versioned)
    const versionedTransaction =
      'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAFDTWoM5DBCGn7cn5aV56fomo6mhD2K1c5XYhQIan41E6dG9t06ox6DMdvVuBnSEATyN/8qIq246iO5aDm1jm82x4wM40FR8Q7xSZUpUtB0lbvelaZ46oRQ2GM9hWGMukHG1EUsA1R9ZO55ClUvNMyw8IQOrfRmu3ONG50oNeluT4LgaOacN+I4d0HStcu+oh0no4XXgVUwjzk5+egiUaQDkCCjXAlSDAb46ahLAfWeKOqzO/HC/z2WgRk8RS1yc6heMZzBbR3SPDwrNvWlCZGaETaixiH9ufdOJ823Gv+MnxH1SOu6TCsX1+TMskj94D3NElDpado8okFQbUuzaijU9oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTjwbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp+mGpF4I4ZrV12bapJ7p61Babt3ty7HYDUKtMso38OYgHCgAFAooyBAAKAAkDoQ4BAAAAAAAIAgAFDAIAAAAwKyIAAAAAAAsFBQAgDAgJk/F7ZPSErnb/CQYABwAdCAwBAQs/HgAFDg0HIB0MDBwLJg8mEBIODSAdESYeDAwkJgIDBgsmGyYWGQ4EICUaJh4MDCQmGBcBCyIjDCEeBA0VExQfMtGYU5N8/tjpC0ANAwAAAAAAWqwAAAAAAAAyAAAAAAADAAAAJiwaAAMm5AwAAgoQJwIDDAMFAAABCQQpv5UHKk+/BN9xdZPnOLzMIScoFcJHGoDZ+fVVsNSEJQI0IwUAKA4CFyo9SDjsPdfWXAdMF0mu2+xZbw9rbR6rzNAEeFkLmyKwBGBmYWUAMHCJ6Oi0A1Qjpjp1Yv3xP+sPLm2qJ//TKZd5Z9KzjvEDwb3CA77DwOtKd1MCu6h4XJjC42yc8TcL92nhzFUR6HLW3XrAIZOvBo6Ki5CRjQOMk5Q=';

    const originalDeserialized = VersionedTransaction.deserialize(Buffer.from(versionedTransaction, 'base64'));

    const versionedInstructions = originalDeserialized.message.compiledInstructions.map((ix) => ({
      programIdIndex: ix.programIdIndex,
      accountKeyIndexes: ix.accountKeyIndexes,
      data: base58.encode(ix.data),
    }));

    const addressLookupTables =
      originalDeserialized.message.addressTableLookups?.map((lookup) => ({
        accountKey: lookup.accountKey.toBase58(),
        writableIndexes: lookup.writableIndexes,
        readonlyIndexes: lookup.readonlyIndexes,
      })) || [];

    const staticAccountKeys = originalDeserialized.message.staticAccountKeys.map((key) => key.toBase58());
    staticAccountKeys[0] = testData.authAccount.pub; // Replace fee payer with our test account

    const versionedTransactionData = {
      versionedInstructions,
      addressLookupTables,
      staticAccountKeys,
      messageHeader: originalDeserialized.message.header,
    };

    const factory = getBuilderFactory('tsol');
    const txBuilder = factory.getCustomInstructionBuilder();

    // Build transaction from versioned transaction data
    txBuilder.fromVersionedTransactionData(versionedTransactionData);
    txBuilder.nonce(testData.blockHashes.validBlockHashes[0]);

    // Build unsigned transaction
    const txUnsigned = (await txBuilder.build()) as Transaction;
    should.exist(txUnsigned);
    txUnsigned.isVersionedTransaction().should.be.true();
    should.exist(txUnsigned.toBroadcastFormat());

    // Sign the transaction
    txBuilder.sign({ key: wallet.prv });
    const tx = (await txBuilder.build()) as Transaction;
    const rawTx = tx.toBroadcastFormat();
    tx.isVersionedTransaction().should.be.true();
    should.exist(rawTx);

    const txBuilder2 = factory.getCustomInstructionBuilder();
    txBuilder2.fromVersionedTransactionData(versionedTransactionData);
    txBuilder2.nonce(testData.blockHashes.validBlockHashes[0]);
    const tx2 = await txBuilder2.build();

    should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));
    should.equal(tx2.type, txUnsigned.type);

    // Verify we can add signature manually
    const signed = tx.signature[0];
    const txBuilder3 = factory.getCustomInstructionBuilder();
    txBuilder3.fromVersionedTransactionData(versionedTransactionData);
    txBuilder3.nonce(testData.blockHashes.validBlockHashes[0]);
    await txBuilder3.addSignature({ pub: wallet.pub }, Buffer.from(base58.decode(signed)));

    const signedTx = await txBuilder3.build();
    should.equal(signedTx.type, tx.type);

    const rawSignedTx = signedTx.toBroadcastFormat();
    should.equal(rawSignedTx, rawTx);

    const signedDeserialized = VersionedTransaction.deserialize(Buffer.from(rawTx, 'base64'));

    // Verify all instructions are preserved
    const origInstructions = originalDeserialized.message.compiledInstructions;
    const signedInstructions = signedDeserialized.message.compiledInstructions;
    should.equal(origInstructions.length, signedInstructions.length, 'Number of instructions should match');

    for (let i = 0; i < origInstructions.length; i++) {
      should.equal(
        origInstructions[i].programIdIndex,
        signedInstructions[i].programIdIndex,
        `Instruction ${i}: programIdIndex should match`
      );
      should.deepEqual(
        origInstructions[i].accountKeyIndexes,
        signedInstructions[i].accountKeyIndexes,
        `Instruction ${i}: accountKeyIndexes should match`
      );
      should.equal(
        Buffer.from(origInstructions[i].data).toString('hex'),
        Buffer.from(signedInstructions[i].data).toString('hex'),
        `Instruction ${i}: data should match`
      );
    }

    // Verify all ALTs are preserved
    const origALTs = originalDeserialized.message.addressTableLookups || [];
    const signedALTs = signedDeserialized.message.addressTableLookups || [];
    should.equal(origALTs.length, signedALTs.length, 'Number of ALTs should match');

    for (let i = 0; i < origALTs.length; i++) {
      should.equal(
        origALTs[i].accountKey.toBase58(),
        signedALTs[i].accountKey.toBase58(),
        `ALT ${i}: accountKey should match`
      );
      should.deepEqual(
        origALTs[i].writableIndexes,
        signedALTs[i].writableIndexes,
        `ALT ${i}: writableIndexes should match`
      );
      should.deepEqual(
        origALTs[i].readonlyIndexes,
        signedALTs[i].readonlyIndexes,
        `ALT ${i}: readonlyIndexes should match`
      );
    }
  });
});
