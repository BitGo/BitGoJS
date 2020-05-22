import should from 'should';
import { TransactionType } from '../../../../src/coin/baseCoin/';
import { getBuilder, Eth } from '../../../../src';
import * as testData from '../../../resources/cgld/cgld';

describe('Celo Transaction builder', function() {
  const defaultKeyPair = new Eth.KeyPair({
    prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
  });

  let txBuilder;
  const initTxBuilder = (): void => {
    txBuilder = getBuilder('cgld');
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.chainId(44786);
    txBuilder.source(defaultKeyPair.getAddress());
    txBuilder.counter(2);
  };

  describe('Non serialized transaction', () => {
    describe('should sign', () => {
      it('an init transaction', async () => {
        initTxBuilder();
        txBuilder.type(TransactionType.WalletInitialization);
        txBuilder.owner(defaultKeyPair.getAddress());
        txBuilder.owner('0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CB');
        txBuilder.owner('0x2fa96fca36dd9d646AC8a4e0C19b4D3a0Dc7e456');
        txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
        const tx = await txBuilder.build(); //should build and sign

        tx.type.should.equal(TransactionType.WalletInitialization);
        const txJson = tx.toJson();
        txJson.gasLimit.should.equal('12100000');
        txJson.gasPrice.should.equal('1000000000');
        should.equal(txJson.nonce, 2);
        should.equal(txJson.chainId, 44786);
        should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
        should.equal(txJson.from, defaultKeyPair.getAddress());
      });

      it('an init transaction with nonce 0', async () => {
        initTxBuilder();
        txBuilder.counter(0);
        txBuilder.type(TransactionType.WalletInitialization);
        txBuilder.owner(defaultKeyPair.getAddress());
        txBuilder.owner('0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CB');
        txBuilder.owner('0x2fa96fca36dd9d646AC8a4e0C19b4D3a0Dc7e456');
        txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
        const tx = await txBuilder.build(); // should build and sign

        tx.type.should.equal(TransactionType.WalletInitialization);
        const txJson = tx.toJson();
        txJson.gasLimit.should.equal('12100000');
        txJson.gasPrice.should.equal('1000000000');
        should.equal(txJson.nonce, 0);
        should.equal(txJson.chainId, 44786);
        should.equal(txJson.from, defaultKeyPair.getAddress());
      });

      it('a send transaction', async () => {
        initTxBuilder();
        txBuilder.type(TransactionType.Send);
        txBuilder.contract('0x8f977e912ef500548a0c3be6ddde9899f1199b81');
        txBuilder
          .transfer()
          .amount('1000000000')
          .to('0x19645032c7f1533395d44a629462e751084d3e4c')
          .expirationTime(1590066728)
          .contractSequenceId(5)
          .key(defaultKeyPair.getKeys().prv);
        txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
        const tx = await txBuilder.build(); //should build and sign
        should.equal(tx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
      });

      it('an send token transaction', async () => {
        txBuilder.type(TransactionType.SendToken);
        txBuilder.contract('0x8f977e912ef500548a0c3be6ddde9899f1199b81');
        txBuilder
          .transferToken(1000000000)
          .to('0x19645032c7f1533395d44a629462e751084d3e4c')
          .expirationTime(1590066728)
          .contractSequenceId(5)
          .key(defaultKeyPair.getKeys().prv)
          .tokenContractAddress(testData.CONTRACT_TOKEN_CUSD_ADDRESS);
        txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
        const tx = await txBuilder.build(); //shoud build and sign
        should.equal(tx.toBroadcastFormat(), testData.SEND_TOKEN_TX_BROADCAST);
      });

      it('an address creation transaction', async () => {
        initTxBuilder();
        txBuilder.type(TransactionType.AddressInitialization);
        txBuilder.contract(testData.CONTRACT_ADDRESS);
        txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
        const tx = await txBuilder.build(); //should build and sign

        tx.type.should.equal(TransactionType.AddressInitialization);
        const txJson = tx.toJson();
        txJson.gasLimit.should.equal('12100000');
        txJson.gasPrice.should.equal('1000000000');
        should.equal(txJson.nonce, 2);
        should.equal(txJson.chainId, 44786);
        should.equal(tx.toBroadcastFormat(), testData.TX_ADDRESS_INIT);
      });
    });

    describe('should fail to build', async () => {
      it('an address initialization transaction without fee', async () => {
        const txBuilder: any = getBuilder('cgld');
        txBuilder.type(TransactionType.AddressInitialization);
        txBuilder.chainId(44786);
        const source = {
          prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
        };
        const sourceKeyPair = new Eth.KeyPair(source);
        txBuilder.source(sourceKeyPair.getAddress());
        txBuilder.counter(1);
        txBuilder.contract(testData.CONTRACT_ADDRESS);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
      });

      it('an address initialization transaction without source', async () => {
        const txBuilder: any = getBuilder('cgld');
        txBuilder.type(TransactionType.AddressInitialization);
        txBuilder.fee({
          fee: '10000000000',
          gasLimit: '2000000',
        });
        txBuilder.chainId(44786);
        txBuilder.counter(1);
        txBuilder.contract(testData.CONTRACT_ADDRESS);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing source');
      });

      it('an address initialization transaction without chain id', async () => {
        const txBuilder: any = getBuilder('cgld');
        txBuilder.type(TransactionType.AddressInitialization);
        txBuilder.fee({
          fee: '10000000000',
          gasLimit: '2000000',
        });
        const source = {
          prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
        };
        const sourceKeyPair = new Eth.KeyPair(source);
        txBuilder.source(sourceKeyPair.getAddress());
        txBuilder.counter(1);
        txBuilder.contract(testData.CONTRACT_ADDRESS);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing chain id');
      });
    });
  });

  describe('From serialized data', () => {
    it('should validate a raw transaction', async () => {
      const builder: any = getBuilder('cgld');
      should.doesNotThrow(() => builder.from(testData.TX_BROADCAST));
      should.doesNotThrow(() => builder.from(testData.TX_JSON));
      should.throws(() => builder.from('0x00001000'), 'There was error in decoding the hex string');
      should.throws(() => builder.from(''), 'There was error in decoding the hex string');
      should.throws(() => builder.from('pqrs'), 'There was error in parsing the JSON string');
      should.throws(() => builder.from(1234), 'Transaction is not a hex string or stringified json');
    });

    describe('wallet initialization transaction', () => {
      it('sign an serialized init transaction', async () => {
        initTxBuilder();
        txBuilder.type(TransactionType.WalletInitialization);
        txBuilder.owner('0x386Fe4E3D2b6Acce93CC13d06e92B00aa50F429c');
        txBuilder.owner('0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CB');
        txBuilder.owner('0x2fa96fca36dd9d646AC8a4e0C19b4D3a0Dc7e456');
        txBuilder.source(defaultKeyPair.getAddress());
        const tx = await txBuilder.build();
        const serialized = tx.toBroadcastFormat();

        // now rebuild from the signed serialized tx and make sure it stays the same
        const newTxBuilder: any = getBuilder('cgld');
        newTxBuilder.from(serialized);
        newTxBuilder.source(defaultKeyPair.getAddress());
        newTxBuilder.sign({ key: defaultKeyPair.getKeys().prv });
        const signedTx = await newTxBuilder.build();
        should.equal(signedTx.toBroadcastFormat(), testData.TX_BROADCAST);
      });

      it('a signed init transaction from serialized', async () => {
        const newTxBuilder: any = getBuilder('cgld');
        newTxBuilder.from(testData.TX_BROADCAST);
        const newTx = await newTxBuilder.build();
        should.equal(newTx.toBroadcastFormat(), testData.TX_BROADCAST);
      });
    });

    describe('should fail to build', async () => {
      it('a token transaction without fee', async () => {
        const txBuilder: any = getBuilder('cgld');

        txBuilder.type(TransactionType.SendToken);
        txBuilder.chainId(44786);
        const source = {
          prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
        };
        const sourceKeyPair = new Eth.KeyPair(source);
        txBuilder.source(sourceKeyPair.getAddress());
        txBuilder.counter(1);
        txBuilder.contract(testData.CONTRACT_TOKEN_CUSD_ADDRESS);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing fee');
      });
      it('a token transaction without source', async () => {
        const txBuilder: any = getBuilder('cgld');

        txBuilder.type(TransactionType.SendToken);
        txBuilder.fee({
          fee: '10000000000',
          gasLimit: '2000000',
        });
        txBuilder.chainId(44786);
        txBuilder.counter(1);
        txBuilder.contract(testData.CONTRACT_TOKEN_CUSD_ADDRESS);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing source');
      });
      it('a token transaction without chain id', async () => {
        const txBuilder: any = getBuilder('cgld');

        txBuilder.type(TransactionType.SendToken);
        txBuilder.fee({
          fee: '10000000000',
          gasLimit: '2000000',
        });
        const source = {
          prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
        };
        const sourceKeyPair = new Eth.KeyPair(source);
        txBuilder.source(sourceKeyPair.getAddress());
        txBuilder.counter(1);
        txBuilder.contract(testData.CONTRACT_TOKEN_CUSD_ADDRESS);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing chain id');
      });
      it('a token transaction without nonce', async () => {
        const txBuilder: any = getBuilder('cgld');

        txBuilder.type(TransactionType.SendToken);
        txBuilder.fee({
          fee: '10000000000',
          gasLimit: '2000000',
        });
        const source = {
          prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
        };
        const sourceKeyPair = new Eth.KeyPair(source);
        txBuilder.source(sourceKeyPair.getAddress());
        txBuilder.chainId(44786);
        txBuilder.counter(1);
        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing contract address');
      });
      it('a send token transaction with wrong transaction type', async () => {
        txBuilder.type(TransactionType.Send);
        txBuilder.contract('0x8f977e912ef500548a0c3be6ddde9899f1199b81');
        should.throws(() => {
          txBuilder.transferToken(1000000000);
        }, 'Error: Token transfers can only be set for send token transactions');
      });
      it('a token transaction without token information', async () => {
        const txBuilder: any = getBuilder('cgld');

        txBuilder.type(TransactionType.SendToken);
        txBuilder.fee({
          fee: '10000000000',
          gasLimit: '2000000',
        });
        const source = {
          prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
        };
        const sourceKeyPair = new Eth.KeyPair(source);
        txBuilder.source(sourceKeyPair.getAddress());
        txBuilder.chainId(44786);
        txBuilder.counter(1);
        txBuilder.contract(testData.CONTRACT_TOKEN_CUSD_ADDRESS);
        await txBuilder.build().should.be.rejectedWith('Missing token transfer information');
      });
    });

    describe('send transaction', () => {
      it('should build a transaction without changes', async () => {
        const txBuilder: any = getBuilder('cgld');
        txBuilder.from(testData.SEND_TX_BROADCAST);
        const signedTx = await txBuilder.build();
        should.equal(signedTx.toBroadcastFormat(), testData.SEND_TX_BROADCAST);
      });
    });
  });
});
