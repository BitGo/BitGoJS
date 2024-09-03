import { BitGoAPI } from '@bitgo/sdk-api';
import { common, ECDSAMethodTypes, FullySignedTransaction, Recipient, TransactionType, Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { bip32 } from '@bitgo/utxo-lib';
import nock from 'nock';
import * as secp256k1 from 'secp256k1';
import * as should from 'should';
import { Polygon, Tpolygon, TransactionBuilder, TransferBuilder } from '../../src';
import { getBuilder } from '../getBuilder';
import * as mockData from '../fixtures/polygon';
import { OfflineVaultTxInfo, optionalDeps } from '@bitgo/abstract-eth';
import * as sjcl from '@bitgo/sjcl';

nock.enableNetConnect();

describe('Polygon', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let hopTxBitgoSignature;

  const address1 = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const address2 = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
  const hopContractAddress = '0x47ce7cc86efefef19f8fb516b11735d183da8635';
  const hopDestinationAddress = '0x9c7e8ce6825bD48278B3Ab59228EE26f8BE7925b';
  const hopTx =
    '0xf86b808504a817c8ff8252ff949c7e8ce6825bd48278b3ab59228ee26f8be7925b87038d7ea4c68000801ca011bc22c664570133dfca4f08a0b8d02339cf467046d6a4152f04f368d0eaf99ea01d6dc5cf0c897c8d4c3e1df53d0d042784c424536a4cc5b802552b7d64fee8b5';
  const hopTxid = '0x4af65143bc77da2b50f35b3d13cacb4db18f026bf84bc0743550bc57b9b53351';
  const userReqSig =
    '0x404db307f6147f0d8cd338c34c13906ef46a6faa7e0e119d5194ef05aec16e6f3d710f9b7901460f97e924066b62efd74443bd34402c6d40b49c203a559ff2c8';

  before(function () {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    hopTxBitgoSignature =
      '0xaa' +
      Buffer.from(secp256k1.ecdsaSign(Buffer.from(hopTxid.slice(2), 'hex'), bitgoKey.privateKey).signature).toString(
        'hex'
      );

    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo.safeRegister('polygon', Polygon.createInstance);
    bitgo.safeRegister('tpolygon', Tpolygon.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tpolygon');
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
    const txBuilder: TransactionBuilder = getBuilder('tpolygon') as TransactionBuilder;
    txBuilder.type(TransactionType.Send);
    txBuilder.fee({
      fee: gasPrice,
      gasLimit: gasLimit,
    });
    txBuilder.counter(nonce);
    txBuilder.contract(contractAddress);
    const transferBuilder = txBuilder.transfer() as TransferBuilder;

    transferBuilder
      .coin('tpolygon')
      .expirationTime(expireTime)
      .amount(amount)
      .to(destination)
      .contractSequenceId(contractSequenceId);

    return await txBuilder.build();
  };

  describe('Instantiate', () => {
    it('should instantiate the coin', function () {
      let localBasecoin = bitgo.coin('tpolygon');
      localBasecoin.should.be.an.instanceof(Tpolygon);

      localBasecoin = bitgo.coin('polygon');
      localBasecoin.should.be.an.instanceof(Polygon);
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
      const builder = getBuilder('tpolygon') as TransactionBuilder;
      builder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      builder.counter(1);
      builder.type(TransactionType.Send);
      builder.contract(account_1.address);
      builder.transfer().amount('1').to(account_2.address).expirationTime(10000).contractSequenceId(1);

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
      const builder = getBuilder('tpolygon') as TransactionBuilder;
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
      builder.transfer().amount('1').to(account_2.address).expirationTime(10000).contractSequenceId(1);

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
        coin: 'tpolygon',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should verify a hop txPrebuild from the bitgo server that matches the client txParams', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [{ amount: 1000000000000000, address: hopDestinationAddress }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
        hop: true,
      };

      const txPrebuild = {
        recipients: [{ amount: '5000000000000000', address: hopContractAddress }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tpolygon',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        hopTransaction: {
          tx: hopTx,
          id: hopTxid,
          signature: hopTxBitgoSignature,
          paymentId: '2773928196',
          gasPrice: 20000000000,
          gasLimit: 500000,
          amount: '1000000000000000',
          recipient: hopDestinationAddress,
          nonce: 0,
          userReqSig: userReqSig,
          gasPriceMax: 500000000000,
        },
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
        coin: 'tpolygon',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('missing params');
    });

    it('should reject txPrebuild that is both batch and hop', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [
          { amount: '1000000000000', address: address1 },
          { amount: '2500000000000', address: address2 },
        ],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
        hop: true,
      };

      const txPrebuild = {
        recipients: [{ amount: '3500000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'tpolygon',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        hopTransaction: {
          tx: hopTx,
          id: hopTxid,
          signature: hopTxBitgoSignature,
          paymentId: '2773928196',
          gasPrice: 20000000000,
          gasLimit: 500000,
          amount: '1000000000000000',
          recipient: hopDestinationAddress,
          nonce: 0,
          userReqSig: userReqSig,
          gasPriceMax: 500000000000,
        },
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('tx cannot be both a batch and hop transaction');
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
        coin: 'tpolygon',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('txPrebuild should only have 1 recipient but 2 found');
    });

    it('should reject a hop txPrebuild that does not send to its hop address', async function () {
      const wallet = new Wallet(bitgo, basecoin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000000', address: hopDestinationAddress }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
        hop: true,
      };

      const txPrebuild = {
        recipients: [{ amount: '5000000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'tpolygon',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
        hopTransaction: {
          tx: hopTx,
          id: hopTxid,
          signature: hopTxBitgoSignature,
          paymentId: '0',
          gasPrice: 20000000000,
          gasLimit: 500000,
          amount: '1000000000000000',
          recipient: hopDestinationAddress,
          nonce: 0,
          userReqSig: userReqSig,
          gasPriceMax: 500000000000,
        },
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('recipient address of txPrebuild does not match hop address');
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
        coin: 'tpolygon',
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
        coin: 'tpolygon',
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

  describe('Recover transaction:', function () {
    const baseUrl = 'https://api-amoy.polygonscan.com';
    const userXpub =
      'xpub661MyMwAqRbcEeTc8789MK5PUGEYiPG4F4V17n2Rd2LoTATA1XoCnJT5FAYAShQxSxtFjpo5NHmcWwTp2LiWGBMwpUcAA3HywhxivgYfq7q';
    const userXprv =
      'xprv9s21ZrQH143K2AP925b8zB8evEQ4JvYCsqZQKPcp4gopaN81TzUxEW8bPtVyDgjmddGhRRETn8xi1cVAB9bf1Bx9kGRRFgTZXxJayZLnag1';
    const backupXpub =
      'xpub661MyMwAqRbcFZX15xpZf4ERCGHiVSJm8r5C4yh1yXV2GrdZCUPYo4WQr6tN9oUywKXsgSHo7Risf9r22GH5joVD2hEEEhqnSCvK8qy11wW';
    const backupXprv =
      'xprv9s21ZrQH143K35SXywHZHvHgeETE5yaumd9bGbHQRBx3Q4JQew5JFGBvzqiZjCUkBdBUZnfuMDTGURRayN1hFSWxEJQsCEAMm1D3pk1h7Jj';

    it('should generate an unsigned sweep', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const backupKeyAddress = '0x4f2c4830cc37f2785c646f89ded8a919219fa0e9';
      nock(baseUrl)
        .get('/api')
        .twice()
        .query(mockData.getTxListRequest(backupKeyAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(backupKeyAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);
      const basecoin = bitgo.coin('tpolygon') as Polygon;
      const transaction = (await basecoin.recover({
        userKey: userXpub,
        backupKey: backupXpub,
        walletContractAddress: walletContractAddress,
        recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT as string,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
      })) as OfflineVaultTxInfo;
      should.exist(transaction);
      transaction.should.have.property('txHex');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipients');
      const recipient = transaction.recipients[0];
      recipient.should.have.property('address');
      recipient.address.should.equal(TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9999999999999999928');
    });

    it('should construct a recovery transaction without BitGo', async function () {
      const backupKeyAddress = '0x6d22efdd634996248170c948e5726007fc251bb3';
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(backupKeyAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(backupKeyAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);
      const basecoin = bitgo.coin('tpolygon') as Polygon;
      const transaction = (await basecoin.recover({
        userKey:
          '{"iv":"VFZ3jvXhxo1Z+Yaf2MtZnA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"p+fkHuLa/8k=","ct":"hYG7pvljLIgCjZ\n' +
          '53PBlCde5KZRmlUKKHLtDMk+HJfuU46hW+x+C9WsIAO4gFPnTCvFVmQ8x7czCtcNFub5AO2otOG\n' +
          'OsX4GE2gXOEmCl1TpWwwNhm7yMUjGJUpgW6ZZgXSXdDitSKi4V/hk78SGSzjFOBSPYRa6I="}\n',
        backupKey:
          '{"iv":"AbsCtv1qwPIhOgyrCpNagA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"5vpUDBUlzm8=","ct":"PapYYCjBXRLUKA\n' +
          'JbOsB/EJ9B8fUmVQTxMPjUnQyAky12me9K66GiMEAxTD7kd6bYAQJuuTkATXKU7Bnf7vK9JxNOw\n' +
          'oji7HF9eFH0aD4/hX5SWFfHF2Qfi+TnXv6hVsMAoisDZs3/F67/ZUaDYR0ZsdrQ4Q/cLD0="}\n',

        walletContractAddress: walletContractAddress,
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT as string,
        gasLimit: 500000,
      })) as OfflineVaultTxInfo;
      should.exist(transaction);
      transaction.should.have.property('tx');
      transaction.should.have.property('id');
      const decodedTx = optionalDeps.EthTx.Transaction.fromSerializedTx(optionalDeps.ethUtil.toBuffer(transaction.tx));
      decodedTx.should.have.property('gasPrice');
      decodedTx.should.have.property('nonce');
      decodedTx.should.have.property('to');
    });

    xit('should construct a recovery tx with TSS', async function () {
      const backupKeyAddress = '0xe7406dc43d13f698fb41a345c7783d39a4c2d191';
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(backupKeyAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(backupKeyAddress))
        .reply(200, mockData.getBalanceResponse);

      const basecoin = bitgo.coin('tpolygon') as Polygon;
      const userKey = mockData.keyShares.userKeyShare;
      const backupKey = mockData.keyShares.backupKeyShare;
      const bitgoKey = mockData.keyShares.bitgoKeyShare;

      const userSigningMaterial: ECDSAMethodTypes.SigningMaterial = {
        pShare: userKey.pShare,
        backupNShare: backupKey.nShares[1],
        bitgoNShare: bitgoKey.nShares[1],
      };

      const backupSigningMaterial: ECDSAMethodTypes.SigningMaterial = {
        pShare: backupKey.pShare,
        userNShare: userKey.nShares[2],
        bitgoNShare: bitgoKey.nShares[2],
      };

      const encryptedBackupSigningMaterial = sjcl.encrypt(
        TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        JSON.stringify(backupSigningMaterial)
      );
      const encryptedUserSigningMaterial = sjcl.encrypt(
        TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        JSON.stringify(userSigningMaterial)
      );

      const recoveryParams = {
        userKey: encryptedUserSigningMaterial,
        backupKey: encryptedBackupSigningMaterial,
        walletContractAddress: '0xe7406dc43d13f698fb41a345c7783d39a4c2d191',
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        isTss: true,
      };

      const recovery = await basecoin.recover(recoveryParams);
      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    });

    it('should construct an unsigned sweep tx with TSS', async function () {
      const backupKeyAddress = '0xe7406dc43d13f698fb41a345c7783d39a4c2d191';
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(backupKeyAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(backupKeyAddress))
        .reply(200, mockData.getBalanceResponse);

      const basecoin = bitgo.coin('tpolygon') as Polygon;

      const userKey = '03f8606a595917de4cf2244e27b7fba172505469392ad385d2dd2b3588a6bb878c';
      const backupKey = '03f8606a595917de4cf2244e27b7fba172505469392ad385d2dd2b3588a6bb878c';

      const recoveryParams = {
        userKey: userKey,
        backupKey: backupKey,
        walletContractAddress: '0xe7406dc43d13f698fb41a345c7783d39a4c2d191',
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        isTss: true,
        gasPrice: 20000000000,
        gasLimit: 500000,
        replayProtectionOptions: {
          chain: 80002,
          hardfork: 'london',
        },
      };

      const transaction = (await basecoin.recover(recoveryParams)) as OfflineVaultTxInfo;
      should.exist(transaction);
      transaction.should.have.property('tx');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('gasPrice');
      transaction.gasPrice.should.equal('20000000000');
      transaction.should.have.property('recipient');
      const recipient = (transaction as any).recipient as Recipient;
      recipient.should.have.property('address');
      recipient.address.should.equal('0xac05da78464520aa7c9d4c19bd7a440b111b3054');
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9989999999999999928');
    });

    it('should be able to second sign', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const backupKeyAddress = '0x4f2c4830cc37f2785c646f89ded8a919219fa0e9';
      nock(baseUrl)
        .get('/api')
        .twice()
        .query(mockData.getTxListRequest(backupKeyAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(backupKeyAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);
      const basecoin = bitgo.coin('tpolygon') as Polygon;
      const transaction = (await basecoin.recover({
        userKey: userXpub,
        backupKey: backupXpub,
        walletContractAddress: walletContractAddress,
        recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT as string,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        replayProtectionOptions: { chain: 80002, hardfork: 'london' },
        gasLimit: 500000,
      })) as OfflineVaultTxInfo;

      const txPrebuild = {
        txHex: transaction.txHex,
      };

      const params = {
        txPrebuild,
        prv: userXprv,
      };
      // sign transaction once
      const halfSigned = await basecoin.signTransaction(params as any);
      const halfSignedParams = {
        txPrebuild: halfSigned,
        isLastSignature: true,
        walletContractAddress: walletContractAddress,
        prv: backupXprv,
      };

      const finalSigned = (await basecoin.signTransaction(halfSignedParams as any)) as FullySignedTransaction;
      finalSigned.should.have.property('txHex');
      const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
      txBuilder.from(finalSigned.txHex);
      const rebuiltTx = await txBuilder.build();
      rebuiltTx.signature.length.should.equal(2);
      rebuiltTx.outputs.length.should.equal(1);
    });
  });

  describe('Evm Based Cross Chain Recovery transaction:', function () {
    const baseUrl = 'https://api-amoy.polygonscan.com';
    const userXpub =
      'xpub661MyMwAqRbcEeTc8789MK5PUGEYiPG4F4V17n2Rd2LoTATA1XoCnJT5FAYAShQxSxtFjpo5NHmcWwTp2LiWGBMwpUcAA3HywhxivgYfq7q';
    const bitgoFeeAddress = '0x33a42faea3c6e87021347e51700b48aaf49aa1e7';
    const destinationAddress = '0xd5adde17fed8baed3f32b84af05b8f2816f7b560';
    const bitgoDestinationAddress = '0xe5986ce4490deb67d2950562ceb930ddf9be7a14';
    it('should generate an unsigned recovery txn for cold wallet', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;

      const basecoin = bitgo.coin('tpolygon') as Polygon;
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(bitgoFeeAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(bitgoFeeAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const transaction = (await basecoin.recover({
        userKey: userXpub,
        backupKey: '',
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');
      transaction.should.have.property('userKey');
      transaction.should.have.property('coin');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('isEvmBasedCrossChainRecovery');
      transaction.isEvmBasedCrossChainRecovery?.should.equal(true);
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipients');
      const recipient = transaction.recipients[0];
      recipient.should.have.property('address');
      recipient.address.should.equal(destinationAddress);
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9999999999999999928');
    });

    it('should generate an unsigned recovery txn for custody wallet', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;

      const basecoin = bitgo.coin('tpolygon') as Polygon;
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(bitgoFeeAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(bitgoFeeAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const transaction = (await basecoin.recover({
        userKey: '',
        backupKey: '',
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');
      transaction.should.have.property('coin');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('isEvmBasedCrossChainRecovery');
      transaction.isEvmBasedCrossChainRecovery?.should.equal(true);
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipients');
      const recipient = transaction.recipients[0];
      recipient.should.have.property('address');
      recipient.address.should.equal(destinationAddress);
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9999999999999999928');
    });

    it('should generate an unsigned recovery txn for hot wallet', async function () {
      const userKey =
        '{"iv":"VFZ3jvXhxo1Z+Yaf2MtZnA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"p+fkHuLa/8k=","ct":"hYG7pvljLIgCjZ\n' +
        '53PBlCde5KZRmlUKKHLtDMk+HJfuU46hW+x+C9WsIAO4gFPnTCvFVmQ8x7czCtcNFub5AO2otOG\n' +
        'OsX4GE2gXOEmCl1TpWwwNhm7yMUjGJUpgW6ZZgXSXdDitSKi4V/hk78SGSzjFOBSPYRa6I="}\n';
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const walletPassphrase = TestBitGo.V2.TEST_RECOVERY_PASSCODE as string;

      const basecoin = bitgo.coin('tpolygon') as Polygon;
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(bitgoFeeAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(bitgoFeeAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const transaction = (await basecoin.recover({
        userKey: userKey,
        backupKey: '',
        walletPassphrase: walletPassphrase,
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');
      transaction.should.have.property('coin');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('isEvmBasedCrossChainRecovery');
      transaction.isEvmBasedCrossChainRecovery?.should.equal(true);
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipients');
      const recipient = transaction.recipients[0];
      recipient.should.have.property('address');
      recipient.address.should.equal(destinationAddress);
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9999999999999999928');
      transaction.should.have.property('feesUsed');
      transaction.feesUsed?.gasLimit.should.equal('500000');
      transaction.should.have.property('halfSigned');
      transaction.halfSigned?.should.have.property('txHex');
      transaction.halfSigned?.should.have.property('recipients');
    });

    it('should generate an unsigned recovery txn of a token for cold wallet ', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const tokenContractAddress = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb'; // tpolygon-link contract token address

      const basecoin = bitgo.coin('tpolygon') as Polygon;
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(bitgoFeeAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(bitgoFeeAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTokenBalanceRequest(tokenContractAddress, walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const transaction = (await basecoin.recover({
        userKey: userXpub,
        backupKey: '',
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
        tokenContractAddress: tokenContractAddress,
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');

      const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
      txBuilder.from(transaction.txHex);
      const rebuiltTx = await txBuilder.build();
      const rebuiltTxJson = rebuiltTx.toJson();
      rebuiltTxJson.should.have.property('data');
      rebuiltTxJson.data.should.startWith('0x0dcd7a6c'); // sendMultiSigToken func

      transaction.should.have.property('userKey');
      transaction.should.have.property('coin');
      transaction.coin.should.equal('tpolygon:link');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('isEvmBasedCrossChainRecovery');
      transaction.isEvmBasedCrossChainRecovery?.should.equal(true);
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipients');
      const recipient = transaction.recipients[0];
      recipient.should.have.property('address');
      recipient.address.should.equal(destinationAddress);
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9999999999999999928');
    });

    it('should generate an unsigned recovery txn of a token for custody wallet', async function () {
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const tokenContractAddress = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb'; // tpolygon-link contract token address

      const basecoin = bitgo.coin('tpolygon') as Polygon;
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(bitgoFeeAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(bitgoFeeAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTokenBalanceRequest(tokenContractAddress, walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const transaction = (await basecoin.recover({
        userKey: '',
        backupKey: '',
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
        tokenContractAddress: tokenContractAddress,
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');

      const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
      txBuilder.from(transaction.txHex);
      const rebuiltTx = await txBuilder.build();
      const rebuiltTxJson = rebuiltTx.toJson();
      rebuiltTxJson.should.have.property('data');
      rebuiltTxJson.data.should.startWith('0x0dcd7a6c'); // sendMultiSigToken func

      transaction.should.have.property('coin');
      transaction.coin.should.equal('tpolygon:link');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('isEvmBasedCrossChainRecovery');
      transaction.isEvmBasedCrossChainRecovery?.should.equal(true);
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipients');
      const recipient = transaction.recipients[0];
      recipient.should.have.property('address');
      recipient.address.should.equal(destinationAddress);
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9999999999999999928');
    });

    it('should generate an unsigned recovery txn of a token for hot wallet', async function () {
      const userKey =
        '{"iv":"VFZ3jvXhxo1Z+Yaf2MtZnA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"p+fkHuLa/8k=","ct":"hYG7pvljLIgCjZ\n' +
        '53PBlCde5KZRmlUKKHLtDMk+HJfuU46hW+x+C9WsIAO4gFPnTCvFVmQ8x7czCtcNFub5AO2otOG\n' +
        'OsX4GE2gXOEmCl1TpWwwNhm7yMUjGJUpgW6ZZgXSXdDitSKi4V/hk78SGSzjFOBSPYRa6I="}\n';
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const walletPassphrase = TestBitGo.V2.TEST_RECOVERY_PASSCODE as string;
      const tokenContractAddress = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb'; // tpolygon-link contract token address

      const basecoin = bitgo.coin('tpolygon') as Polygon;
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTxListRequest(bitgoFeeAddress))
        .reply(200, mockData.getTxListResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getBalanceRequest(bitgoFeeAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl)
        .get('/api')
        .query(mockData.getTokenBalanceRequest(tokenContractAddress, walletContractAddress))
        .reply(200, mockData.getBalanceResponse);
      nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

      const transaction = (await basecoin.recover({
        userKey: userKey,
        backupKey: '',
        walletPassphrase: walletPassphrase,
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
        tokenContractAddress: tokenContractAddress,
      })) as OfflineVaultTxInfo;

      should.exist(transaction);
      transaction.should.have.property('txHex');

      const txBuilder = getBuilder('tpolygon') as TransactionBuilder;
      txBuilder.from(transaction.txHex);
      const rebuiltTx = await txBuilder.build();
      const rebuiltTxJson = rebuiltTx.toJson();
      rebuiltTxJson.should.have.property('data');
      rebuiltTxJson.data.should.startWith('0x0dcd7a6c'); // sendMultiSigToken func

      transaction.should.have.property('coin');
      transaction.coin.should.equal('tpolygon:link');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('isEvmBasedCrossChainRecovery');
      transaction.isEvmBasedCrossChainRecovery?.should.equal(true);
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipients');
      const recipient = transaction.recipients[0];
      recipient.should.have.property('address');
      recipient.address.should.equal(destinationAddress);
      recipient.should.have.property('amount');
      recipient.amount.should.equal('9999999999999999928');
      transaction.should.have.property('feesUsed');
      transaction.feesUsed?.gasLimit.should.equal('500000');
      transaction.should.have.property('halfSigned');
      transaction.halfSigned?.should.have.property('txHex');
      transaction.halfSigned?.should.have.property('recipients');
    });
  });
});
