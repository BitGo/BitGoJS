import crypto from 'crypto';
import algosdk from 'algosdk';
import { coins } from '@bitgo/statics';
import should, { throws } from 'should';
import sinon, { assert } from 'sinon';
import { AddressValidationError, TransferBuilder } from '../../../../../src/coin/algo';
import * as AlgoResources from '../../../../resources/algo';

describe('Algo Transfer Builder', () => {
  let builder: TransferBuilder;

  const sender = AlgoResources.accounts.account1;
  const receiver = AlgoResources.accounts.account2;
  const ALGOTXNLENGTH = 52;
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
        .isFlatFee(true)
        .fee({ fee: '22000' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(1)
        .sign({ key: sender.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 22000);
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
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(AlgoResources.rawTx.transfer.unsigned);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('base64'), AlgoResources.rawTx.transfer.unsigned);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });
    it('should fail building from raw unsigned tx, due this has lease = 0', async () => {
      const unsignedTxnWithLeaseZero =
        '8ba3616d74cd2710a5636c6f7365c420fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025a3666565cd55f0a2667601a367656eac746573746e65742d76312e30a26768c4204863b518a4b3c84ec810f22d4f1081cb0f71f059a7ac20dec62f7f70e5093a22a26c7664a46e6f7465c4046e6f7465a3726376c4203d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660ca3736e64c420d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511aa474797065a3706179';
      builder.from(unsignedTxnWithLeaseZero);
      try {
        await builder.build();
      } catch (e) {
        throws(e, 'lease must be of length 32');
      }
    });

    it('should build from raw signed tx', async () => {
      builder.from(AlgoResources.rawTx.transfer.signed);
      builder.numberOfSigners(1);
      builder.sign({ key: sender.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.equal(txJson.id.toString().length, ALGOTXNLENGTH);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
    });

    it('should sign from raw unsigned tx', async () => {
      builder.from(AlgoResources.rawTx.transfer.unsigned);
      builder.numberOfSigners(1);
      builder.sign({ key: sender.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.equal(txJson.id.toString().length, ALGOTXNLENGTH);
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
        .setSigners([AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address])
        .sign({ key: AlgoResources.accounts.account1.prvKey });
      builder.sign({ key: AlgoResources.accounts.account3.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 22000);
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
        .isFlatFee(true)
        .fee({ fee: '22000' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(2)
        .setSigners([AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address])
        .sign({ key: AlgoResources.accounts.account1.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 22000);
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
        .sign({ key: AlgoResources.accounts.account3.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('base64'), AlgoResources.rawTx.transfer.multisig);
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
        .isFlatFee(true)
        .fee({ fee: '22000' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(numberOfSigners)
        .setSigners(addresses)
        .sign({ key: AlgoResources.accounts.account1.prvKey });
      const tx1 = await builder.build();
      const builder2 = new TransferBuilder(coins.get('algo'));
      builder2.from(tx1.toBroadcastFormat());
      builder2
        .numberOfSigners(numberOfSigners)
        .setSigners(addresses)
        .sign({ key: AlgoResources.accounts.account3.prvKey });
      const tx2 = await builder2.build();
      const builder3 = new TransferBuilder(coins.get('algo'));
      builder3.from(tx2.toBroadcastFormat());

      builder3
        .numberOfSigners(numberOfSigners)
        .setSigners(addresses)
        .sign({ key: AlgoResources.accounts.account4.prvKey });
      const tx3 = await builder3.build();
      const txJson = tx3.toJson();
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, 22000);
      should.deepEqual(txJson.amount, '10000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });
  });
});
