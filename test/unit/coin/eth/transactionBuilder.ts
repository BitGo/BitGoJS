import should from 'should';
import { TransactionType } from '../../../../src/coin/baseCoin/';
import { getBuilder, Eth } from '../../../../src';
import * as testData from '../../../resources/eth/eth';

describe('Eth Transaction builder', function() {
  const defaultKeyPair = new Eth.KeyPair({
    prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
  });

  describe('should build', () => {
    it('an init transaction', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      txBuilder.owner(sourceKeyPair.getAddress());
      txBuilder.owner(
        new Eth.KeyPair({
          pub:
            '04e5a2bbe7054f3bced0ba534a557d95a43f49c130db0e94e7eb706c62b4130aa93dede2111468531321d329761fa2b3f93c845fa271dd70a9c6c765a39777d189',
        }).getAddress(),
      );
      txBuilder.owner(
        new Eth.KeyPair({
          pub:
            '0428f4eb08b1326305ef0a5aac9c48dc39f427763ccfa9e59805e09544aad403a0b540c0067b619f3199be7660874f3e764535e9f744586393b22fa8a4e29b7b26',
        }).getAddress(),
      );
      const tx = await txBuilder.build(); //build without sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson.gasPrice.should.equal('10');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId, 31);
    });
  });

  describe('should fail to build', () => {
    it('an unsupported type of transaction', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.AddressInitialization);
      return txBuilder.build().should.be.rejectedWith('Unsupported transaction type');
    });
  });

  describe('should sign', () => {
    it('an init transaction', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      txBuilder.owner(sourceKeyPair.getAddress());
      txBuilder.owner('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5');
      txBuilder.owner('0x603e077acd3F01e81b95fB92ce42FF60dFf3D4C7');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build(); //shoud build and sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson.gasPrice.should.equal('10');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId, 31);
      should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
    });
  });

  describe('should fail to sign', () => {
    it('a transaction without owners', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      should.throws(() => txBuilder.sign({ key: defaultKeyPair.getKeys().prv }));
    });

    it('a signed transaction', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      txBuilder.owner(sourceKeyPair.getAddress());
      txBuilder.owner('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5');
      txBuilder.owner('0x603e077acd3F01e81b95fB92ce42FF60dFf3D4C7');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      should.throws(
        () => txBuilder.sign({ key: defaultKeyPair.getKeys().prv }),
        'Cannot sign multiple times a non send-type transaction',
      );
    });
  });

  describe('should validate', () => {
    it('an address', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.validateAddress(testData.VALID_ADDRESS);
      should.throws(() => txBuilder.validateAddress(testData.INVALID_ADDRESS));
    });

    it('value should be greater than zero', () => {
      const txBuilder: any = getBuilder('eth');
      should.throws(() => txBuilder.fee({ fee: '-10' }));
      should.doesNotThrow(() => txBuilder.fee({ fee: '10' }));
    });

    it('a private key', () => {
      const txBuilder: any = getBuilder('eth');
      should.throws(() => txBuilder.validateKey({ key: 'abc' }), 'Invalid key');
      should.throws(() => txBuilder.validateKey({ key: testData.PUBLIC_KEY }), 'Invalid key');
      should.doesNotThrow(() => txBuilder.validateKey({ key: testData.PRIVATE_KEY }));
    });

    it('a raw transaction', async () => {
      const builder: any = getBuilder('eth');
      should.doesNotThrow(() => builder.from(testData.TX_BROADCAST));
      should.doesNotThrow(() => builder.from(testData.TX_JSON));
      should.throws(() => builder.from('0x00001000'), 'There was error in decoding the hex string');
      should.throws(() => builder.from(''), 'There was error in decoding the hex string');
      should.throws(() => builder.from('pqrs'), 'There was error in parsing the JSON string');
      should.throws(() => builder.from(1234), 'Transaction is not a hex string or stringified json');
    });

    it('a transaction to build', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction');
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction');
      txBuilder.chainId(31);
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction');
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction');
      txBuilder.counter(1);
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction');
      txBuilder.owner(sourceKeyPair.getAddress());
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction');
      txBuilder.owner(
        new Eth.KeyPair({
          pub:
            '04e5a2bbe7054f3bced0ba534a557d95a43f49c130db0e94e7eb706c62b4130aa93dede2111468531321d329761fa2b3f93c845fa271dd70a9c6c765a39777d189',
        }).getAddress(),
      );
      should.throws(() => txBuilder.validateTransaction(), 'Invalid transaction');
      txBuilder.owner(
        new Eth.KeyPair({
          pub:
            '0428f4eb08b1326305ef0a5aac9c48dc39f427763ccfa9e59805e09544aad403a0b540c0067b619f3199be7660874f3e764535e9f744586393b22fa8a4e29b7b26',
        }).getAddress(),
      );
      should.doesNotThrow(() => txBuilder.validateTransaction());
    });
  });

  describe('set owner', () => {
    it('should be wallet initializaion', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.Send);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      should.throws(
        () => txBuilder.owner(sourceKeyPair.getAddress()),
        'Multisig wallet owner can only be set for initialization transactions',
      );
    });

    it('should be only 3 owners', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      txBuilder.owner(sourceKeyPair.getAddress());
      txBuilder.owner('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5');
      txBuilder.owner('0x603e077acd3F01e81b95fB92ce42FF60dFf3D4C7');
      should.throws(
        () => txBuilder.owner('0x1A88Ee4Bc80BE080fC91AC472Af2F59260695060'),
        'A maximum of 3 owners can be set for a multisig wallet',
      );
    });

    it('should be a valid address', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      should.throws(() => txBuilder.owner('0x7325A3F7d4f9E86AE62C'), 'Invalid address');
    });

    it('should be differnts 3 owners', () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      txBuilder.owner(sourceKeyPair.getAddress());
      txBuilder.owner('0x603e077acd3F01e81b95fB92ce42FF60dFf3D4C7');
      should.throws(
        () => txBuilder.owner('0x603e077acd3F01e81b95fB92ce42FF60dFf3D4C7'),
        'Repeated owner address: 0x603e077acd3F01e81b95fB92ce42FF60dFf3D4C7',
      );
    });
  });
});
