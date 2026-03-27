import assert from 'assert';
import should from 'should';
import { Transaction as WasmTonTransaction, parseTransaction } from '@bitgo/wasm-ton';
import { explainTonTransaction } from '../../src/lib/explainTransactionWasm';
import { TransactionType } from '@bitgo/sdk-core';
import * as testData from '../resources/ton';

describe('TON WASM explainTransaction', function () {
  describe('explainTonTransaction', function () {
    it('should explain a signed send transaction', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      explained.type.should.equal(TransactionType.Send);
      explained.outputs.length.should.be.greaterThan(0);
      explained.outputs[0].amount.should.equal(testData.signedSendTransaction.recipient.amount);
      explained.changeOutputs.should.be.an.Array();
      explained.changeAmount.should.equal('0');
      should.exist(explained.id);
      should.exist(explained.sender);
      explained.isSigned.should.be.true();
    });

    it('should explain a signed token send transaction', function () {
      const txBase64 = testData.signedTokenSendTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      explained.type.should.equal(TransactionType.SendToken);
      explained.outputs.length.should.be.greaterThan(0);
      should.exist(explained.id);
      should.exist(explained.sender);
    });

    it('should explain a single nominator withdraw transaction', function () {
      const txBase64 = testData.signedSingleNominatorWithdrawTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      explained.type.should.equal(TransactionType.SingleNominatorWithdraw);
      should.exist(explained.id);
      should.exist(explained.sender);
    });

    it('should explain a Ton Whales deposit transaction', function () {
      const txBase64 = testData.signedTonWhalesDepositTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      explained.type.should.equal(TransactionType.TonWhalesDeposit);
      should.exist(explained.id);
      should.exist(explained.sender);
    });

    it('should explain a Ton Whales withdrawal transaction', function () {
      const txBase64 = testData.signedTonWhalesWithdrawalTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      explained.type.should.equal(TransactionType.TonWhalesWithdrawal);
      should.exist(explained.id);
      should.exist(explained.sender);
      should.exist(explained.withdrawAmount);
    });

    it('should explain a Ton Whales full withdrawal transaction', function () {
      const txBase64 = testData.signedTonWhalesFullWithdrawalTransaction.tx;
      const explained = explainTonTransaction({ txBase64 });

      explained.type.should.equal(TransactionType.TonWhalesWithdrawal);
      should.exist(explained.id);
      should.exist(explained.sender);
    });
  });

  describe('WASM Transaction signing flow', function () {
    it('should produce correct signable payload from WASM Transaction', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const tx = WasmTonTransaction.fromBytes(Buffer.from(txBase64, 'base64'));
      const signablePayload = tx.signablePayload();

      signablePayload.should.be.instanceOf(Uint8Array);
      signablePayload.length.should.equal(32);

      // Compare against known signable from test fixtures
      const expectedSignable = Buffer.from(testData.signedSendTransaction.signable, 'base64');
      Buffer.from(signablePayload).toString('base64').should.equal(expectedSignable.toString('base64'));
    });

    it('should parse transaction and preserve bigint amounts', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const tx = WasmTonTransaction.fromBytes(Buffer.from(txBase64, 'base64'));
      const parsed = parseTransaction(tx);

      parsed.type.should.equal('Transfer');
      should.exist(parsed.amount);
      (typeof parsed.amount).should.equal('bigint');
      parsed.seqno.should.be.a.Number();
      parsed.expireTime.should.be.a.Number();
    });

    it('should get transaction id', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const tx = WasmTonTransaction.fromBytes(Buffer.from(txBase64, 'base64'));
      const id = tx.id;

      should.exist(id);
      id.should.be.a.String();
      id.length.should.be.greaterThan(0);
    });

    it('should report isSigned correctly', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const tx = WasmTonTransaction.fromBytes(Buffer.from(txBase64, 'base64'));

      tx.isSigned.should.be.true();
    });
  });

  describe('WASM parseTransaction types', function () {
    it('should parse Transfer type', function () {
      const tx = WasmTonTransaction.fromBytes(Buffer.from(testData.signedSendTransaction.tx, 'base64'));
      const parsed = parseTransaction(tx);
      parsed.type.should.equal('Transfer');
    });

    it('should parse TokenTransfer type', function () {
      const tx = WasmTonTransaction.fromBytes(Buffer.from(testData.signedTokenSendTransaction.tx, 'base64'));
      const parsed = parseTransaction(tx);
      parsed.type.should.equal('TokenTransfer');
    });

    it('should parse SingleNominatorWithdraw type', function () {
      const tx = WasmTonTransaction.fromBytes(
        Buffer.from(testData.signedSingleNominatorWithdrawTransaction.tx, 'base64')
      );
      const parsed = parseTransaction(tx);
      parsed.type.should.equal('SingleNominatorWithdraw');
    });

    it('should parse WhalesDeposit type', function () {
      const tx = WasmTonTransaction.fromBytes(Buffer.from(testData.signedTonWhalesDepositTransaction.tx, 'base64'));
      const parsed = parseTransaction(tx);
      parsed.type.should.equal('WhalesDeposit');
    });

    it('should parse WhalesWithdraw type', function () {
      const tx = WasmTonTransaction.fromBytes(Buffer.from(testData.signedTonWhalesWithdrawalTransaction.tx, 'base64'));
      const parsed = parseTransaction(tx);
      parsed.type.should.equal('WhalesWithdraw');
    });
  });
});
