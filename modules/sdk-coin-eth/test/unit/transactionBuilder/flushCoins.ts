import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { ETHTransactionType, Fee, flushCoinsMethodId, KeyPair, Transaction, TransactionBuilder } from '../../../src';
import { getBuilder } from '../getBuilder';

describe('Eth Transaction builder flush native coins', function () {
  const defaultKeyPair = new KeyPair({
    prv: 'FAC4D04AA0025ECF200D74BC9B5E4616E4B8338B69B61362AAAD49F76E68EF28',
  });

  interface FlushCoinsDetails {
    contractAddress?: string;
    counter?: number;
    fee?: Fee;
    key?: KeyPair;
  }

  const buildTransaction = async function (details: FlushCoinsDetails): Promise<Transaction> {
    const txBuilder: TransactionBuilder = getBuilder('teth') as TransactionBuilder;
    txBuilder.type(TransactionType.FlushCoins);

    if (details.fee !== undefined) {
      txBuilder.fee(details.fee);
    }

    if (details.contractAddress !== undefined) {
      txBuilder.contract(details.contractAddress);
    }

    if (details.counter !== undefined) {
      txBuilder.counter(details.counter);
    }

    if (details.key !== undefined) {
      txBuilder.sign({ key: details.key.getKeys().prv });
    }

    return (await txBuilder.build()) as Transaction;
  };

  describe('should build', () => {
    it('a wallet flush forwarder transaction', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 1,
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      });

      tx.type.should.equal(TransactionType.FlushCoins);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson._type.should.equals(ETHTransactionType.LEGACY);
      txJson.gasPrice!.should.equal('10');
      should.equal(txJson.nonce, 1);
      txJson.data.should.startWith(flushCoinsMethodId);
    });

    it('a wallet flush forwarder transaction with nonce 0', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 0,
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      });

      tx.type.should.equal(TransactionType.FlushCoins);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson._type.should.equals(ETHTransactionType.LEGACY);
      txJson.gasPrice!.should.equal('10');
      should.equal(txJson.nonce, 0);
    });

    it('an unsigned flush transaction from serialized', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 0,
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      });
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder: any = getBuilder('teth');
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
      newTx.toJson().data.should.startWith(flushCoinsMethodId);
      newTx.toJson().v.should.equal('0x77');
    });

    it('a signed flush coin transaction from serialized', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 0,
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
        key: defaultKeyPair,
      });
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder: any = getBuilder('teth');
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
      const txJson = newTx.toJson();
      should.exist(txJson.v);
      should.exist(txJson.r);
      should.exist(txJson.s);
      should.exist(txJson.from);
    });
  });

  describe('should fail to build', () => {
    it('a transaction without fee', async () => {
      await buildTransaction({
        counter: 0,
        contractAddress: '0x8f977e912ef500548a0c3be6ddde9899f1199b81',
      }).should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('a transaction without contractAddress', async () => {
      await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        counter: 0,
      }).should.be.rejectedWith('Invalid transaction: missing contract address');
    });

    it('a transaction with invalid counter', async () => {
      await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        counter: -1,
      }).should.be.rejectedWith('Invalid counter: -1');
    });
  });
});
