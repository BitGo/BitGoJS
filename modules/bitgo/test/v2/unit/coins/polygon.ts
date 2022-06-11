import { decorate } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { Polygon } from '../../../../src/v2/coins/polygon';
import { Tpolygon } from '../../../../src/v2/coins/tpolygon';
import { getBuilder, Polygon as PolygonAccountLib } from '@bitgo/account-lib';
import * as secp256k1 from 'secp256k1';
import * as bip32 from 'bip32';
import * as nock from 'nock';

import * as should from 'should';
import { common, TransactionType, Wallet } from '@bitgo/sdk-core';

nock.enableNetConnect();

describe('Polygon', function () {
  let bitgo;
  let tpolygonCoin;
  let hopTxBitgoSignature;

  const address1 = '0x174cfd823af8ce27ed0afee3fcf3c3ba259116be';
  const address2 = '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6';
  const hopContractAddress = '0x47ce7cc86efefef19f8fb516b11735d183da8635';
  const hopDestinationAddress = '0x9c7e8ce6825bD48278B3Ab59228EE26f8BE7925b';
  const hopTx = '0xf86b808504a817c8ff8252ff949c7e8ce6825bd48278b3ab59228ee26f8be7925b87038d7ea4c68000801ca011bc22c664570133dfca4f08a0b8d02339cf467046d6a4152f04f368d0eaf99ea01d6dc5cf0c897c8d4c3e1df53d0d042784c424536a4cc5b802552b7d64fee8b5';
  const hopTxid = '0x4af65143bc77da2b50f35b3d13cacb4db18f026bf84bc0743550bc57b9b53351';
  const userReqSig = '0x404db307f6147f0d8cd338c34c13906ef46a6faa7e0e119d5194ef05aec16e6f3d710f9b7901460f97e924066b62efd74443bd34402c6d40b49c203a559ff2c8';

  before(function () {
    const bitgoKeyXprv = 'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    hopTxBitgoSignature = '0xaa' + Buffer.from(secp256k1.ecdsaSign(Buffer.from(hopTxid.slice(2), 'hex'), bitgoKey.privateKey).signature).toString('hex');

    const env = 'test';
    bitgo = decorate(BitGo, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo.initializeTestVars();
  });

  after(function () {
    nock.cleanAll();
  });

  beforeEach(() => {
    tpolygonCoin = bitgo.coin('tpolygon') as Tpolygon;
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
    const txBuilder: PolygonAccountLib.TransactionBuilder = getBuilder('tpolygon') as PolygonAccountLib.TransactionBuilder;
    txBuilder.type(TransactionType.Send);
    txBuilder.fee({
      fee: gasPrice,
      gasLimit: gasLimit,
    });
    txBuilder.counter(nonce);
    txBuilder.contract(contractAddress);
    const transferBuilder = txBuilder.transfer() as PolygonAccountLib.TransferBuilder;

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
      await tpolygonCoin.explainTransaction(explainParams).should.be.rejectedWith('missing explain tx parameters');
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
      const explanation = await tpolygonCoin.explainTransaction(explainParams);
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

    const userKeychain = {
      prv: 'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g',
      pub: 'xpub661MyMwAqRbcGBjE5QG7pkf9cZD33UUD6K46q7ELrbuG7FqXfLNGiXYGHeEnGBb5AWREnk1eA28g8ArZvURbhshXWkTtddHRo54fgyVvLdb',
      rawPub: '023636e68b7b204573abda2616aff6b584910dece2543f1cc6d842caac7d74974b',
      rawPrv: '7438a50010ce7b1dfd86e68046cc78ba1ebd242d6d85d9904d3fcc08734bc172',
    };

    it('should sign an unsigned test tx', async function () {
      const coin = bitgo.coin('tpolygon');

      const halfSignedTransaction = await coin.signTransaction({
        txPrebuild: {
          isBatch: false,
          recipients: [{
            amount: '1',
            address: account_1.address,
          }],
          expireTime: 1627949214,
          contractSequenceId: 1,
          gasLimit: 7000000,
          gasPrice: 280000000000,
          hopTransaction: undefined,
          backupKeyNonce: undefined,
          sequenceId: undefined,
          nextContractSequenceId: 0,
        },
        prv: userKeychain.prv,
      });

      halfSignedTransaction.halfSigned.recipients.length.should.equals(1);
      halfSignedTransaction.halfSigned.recipients[0].address.toLowerCase().should.equals(account_1.address.toLowerCase());
      halfSignedTransaction.halfSigned.recipients[0].amount.toLowerCase().should.equals('1');
    });

    it('should sign a transaction with EIP1559 fee params', async function () {
      const coin = bitgo.coin('tpolygon');

      const halfSignedTransaction = await coin.signTransaction({
        txPrebuild: {
          eip1559: { maxPriorityFeePerGas: 10, maxFeePerGas: 10 },
          isBatch: false,
          recipients: [{
            amount: '1',
            address: account_1.address,
          }],
          expireTime: 1627949214,
          contractSequenceId: 12,
          gasLimit: undefined,
          gasPrice: undefined,
          hopTransaction: undefined,
          backupKeyNonce: undefined,
          sequenceId: undefined,
          nextContractSequenceId: 0,
        },
        prv: userKeychain.prv,
      });

      halfSignedTransaction.halfSigned.recipients.length.should.equals(1);
      halfSignedTransaction.halfSigned.recipients[0].address.toLowerCase().should.equals(account_1.address.toLowerCase());
      halfSignedTransaction.halfSigned.recipients[0].amount.toLowerCase().should.equals('1');

      halfSignedTransaction.halfSigned.eip1559.maxPriorityFeePerGas.should.equal(10);
      halfSignedTransaction.halfSigned.eip1559.maxFeePerGas.should.equal(10);
    });

  });

  describe('Transaction Verification', function () {

    it('should verify a normal txPrebuild from the bitgo server that matches the client txParams', async function () {
      const coin = bitgo.coin('tpolygon');
      const wallet = new Wallet(bitgo, coin, {});

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

      const isTransactionVerified = await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should verify a hop txPrebuild from the bitgo server that matches the client txParams', async function () {
      const coin = bitgo.coin('tpolygon');
      const wallet = new Wallet(bitgo, coin, {});

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

      const isTransactionVerified = await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should reject when client txParams are missing', async function () {
      const coin = bitgo.coin('tpolygon');
      const wallet = new Wallet(bitgo, coin, {});

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

      await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('missing params');
    });

    it('should reject txPrebuild that is both batch and hop', async function () {
      const coin = bitgo.coin('tpolygon');
      const wallet = new Wallet(bitgo, coin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }, { amount: '2500000000000', address: address2 }],
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

      await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('tx cannot be both a batch and hop transaction');
    });

    it('should reject a txPrebuild with more than one recipient', async function () {
      const coin = bitgo.coin('tpolygon');
      const wallet = new Wallet(bitgo, coin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: address1 }, { amount: '2500000000000', address: address2 }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }, { amount: '2500000000000', address: address2 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'tpolygon',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('txPrebuild should only have 1 recipient but 2 found');
    });

    it('should reject a hop txPrebuild that does not send to its hop address', async function () {
      const coin = bitgo.coin('tpolygon');
      const wallet = new Wallet(bitgo, coin, {});

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

      await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('recipient address of txPrebuild does not match hop address');
    });

    it('should reject a normal txPrebuild from the bitgo server with the wrong amount', async function () {
      const coin = bitgo.coin('tpolygon');
      const wallet = new Wallet(bitgo, coin, {});

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

      await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client');
    });

    it('should reject a normal txPrebuild from the bitgo server with the wrong recipient', async function () {
      const coin = bitgo.coin('tpolygon');
      const wallet = new Wallet(bitgo, coin, {});

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

      await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('destination address in normal txPrebuild does not match that in txParams supplied by client');
    });

    it('should reject a txPrebuild from the bitgo server with the wrong coin', async function () {
      const coin = bitgo.coin('tpolygon');
      const wallet = new Wallet(bitgo, coin, {});

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

      await coin.verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('coin in txPrebuild did not match that in txParams supplied by client');
    });

  });

});
