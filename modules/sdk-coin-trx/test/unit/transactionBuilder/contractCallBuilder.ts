import assert from 'assert';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins, TronNetwork } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { Transaction, WrappedBuilder } from '../../../src';
import { getBuilder } from '../../../src/lib/builder';
import {
  PARTICIPANTS,
  CONTRACTS,
  MINT_CONFIRM_DATA,
  BLOCK_HASH,
  FEE_LIMIT,
  BLOCK_NUMBER,
  EXPIRATION,
  TX_CONTRACT,
} from '../../resources';

describe('Trx Contract call Builder', () => {
  const initTxBuilder = () => {
    const builder = (getBuilder('ttrx') as WrappedBuilder).getContractCallBuilder();
    builder
      .source({ address: PARTICIPANTS.custodian.address })
      .to({ address: CONTRACTS.factory })
      .block({ number: BLOCK_NUMBER, hash: BLOCK_HASH })
      .fee({ feeLimit: FEE_LIMIT });

    return builder;
  };

  describe('Contract Call builder', () => {
    describe('should build', () => {
      describe('non serialized transactions', () => {
        it('a signed contract call transaction', async () => {
          const txBuilder = initTxBuilder();
          txBuilder.data(MINT_CONFIRM_DATA).sign({ key: PARTICIPANTS.custodian.pk });
          const tx = await txBuilder.build();
          tx.toJson();
        });
      });

      describe('serialized transactions', () => {
        it('a transaction signed multiple times', async () => {
          const timestamp = Date.now();
          const txBuilder = initTxBuilder();
          txBuilder.data(MINT_CONFIRM_DATA);
          txBuilder.timestamp(timestamp);
          txBuilder.expiration(timestamp + EXPIRATION);
          const tx = await txBuilder.build();

          let txJson = tx.toJson();
          let rawData = txJson.raw_data;
          should.deepEqual(rawData.contract, TX_CONTRACT);
          should.equal(txJson.signature.length, 0);

          const txBuilder2 = getBuilder('ttrx').from(tx.toJson());
          txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
          const tx2 = await txBuilder2.build();

          txJson = tx2.toJson();
          rawData = txJson.raw_data;
          should.deepEqual(rawData.contract, TX_CONTRACT);
          should.equal(txJson.signature.length, 1);

          const txBuilder3 = getBuilder('ttrx').from(tx2.toJson());
          txBuilder3.sign({ key: PARTICIPANTS.from.pk });
          const tx3 = await txBuilder3.build();

          txJson = tx3.toJson();
          rawData = txJson.raw_data;
          should.deepEqual(rawData.contract, TX_CONTRACT);
          should.equal(txJson.signature.length, 2);

          const txBuilder4 = getBuilder('ttrx').from(tx3.toJson());
          txBuilder4.sign({ key: PARTICIPANTS.multisig.pk });
          const tx4 = await txBuilder4.build();

          tx4.inputs.length.should.equal(1);
          tx4.inputs[0].address.should.equal(PARTICIPANTS.custodian.address);
          if (tx4.inputs[0].contractAddress) {
            tx4.inputs[0].contractAddress.should.equal(CONTRACTS.factory);
          }
          if (tx4.inputs[0].data) {
            tx4.inputs[0].data.should.equal('K/kLqhJzFAw+G1dWskLMiM18TdimG/hctcHdX1C6YeBmtToV');
          }
          tx4.inputs[0].value.should.equal('0');
          tx4.outputs[0].value.should.equal('0');
          tx4.outputs[0].address.should.equal(PARTICIPANTS.custodian.address);

          txJson = tx4.toJson();
          rawData = txJson.raw_data;
          should.deepEqual(rawData.contract, TX_CONTRACT);
          should.equal(txJson.signature.length, 3);
          should.equal(rawData.fee_limit, FEE_LIMIT);
          should.equal(rawData.expiration, timestamp + EXPIRATION);
          should.equal(rawData.timestamp, timestamp);
        });

        it('an unsigned transaction from a string and from a JSON', async () => {
          const timestamp = Date.now();
          const txBuilder = initTxBuilder();
          txBuilder.data(MINT_CONFIRM_DATA);
          txBuilder.timestamp(timestamp);
          txBuilder.expiration(timestamp + 40000);
          const tx = await txBuilder.build();

          const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
          txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
          const tx2 = await txBuilder2.build();

          const txBuilder3 = getBuilder('ttrx').from(tx.toJson());
          txBuilder3.sign({ key: PARTICIPANTS.custodian.pk });
          const tx3 = await txBuilder3.build();

          should.deepEqual(tx2, tx3);
        });

        it('an unsigned transaction with extended duration', async () => {
          const timestamp = Date.now();
          const expiration = timestamp + EXPIRATION;
          const extension = 60000;
          const txBuilder = initTxBuilder();
          txBuilder.data(MINT_CONFIRM_DATA);
          txBuilder.timestamp(timestamp);
          txBuilder.expiration(expiration);
          const tx = await txBuilder.build();

          const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
          txBuilder2.extendValidTo(extension);
          txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
          const tx2 = await txBuilder2.build();

          tx2.inputs.length.should.equal(1);
          tx2.inputs[0].address.should.equal(PARTICIPANTS.custodian.address);
          if (tx2.inputs[0].contractAddress) {
            tx2.inputs[0].contractAddress.should.equal(CONTRACTS.factory);
          }
          if (tx2.inputs[0].data) {
            tx2.inputs[0].data.should.equal('K/kLqhJzFAw+G1dWskLMiM18TdimG/hctcHdX1C6YeBmtToV');
          }
          tx2.inputs[0].value.should.equal('0');
          tx2.outputs[0].value.should.equal('0');
          tx2.outputs[0].address.should.equal(PARTICIPANTS.custodian.address);

          const txJson = tx2.toJson();
          should.equal(txJson.raw_data.expiration, expiration + extension);
        });

        it('a transaction with correct inputs', async () => {
          const timestamp = Date.now();
          const txBuilder = initTxBuilder();
          txBuilder.data(MINT_CONFIRM_DATA);
          txBuilder.timestamp(timestamp);
          txBuilder.expiration(timestamp + 40000);
          const tx = (await txBuilder.build()) as Transaction;

          tx.type.should.equal(TransactionType.ContractCall);
          tx.inputs.length.should.equal(1);
          tx.inputs[0].address.should.equal(PARTICIPANTS.custodian.address);
          if (tx.inputs[0].contractAddress) {
            tx.inputs[0].contractAddress.should.equal(CONTRACTS.factory);
          }
          if (tx.inputs[0].data) {
            tx.inputs[0].data.should.equal('K/kLqhJzFAw+G1dWskLMiM18TdimG/hctcHdX1C6YeBmtToV');
          }
          tx.inputs[0].value.should.equal('0');
          tx.outputs[0].value.should.equal('0');
          tx.outputs[0].address.should.equal(PARTICIPANTS.custodian.address);
        });
      });
    });

    describe('should fail to build', () => {
      it('a transaction with wrong data', async () => {
        const txBuilder = initTxBuilder();
        assert.throws(
          () => {
            txBuilder.data('addMintRequest()');
          },
          (e: any) => e.message === 'addMintRequest() is not a valid hex string.'
        );
      });

      it('a transaction with duplicate signatures', async () => {
        const txBuilder = initTxBuilder();
        txBuilder.data(MINT_CONFIRM_DATA);
        txBuilder.sign({ key: PARTICIPANTS.custodian.pk });
        assert.throws(
          () => {
            txBuilder.sign({ key: PARTICIPANTS.custodian.pk });
          },
          (e: any) => e.message === 'Duplicated key'
        );
        const tx = await txBuilder.build();

        const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
        txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
        txBuilder2.build().should.be.rejectedWith('Transaction signing did not return an additional signature.');
      });

      it('an invalid raw transaction', () => {
        assert.throws(
          () => {
            getBuilder('ttrx').from('an invalid raw transaction');
          },
          (e: any) => e.message === 'There was error in parsing the JSON string'
        );
      });
    });
  });

  describe('Should validate ', () => {
    it('a valid expiration', async () => {
      const now = Date.now();
      const expiration = now + EXPIRATION;
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      txBuilder.timestamp(now);
      txBuilder.expiration(expiration + 1000);
      txBuilder.expiration(expiration);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.raw_data.expiration, expiration);
    });

    it('an expiration greater than one year', async () => {
      const now = Date.now();
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      txBuilder.timestamp(now);
      assert.throws(
        () => {
          txBuilder.expiration(now + 31536000001);
        },
        (e: any) => e.message === 'Expiration must not be greater than one year'
      );
    });

    it('an expiration less than the current date', async () => {
      const now = Date.now();
      const txBuilder = initTxBuilder();
      txBuilder.timestamp(now - 2000);
      txBuilder.data(MINT_CONFIRM_DATA);
      assert.throws(
        () => {
          txBuilder.expiration(now - 1000);
        },
        (e: any) => e.message === 'Expiration must be greater than current time'
      );
    });

    it('an expiration less than the timestamp', async () => {
      const now = Date.now();
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      txBuilder.timestamp(now + 2000);
      assert.throws(
        () => {
          txBuilder.expiration(now + 1000);
        },
        (e: any) => e.message === 'Expiration must be greater than timestamp'
      );
    });

    it('an expiration set after build', async () => {
      const now = Date.now();
      const expiration = now + EXPIRATION;
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      await txBuilder.build();
      assert.throws(
        () => {
          txBuilder.expiration(expiration);
        },
        (e: any) => e.message === 'Expiration is already set, it can only be extended'
      );
    });

    it('an expiration set after deserializing', async () => {
      const now = Date.now();
      const expiration = now + EXPIRATION;
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      const tx = await txBuilder.build();
      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      assert.throws(
        () => {
          txBuilder2.expiration(expiration);
        },
        (e: any) => e.message === 'Expiration is already set, it can only be extended'
      );
    });

    it('an extension without a set expiration', async () => {
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      assert.throws(
        () => {
          txBuilder.extendValidTo(20000);
        },
        (e: any) => e.message === 'There is not expiration to extend'
      );
    });

    it('a zero millisecond extension', async () => {
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      const expiration = Date.now() + EXPIRATION;
      txBuilder.expiration(expiration);
      const tx = await txBuilder.build();

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      assert.throws(
        () => {
          txBuilder2.extendValidTo(0);
        },
        (e: any) => e.message === 'Value cannot be below zero'
      );
    });

    it('an extension grater than one year', async () => {
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      const expiration = Date.now() + EXPIRATION;
      txBuilder.expiration(expiration);
      const tx = await txBuilder.build();

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      assert.throws(
        () => {
          txBuilder2.extendValidTo(31536000001);
        },
        (e: any) => e.message === 'The expiration cannot be extended more than one year'
      );
    });

    it('an extension after signing', async () => {
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      txBuilder.sign({ key: PARTICIPANTS.custodian.pk });
      const tx = await txBuilder.build();

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      assert.throws(
        () => {
          txBuilder2.extendValidTo(20000);
        },
        (e: any) => e.message === 'Cannot extend a signed transaction'
      );
    });

    it('fee limit', async () => {
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      assert.throws(
        () => {
          txBuilder.fee({ feeLimit: 'not a number' });
        },
        (e: any) => e.message === 'Invalid fee limit value'
      );

      assert.throws(
        () => {
          txBuilder.fee({ feeLimit: '-15000' });
        },
        (e: any) => e.message === 'Invalid fee limit value'
      );

      assert.throws(
        () => {
          const tronNetwork = coins.get('ttrx').network as TronNetwork;
          txBuilder.fee({ feeLimit: new BigNumber(tronNetwork.maxFeeLimit).plus(1).toString() });
        },
        (e: any) => e.message === 'Invalid fee limit value'
      );
    });

    it('transaction mandatory fields', async () => {
      const txBuilder = (getBuilder('ttrx') as WrappedBuilder).getContractCallBuilder();
      await txBuilder.build().should.be.rejectedWith('Missing parameter: data');

      txBuilder.data(MINT_CONFIRM_DATA);
      await txBuilder.build().should.be.rejectedWith('Missing parameter: source');

      txBuilder.source({ address: PARTICIPANTS.custodian.address });
      await txBuilder.build().should.be.rejectedWith('Missing parameter: contract address');

      txBuilder.to({ address: CONTRACTS.factory });
      await txBuilder.build().should.be.rejectedWith('Missing block reference information');

      txBuilder.block({ number: BLOCK_NUMBER, hash: BLOCK_HASH });
      await txBuilder.build().should.be.rejectedWith('Missing fee');

      txBuilder.fee({ feeLimit: FEE_LIMIT });
      await txBuilder.build().should.be.fulfilled;
    });
  });
});
