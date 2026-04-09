import assert from 'assert';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { Transaction, KeyPair, ETHTransactionType, Fee, TransactionBuilder } from '../../../src';
import * as testData from '../../resources/eth';
import { getBuilder } from '../getBuilder';

describe('Eth Transaction builder wallet initialization', function () {
  const sourcePrv =
    'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
  const pub1 =
    'xpub661MyMwAqRbcGpyL5QvWah4XZYHuTK21mSQ4NVwYaX67A35Kzb42nmTdf2WArW4tettXrWpfpwFbEFdEVqcSvnHLB8F6p1D41ssmbnRMXpc';
  const pub2 =
    'xpub661MyMwAqRbcFWzoz8qnYRDYEFQpPLYwxVFoG6WLy3ck5ZupRGJTG4ju6yGb7Dj3ey6GsC4kstLRER2nKzgjLtmxyPgC4zHy7kVhUt6yfGn';
  const defaultKeyPair = new KeyPair({
    prv: 'FAC4D04AA0025ECF200D74BC9B5E4616E4B8338B69B61362AAAD49F76E68EF28',
  });

  interface WalletCreationDetails {
    fee?: Fee;
    chainId?: number;
    counter?: number;
    source?: string;
    owners?: string[];
    type?: TransactionType;
  }

  const buildTransaction = async function (details: WalletCreationDetails): Promise<Transaction> {
    const txBuilder: any = getBuilder('teth');
    if (details.type !== undefined) {
      txBuilder.type(details.type);
    }
    if (details.fee !== undefined) {
      txBuilder.fee(details.fee);
    }

    if (details.counter !== undefined) {
      txBuilder.counter(details.counter);
    }

    if (details.owners !== undefined) {
      for (const owner of details.owners) {
        txBuilder.owner(owner);
      }
    }

    return await txBuilder.build();
  };

  describe('should build', () => {
    it('a wallet initialization transaction', async () => {
      const tx = await buildTransaction({
        type: TransactionType.WalletInitialization,
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        source: new KeyPair({ prv: sourcePrv }).getAddress(),
        owners: [
          new KeyPair({ prv: sourcePrv }).getAddress(),
          new KeyPair({ pub: pub1 }).getAddress(),
          new KeyPair({ pub: pub2 }).getAddress(),
        ],
        counter: 1,
      });

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson._type.should.equals(ETHTransactionType.LEGACY);
      txJson.gasPrice!.should.equal('10');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId, 42);
      should.equal(txJson.v, '0x77');
    });

    it('a wallet initialization transaction with nonce 0', async () => {
      const tx = await buildTransaction({
        type: TransactionType.WalletInitialization,
        fee: {
          fee: '10',
          gasLimit: '1000',
        },
        owners: [
          new KeyPair({ prv: sourcePrv }).getAddress(),
          new KeyPair({ pub: pub1 }).getAddress(),
          new KeyPair({ pub: pub2 }).getAddress(),
        ],
        counter: 0,
      });

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson._type.should.equals(ETHTransactionType.LEGACY);
      txJson.gasPrice!.should.equal('10');
      should.equal(txJson.nonce, 0);
      should.equal(txJson.chainId, 42);
      should.equal(txJson.v, '0x77');
    });

    it('an unsigned init transaction from serialized with 0-prefixed address', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.counter(1);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '2000000',
      });
      txBuilder.owner('0x6461EC4E9dB87CFE2aeEc7d9b02Aa264edFbf41f');
      txBuilder.owner('0xf10C8f42BD63D0AeD3338A6B2b661BC6D9fa7C44');
      txBuilder.owner('0x07ee8b845b8bf0e807e096d6b1599b121b82cbe1');
      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder: any = getBuilder('eth');
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
    });

    it('an unsigned init transaction from serialized', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.counter(1);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '2000000',
      });
      txBuilder.owner('0x6461EC4E9dB87CFE2aeEc7d9b02Aa264edFbf41f');
      txBuilder.owner('0xf10C8f42BD63D0AeD3338A6B2b661BC6D9fa7C44');
      txBuilder.owner('0xa4b5666FB4fFEA84Dd848845E1114b84146de4b3');
      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder: any = getBuilder('eth');
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
    });

    it('a signed init transaction from serialized', async () => {
      const txBuilder: any = getBuilder('teth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.counter(1);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '2000000',
      });
      txBuilder.owner('0x6461EC4E9dB87CFE2aeEc7d9b02Aa264edFbf41f');
      txBuilder.owner('0xf10C8f42BD63D0AeD3338A6B2b661BC6D9fa7C44');
      txBuilder.owner('0xa4b5666FB4fFEA84Dd848845E1114b84146de4b3');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      // now rebuild from the signed serialized tx and make sure it stays the same
      const newTxBuilder: any = getBuilder('teth');
      newTxBuilder.from(serialized);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toBroadcastFormat(), serialized);
      should.equal(newTx.id, '0xef04334f21ba844100b9aee6485f14afe177e88308ad2b8c1b0878576a31d47b');
      const txJson = newTx.toJson();
      should.exist(txJson.v);
      should.exist(txJson.r);
      should.exist(txJson.s);
      should.exist(txJson.from);
    });

    it('correct transaction id', async () => {
      const newTxBuilder = getBuilder('eth') as TransactionBuilder;
      newTxBuilder.from(testData.WALLET_INITIALIZATION);
      const newTx = await newTxBuilder.build();
      should.equal(newTx.toJson().id, '0xc65f9802df3b559b297779ec06d3e71ba7f5b1b47cc961ad2efba54d82347bec');
    });
  });

  describe('should fail to build', () => {
    it('an unsupported type of transaction', async () => {
      await buildTransaction({
        type: TransactionType.AccountUpdate,
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        source: new KeyPair({ prv: sourcePrv }).getAddress(),
        counter: 0,
      }).should.be.rejectedWith('Unsupported transaction type');
    });

    it('a transaction without fee', async () => {
      await buildTransaction({
        source: new KeyPair({ prv: sourcePrv }).getAddress(),
        counter: 0,
      }).should.be.rejectedWith('Invalid transaction: missing fee');
    });

    it('a wallet initialization the wrong number of owners', async () => {
      await buildTransaction({
        type: TransactionType.WalletInitialization,
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        source: new KeyPair({ prv: sourcePrv }).getAddress(),
        owners: [new KeyPair({ pub: pub1 }).getAddress(), new KeyPair({ pub: pub2 }).getAddress()],
        counter: 0,
      }).should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 2');

      await buildTransaction({
        type: TransactionType.WalletInitialization,
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        source: new KeyPair({ prv: sourcePrv }).getAddress(),
        owners: [
          new KeyPair({ prv: sourcePrv }).getAddress(),
          new KeyPair({ pub: pub1 }).getAddress(),
          new KeyPair({ pub: pub1 }).getAddress(),
          new KeyPair({ pub: pub2 }).getAddress(),
        ],
        counter: 0,
      }).should.be.rejectedWith('Repeated owner address: ' + new KeyPair({ pub: pub1 }).getAddress());

      await buildTransaction({
        type: TransactionType.WalletInitialization,
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        source: new KeyPair({ prv: sourcePrv }).getAddress(),
        owners: [],
        counter: 0,
      }).should.be.rejectedWith('Invalid transaction: wrong number of owners -- required: 3, found: 0');
    });

    it('a transaction with invalid counter', async () => {
      await buildTransaction({
        fee: {
          fee: '10',
          gasLimit: '10',
        },
        source: new KeyPair({ prv: sourcePrv }).getAddress(),
        counter: -1,
        owners: [
          new KeyPair({ prv: sourcePrv }).getAddress(),
          new KeyPair({ pub: pub1 }).getAddress(),
          new KeyPair({ pub: pub2 }).getAddress(),
        ],
      }).should.be.rejectedWith('Invalid counter: -1');
    });
  });

  describe('should fail to sign', () => {
    it('a wallet initialization transaction without owners', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.counter(1);
      assert.throws(() => txBuilder.sign({ key: defaultKeyPair.getKeys().prv }));
    });

    it('a signed wallet initialization transaction', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.counter(1);
      txBuilder.owner(new KeyPair({ pub: pub1 }).getAddress());
      txBuilder.owner(new KeyPair({ pub: pub2 }).getAddress());
      txBuilder.owner(new KeyPair({ prv: sourcePrv }).getAddress());
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      assert.throws(
        () => txBuilder.sign({ key: defaultKeyPair.getKeys().prv }),
        new RegExp('Cannot sign multiple times a non send-type transaction')
      );
    });
  });

  describe('should validate', () => {
    it('an address', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.validateAddress(testData.VALID_ADDRESS);
      assert.throws(
        () => txBuilder.validateAddress(testData.INVALID_ADDRESS),
        new RegExp('Invalid address ' + testData.INVALID_ADDRESS.address)
      );
    });

    it('value should be greater than zero', () => {
      const txBuilder: any = getBuilder('eth');
      assert.throws(() => txBuilder.fee({ fee: '-10' }));
      should.doesNotThrow(() => txBuilder.fee({ fee: '10' }));
    });

    it('a private key', () => {
      const txBuilder: any = getBuilder('eth');
      assert.throws(() => txBuilder.validateKey({ key: 'abc' }), /Invalid key/);
      assert.throws(() => txBuilder.validateKey({ key: testData.PUBLIC_KEY }), /Invalid key/);
      should.doesNotThrow(() => txBuilder.validateKey({ key: testData.PRIVATE_KEY }));
    });

    it('a raw transaction', async () => {
      const builder: any = getBuilder('eth');
      should.doesNotThrow(() => builder.from(testData.TX_BROADCAST));
      should.doesNotThrow(() => builder.from(testData.TX_JSON));
      assert.throws(() => builder.from('0x00001000'), /There was error in decoding the hex string/);
      assert.throws(() => builder.from(''), /Raw transaction is empty/);
      assert.throws(() => builder.from('pqrs'), /There was error in parsing the JSON string/);
      assert.throws(() => builder.from(1234), /Transaction is not a hex string or stringified json/);
    });

    it('a transaction to build', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.counter(undefined);
      txBuilder.type(TransactionType.WalletInitialization);
      assert.throws(() => txBuilder.validateTransaction(), /Invalid transaction: missing fee/);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      assert.throws(() => txBuilder.validateTransaction(), /Invalid transaction: missing address counter/);
      assert.throws(() => txBuilder.validateTransaction(), /Invalid transaction: missing address counter/);
      const source = {
        prv: sourcePrv,
      };
      const sourceKeyPair = new KeyPair(source);
      assert.throws(() => txBuilder.validateTransaction(), /Invalid transaction: missing address counter/);
      txBuilder.counter(1);
      assert.throws(() => txBuilder.validateTransaction(), /wrong number of owners -- required: 3, found: 0/);
      txBuilder.owner(sourceKeyPair.getAddress());
      assert.throws(() => txBuilder.validateTransaction(), /wrong number of owners -- required: 3, found: 1/);
      txBuilder.owner(new KeyPair({ pub: pub1 }).getAddress());
      assert.throws(() => txBuilder.validateTransaction(), /wrong number of owners -- required: 3, found: 2/);
      txBuilder.owner(new KeyPair({ pub: pub2 }).getAddress());
      should.doesNotThrow(() => txBuilder.validateTransaction());
    });
  });

  describe('set owner', () => {
    it('should be wallet initializaion', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.Send);
      const sourceKeyPair = new KeyPair({ prv: sourcePrv });
      assert.throws(
        () => txBuilder.owner(sourceKeyPair.getAddress()),
        new RegExp('Multisig wallet owner can only be set for initialization transactions')
      );
    });

    it('should be only 3 owners', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      const sourceKeyPair = new KeyPair({ prv: sourcePrv });
      txBuilder.counter(1);
      txBuilder.owner(sourceKeyPair.getAddress());
      txBuilder.owner('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5');
      txBuilder.owner('0x603e077acd3F01e81b95fB92ce42FF60dFf3D4C7');
      assert.throws(
        () => txBuilder.owner('0x1A88Ee4Bc80BE080fC91AC472Af2F59260695060'),
        new RegExp('A maximum of 3 owners can be set for a multisig wallet')
      );
    });

    it('should be a valid address', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.counter(1);
      assert.throws(() => txBuilder.owner('0x7325A3F7d4f9E86AE62C'), /Invalid address/);
    });
  });

  it('Should getting same tx hash from raw tx', async function () {
    const txBuilder: any = getBuilder('eth');
    txBuilder.fee({
      fee: '280000000000',
      gasLimit: '7000000',
    });
    txBuilder.counter(1);
    txBuilder.type(TransactionType.WalletInitialization);
    txBuilder.owner(new KeyPair({ pub: pub1 }).getAddress());
    txBuilder.owner(new KeyPair({ pub: pub2 }).getAddress());
    txBuilder.owner(new KeyPair({ prv: sourcePrv }).getAddress());
    txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
    const tx = await txBuilder.build();
    const txBuiderFromRaw: any = getBuilder('eth');
    txBuiderFromRaw.from(tx.toBroadcastFormat());
    const txFromRaw = await txBuiderFromRaw.build();
    should.deepEqual(tx.id, txFromRaw.id);
  });

  describe('Recovery Wallet', function () {
    it('should build and sign using txHex', async () => {
      const txBuilder = getBuilder('gteth') as TransactionBuilder;
      const txHex = testData.RECOVERY_WALLET_DEPLOYMENT_TXHEX;
      txBuilder.from(txHex);
      const xpriv =
        'xprv9s21ZrQH143K2YKSzZa2fv7QTzZ5Ui45ZUzygDwhfeHodwHbWtUUSKqikMKZR9Z751NMekrjXKBykb8mhvoTrKMRodKBvNDH4XKPkccF1K4';
      txBuilder.sign({ key: xpriv });
      const signedTx = await txBuilder.build();
      should.exists(signedTx.toBroadcastFormat());
    });

    it('succeed when build via contract call', async () => {
      const txBuilder = getBuilder('hteth') as TransactionBuilder;
      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({
        eip1559: {
          maxFeePerGas: '100',
          maxPriorityFeePerGas: '10',
        },
        fee: '100',
        gasLimit: '10000',
      });

      const data = testData.SEND_FUNDS_METHOD_CALL;
      txBuilder.counter(1);
      txBuilder.data(data);
      txBuilder.contract('0xd536f4b9f9127a39f19820ca18baac7cd157471f');
      const tx = await txBuilder.build();
      const txhex = tx.toBroadcastFormat();
      const builderFrom = getBuilder('hteth') as TransactionBuilder;
      builderFrom.from(txhex);
      const txFrom = await builderFrom.build();
      should.deepEqual(tx.id, txFrom.id);
      should.deepEqual(tx.toJson(), txFrom.toJson());
    });
  });
});
