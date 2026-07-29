import { coins } from '@bitgo/statics';
import assert from 'assert';
import should from 'should';
import { test } from 'mocha';
import { AssetTransferBuilder, TransactionBuilderFactory } from '../../../../src/lib';

import * as AlgoResources from '../../../fixtures/resources';

describe('Algo Asset Transfer Transaction Builder', () => {
  let txnBuilder: AssetTransferBuilder;

  const {
    accounts: { account1 },
    rawTx,
  } = AlgoResources;

  beforeEach(() => {
    const config = coins.get('algo');
    txnBuilder = new TransactionBuilderFactory(config).getAssetTransferBuilder();
  });

  describe('setter validation', () => {
    it('should validate asset id is not lte 0', () => {
      assert.throws(() => txnBuilder.tokenId(-1));
      assert.throws(() => txnBuilder.tokenId(0));
      should.doesNotThrow(() => txnBuilder.tokenId(1));
    });
  });

  describe('build asset transfer transaction', () => {
    it('should build a normal asset transfer transaction', async () => {
      const sender = AlgoResources.accounts.account1;
      const receiver = AlgoResources.accounts.account2;
      const amount = 1234;
      const firstRound = 1;
      const lastRound = 10;
      const fee = 1000;
      const tokenId = 1;
      const {
        networks: { testnet },
      } = AlgoResources;
      const { genesisHash, genesisID } = testnet;

      const tx = await txnBuilder
        .fee({ fee: fee.toString() })
        .isFlatFee(true)
        .firstRound(firstRound)
        .lastRound(lastRound)
        .testnet()
        .sender({ address: sender.address })
        .tokenId(tokenId)
        .amount(amount)
        .to({ address: receiver.address })
        .build();
      const txJson = tx.toJson();

      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.fee, fee);
      should.deepEqual(txJson.firstRound, firstRound);
      should.deepEqual(txJson.lastRound, lastRound);
      should.deepEqual(txJson.tokenId, tokenId);
      should.deepEqual(txJson.amount, amount.toString());
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });

    it('should build a valid disable token transaction', async function () {
      const firstRound = 167;
      const lastRound = 1167;
      const fee = 1000;
      const tokenId = 1;
      const amount = '0';
      const note = new Uint8Array(Buffer.from('note', 'utf-8'));
      const address = 'RIJVLDYWASZZNGOSQNOK7HN6JNFLMMZ3FFBBFG2NNROM5CE744DAJSPZJ4';
      const closeRemainderTo = 'SP745JJR4KPRQEXJZHVIEN736LYTL2T2DFMG3OIIFJBV66K73PHNMDCZVM';

      const tx = await txnBuilder
        .fee({ fee: fee.toString() })
        .isFlatFee(true)
        .firstRound(firstRound)
        .lastRound(lastRound)
        .testnet()
        .closeRemainderTo({ address: closeRemainderTo })
        .sender({ address: address })
        .tokenId(tokenId)
        .amount(BigInt(amount))
        .to({ address: address })
        .note(note)
        .build();

      const txHex = tx.toBroadcastFormat();
      const txInfo = tx.toJson();

      should.exists(txHex);

      txInfo.to.should.equal(address);
      txInfo.from.should.equal(address);
      txInfo.closeRemainderTo.should.equal(closeRemainderTo);
      txInfo.amount.should.equal('0');
      txInfo.firstRound.should.equal(167);
      txInfo.tokenId.should.equal(1);
      txInfo.fee.should.equal(1000);
      txInfo.note.should.equal(note);
      txInfo.lastRound.should.equal(1167);
      txInfo.genesisID.should.equal('testnet-v1.0');
      txInfo.genesisHash.should.equal('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=');
    });

    it('should not build a token transaction with an invalid sender address', async function () {
      const wrongAddress = 'RIJVLDYWASZZNGOSQNOK7HN6JNFLMMZ3FFBBFG2NNROM5CE744DAJSPZJ';
      const tx = await txnBuilder.testnet();
      assert.throws(
        () => tx.sender({ address: wrongAddress }),
        new RegExp("The address '" + wrongAddress + "' is not a well-formed algorand address")
      );
    });

    it('should not build a token transaction with an invalid closeRemainderTo address', async function () {
      const wrongAddress = 'RIJVLDYWASZZNGOSQNOK7HN6JNFLMMZ3FFBBFG2NNROM5CE744DAJSPZJ';
      const tx = await txnBuilder.testnet();
      assert.throws(
        () => tx.closeRemainderTo({ address: wrongAddress }),
        new RegExp("The address '" + wrongAddress + "' is not a well-formed algorand address")
      );
    });

    it('should not build a token transaction with an invalid to address', async function () {
      const wrongAddress = 'RIJVLDYWASZZNGOSQNOK7HN6JNFLMMZ3FFBBFG2NNROM5CE744DAJSPZJ';
      const tx = await txnBuilder.testnet();
      assert.throws(
        () => tx.to({ address: wrongAddress }),
        new RegExp("The address '" + wrongAddress + "' is not a well-formed algorand address")
      );
    });

    it('should build a valid enable token transaction', async function () {
      const firstRound = 167;
      const lastRound = 1167;
      const fee = 1000;
      const tokenId = 1;
      const amount = '0';
      const address = 'RIJVLDYWASZZNGOSQNOK7HN6JNFLMMZ3FFBBFG2NNROM5CE744DAJSPZJ4';

      const tx = await txnBuilder
        .fee({ fee: fee.toString() })
        .isFlatFee(true)
        .firstRound(firstRound)
        .lastRound(lastRound)
        .testnet()
        .sender({ address: address })
        .tokenId(tokenId)
        .amount(BigInt(amount))
        .to({ address: address })
        .build();

      const txHex = tx.toBroadcastFormat();
      const txInfo = tx.toJson();

      should.exists(txHex);

      txInfo.to.should.equal(address);
      txInfo.from.should.equal(address);
      txInfo.amount.should.equal('0');
      txInfo.firstRound.should.equal(167);
      txInfo.tokenId.should.equal(1);
      txInfo.fee.should.equal(1000);
      txInfo.lastRound.should.equal(1167);
      txInfo.genesisID.should.equal('testnet-v1.0');
      txInfo.genesisHash.should.equal('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=');
    });

    it('should build a valid enable token transaction and re-calcualte minimum fee', async function () {
      const firstRound = 167;
      const lastRound = 1167;
      const fee = 1000;
      const tokenId = 1;
      const amount = '0';
      const address = 'RIJVLDYWASZZNGOSQNOK7HN6JNFLMMZ3FFBBFG2NNROM5CE744DAJSPZJ4';

      const tx = await txnBuilder
        .fee({ fee: fee.toString() })
        .isFlatFee(true)
        .firstRound(firstRound)
        .lastRound(lastRound)
        .testnet()
        .sender({ address: address })
        .tokenId(tokenId)
        .amount(BigInt(amount))
        .to({ address: address })
        .build();

      const txHex = tx.toBroadcastFormat();
      const txInfo = tx.toJson();

      should.exists(txHex);

      txInfo.to.should.equal(address);
      txInfo.from.should.equal(address);
      txInfo.amount.should.equal('0');
      txInfo.firstRound.should.equal(167);
      txInfo.tokenId.should.equal(1);
      txInfo.fee.should.equal(1000);
      txInfo.lastRound.should.equal(1167);
      txInfo.genesisID.should.equal('testnet-v1.0');
      txInfo.genesisHash.should.equal('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=');
    });

    it('should build a valid disable token transaction and re-calcualte minimum fee', async function () {
      const firstRound = 167;
      const lastRound = 1167;
      const fee = 1000;
      const tokenId = 1;
      const closeRemainderTo = 'SP745JJR4KPRQEXJZHVIEN736LYTL2T2DFMG3OIIFJBV66K73PHNMDCZVM';
      const amount = '0';
      const address = 'RIJVLDYWASZZNGOSQNOK7HN6JNFLMMZ3FFBBFG2NNROM5CE744DAJSPZJ4';

      const tx = await txnBuilder
        .fee({ fee: fee.toString() })
        .isFlatFee(true)
        .firstRound(firstRound)
        .lastRound(lastRound)
        .testnet()
        .closeRemainderTo({ address: closeRemainderTo })
        .sender({ address: address })
        .tokenId(tokenId)
        .amount(BigInt(amount))
        .to({ address: address })
        .build();

      const txHex = tx.toBroadcastFormat();
      const txInfo = tx.toJson();

      should.exists(txHex);

      txInfo.to.should.equal(address);
      txInfo.from.should.equal(address);
      txInfo.amount.should.equal('0');
      txInfo.firstRound.should.equal(167);
      txInfo.tokenId.should.equal(1);
      txInfo.fee.should.equal(1000);
      txInfo.closeRemainderTo.should.equal(closeRemainderTo);
      txInfo.lastRound.should.equal(1167);
      txInfo.genesisID.should.equal('testnet-v1.0');
      txInfo.genesisHash.should.equal('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=');
    });

    it('should decode an unsigned asset transfer transaction', async () => {
      txnBuilder.from(rawTx.assetTransfer.unsigned);
      const tx = await txnBuilder.build();
      const txJson = tx.toJson();

      const sender = AlgoResources.accounts.account1;
      const receiver = AlgoResources.accounts.account2;

      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.assetTransfer.unsigned);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '1000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 10);
      should.deepEqual(txJson.tokenId, 1);
    });

    it('should decode a signed asset transfer transaction', async () => {
      txnBuilder.from(rawTx.assetTransfer.signed);

      txnBuilder.numberOfSigners(1).sign({ key: account1.prvKey });
      const tx = await txnBuilder.build();
      const txJson = tx.toJson();

      const sender = AlgoResources.accounts.account1;
      const receiver = AlgoResources.accounts.account2;

      should.deepEqual(Buffer.from(tx.toBroadcastFormat()).toString('hex'), AlgoResources.rawTx.assetTransfer.signed);
      should.deepEqual(txJson.from, sender.address);
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.amount, '10000000000000000000');
      should.deepEqual(txJson.firstRound, 1);
      should.deepEqual(txJson.lastRound, 10);
      should.deepEqual(txJson.tokenId, 1);
    });

    it('should fail to decode other types of transactions', () => {
      assert.throws(() => txnBuilder.from(rawTx.keyReg.unsigned), /Invalid Transaction Type: keyreg. Expected axfer/);
      assert.throws(() => txnBuilder.from(rawTx.keyReg.signed), /Invalid Transaction Type: keyreg. Expected axfer/);
      assert.throws(() => txnBuilder.from(rawTx.transfer.unsigned), /Invalid Transaction Type: pay. Expected axfer/);
      assert.throws(() => txnBuilder.from(rawTx.transfer.signed), /Invalid Transaction Type: pay. Expected axfer/);
    });
  });

  describe('allowlist asset txn', () => {
    test('allowlist parameters are set correctly', async () => {
      const tokenId = 123;
      const sender = account1.address;
      const {
        networks: { testnet },
      } = AlgoResources;
      const { genesisHash, genesisID } = testnet;
      txnBuilder
        .allowListAsset(tokenId, { address: sender })
        .firstRound(1)
        .lastRound(10)
        .testnet()
        .numberOfRequiredSigners(1);

      txnBuilder.sign({ key: account1.prvKey });

      const tx = await txnBuilder.build();
      const txJson = tx.toJson();

      should.equal(txJson.from, account1.address);
      should.equal(txJson.to, account1.address);
      should.equal(txJson.tokenId, tokenId);
      should.equal(txJson.fee, 1000);
      should.deepEqual(txJson.genesisID, genesisID.toString());
      should.deepEqual(txJson.genesisHash.toString('base64'), genesisHash);
    });
  });
});
