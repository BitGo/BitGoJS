import should from 'should';
import { Transaction as WasmTonTransaction, parseTransaction } from '@bitgo/wasm-ton';
import { explainTonTransaction } from '../../src/lib/explainTransactionWasm';
import * as testData from '../resources/ton';

describe('TON WASM explainTransaction', function () {
  describe('explainTonTransaction', function () {
    it('should explain a signed send transaction', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      explained.outputs.length.should.be.greaterThan(0);
      explained.outputs[0].amount.should.equal(testData.signedSendTransaction.recipient.amount);
      explained.outputs[0].address.should.equal(testData.signedSendTransaction.recipient.address);
      explained.changeOutputs.should.be.an.Array();
      explained.changeAmount.should.equal('0');
      should.exist(explained.id);
    });

    it('should explain a signed token send transaction', function () {
      const txBase64 = testData.signedTokenSendTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      explained.outputs.length.should.be.greaterThan(0);
      should.exist(explained.id);
    });

    it('should explain a single nominator withdraw transaction', function () {
      const txBase64 = testData.signedSingleNominatorWithdrawTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      should.exist(explained.id);
      explained.id.should.equal(testData.signedSingleNominatorWithdrawTransaction.txId);
      should.exist(explained.withdrawAmount);
      explained.withdrawAmount!.should.equal('932178112330000');
    });

    it('should explain a Ton Whales withdrawal transaction', function () {
      const txBase64 = testData.signedTonWhalesWithdrawalTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      should.exist(explained.id);
      should.exist(explained.withdrawAmount);
    });

    it('should explain a Ton Whales full withdrawal transaction', function () {
      const txBase64 = testData.signedTonWhalesFullWithdrawalTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      should.exist(explained.id);
    });

    it('should respect toAddressBounceable=false', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const bounceable = explainTonTransaction({ txBase64, toAddressBounceable: true });
      const nonBounceable = explainTonTransaction({ txBase64, toAddressBounceable: false });

      bounceable.outputs[0].address.should.equal(testData.signedSendTransaction.recipient.address);
      nonBounceable.outputs[0].address.should.equal(testData.signedSendTransaction.recipientBounceable.address);
    });
  });

  describe('WASM Transaction signing flow', function () {
    it('should produce correct signable payload from WASM Transaction', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const tx = WasmTonTransaction.fromBytes(Buffer.from(txBase64, 'base64'));
      const signablePayload = tx.signablePayload();

      signablePayload.should.be.instanceOf(Uint8Array);
      signablePayload.length.should.equal(32);

      const expectedSignable = Buffer.from(testData.signedSendTransaction.signable, 'base64');
      Buffer.from(signablePayload).toString('base64').should.equal(expectedSignable.toString('base64'));
    });

    it('should parse transaction and preserve bigint amounts', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const tx = WasmTonTransaction.fromBytes(Buffer.from(txBase64, 'base64'));
      const parsed = parseTransaction(tx);

      parsed.transactionType.should.equal('Transfer');
      parsed.sendActions.length.should.be.greaterThan(0);
      (typeof parsed.sendActions[0].amount).should.equal('bigint');
      parsed.seqno.should.be.a.Number();
      (typeof parsed.expireAt).should.equal('bigint');
    });

    it('should get transaction id', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const tx = WasmTonTransaction.fromBytes(Buffer.from(txBase64, 'base64'));
      tx.id.should.equal(testData.signedSendTransaction.txId);
    });

    it('should detect signed transaction via non-zero signature', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const tx = WasmTonTransaction.fromBytes(Buffer.from(txBase64, 'base64'));
      const parsed = parseTransaction(tx);

      parsed.signature.should.be.a.String();
      parsed.signature.length.should.be.greaterThan(0);
      parsed.signature.should.not.equal('0'.repeat(128));
    });
  });

  describe('WASM parseTransaction types', function () {
    it('should parse Transfer type', function () {
      const tx = WasmTonTransaction.fromBytes(Buffer.from(testData.signedSendTransaction.tx, 'base64'));
      parseTransaction(tx).transactionType.should.equal('Transfer');
    });

    it('should parse TokenTransfer type', function () {
      const tx = WasmTonTransaction.fromBytes(Buffer.from(testData.signedTokenSendTransaction.tx, 'base64'));
      parseTransaction(tx).transactionType.should.equal('TokenTransfer');
    });

    it('should parse SingleNominatorWithdraw type with correct withdrawAmount', function () {
      const tx = WasmTonTransaction.fromBytes(
        Buffer.from(testData.signedSingleNominatorWithdrawTransaction.tx, 'base64')
      );
      const parsed = parseTransaction(tx);
      parsed.transactionType.should.equal('SingleNominatorWithdraw');
      String(parsed.sendActions[0].withdrawAmount).should.equal('932178112330000');
    });

    it('should parse WhalesDeposit type', function () {
      const tx = WasmTonTransaction.fromBytes(Buffer.from(testData.signedTonWhalesDepositTransaction.tx, 'base64'));
      parseTransaction(tx).transactionType.should.equal('WhalesDeposit');
    });

    it('should parse WhalesWithdraw type', function () {
      const tx = WasmTonTransaction.fromBytes(Buffer.from(testData.signedTonWhalesWithdrawalTransaction.tx, 'base64'));
      parseTransaction(tx).transactionType.should.equal('WhalesWithdraw');
    });
  });
});
