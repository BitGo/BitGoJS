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
  const {
    networks: { testnet },
  } = AlgoResources;
  const { genesisHash, genesisID } = testnet;
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
        .fee({ feeRate: '4' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(1)
        .sign({ key: sender.secretKey.toString('hex') });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 1000);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('should build an unsigned transfer transaction', async () => {
      const lease = new Uint8Array(crypto.randomBytes(32));
      const note = new Uint8Array(Buffer.from('note', 'utf-8'));
      builder
        .sender({ address: sender.address })
        .to({ address: receiver.address })
        .closeRemainderTo({ address: AlgoResources.accounts.account3.address })
        .amount(10000)
        .fee({ feeRate: '22000' })
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
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
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
        .fee({ feeRate: '90' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(2)
        .setSigners([AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address])
        .sign({ key: AlgoResources.accounts.account1.secretKey.toString('hex') });
      builder.sign({ key: AlgoResources.accounts.account3.secretKey.toString('hex') });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 21150);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });
    it('should build a half signed transfer transaction', async () => {
      const msigAddress = algosdk.multisigAddress({
        version: 1,
        threshold: 2,
        addrs: [AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address],
      });
      builder
        .sender({ address: sender.address })
        .to({ address: receiver.address })
        .amount(10000)
        .fee({ feeRate: '90' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(2)
        .setSigners([AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address])
        .sign({ key: AlgoResources.accounts.account1.secretKey.toString('hex') });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 21150);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });
    it('should sign a half signed transfer tx', async () => {
      const msigAddress = algosdk.multisigAddress({
        version: 1,
        threshold: 2,
        addrs: [AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address],
      });
      builder.from(AlgoResources.rawTx.transfer.halfSigned);
      builder
        .numberOfSigners(2)
        .setSigners([AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address])
        .sign({ key: AlgoResources.accounts.account3.secretKey.toString('hex') });
      const tx = await builder.build();
      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.transfer.multisig);
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 22000);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });

    it('should build a half signed transfer transaction with 3 signers', async () => {
      const addresses = [
        AlgoResources.accounts.account1.address,
        AlgoResources.accounts.account3.address,
        AlgoResources.accounts.account4.address,
      ];
      const numberOfSigners = 3;
      const msigAddress = algosdk.multisigAddress({
        version: 1,
        threshold: numberOfSigners,
        addrs: addresses,
      });
      builder
        .sender({ address: sender.address })
        .to({ address: receiver.address })
        .amount(10000)
        .fee({ feeRate: '90' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(numberOfSigners)
        .setSigners(addresses)
        .sign({ key: AlgoResources.accounts.account1.secretKey.toString('hex') });
      const tx1 = await builder.build();
      const builder2 = new TransferBuilder(coins.get('algo'));
      builder2.from(tx1.toBroadcastFormat());
      builder2
        .numberOfSigners(numberOfSigners)
        .setSigners(addresses)
        .sign({ key: AlgoResources.accounts.account3.secretKey.toString('hex') });
      const tx2 = await builder2.build();
      const builder3 = new TransferBuilder(coins.get('algo'));
      builder3.from(tx2.toBroadcastFormat());
      builder3
        .numberOfSigners(numberOfSigners)
        .setSigners(addresses)
        .sign({ key: AlgoResources.accounts.account4.secretKey.toString('hex') });
      const tx3 = await builder3.build();
      const txJson = tx3.toJson();
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 21150);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });
  });

  describe('fee flow test', () => {
    it('fee value should be updated when signing and building for the first the first time', async () => {
      builder
        .sender({ address: sender.address })
        .to({ address: receiver.address })
        .amount(10000)
        .fee({ feeRate: '500' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(1)
        .sign({ key: sender.secretKey.toString('hex') });

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.fee, 118500);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('fee value should be maintained when building an already signed transfer', async () => {
      const addresses = [
        AlgoResources.accounts.account1.address,
        AlgoResources.accounts.account3.address,
        AlgoResources.accounts.account4.address,
      ];
      const numberOfSigners = 3;
      const msigAddress = algosdk.multisigAddress({
        version: 1,
        threshold: numberOfSigners,
        addrs: addresses,
      });
      builder
        .sender({ address: sender.address })
        .to({ address: receiver.address })
        .amount(10000)
        .fee({ feeRate: '90' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(numberOfSigners)
        .setSigners(addresses)
        .sign({ key: AlgoResources.accounts.account1.secretKey.toString('hex') });

      const tx1 = await builder.build();
      const tx1Json = tx1.toJson();
      should.deepEqual(tx1Json.fee, 21150);
      should.deepEqual(tx1Json.from, msigAddress);
      should.deepEqual(tx1Json.to, receiver.address);
      should.deepEqual(tx1Json.amount, '10000');
      should.deepEqual(tx1Json.firstRound, 1);
      should.deepEqual(tx1Json.lastRound, 100);
      should.deepEqual(tx1Json.genesisID, genesisID.toString());
      should.deepEqual(tx1Json.genesisHash.toString('base64'), genesisHash);

      const builder2 = new TransferBuilder(coins.get('algo'));
      builder2.from(tx1.toBroadcastFormat());
      builder2
        .numberOfSigners(numberOfSigners)
        .setSigners(addresses)
        .sign({ key: AlgoResources.accounts.account3.secretKey.toString('hex') });

      const tx2 = await builder2.build();
      const tx2Json = tx2.toJson();
      should.deepEqual(tx2Json.fee, 21150);
      should.deepEqual(tx2Json.from, msigAddress);
      should.deepEqual(tx2Json.to, receiver.address);
      should.deepEqual(tx2Json.amount, '10000');
      should.deepEqual(tx2Json.firstRound, 1);
      should.deepEqual(tx2Json.lastRound, 100);
      should.deepEqual(tx2Json.genesisID, genesisID.toString());
      should.deepEqual(tx2Json.genesisHash.toString('base64'), genesisHash);

      const builder3 = new TransferBuilder(coins.get('algo'));
      builder3.from(tx2.toBroadcastFormat());
      builder3
        .numberOfSigners(numberOfSigners)
        .setSigners(addresses)
        .sign({ key: AlgoResources.accounts.account4.secretKey.toString('hex') });

      const tx3 = await builder3.build();
      const tx3Json = tx3.toJson();
      should.deepEqual(tx3Json.from, msigAddress);
      should.deepEqual(tx3Json.to, receiver.address);
      should.deepEqual(tx3Json.fee, 21150);
      should.deepEqual(tx3Json.amount, '10000');
      should.deepEqual(tx3Json.firstRound, 1);
      should.deepEqual(tx3Json.lastRound, 100);
      should.deepEqual(tx3Json.genesisID, genesisID.toString());
      should.deepEqual(tx3Json.genesisHash.toString('base64'), genesisHash);
    });
  });
});
