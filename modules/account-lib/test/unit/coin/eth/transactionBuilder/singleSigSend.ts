import * as should from 'should';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { getBuilder, Eth } from '../../../../../src';
import { Transaction } from '../../../../../src/coin/eth';
import { Fee } from '../../../../../src/coin/eth/iface';

describe('Eth Transaction builder flush tokens', function() {
  const sourcePrv =
    'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
  const pub1 =
    'xpub661MyMwAqRbcGpyL5QvWah4XZYHuTK21mSQ4NVwYaX67A35Kzb42nmTdf2WArW4tettXrWpfpwFbEFdEVqcSvnHLB8F6p1D41ssmbnRMXpc';
  const pub2 =
    'xpub661MyMwAqRbcFWzoz8qnYRDYEFQpPLYwxVFoG6WLy3ck5ZupRGJTG4ju6yGb7Dj3ey6GsC4kstLRER2nKzgjLtmxyPgC4zHy7kVhUt6yfGn';
  const defaultKeyPair = new Eth.KeyPair({
    prv: 'FAC4D04AA0025ECF200D74BC9B5E4616E4B8338B69B61362AAAD49F76E68EF28',
  });

  interface SingleSigSend {
    value?: string;
    recipient?: string;
    counter?: number;
    fee?: Fee;
    key?: Eth.KeyPair;
  }

  const buildTransaction = async function(details: SingleSigSend): Promise<Transaction> {
    const txBuilder: any = getBuilder('teth');
    txBuilder.type(TransactionType.SingleSigSend);

    if (details.value !== undefined) {
      txBuilder.value(details.value);
    }

    if (details.recipient !== undefined) {
      // majority of calls the external recipient is the contract address
      // unfortunate outcropping that in this case it is the recipient
      txBuilder.contract(details.recipient);
    }

    if (details.fee !== undefined) {
      txBuilder.fee(details.fee);
    }

    if (details.counter !== undefined) {
      txBuilder.counter(details.counter);
    }

    if (details.key !== undefined) {
      txBuilder.sign({ key: details.key.getKeys().prv });
    }

    return await txBuilder.build();
  };

  describe('should build', () => {
    it('a single sig send', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 1,
        recipient: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        value: '123',
      });

      tx.type.should.equal(TransactionType.SingleSigSend);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson.gasPrice.should.equal('10');
      txJson.value.should.equal('123');
      txJson.nonce.should.equal(1);
    });

    it('a single sig send with nonce 0', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 0,
        recipient: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        value: '123',
      });

      tx.type.should.equal(TransactionType.SingleSigSend);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson.gasPrice.should.equal('10');
      txJson.value.should.equal('123');
      txJson.nonce.should.equal(0);
    });

    it('an unsigned single sig send from serialized', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 0,
        recipient: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        value: '123',
      });
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the unsigned signed serialized tx and make sure it stays the same
      const newTxBuilder: any = getBuilder('teth');
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
    });

    it('a signed single sig send from serialized', async () => {
      const tx = await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        counter: 0,
        recipient: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        value: '123',
        key: defaultKeyPair,
      });
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder: any = getBuilder('teth');
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
      should.equal(newTx.id, '0x5dfa2726334bb5e800adfd151299f3af9a1dcf0cec7dc5107b4b24de1338173a');
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
        recipient: '0x53b8e91bb3b8f618b5f01004ef108f134f219573',
        value: '123',
      }).should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('a transaction without recipient', async () => {
      await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        counter: 0,
        value: '123',
      }).should.be.rejectedWith('Invalid transaction: missing contract address');
    });

    it('a transaction with invalid counter', async () => {
      await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        counter: -1,
        recipient: '0xbcf935d206ca32929e1b887a07ed240f0d8ccd22',
        value: '123',
      }).should.be.rejectedWith('Invalid counter: -1');
    });
  });
});
