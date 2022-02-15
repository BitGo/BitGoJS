import { coins } from '@bitgo/statics';
import algosdk from 'algosdk';
import should from 'should';
import sinon, { assert } from 'sinon';
import { Transaction } from '../../../../../src/coin/algo';
import { KeyRegistrationBuilder } from '../../../../../src/coin/algo/keyRegistrationBuilder';

import * as AlgoResources from '../../../../resources/algo';

class StubTransactionBuilder extends KeyRegistrationBuilder {
  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Algo KeyRegistration Builder', () => {
  const {
    networks: { testnet },
  } = AlgoResources;
  const { genesisHash, genesisID } = testnet;
  let builder: StubTransactionBuilder;

  const sender = AlgoResources.accounts.account1;
  const { rawTx } = AlgoResources;

  beforeEach(() => {
    const config = coins.get('algo');
    builder = new StubTransactionBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate voteKey, is set and is a valid string', () => {
      should.doesNotThrow(() => builder.voteKey(sender.voteKey));
    });

    it('should validate selection key, is set and is a valid string', () => {
      should.doesNotThrow(() => builder.selectionKey(sender.selectionKey));
    });

    it('should validate voteFirst is gt than 0', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.voteFirst(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.voteFirst(15));
      assert.calledTwice(spy);
    });

    it('should validate voteLast is gt than 0', () => {
      const validateValueSpy = sinon.spy(builder, 'validateValue');
      builder.voteFirst(1);
      should.throws(
        () => builder.voteLast(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.voteLast(15));
      assert.calledThrice(validateValueSpy);
    });

    it('should validate vote Key Dilution', () => {
      const validateValueSpy = sinon.spy(builder, 'validateValue');
      builder.voteFirst(5).voteLast(18);
      should.doesNotThrow(() => builder.voteKeyDilution(2));
      assert.calledThrice(validateValueSpy);
    });
  });

  describe('transaction validation', () => {
    beforeEach(() => {
      builder.sender({ address: sender.address }).fee({ fee: '1000' }).firstRound(1).lastRound(100).testnet();
    });
    it('should validate a normal transaction', () => {
      builder.voteKey(sender.voteKey).selectionKey(sender.selectionKey).voteFirst(1).voteLast(100).voteKeyDilution(9);
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });
  });

  describe('build key registration transaction', () => {
    it('should build a key registration transaction', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .testnet()
        .numberOfSigners(1);
      builder.sign({ key: sender.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => builder.validateKey({ key: txJson.voteKey }));
      should.deepEqual(txJson.voteKey.toString('base64'), sender.voteKey);
      should.doesNotThrow(() => builder.validateKey({ key: txJson.selectionKey }));
      should.deepEqual(txJson.selectionKey.toString('base64'), sender.selectionKey);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, 1);
      should.deepEqual(txJson.voteLast, 100);
      should.deepEqual(txJson.voteKeyDilution, 9);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('should build a offline key registration transaction without non participation', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(1)
        .nonParticipation(false);
      builder.sign({ key: sender.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.voteKey, undefined);
      should.deepEqual(txJson.selectionKey, undefined);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, undefined);
      should.deepEqual(txJson.voteLast, undefined);
      should.deepEqual(txJson.voteKeyDilution, undefined);
      should.deepEqual(txJson.nonParticipation, undefined);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('should build a key registration transaction with non participation', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .testnet()
        .numberOfSigners(1)
        .nonParticipation(true);
      builder.sign({ key: sender.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.voteKey, undefined);
      should.deepEqual(txJson.selectionKey, undefined);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, undefined);
      should.deepEqual(txJson.voteLast, undefined);
      should.deepEqual(txJson.voteKeyDilution, undefined);
      should.deepEqual(txJson.nonParticipation, true);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('build a offline key registration transaction without non participation should thrown an error when does not have fee', async () => {
      builder
        .sender({ address: sender.address })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(1)
        .nonParticipation(false);
      builder.sign({ key: sender.prvKey });
      await builder.build().should.be.rejectedWith('Transaction validation failed: "fee" is required');
    });

    it('build a offline key registration transaction without non participation should thrown an error when does not have first round', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .lastRound(100)
        .testnet()
        .numberOfSigners(1)
        .nonParticipation(false);
      builder.sign({ key: sender.prvKey });
      await builder.build().should.be.rejectedWith('Transaction validation failed: "firstRound" is required');
    });

    it('build a offline key registration transaction without non participation should thrown an error when does not have last round', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .testnet()
        .numberOfSigners(1)
        .nonParticipation(false);
      builder.sign({ key: sender.prvKey });
      await builder.build().should.be.rejectedWith('Transaction validation failed: "lastRound" is required');
    });

    it('build a offline key registration transaction without non participation should thrown an error when does not have testnet set', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .numberOfSigners(1)
        .nonParticipation(false);
      builder.sign({ key: sender.prvKey });
      await builder.build().should.be.rejectedWith('Transaction validation failed: "genesisHash" is required');
    });

    it('should build an unsigned offline key registration transaction', async () => {
      builder.sender({ address: sender.address }).fee({ fee: '1000' }).firstRound(1).lastRound(100).testnet();
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('build a key registration transaction with non participation should thrown an error when does not have fee', async () => {
      builder
        .sender({ address: sender.address })
        .firstRound(1)
        .lastRound(100)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .testnet()
        .numberOfSigners(1)
        .nonParticipation(true);
      builder.sign({ key: sender.prvKey });
      await builder.build().should.be.rejectedWith('Transaction validation failed: "fee" is required');
    });

    it('build a key registration transaction with non participation should thrown an error when does not have first round', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .lastRound(100)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .testnet()
        .numberOfSigners(1)
        .nonParticipation(true);
      builder.sign({ key: sender.prvKey });
      await builder.build().should.be.rejectedWith('Transaction validation failed: "firstRound" is required');
    });

    it('build a key registration transaction with non participation should thrown an error when does not have last round', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .testnet()
        .numberOfSigners(1)
        .nonParticipation(true);
      builder.sign({ key: sender.prvKey });
      await builder.build().should.be.rejectedWith('Transaction validation failed: "lastRound" is required');
    });

    it('build a key registration transaction with non participation should thrown an error when does not have testnet set', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .numberOfSigners(1)
        .nonParticipation(true);
      builder.sign({ key: sender.prvKey });
      await builder.build().should.be.rejectedWith('Transaction validation failed: "genesisHash" is required');
    });

    it('should build a key registration transaction with non participation without vote parameters', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .testnet()
        .numberOfSigners(1)
        .nonParticipation(true);
      builder.sign({ key: sender.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.voteKey, undefined);
      should.deepEqual(txJson.selectionKey, undefined);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, undefined);
      should.deepEqual(txJson.voteLast, undefined);
      should.deepEqual(txJson.voteKeyDilution, undefined);
      should.deepEqual(txJson.nonParticipation, true);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('should build an unsigned key registration transaction', async () => {
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .testnet();
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => builder.validateKey({ key: txJson.voteKey }));
      should.deepEqual(txJson.voteKey.toString('base64'), sender.voteKey);
      should.doesNotThrow(() => builder.validateKey({ key: txJson.selectionKey }));
      should.deepEqual(txJson.selectionKey.toString('base64'), sender.selectionKey);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, 1);
      should.deepEqual(txJson.voteLast, 100);
      should.deepEqual(txJson.voteKeyDilution, 9);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('should build a trx from an unsigned raw transaction', async () => {
      builder.from(rawTx.keyReg.unsigned);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => builder.validateKey({ key: txJson.voteKey }));
      should.deepEqual(txJson.voteKey.toString('base64'), sender.voteKey);
      should.doesNotThrow(() => builder.validateKey({ key: txJson.selectionKey }));
      should.deepEqual(txJson.selectionKey.toString('base64'), sender.selectionKey);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, 1);
      should.deepEqual(txJson.voteLast, 100);
      should.deepEqual(txJson.voteKeyDilution, 9);
    });

    it('should sign from raw unsigned tx', async () => {
      builder.from(rawTx.keyReg.unsigned);
      builder.numberOfSigners(1);
      builder.sign({ key: sender.prvKey });
      const tx = await builder.build();
      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.keyReg.signed);
      const txJson = tx.toJson();
      should.doesNotThrow(() => builder.validateKey({ key: txJson.voteKey }));
      should.deepEqual(txJson.voteKey.toString('base64'), sender.voteKey);
      should.doesNotThrow(() => builder.validateKey({ key: txJson.selectionKey }));
      should.deepEqual(txJson.selectionKey.toString('base64'), sender.selectionKey);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, 1);
      should.deepEqual(txJson.voteLast, 100);
      should.deepEqual(txJson.voteKeyDilution, 9);
    });
  });

  describe('build multi-sig key registration transaction', () => {
    it('should build a msig registration transaction', async () => {
      const msigAddress = algosdk.multisigAddress({
        version: 1,
        threshold: 2,
        addrs: [AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address],
      });
      builder
        .sender({ address: sender.address })
        .fee({ fee: '1000' })
        .firstRound(1)
        .lastRound(100)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .testnet()
        .numberOfSigners(2)
        .setSigners([AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address])
        .sign({ key: AlgoResources.accounts.account1.prvKey });
      builder.sign({ key: AlgoResources.accounts.account3.prvKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => builder.validateKey({ key: txJson.voteKey }));
      should.deepEqual(txJson.voteKey.toString('base64'), sender.voteKey);
      should.doesNotThrow(() => builder.validateKey({ key: txJson.selectionKey }));
      should.deepEqual(txJson.selectionKey.toString('base64'), sender.selectionKey);
      should.deepEqual(txJson.from, msigAddress);
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 100);
      should.deepEqual(txJson.voteFirst, 1);
      should.deepEqual(txJson.voteLast, 100);
      should.deepEqual(txJson.voteKeyDilution, 9);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });
  });
});
