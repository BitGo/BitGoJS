import crypto from 'crypto';
import algosdk from 'algosdk';
import { coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { AddressValidationError, TransferBuilder } from '../../../../../src/coin/algo';
import * as AlgoResources from '../../../../resources/algo';

describe('Algo Transfer Builder', () => {
  let builder: TransferBuilder;

  const sender = AlgoResources.accounts.account1;
  const receiver = AlgoResources.accounts.account2;

  beforeEach(() => {
    const config = coins.get('algo');
    builder = new TransferBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate receiver address is a valid algo address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.to({ address: 'wrong-addr' }),
        (e: Error) => e.name === AddressValidationError.name,
      );
      should.doesNotThrow(() => builder.to({ address: sender.address }));
      assert.calledTwice(spy);
    });

    it('should validate transfer amount', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.amount(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.amount(1000));
      assert.calledTwice(spy);
    });
  });

  describe('build transfer transaction', () => {
    it('should build a transfer transaction', async () => {
      builder
        .sender({ address: sender.address })
        .to({ address: receiver.address })
        .amount(10000)
        .isFlatFee(true)
        .fee({ fee: '22000' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(1)
        .sign({ key: sender.secretKey.toString('hex') });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 22000);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });

    it('should build an unsigned transfer transaction', async () => {
      const lease = new Uint8Array(crypto.randomBytes(32));
      const note = new Uint8Array(Buffer.from('note', 'utf-8'));
      builder
        .sender({ address: sender.address })
        .to({ address: receiver.address })
        .closeRemainderTo({ address: AlgoResources.accounts.account3.address })
        .amount(10000)
        .isFlatFee(true)
        .fee({ fee: '22000' })
        .firstRound(1)
        .lastRound(100)
        .lease(lease)
        .note(note)
        .testnet();
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(AlgoResources.rawTx.transfer.unsigned);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.transfer.unsigned);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });

    it('should build from raw signed tx', async () => {
      builder.from(AlgoResources.rawTx.transfer.signed);
      builder.numberOfSigners(1);
      builder.sign({ key: sender.secretKey.toString('hex') });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.transfer.signed);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });

    it('should sign from raw unsigned tx', async () => {
      builder.from(AlgoResources.rawTx.transfer.unsigned);
      builder.numberOfSigners(1);
      builder.sign({ key: sender.secretKey.toString('hex') });
      const tx = await builder.build();
      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.transfer.signed);
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });
  });

  describe('build multi-sig transfer transaction', () => {
    it('should build a msig transfer transaction', async () => {
      const msigAddress = algosdk.multisigAddress({
        version: 1,
        threshold: 2,
        addrs: [AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address],
      });
      builder
        .sender({ address: sender.address })
        .to({ address: receiver.address })
        .amount(10000)
        .isFlatFee(true)
        .fee({ fee: '22000' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(2)
        .sign({ key: AlgoResources.accounts.account1.secretKey.toString('hex') });
      builder.sign({ key: AlgoResources.accounts.account3.secretKey.toString('hex') });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 22000);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });
  });
});
