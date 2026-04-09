import * as should from 'should';
import { bip32 } from '@bitgo/secp256k1';
import { common, TransactionType, Wallet } from '@bitgo/sdk-core';
import nock from 'nock';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Bera, Tbera, TransactionBuilder, TransferBuilder } from '../../src';
import { getBuilder } from '../getBuilder';

nock.enableNetConnect();

describe('Bera', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  const address1 = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const address2 = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';

  before(function () {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();

    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;

    bitgo.safeRegister('bera', Bera.createInstance);
    bitgo.safeRegister('tbera', Tbera.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbera');
  });

  after(function () {
    nock.cleanAll();
  });

  /**
   * Build an unsigned account-lib multi-signature send transactino
   * @param destination The destination address of the transaction
   * @param contractAddress The address of the smart contract processing the transaction
   * @param contractSequenceId The sequence id of the contract
   * @param nonce The nonce of the sending address
   * @param expireTime The expire time of the transaction
   * @param amount The amount to send to the recipient
   * @param gasPrice The gas price of the transaction
   * @param gasLimit The gas limit of the transaction
   */
  const buildUnsignedTransaction = async function ({
    destination,
    contractAddress,
    contractSequenceId = 1,
    nonce = 0,
    expireTime = Math.floor(new Date().getTime() / 1000),
    amount = '100000',
    gasPrice = '10000',
    gasLimit = '20000',
  }) {
    const txBuilder: TransactionBuilder = getBuilder('tbera') as TransactionBuilder;
    txBuilder.type(TransactionType.Send);
    txBuilder.fee({
      fee: gasPrice,
      gasLimit: gasLimit,
    });
    txBuilder.counter(nonce);
    txBuilder.contract(contractAddress);
    const transferBuilder = txBuilder.transfer() as TransferBuilder;

    transferBuilder
      .coin('tbera')
      .expirationTime(expireTime)
      .amount(amount)
      .to(destination)
      .contractSequenceId(contractSequenceId);

    return await txBuilder.build();
  };

  describe('Basic Coin Info', function () {
    it('should return the right info for bera', function () {
      const bera = bitgo.coin('bera');

      bera.should.be.an.instanceof(Bera);
      bera.getChain().should.equal('bera');
      bera.getFamily().should.equal('bera');
      bera.getFullName().should.equal('Bera');
      bera.getBaseFactor().should.equal(1e18);
    });

    it('should return the right info for tbera', function () {
      const tbera = bitgo.coin('tbera');

      tbera.should.be.an.instanceof(Tbera);
      tbera.getChain().should.equal('tbera');
      tbera.getFamily().should.equal('bera');
      tbera.getFullName().should.equal('Testnet Berachain');
      tbera.getBaseFactor().should.equal(1e18);
    });
  });

  describe('Explain transaction:', () => {
    it('should fail if the options object is missing parameters', async function () {
      const explainParams = {
        feeInfo: { fee: 1 },
        txHex: null,
      };
      await basecoin.explainTransaction(explainParams).should.be.rejectedWith('missing explain tx parameters');
    });

    it('explain a transfer transaction', async function () {
      const destination = '0xfaa8f14f46a99eb439c50e0c3b835cc21dad51b4';
      const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';

      const unsignedTransaction = await buildUnsignedTransaction({
        destination,
        contractAddress,
      });

      const explainParams = {
        halfSigned: {
          txHex: unsignedTransaction.toBroadcastFormat(),
        },
        feeInfo: { fee: 1 },
      };
      const explanation = await basecoin.explainTransaction(explainParams);
      should.exist(explanation.id);
    });
  });

  describe('Sign Transaction', () => {
    const account_1 = {
      address: '0x8Ce59c2d1702844F8EdED451AA103961bC37B4e8',
      owner_1: '4ee089aceabf3ddbf748db79b1066c33b7d3ea1ab3eb7e325121bba2bff2f5ca',
      owner_2: '5c7e4efff7304d4dfff6d5f1591844ec6f2adfa6a47e9fece6a3c1a4d755f1e3',
      owner_3: '4421ab25dd91e1a3180d03d57c323a7886dcc313d3b3a4b4256a5791572bf597',
    };

    const account_2 = {
      address: '0xeeaf0F05f37891ab4a21208B105A0687d12c5aF7',
      owner_1: '4ee089aceabf3ddbf748db79b1066c33b7d3ea1ab3eb7e325121bba2bff2f5ca',
      owner_2: '5ca116d25aec5f765465432cc421ff25ef9ffdc330b10bb3d9ad61e3baad88d7',
      owner_3: '1fae946cc84af8bd74d610a88537e24e19c3349d478d86fc5bb59ba4c88fb9cc',
    };

    it('should sign an unsigned test tx', async function () {
      const builder = getBuilder('tbera') as TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      builder.counter(1);
      builder.type(TransactionType.Send);
      builder.contract(account_1.address);
      const transferBuilder = builder.transfer() as TransferBuilder;
      transferBuilder.coin('tbera').amount('1').to(account_2.address).expirationTime(10000).contractSequenceId(1);

      const unsignedTx = await builder.build();
      const unsignedTxForBroadcasting = unsignedTx.toBroadcastFormat();

      const halfSignedRawTx = await basecoin.signTransaction({
        txPrebuild: {
          txHex: unsignedTxForBroadcasting,
        },
        prv: account_1.owner_2,
      });

      builder.transfer().key(account_1.owner_2);
      const halfSignedTx = await builder.build();
      const halfSignedTxForBroadcasting = halfSignedTx.toBroadcastFormat();

      halfSignedRawTx.halfSigned.txHex.should.equals(halfSignedTxForBroadcasting);
      halfSignedRawTx.halfSigned.recipients.length.should.equals(1);
      halfSignedRawTx.halfSigned.recipients[0].address.toLowerCase().should.equals(account_2.address.toLowerCase());
      halfSignedRawTx.halfSigned.recipients[0].amount.toLowerCase().should.equals('1');
    });

    it('should sign an unsigned test tx with eip1559', async function () {
      const builder = getBuilder('tbera') as TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
        eip1559: {
          maxFeePerGas: '7593123',
          maxPriorityFeePerGas: '150',
        },
      });
      builder.counter(1);
      builder.type(TransactionType.Send);
      builder.contract(account_1.address);
      const transferBuilder = builder.transfer() as TransferBuilder;
      transferBuilder.coin('tbera').amount('1').to(account_2.address).expirationTime(10000).contractSequenceId(1);

      const unsignedTx = await builder.build();
      const unsignedTxForBroadcasting = unsignedTx.toBroadcastFormat();

      const halfSignedRawTx = await basecoin.signTransaction({
        txPrebuild: {
          txHex: unsignedTxForBroadcasting,
          eip1559: {
            maxFeePerGas: '7593123',
            maxPriorityFeePerGas: '150',
          },
        },
        prv: account_1.owner_2,
      });

      builder.transfer().key(account_1.owner_2);
      const halfSignedTx = await builder.build();
      const halfSignedTxForBroadcasting = halfSignedTx.toBroadcastFormat();

      halfSignedRawTx.halfSigned.txHex.should.equals(halfSignedTxForBroadcasting);
      halfSignedRawTx.halfSigned.recipients.length.should.equals(1);
      halfSignedRawTx.halfSigned.recipients[0].address.toLowerCase().should.equals(account_2.address.toLowerCase());
      halfSignedRawTx.halfSigned.recipients[0].amount.toLowerCase().should.equals('1');
      halfSignedRawTx.halfSigned.eip1559.maxFeePerGas.should.equal('7593123');
      halfSignedRawTx.halfSigned.eip1559.maxPriorityFeePerGas.should.equal('150');
    });
  });

  describe('Transaction Verification', function () {
    it('should verify a normal txPrebuild from the bitgo server that matches the client txParams', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tbera',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should reject when client txParams are missing', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = null;

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tbera',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('missing params');
    });

    it('should reject a txPrebuild with more than one recipient', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [
          { amount: '1000000000000', address: address1 },
          { amount: '2500000000000', address: address2 },
        ],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [
          { amount: '1000000000000', address: address1 },
          { amount: '2500000000000', address: address2 },
        ],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'tbera',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith(
          `tbera doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
        );
    });

    it('should reject a normal txPrebuild from the bitgo server with the wrong amount', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '2000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tbera',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith(
          'normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
    });

    it('should reject a normal txPrebuild from the bitgo server with the wrong recipient', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address2 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tbera',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith(
          'destination address in normal txPrebuild does not match that in txParams supplied by client'
        );
    });

    it('should reject a txPrebuild from the bitgo server with the wrong coin', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'btc',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('coin in txPrebuild did not match that in txParams supplied by client');
    });
  });
});
