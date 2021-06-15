import { coins } from '@bitgo/statics';
import should from 'should';
import { test } from 'mocha';
import { AssetTransferBuilder, TransactionBuilderFactory } from '../../../../../src/coin/algo';

import * as AlgoResources from '../../../../resources/algo';

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
      should.throws(() => txnBuilder.tokenId(-1));
      should.throws(() => txnBuilder.tokenId(0));
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

      txnBuilder.numberOfSigners(1).sign({ key: account1.secretKey.toString('hex') });
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
      should.throws(() => txnBuilder.from(rawTx.keyReg.unsigned));
      should.throws(() => txnBuilder.from(rawTx.keyReg.signed));
      should.throws(() => txnBuilder.from(rawTx.transfer.unsigned));
      should.throws(() => txnBuilder.from(rawTx.transfer.signed));
    });
  });

  describe('allowlist asset txn', () => {
    test('allowlist parameters are set correctly', async () => {
      const tokenId = 123;
      const sender = account1.address;

      txnBuilder
        .allowListAsset(tokenId, { address: sender })
        .firstRound(1)
        .lastRound(10)
        .testnet()
        .numberOfRequiredSigners(1);

      txnBuilder.sign({ key: account1.secretKey.toString('hex') });

      const tx = await txnBuilder.build();
      const txJson = tx.toJson();

      should.equal(txJson.from, account1.address);
      should.equal(txJson.to, account1.address);
      should.equal(txJson.tokenId, tokenId);
      should.equal(txJson.fee, 1000);
    });
  });
});
