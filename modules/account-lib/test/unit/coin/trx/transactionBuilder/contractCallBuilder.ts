import should from 'should';
import { WrappedBuilder } from '../../../../../src/coin/trx';
import { getBuilder } from '../../../../../src/index';
import {
  PARTICIPANTS,
  CONTRACTS,
  MINT_CONFIRM_DATA,
  BLOCK_HASH,
  FEE_LIMIT,
  BLOCK_NUMBER,
  EXPIRATION,
  TX_CONTRACT,
} from '../../../../resources/trx/trx';

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

          const txJson = tx2.toJson();
          should.equal(txJson.raw_data.expiration, expiration + extension);
        });
      });
    });

    describe('should fail to build', () => {
      it('a transaction with wrong data', async () => {
        const txBuilder = initTxBuilder();
        should.throws(
          () => {
            txBuilder.data('addMintRequest()');
          },
          e => e.message === 'addMintRequest() is not a valid hex string.',
        );
      });

      it('a transaction with duplicate signatures', async () => {
        const txBuilder = initTxBuilder();
        txBuilder.data(MINT_CONFIRM_DATA);
        txBuilder.sign({ key: PARTICIPANTS.custodian.pk });
        should.throws(
          () => {
            txBuilder.sign({ key: PARTICIPANTS.custodian.pk });
          },
          e => e.message === 'Duplicated key',
        );
        const tx = await txBuilder.build();

        const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
        txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
        txBuilder2.build().should.be.rejectedWith('Transaction signing did not return an additional signature.');
      });

      it('an invalid raw transaction', () => {
        should.throws(
          () => {
            getBuilder('ttrx').from('an invalid raw transaction');
          },
          e => e.message === 'There was error in parsing the JSON string',
        );
      });
    });
  });

  describe('Should validate ', () => {
    it('expiration', async () => {
      const now = Date.now();
      const expiration = now + EXPIRATION;
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      txBuilder.timestamp(now);
      txBuilder.expiration(expiration + 1000);
      txBuilder.expiration(expiration);
      should.throws(
        () => {
          txBuilder.expiration(now + 31536000001);
        },
        e => e.message === 'Expiration must not be greater than one year',
      );
      const tx = await txBuilder.build();
      should.throws(
        () => {
          txBuilder.expiration(expiration + 20000);
        },
        e => e.message === 'Expiration is already set, it can only be extended',
      );
      const txJson = tx.toJson();
      should.equal(txJson.raw_data.expiration, expiration);

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      should.throws(
        () => {
          txBuilder2.expiration(expiration + 20000);
        },
        e => e.message === 'Expiration is already set, it can only be extended',
      );
    });

    it('valid duration extension', async () => {
      const expiration = Date.now() + EXPIRATION;
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      should.throws(
        () => {
          txBuilder.extendValidTo(20000);
        },
        e => e.message === 'There is not expiration to extend',
      );
      txBuilder.expiration(expiration);
      const tx = await txBuilder.build();

      const txBuilder2 = getBuilder('ttrx').from(tx.toBroadcastFormat());
      should.throws(
        () => {
          txBuilder2.extendValidTo(0);
        },
        e => e.message === 'Value cannot be below zero',
      );
      should.throws(
        () => {
          txBuilder2.extendValidTo(31536000001);
        },
        e => e.message === 'The expiration cannot be extended more than one year',
      );
      txBuilder2.sign({ key: PARTICIPANTS.custodian.pk });
      const tx2 = await txBuilder2.build();

      const txBuilder3 = getBuilder('ttrx').from(tx2.toJson());
      should.throws(
        () => {
          txBuilder3.extendValidTo(20000);
        },
        e => e.message === 'Cannot extend a signed transaction',
      );
    });

    it('fee limit', async () => {
      const txBuilder = initTxBuilder();
      txBuilder.data(MINT_CONFIRM_DATA);
      should.throws(
        () => {
          txBuilder.fee({ feeLimit: 'not a number' });
        },
        e => e.message === 'Invalid fee limit value',
      );

      should.throws(
        () => {
          txBuilder.fee({ feeLimit: '-15000' });
        },
        e => e.message === 'Invalid fee limit value',
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
