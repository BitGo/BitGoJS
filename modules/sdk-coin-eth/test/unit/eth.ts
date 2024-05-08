import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import nock from 'nock';
import sinon from 'sinon';
import { bip32 } from '@bitgo/utxo-lib';
import * as secp256k1 from 'secp256k1';
import {
  common,
  InvalidAddressError,
  InvalidAddressVerificationObjectPropertyError,
  TransactionType,
  UnexpectedAddressError,
  Wallet,
} from '@bitgo/sdk-core';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AbstractEthLikeNewCoins, Erc20Token, Hteth, Teth, TransactionBuilder, TransferBuilder } from '../../src';
import { EthereumNetwork } from '@bitgo/statics';
import assert from 'assert';
import { getBuilder } from './getBuilder';
import * as testData from '../resources/eth';
import * as mockData from '../fixtures/eth';

nock.enableNetConnect();

describe('ETH:', function () {
  let bitgo: TestBitGoAPI;
  let hopTxBitgoSignature;
  let sandbox: sinon.SinonSandbox;

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
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    Erc20Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.safeRegister('teth', Teth.createInstance);
    bitgo.safeRegister('hteth', Hteth.createInstance);
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo.initializeTestVars();
    sandbox = sinon.createSandbox();
  });

  after(function () {
    nock.cleanAll();
    sandbox.restore();
  });

  describe('EIP1559', function () {
    it('should sign a transaction with EIP1559 fee params', async function () {
      const coin = bitgo.coin('teth') as Teth;

      const userKeychain = {
        prv: 'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g',
        pub: 'xpub661MyMwAqRbcGBjE5QG7pkf9cZD33UUD6K46q7ELrbuG7FqXfLNGiXYGHeEnGBb5AWREnk1eA28g8ArZvURbhshXWkTtddHRo54fgyVvLdb',
        rawPub: '023636e68b7b204573abda2616aff6b584910dece2543f1cc6d842caac7d74974b',
        rawPrv: '7438a50010ce7b1dfd86e68046cc78ba1ebd242d6d85d9904d3fcc08734bc172',
      };

      const halfSignedTransaction = await coin.signTransaction({
        txPrebuild: {
          eip1559: { maxPriorityFeePerGas: 10, maxFeePerGas: 10 },
          isBatch: false,
          recipients: [
            {
              amount: '42',
              address: '0xc93b13642d93b4218bb85f67317d6b37286e8028',
            },
          ],
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
      } as any);

      (halfSignedTransaction as any).halfSigned.eip1559.maxPriorityFeePerGas.should.equal(10);
      (halfSignedTransaction as any).halfSigned.eip1559.maxFeePerGas.should.equal(10);
    });

    it('should sign a transaction with EIP1559 fee params for CCR', async function () {
      const coin = bitgo.coin('hteth') as Hteth;
      const signTransaction = sinon.spy(AbstractEthLikeNewCoins.prototype, 'signTransaction');

      const userKeychain = {
        prv: 'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g',
        pub: 'xpub661MyMwAqRbcGBjE5QG7pkf9cZD33UUD6K46q7ELrbuG7FqXfLNGiXYGHeEnGBb5AWREnk1eA28g8ArZvURbhshXWkTtddHRo54fgyVvLdb',
        rawPub: '023636e68b7b204573abda2616aff6b584910dece2543f1cc6d842caac7d74974b',
        rawPrv: '7438a50010ce7b1dfd86e68046cc78ba1ebd242d6d85d9904d3fcc08734bc172',
      };
      const txBuilder = getBuilder('hteth') as TransactionBuilder;
      txBuilder.type(TransactionType.Send);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      const key = testData.KEYPAIR_PRV.getKeys().prv as string;
      const transferBuilder = txBuilder.transfer() as TransferBuilder;
      transferBuilder
        .amount('0')
        .to('0x19645032c7f1533395d44a629462e751084d3e4c')
        .expirationTime(1590066728)
        .contractSequenceId(5)
        .key(key);
      txBuilder.contract(address1);
      const tx = await txBuilder.build();

      const halfSignedTransaction = await coin.signTransaction({
        txPrebuild: {
          eip1559: { maxPriorityFeePerGas: 10, maxFeePerGas: 10 },
          isBatch: false,
          recipients: [
            {
              amount: '42',
              address: '0xc93b13642d93b4218bb85f67317d6b37286e8028',
            },
          ],
          expireTime: 1627949214,
          contractSequenceId: 12,
          gasLimit: undefined,
          gasPrice: undefined,
          hopTransaction: undefined,
          backupKeyNonce: undefined,
          sequenceId: undefined,
          nextContractSequenceId: 0,
          txHex: tx.toBroadcastFormat(),
        },
        prv: userKeychain.prv,
        isEvmBasedCrossChainRecovery: true,
      } as any);

      assert((halfSignedTransaction as any).halfSigned.txHex);
      assert.strictEqual((halfSignedTransaction as any).halfSigned.eip1559.maxFeePerGas, 10);

      sandbox.assert.calledOnce(signTransaction);
    });
  });

  describe('Transaction Verification', function () {
    it('should verify a normal txPrebuild from the bitgo server that matches the client txParams', async function () {
      const coin = bitgo.coin('teth') as Teth;
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
        coin: 'teth',
        wallet: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      const isTransactionVerified = await coin.verifyTransaction({
        txParams,
        txPrebuild: txPrebuild as any,
        wallet,
        verification,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should verify a batch txPrebuild from the bitgo server that matches the client txParams', async function () {
      const coin = bitgo.coin('teth') as Teth;
      const wallet = new Wallet(bitgo, coin, {});

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
          { amount: '3500000000000', address: (coin?.staticsCoin?.network as EthereumNetwork).batcherContractAddress },
        ],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'teth',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      const isTransactionVerified = await coin.verifyTransaction({
        txParams,
        txPrebuild: txPrebuild as any,
        wallet,
        verification,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should verify ENS address resolution changing recipient address in client txParams', async function () {
      const coin = bitgo.coin('teth') as Teth;
      const wallet = new Wallet(bitgo, coin, {});

      const txParams = {
        recipients: [{ amount: '1000000000000', address: 'bitgotestwallet.eth' }],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: '0x40a663963810449d6e72533657a74f112c3b901a' }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'teth',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      const isTransactionVerified = await coin.verifyTransaction({
        txParams,
        txPrebuild: txPrebuild as any,
        wallet,
        verification,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should verify a hop txPrebuild from the bitgo server that matches the client txParams', async function () {
      const coin = bitgo.coin('teth') as Teth;
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
        coin: 'teth',
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

      const isTransactionVerified = await coin.verifyTransaction({
        txParams,
        txPrebuild: txPrebuild as any,
        wallet,
        verification,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should reject when client txParams are missing', async function () {
      const coin = bitgo.coin('teth') as Teth;
      const wallet = new Wallet(bitgo, coin, {});

      const txParams = null;

      const txPrebuild = {
        recipients: [{ amount: '1000000000000', address: address1 }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: false,
        coin: 'teth',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await coin
        .verifyTransaction({ txParams: txParams as any, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('missing params');
    });

    it('should reject txPrebuild that is both batch and hop', async function () {
      const coin = bitgo.coin('teth') as Teth;
      const wallet = new Wallet(bitgo, coin, {});

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
        coin: 'teth',
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

      await coin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('tx cannot be both a batch and hop transaction');
    });

    it('should reject a txPrebuild with more than one recipient', async function () {
      const coin = bitgo.coin('teth') as Teth;
      const wallet = new Wallet(bitgo, coin, {});

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
        coin: 'teth',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await coin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('txPrebuild should only have 1 recipient but 2 found');
    });

    it('should reject a hop txPrebuild that does not send to its hop address', async function () {
      const coin = bitgo.coin('teth') as Teth;
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
        coin: 'teth',
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

      await coin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('recipient address of txPrebuild does not match hop address');
    });

    it('should reject a batch txPrebuild from the bitgo server with the wrong total amount', async function () {
      const coin = bitgo.coin('teth') as Teth;
      const wallet = new Wallet(bitgo, coin, {});

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
          { amount: '5500000000000', address: (coin?.staticsCoin?.network as EthereumNetwork).batcherContractAddress },
        ],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'teth',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await coin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith(
          'batch transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
    });

    it('should reject a batch txPrebuild from the bitgo server that does not send to the batcher contract address', async function () {
      const coin = bitgo.coin('teth') as Teth;
      const wallet = new Wallet(bitgo, coin, {});

      const txParams = {
        recipients: [
          { amount: '1000000000000', address: address1 },
          { amount: '2500000000000', address: address2 },
        ],
        wallet: wallet,
        walletPassphrase: 'fakeWalletPassphrase',
      };

      const txPrebuild = {
        recipients: [{ amount: '3500000000000', address: hopContractAddress }],
        nextContractSequenceId: 0,
        gasPrice: 20000000000,
        gasLimit: 500000,
        isBatch: true,
        coin: 'teth',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await coin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('recipient address of txPrebuild does not match batcher address');
    });

    it('should reject a normal txPrebuild from the bitgo server with the wrong amount', async function () {
      const coin = bitgo.coin('teth') as Teth;
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
        coin: 'teth',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await coin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith(
          'normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
    });

    it('should reject a normal txPrebuild from the bitgo server with the wrong recipient', async function () {
      const coin = bitgo.coin('teth') as Teth;
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
        coin: 'teth',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      await coin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith(
          'destination address in normal txPrebuild does not match that in txParams supplied by client'
        );
    });

    it('should verify a token txPrebuild from the bitgo server that matches the client txParams', async function () {
      const coin = bitgo.coin('test');
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
        coin: 'teth',
        token: 'test',
        walletId: 'fakeWalletId',
        walletContractAddress: 'fakeWalletContractAddress',
      };

      const verification = {};

      const isTransactionVerified = await coin.verifyTransaction({
        txParams,
        txPrebuild: txPrebuild as any,
        wallet,
        verification,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should reject a txPrebuild from the bitgo server with the wrong coin', async function () {
      const coin = bitgo.coin('teth') as Teth;
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

      await coin
        .verifyTransaction({ txParams, txPrebuild: txPrebuild as any, wallet, verification })
        .should.be.rejectedWith('coin in txPrebuild did not match that in txParams supplied by client');
    });
  });

  describe('Address Verification', function () {
    it('should verify an address generated using forwarder version 0', async function () {
      const coin = bitgo.coin('teth') as Teth;

      const params = {
        id: '6127bff4ecd84c0006cd9a0e5ccdc36f',
        chain: 0,
        index: 3174,
        coin: 'teth',
        lastNonce: 0,
        wallet: '598f606cd8fc24710d2ebadb1d9459bb',
        baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        coinSpecific: {
          nonce: -1,
          updateTime: '2021-08-26T16:23:16.563Z',
          txCount: 0,
          pendingChainInitialization: true,
          creationFailure: [],
          pendingDeployment: false,
          forwarderVersion: 0,
        },
      };

      const isAddressVerified = await coin.verifyAddress(params as any);
      isAddressVerified.should.equal(true);
    });

    it('should verify an address generated using forwarder version 1', async function () {
      const coin = bitgo.coin('teth') as Teth;

      const params = {
        id: '61250217c8c02b000654b15e7af6f618',
        address: '0xb0b56eeae1b283918caca02a14ada2df17a98e6d',
        chain: 0,
        index: 3162,
        coin: 'teth',
        lastNonce: 0,
        wallet: '598f606cd8fc24710d2ebadb1d9459bb',
        baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        coinSpecific: {
          nonce: -1,
          updateTime: '2021-08-24T14:28:39.841Z',
          txCount: 0,
          pendingChainInitialization: true,
          creationFailure: [],
          salt: '0xc5a',
          pendingDeployment: true,
          forwarderVersion: 1,
        },
      };

      const isAddressVerified = await coin.verifyAddress(params);
      isAddressVerified.should.equal(true);
    });

    it('should reject address verification if coinSpecific field is not an object', async function () {
      const coin = bitgo.coin('teth') as Teth;

      const params = {
        id: '61250217c8c02b000654b15e7af6f618',
        address: '0xb0b56eeae1b283918caca02a14ada2df17a98e6d',
        chain: 0,
        index: 3162,
        coin: 'teth',
        lastNonce: 0,
        wallet: '598f606cd8fc24710d2ebadb1d9459bb',
        baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
      };

      assert.rejects(async () => coin.verifyAddress(params), InvalidAddressVerificationObjectPropertyError);
    });

    it('should reject address verification when an actual address is different from expected address', async function () {
      const coin = bitgo.coin('teth') as Teth;

      const params = {
        id: '61250217c8c02b000654b15e7af6f618',
        address: '0x28904591f735994f050804fda3b61b813b16e04c',
        chain: 0,
        index: 3162,
        coin: 'teth',
        lastNonce: 0,
        baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        wallet: '598f606cd8fc24710d2ebadb1d9459bb',
        coinSpecific: {
          nonce: -1,
          updateTime: '2021-08-24T14:28:39.841Z',
          txCount: 0,
          pendingChainInitialization: true,
          creationFailure: [],
          salt: '0xc5a',
          pendingDeployment: true,
          forwarderVersion: 1,
        },
      };

      assert.rejects(async () => coin.verifyAddress(params), UnexpectedAddressError);
    });

    it('should reject address verification if the derived address is in invalid format', async function () {
      const coin = bitgo.coin('teth') as Teth;

      const params = {
        id: '61250217c8c02b000654b15e7af6f618',
        address: '0xe0b56eeae1b283918caca02a14ada2df17a98bvf',
        chain: 0,
        index: 3162,
        coin: 'teth',
        lastNonce: 0,
        wallet: '598f606cd8fc24710d2ebadb1d9459bb',
        baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        coinSpecific: {
          nonce: -1,
          updateTime: '2021-08-24T14:28:39.841Z',
          txCount: 0,
          pendingChainInitialization: true,
          creationFailure: [],
          salt: '0xc5a',
          pendingDeployment: true,
          forwarderVersion: 1,
        },
      };

      assert.rejects(async () => coin.verifyAddress(params), InvalidAddressError);
    });

    it('should reject address verification if base address is undefined', async function () {
      const coin = bitgo.coin('teth') as Teth;

      const params = {
        id: '61250217c8c02b000654b15e7af6f618',
        address: '0xb0b56eeae1b283918caca02a14ada2df17a98e6d',
        chain: 0,
        index: 3162,
        coin: 'teth',
        lastNonce: 0,
        wallet: '598f606cd8fc24710d2ebadb1d9459bb',
        coinSpecific: {
          nonce: -1,
          updateTime: '2021-08-24T14:28:39.841Z',
          txCount: 0,
          pendingChainInitialization: true,
          creationFailure: [],
          salt: '0xc5a',
          pendingDeployment: true,
          forwarderVersion: 1,
        },
      };

      assert.rejects(async () => coin.verifyAddress(params), InvalidAddressError);
    });

    it('should reject address verification if base address is in invalid format', async function () {
      const coin = bitgo.coin('teth') as Teth;

      const params = {
        id: '61250217c8c02b000654b15e7af6f618',
        address: '0xb0b56eeae1b283918caca02a14ada2df17a98e6d',
        chain: 0,
        index: 3162,
        coin: 'teth',
        lastNonce: 0,
        wallet: '598f606cd8fc24710d2ebadb1d9459bb',
        baseAddress: '0xe0b56eeae1b283918caca02a14ada2df17a98bvf',
        coinSpecific: {
          nonce: -1,
          updateTime: '2021-08-24T14:28:39.841Z',
          txCount: 0,
          pendingChainInitialization: true,
          creationFailure: [],
          salt: '0xc5a',
          pendingDeployment: true,
          forwarderVersion: 1,
        },
      };

      assert.rejects(async () => coin.verifyAddress(params), InvalidAddressError);
    });
  });

  describe('EVM Cross Chain Recovery', function () {
    const baseUrl = 'https://api-holesky.etherscan.io';
    it('should build a recovery transaction for hot wallet', async function () {
      const userKey =
        '{"iv":"VFZ3jvXhxo1Z+Yaf2MtZnA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"p+fkHuLa/8k=","ct":"hYG7pvljLIgCjZ\n' +
        '53PBlCde5KZRmlUKKHLtDMk+HJfuU46hW+x+C9WsIAO4gFPnTCvFVmQ8x7czCtcNFub5AO2otOG\n' +
        'OsX4GE2gXOEmCl1TpWwwNhm7yMUjGJUpgW6ZZgXSXdDitSKi4V/hk78SGSzjFOBSPYRa6I="}\n';
      const walletContractAddress = TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS as string;
      const bitgoFeeAddress = '0x33a42faea3c6e87021347e51700b48aaf49aa1e7';
      const destinationAddress = '0xd5ADdE17feD8baed3F32b84AF05B8F2816f7b560';
      const bitgoDestinationAddress = '0xE5986CE4490Deb67d2950562Ceb930Ddf9be7a14';
      const walletPassphrase = TestBitGo.V2.TEST_RECOVERY_PASSCODE as string;

      const basecoin = bitgo.coin('hteth') as Hteth;
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

      const spy = sinon.spy(TransactionBuilder.prototype, 'coinUsesNonPackedEncodingForTxData');
      await basecoin.recover({
        userKey: userKey,
        backupKey: '',
        walletPassphrase: walletPassphrase,
        walletContractAddress: walletContractAddress,
        bitgoFeeAddress: bitgoFeeAddress,
        recoveryDestination: destinationAddress,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        gasLimit: 500000,
        bitgoDestinationAddress: bitgoDestinationAddress,
        intendedChain: 'tarbeth',
      });
      assert(spy.returned(true));
    });
  });
});
