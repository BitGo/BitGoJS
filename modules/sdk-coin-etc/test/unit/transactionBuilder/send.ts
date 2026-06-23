import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from '../../../src';
import { getBuilder } from '../../../src/lib/builder';
import * as testData from '../../resources';
import { decodeTransferData } from '@bitgo/sdk-coin-eth';

describe('Etc send transaction', function () {
  let txBuilder: TransactionBuilder;
  const contractAddress = '0x7073b82be1d932c70afe505e1fe211916e978c34';
  const initTxBuilder = (): void => {
    txBuilder = getBuilder('tetc') as TransactionBuilder;
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(2);
    txBuilder.type(TransactionType.Send);
    txBuilder.contract(contractAddress);
  };
  const key = testData.KEYPAIR_PRV.getKeys().prv as string;

  it('a send funds transaction', async () => {
    initTxBuilder();
    const recipient = testData.ACCOUNT_2;
    const amount = '1000000000';
    const expireTime = 1590066728;
    const sequenceId = 5;
    txBuilder
      .transfer()
      .amount(amount)
      .to(recipient)
      .expirationTime(1590066728)
      .contractSequenceId(sequenceId)
      .key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
    const tx = await txBuilder.build();
    should.equal(tx.toJson().chainId, 63);

    should.equal(tx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
    should.equal(tx.signature.length, 2);
    should.equal(tx.inputs.length, 1);
    should.equal(tx.inputs[0].address, contractAddress);
    should.equal(tx.inputs[0].value, amount);
    should.equal(tx.outputs.length, 1);
    should.equal(tx.outputs[0].address, recipient);
    should.equal(tx.outputs[0].value, amount);

    const data = tx.toJson().data;
    const {
      to,
      amount: parsedAmount,
      expireTime: parsedExpireTime,
      sequenceId: parsedSequenceId,
    } = decodeTransferData(data);
    should.equal(to, recipient);
    should.equal(parsedAmount, amount);
    should.equal(parsedExpireTime, expireTime);
    should.equal(parsedSequenceId, sequenceId);
  });

  it('a send funds with amount 0 transaction', async () => {
    initTxBuilder();
    txBuilder.transfer().amount('0').to(testData.ACCOUNT_2).expirationTime(1590066728).contractSequenceId(5).key(key);
    txBuilder.sign({ key: testData.PRIVATE_KEY_1 });
    const tx = await txBuilder.build();
    should.equal(tx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
  });
  it('unsigned transaction with final v check', async () => {
    initTxBuilder();
    txBuilder.transfer().amount('0').to(testData.ACCOUNT_2).expirationTime(1590066728).contractSequenceId(5).key(key);
    const tx = await txBuilder.build();
    should.equal(tx.toJson().v, '0xa1');
  });
});

describe('should sign and build from serialized', () => {
  it('a send funds transaction from serialized', async () => {
    const txBuilder = getBuilder('tetc') as TransactionBuilder;
    txBuilder.from(testData.SEND_TX_BROADCAST);
    const signedTx = await txBuilder.build();
    should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
  });

  it('a send funds transaction with amount 0 from serialized', async () => {
    const txBuilder = getBuilder('tetc') as TransactionBuilder;
    txBuilder.from(testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
    const signedTx = await txBuilder.build();
    should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_AMOUNT_ZERO_BROADCAST);
  });
});

/**
 * Regression tests for WCN-560: ETC TransactionBuilder.transfer() must pass isFirstSigner to the
 * TransferBuilder so that from(txHex, true) correctly decodes first-signer calldata, and
 * getHalfSignedTxByFirstSigner produces a valid second-signer half-signed tx (instead of treating
 * the ABI string-offset 0xC0 as the recipient address).
 */
describe('ETC first-signer round-trip (WCN-560 regression)', () => {
  const contractAddress = '0x7073b82be1d932c70afe505e1fe211916e978c34';
  const recipient = testData.ACCOUNT_2; // '0x33ffaefff29455fbcb1f7ddabb6ef48f4dd87536'
  const amount = '1000000000';
  const expireTime = 1590066728;
  const sequenceId = 5;
  const key = testData.KEYPAIR_PRV.getKeys().prv as string;

  /** Build an unsigned first-signer tx with known parameters and return its hex. */
  async function buildFirstSignerTxHex(): Promise<string> {
    const txBuilder = getBuilder('tetc') as TransactionBuilder;
    txBuilder.fee({ fee: '1000000000', gasLimit: '12100000' });
    txBuilder.counter(2);
    txBuilder.type(TransactionType.Send);
    txBuilder.contract(contractAddress);
    const transfer = txBuilder.transfer() as any;
    transfer.amount(amount).to(recipient).expirationTime(expireTime).contractSequenceId(sequenceId).key(key);
    transfer.isFirstSigner(true);
    const tx = await txBuilder.build();
    return tx.toBroadcastFormat();
  }

  it('from(firstSignerTxHex, true) decodes recipient and amount correctly (not 0xC0)', async () => {
    const firstSignerTxHex = await buildFirstSignerTxHex();

    // This was broken before the fix: ETC's transfer() dropped isFirstSigner, so the
    // TransferBuilder decoded the first-signer ABI with second-signer offsets, producing
    // address=0x...00c0 (the ABI dynamic-string offset) instead of the real recipient.
    const txBuilder = getBuilder('tetc') as TransactionBuilder;
    txBuilder.from(firstSignerTxHex, true);
    const tx = await txBuilder.build();

    should.equal(tx.outputs.length, 1);
    should.equal(tx.outputs[0].address.toLowerCase(), recipient.toLowerCase());
    should.equal(tx.outputs[0].value, amount);

    // Explicitly assert the old-bug value is absent
    should.notEqual(tx.outputs[0].address.toLowerCase(), '0x00000000000000000000000000000000000000c0');
  });

  it('full round-trip: first-signer → add inner sig → second-signer half-signed → verify recipient', async () => {
    const firstSignerTxHex = await buildFirstSignerTxHex();

    // Simulate getHalfSignedTxByFirstSigner:
    //   1. Parse the first-signer tx (Trust HSM input)
    //   2. Inject the operationHashSig returned by Trust
    //   3. Switch to second-signer encoding (removes the method-id prefix string)
    const txBuilder = getBuilder('tetc') as TransactionBuilder;
    txBuilder.from(firstSignerTxHex, true);
    const transfer = txBuilder.transfer() as any;
    const mockOperationHashSig = '0x' + '1b'.repeat(65); // 65-byte sig from Trust HSM
    transfer.setSignature(mockOperationHashSig);
    transfer.isFirstSigner(false);
    const halfSignedTx = await txBuilder.build();
    const halfSignedTxHex = halfSignedTx.toBroadcastFormat();

    // Direct calldata decode must give the correct recipient and amount
    const { to, amount: decodedAmount } = decodeTransferData(halfSignedTx.toJson().data);
    should.equal(to.toLowerCase(), recipient.toLowerCase());
    should.equal(decodedAmount, amount);
    // Guard against the old bug: 0xC0 is the ABI string offset, NOT a valid recipient
    should.notEqual(to.toLowerCase(), '0x00000000000000000000000000000000000000c0');

    // Re-parsing the half-signed tx as second-signer must also yield correct outputs
    const verifyBuilder = getBuilder('tetc') as TransactionBuilder;
    verifyBuilder.from(halfSignedTxHex);
    const verifiedTx = await verifyBuilder.build();
    should.equal(verifiedTx.outputs[0].address.toLowerCase(), recipient.toLowerCase());
    should.equal(verifiedTx.outputs[0].value, amount);
  });
});
