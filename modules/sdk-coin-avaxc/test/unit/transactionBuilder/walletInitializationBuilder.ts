import assert from 'assert';
import should from 'should';

import { TransactionType } from '@bitgo/sdk-core';
import * as testData from '../../resources/avaxc';
import { ETHTransactionType, TxData } from '@bitgo/sdk-coin-eth';
import { getBuilder } from '../getBuilder';
import { TransactionBuilder } from '../../../src';

describe('AvaxC Wallet Initialization Builder', function () {
  let txBuilder: TransactionBuilder;

  const initTxBuilder = (): void => {
    txBuilder = getBuilder('tavaxc') as TransactionBuilder;
    txBuilder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    txBuilder.counter(1);
    txBuilder.type(TransactionType.WalletInitialization);
  };

  describe('Avax C-Chain Wallet Initialization Transaction', () => {
    it('Should build walletInitialization', async () => {
      initTxBuilder();
      txBuilder.owner(testData.OWNER_1.ethAddress);
      txBuilder.owner(testData.OWNER_2.ethAddress);
      txBuilder.owner(testData.OWNER_3.ethAddress);
      txBuilder.sign({ key: testData.OWNER_1.ethKey });

      const tx = await txBuilder.build();
      const txJson: TxData = tx.toJson();

      tx.type.should.equal(TransactionType.WalletInitialization);
      txJson.gasLimit.should.equal('7000000');
      txJson._type.should.equals(ETHTransactionType.LEGACY);
      txJson.gasPrice!.should.equal('280000000000');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId!, '0xa869');
      should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
    });

    it('Should build with counter 0 if not manually defined', async () => {
      txBuilder = getBuilder('tavaxc') as TransactionBuilder;
      txBuilder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      txBuilder.type(TransactionType.WalletInitialization);

      txBuilder.owner(testData.OWNER_1.ethAddress);
      txBuilder.owner(testData.OWNER_2.ethAddress);
      txBuilder.owner(testData.OWNER_3.ethAddress);
      txBuilder.sign({ key: testData.OWNER_1.ethKey });

      const tx = await txBuilder.build();
      const txJson: TxData = tx.toJson();

      tx.type.should.equal(TransactionType.WalletInitialization);
      txJson.gasLimit.should.equal('7000000');
      txJson._type.should.equals(ETHTransactionType.LEGACY);
      txJson.gasPrice!.should.equal('280000000000');
      should.equal(txJson.chainId!, '0xa869');
      should.equal(txJson.v, '0x0150f5');
      should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST_ZERO_NONCE);
    });

    it('Should throw if building walletInitialization without fee', async function () {
      txBuilder = getBuilder('tavaxc') as TransactionBuilder;
      txBuilder.counter(1);
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.counter(1);
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.owner(testData.OWNER_1.ethAddress);
      txBuilder.owner(testData.OWNER_2.ethAddress);
      txBuilder.owner(testData.OWNER_3.ethAddress);
      txBuilder.sign({ key: testData.OWNER_1.ethKey });

      txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('Should throw if building walletInitialization without type', async function () {
      txBuilder = getBuilder('tavaxc') as TransactionBuilder;
      txBuilder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      txBuilder.counter(1);
      assert.throws(
        () => txBuilder.owner(testData.OWNER_1.ethAddress),
        (e: any) => e.message === 'Multisig wallet owner can only be set for initialization transactions'
      );
    });

    it('Should throw if building walletInitialization without owners', async function () {
      initTxBuilder();
      txBuilder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      txBuilder.counter(1);
      txBuilder.type(TransactionType.WalletInitialization);
      assert.throws(
        () => txBuilder.sign({ key: testData.OWNER_1.ethKey }),
        (e: any) => e.message === 'Cannot sign an wallet initialization transaction without owners'
      );
    });

    it('Should throw if building walletInitialization with only one owner', async function () {
      initTxBuilder();
      txBuilder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      txBuilder.counter(1);
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.owner(testData.OWNER_1.ethAddress);
      txBuilder.sign({ key: testData.OWNER_1.ethKey });

      txBuilder.build().should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 1');
    });

    it('Should throw if building walletInitialization with only two owners', async function () {
      initTxBuilder();
      txBuilder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      txBuilder.counter(1);
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.owner(testData.OWNER_1.ethAddress);
      txBuilder.owner(testData.OWNER_2.ethAddress);
      txBuilder.sign({ key: testData.OWNER_1.ethKey });

      txBuilder.build().should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 2');
    });

    it('Should getting same tx from raw tx', async function () {
      initTxBuilder();
      txBuilder.owner(testData.OWNER_1.ethAddress);
      txBuilder.owner(testData.OWNER_2.ethAddress);
      txBuilder.owner(testData.OWNER_3.ethAddress);
      txBuilder.sign({ key: testData.OWNER_1.ethKey });
      const tx = await txBuilder.build();
      const txBuiderFromRaw = getBuilder('tavaxc') as TransactionBuilder;
      txBuiderFromRaw.from(tx.toBroadcastFormat());
      const txFromRaw = await txBuiderFromRaw.build();
      should.deepEqual(tx.toJson(), txFromRaw.toJson());
      should.deepEqual(tx.toBroadcastFormat(), txFromRaw.toBroadcastFormat());
      should.deepEqual(tx.id, txFromRaw.id);
    });

    it('Should build tx with final v', async function () {
      initTxBuilder();
      txBuilder.owner(testData.OWNER_1.ethAddress);
      txBuilder.owner(testData.OWNER_2.ethAddress);
      txBuilder.owner(testData.OWNER_3.ethAddress);
      const tx = await txBuilder.build();
      should.deepEqual(tx.toJson().v, '0x0150f5');
    });
  });
});
