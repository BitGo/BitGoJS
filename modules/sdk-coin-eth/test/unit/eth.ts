import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import nock from 'nock';
import sinon from 'sinon';
import { bip32 } from '@bitgo/secp256k1';
import * as secp256k1 from 'secp256k1';
import request from 'superagent';
import {
  common,
  generateRandomPassword,
  InvalidAddressError,
  InvalidAddressVerificationObjectPropertyError,
  MPCSweepTxs,
  TransactionType,
  UnexpectedAddressError,
  Wallet,
} from '@bitgo/sdk-core';
import { BitGoAPI } from '@bitgo/sdk-api';
import {
  AbstractEthLikeNewCoins,
  Erc20Token,
  Hteth,
  Teth,
  TransactionBuilder,
  TransferBuilder,
  TssVerifyEthAddressOptions,
  UnsignedBuilConsolidation,
  UnsignedSweepTxMPCv2,
  VerifyEthAddressOptions,
} from '../../src';
import { EthereumNetwork } from '@bitgo/statics';
import assert from 'assert';
import { getBuilder } from './getBuilder';
import * as testData from '../resources/eth';
import * as mockData from '../fixtures/eth';
import should from 'should';
import { ethMultiSigBackupKey } from './fixtures/ethMultiSigBackupKey';
import { ethTssBackupKey } from './fixtures/ethTssBackupKey';

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
        .should.be.rejectedWith(
          `teth doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
        );
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
    describe('isWalletAddress', function () {
      it('should verify an address generated using forwarder version 1', async function () {
        const coin = bitgo.coin('hteth') as Hteth;

        const keychains = [
          {
            id: '691f638f1d3c9fce8f5aa691569a99eb',
            source: 'user',
            type: 'independent',
            pub: 'xpub661MyMwAqRbcGVb3PfCzwiEX94AB1nJQtzVmsa5SriNrfKZZAcAvRgxh1Augm6s8yoD8gSkq2FdZ8YCdVXUgLjf9QxvdYAJK5UthAmpQshU',
          },
          {
            id: '691f638f0b74e73b1f440ea4aceda87e',
            source: 'backup',
            type: 'independent',
            pub: 'xpub661MyMwAqRbcF46pRHda3sZbuPzza9A9MiqAU9JRod8huYtyV4NY2oeJXsis7r26L1vmLntf9BcZJe1m4CQNSvYWfwpe1hSpo6J4x6YF1eN',
          },
          {
            id: '68b9ec587d0ba1c7440de551068c36a7',
            source: 'bitgo',
            type: 'independent',
            pub: 'xpub661MyMwAqRbcGzTn5eyNGDkb18R43nH79HokYLc5PXZM19V8UrbuLdVRaCQMs4EeCAjnqmoYXqfyusTU46WoZMDyLpmTzoUX66ZBwGFjt1a',
          },
        ];

        const params = {
          address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
          baseAddress: '0xe1253bcce7d87db522fbceec6e55c9f78c376d9f',
          coinSpecific: {
            salt: '0x7',
            forwarderVersion: 1,
          },
          keychains,
          index: 7,
          walletVersion: 1,
        } as unknown as TssVerifyEthAddressOptions;

        const isWalletAddr = await coin.isWalletAddress(params as any);
        isWalletAddr.should.equal(true);
      });

      it('should verify an address generated using forwarder version 2', async function () {
        const coin = bitgo.coin('hteth') as Hteth;

        const keychains = [
          {
            id: '691e8c7b3c8aaa791118d9ce616d3b21',
            source: 'user',
            type: 'independent',
            pub: 'xpub661MyMwAqRbcGrCxCX39zb3TvYjTqfUGwEUZHjnraRFm1WeMw9gfCD1wwc2wUDmBBZ2TkccJMwf5eBTja8r3z6HMxoTZGW6nvyoJMQFsecv',
          },
          {
            id: '691e8c7b1967fd6d9867a22a1a4131a0',
            source: 'backup',
            type: 'independent',
            pub: 'xpub661MyMwAqRbcGKhdeC4nr1ta8d27xThtfFFHgbxWMrVb595meMS8i3fBMrTz8EdQMWBKHHKzxapGgheoMymVvRcQmaGDykRTBbtXqbiu9ps',
          },
          {
            id: '68b9ec587d0ba1c7440de551068c36a7',
            source: 'bitgo',
            type: 'independent',
            pub: 'xpub661MyMwAqRbcGzTn5eyNGDkb18R43nH79HokYLc5PXZM19V8UrbuLdVRaCQMs4EeCAjnqmoYXqfyusTU46WoZMDyLpmTzoUX66ZBwGFjt1a',
          },
        ];

        const params = {
          address: '0xf636ceddffe41d106586875c0e56dc8feb6268f7',
          baseAddress: '0xdc485da076ed4a2b19584e9a1fdbb974f89b60f4',
          coinSpecific: {
            salt: '0x17',
            forwarderVersion: 2,
          },
          keychains,
          index: 23,
          walletVersion: 2,
        } as unknown as TssVerifyEthAddressOptions;

        const isWalletAddr = await coin.isWalletAddress(params as any);
        isWalletAddr.should.equal(true);
      });

      it('should verify a wallet version 5 forwarder version 4', async function () {
        const coin = bitgo.coin('hteth') as Hteth;
        const keychains = [
          {
            id: '691e242d93f8d7ad0705887449763c96',
            source: 'user',
            type: 'tss',
            commonKeychain:
              '02c8a496b16abfe2567520a279e2154642fc3c0e08e629775cb4d845c0c5fbf55ab7ba153e886de65748ed18f4ff8f5cee2242e687399ea3297a1f5524fdefd56c',
          },
          {
            id: '691e242df8b6323d4b08df366864af66',
            source: 'backup',
            type: 'tss',
            commonKeychain:
              '02c8a496b16abfe2567520a279e2154642fc3c0e08e629775cb4d845c0c5fbf55ab7ba153e886de65748ed18f4ff8f5cee2242e687399ea3297a1f5524fdefd56c',
          },
          {
            id: '691e242c0595b4cfee6f957c1d6458f7',
            source: 'bitgo',
            type: 'tss',
            commonKeychain:
              '02c8a496b16abfe2567520a279e2154642fc3c0e08e629775cb4d845c0c5fbf55ab7ba153e886de65748ed18f4ff8f5cee2242e687399ea3297a1f5524fdefd56c',
          },
        ];

        const params = {
          address: '0xd63b5e2b8d1b4fba3625460508900bf2a0499a4d',
          baseAddress: '0xf1e3d30798acdf3a12fa5beb5fad8efb23d5be11',
          coinSpecific: {
            salt: '0x75',
            forwarderVersion: 4,
            feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
          },
          keychains,
          index: 117,
          walletVersion: 5,
        } as unknown as TssVerifyEthAddressOptions;

        const isWalletAddr = await coin.isWalletAddress(params);
        isWalletAddr.should.equal(true);
      });

      it('should verify a wallet version 6 forwarder version 5', async function () {
        const coin = bitgo.coin('hteth') as Hteth;
        const keychains = [
          {
            id: '691f630e0c56098288a9b7fa107db144',
            source: 'user',
            type: 'tss',
            commonKeychain:
              '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
          },
          {
            id: '691f630f1d3c9fce8f5a730bff826cf9',
            source: 'backup',
            type: 'tss',
            commonKeychain:
              '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
          },
          {
            id: '691f630d56735e5eb61b06e353fe7639',
            source: 'bitgo',
            type: 'tss',
            commonKeychain:
              '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
          },
        ];

        const params = {
          address: '0xa33f0975f53cdcfcc0cb564d25fb5be03b0651cf',
          baseAddress: '0xc012041dac143a59fa491db3a2b67b69bd78b685',
          coinSpecific: {
            forwarderVersion: 5,
            feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
          },
          keychains,
          index: 7,
          walletVersion: 6,
        } as unknown as TssVerifyEthAddressOptions;

        const isWalletAddr = await coin.isWalletAddress(params);
        isWalletAddr.should.equal(true);
      });

      it('should reject when actual address differs from expected address', async function () {
        const coin = bitgo.coin('hteth') as Hteth;

        const params = {
          address: '0x28904591f735994f050804fda3b61b813b16e04c',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          walletVersion: 1,
          coinSpecific: {
            salt: '0xc5a',
            forwarderVersion: 1,
          },
        } as unknown as VerifyEthAddressOptions;

        await assert.rejects(async () => coin.isWalletAddress(params), UnexpectedAddressError);
      });

      it('should reject if coinSpecific field is not an object', async function () {
        const coin = bitgo.coin('teth') as Teth;

        const params = {
          address: '0xb0b56eeae1b283918caca02a14ada2df17a98e6d',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        };

        await assert.rejects(
          async () => coin.isWalletAddress(params as any),
          InvalidAddressVerificationObjectPropertyError
        );
      });

      it('should reject if the derived address is in invalid format', async function () {
        const coin = bitgo.coin('teth') as Teth;

        const params = {
          address: '0xe0b56eeae1b283918caca02a14ada2df17a98bvf',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          coinSpecific: {
            salt: '0xc5a',
            forwarderVersion: 1,
          },
        } as unknown as VerifyEthAddressOptions;

        await assert.rejects(async () => coin.isWalletAddress(params), InvalidAddressError);
      });

      it('should reject if base address is undefined', async function () {
        const coin = bitgo.coin('teth') as Teth;

        const params = {
          address: '0xb0b56eeae1b283918caca02a14ada2df17a98e6d',
          coinSpecific: {
            salt: '0xc5a',
            forwarderVersion: 1,
          },
        };

        await assert.rejects(async () => coin.isWalletAddress(params as any), InvalidAddressError);
      });

      it('should reject if base address is in invalid format', async function () {
        const coin = bitgo.coin('teth') as Teth;

        const params = {
          address: '0xb0b56eeae1b283918caca02a14ada2df17a98e6d',
          baseAddress: '0xe0b56eeae1b283918caca02a14ada2df17a98bvf',
          coinSpecific: {
            salt: '0xc5a',
            forwarderVersion: 1,
          },
        } as unknown as VerifyEthAddressOptions;

        await assert.rejects(async () => coin.isWalletAddress(params), InvalidAddressError);
      });

      describe('MPC wallet addresses', function () {
        const commonKeychain =
          '03f9c2fb2e5a8b78a44f5d1e4f906f8e3d7a0e6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9e8d7c6b5a4' +
          '93827160594857463728190a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
        const keychains = [
          { pub: 'user_pub', commonKeychain },
          { pub: 'backup_pub', commonKeychain },
          { pub: 'bitgo_pub', commonKeychain },
        ];

        it('should verify an MPC wallet address with forwarder version 3', async function () {
          const coin = bitgo.coin('teth') as Teth;

          const params = {
            address: '0x01153f3adfe454a72589ca9ef74f013c19e54961',
            coinSpecific: {
              forwarderVersion: 3,
            },
            keychains,
            index: 0,
            walletVersion: 3,
          } as unknown as TssVerifyEthAddressOptions;

          const isWalletAddr = await coin.isWalletAddress(params);
          isWalletAddr.should.equal(true);
        });

        it('should verify an MPC wallet address with forwarder version 5', async function () {
          const coin = bitgo.coin('teth') as Teth;

          const params = {
            address: '0x01153f3adfe454a72589ca9ef74f013c19e54961',
            coinSpecific: {
              forwarderVersion: 5,
            },
            keychains,
            index: 0,
            walletVersion: 6,
          } as unknown as TssVerifyEthAddressOptions;

          const isWalletAddr = await coin.isWalletAddress(params);
          isWalletAddr.should.equal(true);
        });

        it('should reject MPC wallet address with wrong address', async function () {
          const coin = bitgo.coin('teth') as Teth;

          const params = {
            address: '0x0000000000000000000000000000000000000001',
            baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
            coinSpecific: {
              forwarderVersion: 3,
            },
            keychains,
            index: 0,
            walletVersion: 3,
          } as unknown as TssVerifyEthAddressOptions;

          const isWalletAddr = await coin.isWalletAddress(params);
          isWalletAddr.should.equal(false);
        });

        it('should reject MPC wallet address with invalid address format', async function () {
          const coin = bitgo.coin('teth') as Teth;

          const params = {
            address: '0xinvalid',
            baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
            coinSpecific: {
              forwarderVersion: 3,
            },
            keychains,
            index: 0,
            walletVersion: 3,
          } as unknown as TssVerifyEthAddressOptions;

          await assert.rejects(async () => coin.isWalletAddress(params), InvalidAddressError);
        });

        it('should reject if keychains are missing for MPC wallet', async function () {
          const coin = bitgo.coin('teth') as Teth;

          const params = {
            address: '0x9e7ce8c24d9f76a814e23633e61be7cb8e6e2d5e',
            baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
            coinSpecific: {
              forwarderVersion: 3,
            },
            index: 0,
            walletVersion: 3,
          };

          await assert.rejects(async () => coin.isWalletAddress(params as any), Error);
        });

        it('should reject if commonKeychain is missing for MPC wallet', async function () {
          const coin = bitgo.coin('teth') as Teth;

          const invalidKeychains = [{ pub: 'user_pub' }, { pub: 'backup_pub' }, { pub: 'bitgo_pub' }];

          const params = {
            address: '0x9e7ce8c24d9f76a814e23633e61be7cb8e6e2d5e',
            baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
            coinSpecific: {
              forwarderVersion: 3,
            },
            keychains: invalidKeychains,
            index: 0,
            walletVersion: 3,
          } as unknown as TssVerifyEthAddressOptions;

          await assert.rejects(async () => coin.isWalletAddress(params), Error);
        });
      });

      describe('Base Address Verification', function () {
        it('should verify base address for wallet version 6 (TSS)', async function () {
          const coin = bitgo.coin('hteth') as Hteth;

          const keychains = [
            {
              id: '691f630e0c56098288a9b7fa107db144',
              source: 'user',
              type: 'tss',
              commonKeychain:
                '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
            },
            {
              id: '691f630f1d3c9fce8f5a730bff826cf9',
              source: 'backup',
              type: 'tss',
              commonKeychain:
                '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
            },
            {
              id: '691f630d56735e5eb61b06e353fe7639',
              source: 'bitgo',
              type: 'tss',
              commonKeychain:
                '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
            },
          ];

          const baseAddress = '0xc012041dac143a59fa491db3a2b67b69bd78b685';

          const params = {
            address: baseAddress,
            baseAddress: baseAddress,
            coinSpecific: {
              salt: '0x0',
              forwarderVersion: 5,
              feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
            },
            keychains,
            index: 0,
            walletVersion: 6,
          } as unknown as TssVerifyEthAddressOptions;

          const isWalletAddr = await coin.isWalletAddress(params);
          isWalletAddr.should.equal(true);
        });

        it('should verify base address for wallet version 5 (TSS)', async function () {
          const coin = bitgo.coin('hteth') as Hteth;

          const keychains = [
            {
              id: '691e242d93f8d7ad0705887449763c96',
              source: 'user',
              type: 'tss',
              commonKeychain:
                '02c8a496b16abfe2567520a279e2154642fc3c0e08e629775cb4d845c0c5fbf55ab7ba153e886de65748ed18f4ff8f5cee2242e687399ea3297a1f5524fdefd56c',
            },
            {
              id: '691e242df8b6323d4b08df366864af66',
              source: 'backup',
              type: 'tss',
              commonKeychain:
                '02c8a496b16abfe2567520a279e2154642fc3c0e08e629775cb4d845c0c5fbf55ab7ba153e886de65748ed18f4ff8f5cee2242e687399ea3297a1f5524fdefd56c',
            },
            {
              id: '691e242c0595b4cfee6f957c1d6458f7',
              source: 'bitgo',
              type: 'tss',
              commonKeychain:
                '02c8a496b16abfe2567520a279e2154642fc3c0e08e629775cb4d845c0c5fbf55ab7ba153e886de65748ed18f4ff8f5cee2242e687399ea3297a1f5524fdefd56c',
            },
          ];

          const baseAddress = '0xf1e3d30798acdf3a12fa5beb5fad8efb23d5be11';

          const params = {
            address: baseAddress,
            baseAddress: baseAddress,
            coinSpecific: {
              salt: '0x0',
              forwarderVersion: 4,
              feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
            },
            keychains,
            index: 0,
            walletVersion: 5,
          } as unknown as TssVerifyEthAddressOptions;

          const isWalletAddr = await coin.isWalletAddress(params);
          isWalletAddr.should.equal(true);
        });

        it('should reject base address verification with non-zero index', async function () {
          const coin = bitgo.coin('hteth') as Hteth;

          const keychains = [
            {
              id: '691f630e0c56098288a9b7fa107db144',
              source: 'user',
              type: 'tss',
              commonKeychain:
                '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
            },
            {
              id: '691f630f1d3c9fce8f5a730bff826cf9',
              source: 'backup',
              type: 'tss',
              commonKeychain:
                '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
            },
            {
              id: '691f630d56735e5eb61b06e353fe7639',
              source: 'bitgo',
              type: 'tss',
              commonKeychain:
                '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
            },
          ];

          const baseAddress = '0xc012041dac143a59fa491db3a2b67b69bd78b685';

          const params = {
            address: baseAddress,
            baseAddress: baseAddress,
            coinSpecific: {
              salt: '0x0',
              forwarderVersion: 5,
              feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
            },
            keychains,
            index: 5, // Wrong index - should be 0 for base address
            walletVersion: 6,
          } as unknown as TssVerifyEthAddressOptions;

          await assert.rejects(
            async () => coin.isWalletAddress(params),
            /Base address verification requires index 0, but got index 5/
          );
        });

        it('should reject base address verification with wrong address', async function () {
          const coin = bitgo.coin('hteth') as Hteth;

          const keychains = [
            {
              id: '691f630e0c56098288a9b7fa107db144',
              source: 'user',
              type: 'tss',
              commonKeychain:
                '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
            },
            {
              id: '691f630f1d3c9fce8f5a730bff826cf9',
              source: 'backup',
              type: 'tss',
              commonKeychain:
                '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
            },
            {
              id: '691f630d56735e5eb61b06e353fe7639',
              source: 'bitgo',
              type: 'tss',
              commonKeychain:
                '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
            },
          ];

          const wrongAddress = '0x0000000000000000000000000000000000000001';
          const actualBaseAddress = '0xc012041dac143a59fa491db3a2b67b69bd78b685';

          const params = {
            address: wrongAddress,
            baseAddress: actualBaseAddress,
            coinSpecific: {
              salt: '0x0',
              forwarderVersion: 5,
              feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
            },
            keychains,
            index: 0,
            walletVersion: 6,
          } as unknown as TssVerifyEthAddressOptions;

          const isWalletAddr = await coin.isWalletAddress(params);
          isWalletAddr.should.equal(false);
        });

        it('should verify base address for wallet version 2 (BIP32) using wallet factory', async function () {
          const coin = bitgo.coin('hteth') as Hteth;

          const baseAddress = '0xdc485da076ed4a2b19584e9a1fdbb974f89b60f4';
          const walletSalt = '0x2';

          const keychains = [
            {
              id: '691e8c7b3c8aaa791118d9ce616d3b21',
              source: 'user',
              type: 'independent',
              ethAddress: '0x9d16bb867b792c5e3bf636a0275f2db8601bd7d4',
            },
            {
              id: '691e8c7b1967fd6d9867a22a1a4131a0',
              source: 'backup',
              type: 'independent',
              ethAddress: '0x2dfce5cfeb5c03fbe680cd39ac0d2b25399b7d22',
            },
            {
              id: '68b9ec587d0ba1c7440de551068c36a7',
              source: 'bitgo',
              type: 'independent',
              ethAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
            },
          ];

          const params = {
            address: baseAddress,
            baseAddress: baseAddress,
            coinSpecific: {
              salt: walletSalt,
              forwarderVersion: 2,
            },
            keychains: keychains,
            index: 0,
            walletVersion: 2,
          } as unknown as VerifyEthAddressOptions;

          const isWalletAddr = await coin.isWalletAddress(params);
          isWalletAddr.should.equal(true);
        });

        it('should verify base address for wallet version 1 (BIP32) using wallet factory', async function () {
          const coin = bitgo.coin('hteth') as Hteth;

          const baseAddress = '0xe1253bcce7d87db522fbceec6e55c9f78c376d9f';
          const walletSalt = '0x5';

          const keychains = [
            {
              id: '691f638f1d3c9fce8f5aa691569a99eb',
              source: 'user',
              type: 'independent',
              ethAddress: '0xf45dadce751a317957f2a247ff37cb764b97620d',
              pub: 'xpub661MyMwAqRbcGVb3PfCzwiEX94AB1nJQtzVm...',
            },
            {
              id: '691f638f0b74e73b1f440ea4aceda87e',
              source: 'backup',
              type: 'independent',
              ethAddress: '0x5bdf3ae1d2c2fadeeb70a45872bf4f4252312b55',
              pub: 'xpub661MyMwAqRbcF46pRHda3sZbuPzza9A9MiqA...',
            },
            {
              id: '68b9ec587d0ba1c7440de551068c36a7',
              source: 'bitgo',
              type: 'independent',
              ethAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
              pub: 'xpub661MyMwAqRbcGzTn5eyNGDkb18R43nH79Hok...',
            },
          ];

          const params = {
            address: baseAddress,
            baseAddress: baseAddress,
            coinSpecific: {
              salt: walletSalt,
              forwarderVersion: 1,
            },
            keychains: keychains,
            index: 0,
            walletVersion: 1,
          } as unknown as VerifyEthAddressOptions;

          const isWalletAddr = await coin.isWalletAddress(params);
          isWalletAddr.should.equal(true);
        });
      });
    });
  });

  describe('Address Creation', function () {
    it('should pass walletVersion 6 to isWalletAddress during address creation', async function () {
      const bgUrl = common.Environments[bitgo.getEnv()].uri;
      const ethCoin = bitgo.coin('hteth') as Hteth;
      const walletDataV6 = {
        id: '598f606cd8fc24710d2ebadb1d9459bb',
        coinSpecific: {
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          walletVersion: 6,
        },
        coin: 'hteth',
        keys: [
          '598f606cd8fc24710d2ebad89dce86c2',
          '598f606cc8e43aef09fcb785221d9dd2',
          '5935d59cf660764331bafcade1855fd7',
        ],
        receiveAddress: {
          address: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        },
      };
      const ethWalletV6 = new Wallet(bitgo, ethCoin, walletDataV6);
      const isWalletAddressSpy = sinon.spy(ethCoin, 'isWalletAddress');

      // Mock keychain requests
      nock(bgUrl).get(`/api/v2/hteth/key/598f606cd8fc24710d2ebad89dce86c2`).reply(200, {
        id: '598f606cd8fc24710d2ebad89dce86c2',
        pub: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        commonKeychain:
          '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
        source: 'user',
        type: 'tss',
      });
      nock(bgUrl).get(`/api/v2/hteth/key/598f606cc8e43aef09fcb785221d9dd2`).reply(200, {
        id: '598f606cc8e43aef09fcb785221d9dd2',
        pub: 'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
        commonKeychain:
          '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
        source: 'backup',
        type: 'tss',
      });
      nock(bgUrl).get(`/api/v2/hteth/key/5935d59cf660764331bafcade1855fd7`).reply(200, {
        id: '5935d59cf660764331bafcade1855fd7',
        pub: 'xpub661MyMwAqRbcFsXShW8R3hJsHNTYTUwzcejnLkY7KCtaJbDqcGkcBF99BrEJSjNZHeHveiYUrsAdwnjUMGwpgmEbiKcZWRuVA9HxnRaA3r3',
        commonKeychain:
          '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
        source: 'bitgo',
        type: 'tss',
      });

      // Mock address creation API
      nock(bgUrl)
        .post(`/api/v2/hteth/wallet/${ethWalletV6.id()}/address`)
        .reply(200, {
          id: '638a48c6c3dba40007a3497fa49a080c',
          address: '0xc012041dac143a59fa491db3a2b67b69bd78b685',
          chain: 0,
          index: 0,
          coin: 'hteth',
          wallet: ethWalletV6.id(),
          coinSpecific: {
            forwarderVersion: 4,
            salt: '0x0',
            feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
          },
        });

      await ethWalletV6.createAddress({ chain: 0 });

      isWalletAddressSpy.calledOnce.should.be.true();
      const calledParams = isWalletAddressSpy.firstCall.args[0];
      calledParams.should.have.property('walletVersion', 6);
    });

    it('should pass walletVersion 5 to isWalletAddress during address creation', async function () {
      const bgUrl = common.Environments[bitgo.getEnv()].uri;
      const ethCoin = bitgo.coin('hteth') as Hteth;
      const walletDataV5 = {
        id: '598f606cd8fc24710d2ebadb1d9459bb',
        coinSpecific: {
          baseAddress: '0xf1e3d30798acdf3a12fa5beb5fad8efb23d5be11',
          walletVersion: 5,
        },
        coin: 'hteth',
        keys: [
          '598f606cd8fc24710d2ebad89dce86c2',
          '598f606cc8e43aef09fcb785221d9dd2',
          '5935d59cf660764331bafcade1855fd7',
        ],
        receiveAddress: {
          address: '0xf1e3d30798acdf3a12fa5beb5fad8efb23d5be11',
        },
      };
      const ethWalletV5 = new Wallet(bitgo, ethCoin, walletDataV5);
      const isWalletAddressSpy = sinon.spy(ethCoin, 'isWalletAddress');

      // Mock keychain requests
      nock(bgUrl).get(`/api/v2/hteth/key/598f606cd8fc24710d2ebad89dce86c2`).reply(200, {
        id: '598f606cd8fc24710d2ebad89dce86c2',
        pub: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        commonKeychain:
          '02c8a496b16abfe2567520a279e2154642fc3c0e08e629775cb4d845c0c5fbf55ab7ba153e886de65748ed18f4ff8f5cee2242e687399ea3297a1f5524fdefd56c',
        source: 'user',
        type: 'tss',
      });
      nock(bgUrl).get(`/api/v2/hteth/key/598f606cc8e43aef09fcb785221d9dd2`).reply(200, {
        id: '598f606cc8e43aef09fcb785221d9dd2',
        pub: 'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
        commonKeychain:
          '02c8a496b16abfe2567520a279e2154642fc3c0e08e629775cb4d845c0c5fbf55ab7ba153e886de65748ed18f4ff8f5cee2242e687399ea3297a1f5524fdefd56c',
        source: 'backup',
        type: 'tss',
      });
      nock(bgUrl).get(`/api/v2/hteth/key/5935d59cf660764331bafcade1855fd7`).reply(200, {
        id: '5935d59cf660764331bafcade1855fd7',
        pub: 'xpub661MyMwAqRbcFsXShW8R3hJsHNTYTUwzcejnLkY7KCtaJbDqcGkcBF99BrEJSjNZHeHveiYUrsAdwnjUMGwpgmEbiKcZWRuVA9HxnRaA3r3',
        commonKeychain:
          '02c8a496b16abfe2567520a279e2154642fc3c0e08e629775cb4d845c0c5fbf55ab7ba153e886de65748ed18f4ff8f5cee2242e687399ea3297a1f5524fdefd56c',
        source: 'bitgo',
        type: 'tss',
      });

      // Mock address creation API
      nock(bgUrl)
        .post(`/api/v2/hteth/wallet/${ethWalletV5.id()}/address`)
        .reply(200, {
          id: '638a48c6c3dba40007a3497fa49a080c',
          address: '0xd63b5e2b8d1b4fba3625460508900bf2a0499a4d',
          chain: 0,
          index: 117,
          coin: 'hteth',
          wallet: ethWalletV5.id(),
          coinSpecific: {
            forwarderVersion: 4,
            salt: '0x75',
            feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
          },
        });

      await ethWalletV5.createAddress({ chain: 0 });

      // Verify isWalletAddress was called with walletVersion 5
      isWalletAddressSpy.calledOnce.should.be.true();
      const calledParams = isWalletAddressSpy.firstCall.args[0];
      calledParams.should.have.property('walletVersion', 5);
    });

    it('should pass walletVersion 2 to isWalletAddress during address creation', async function () {
      const bgUrl = common.Environments[bitgo.getEnv()].uri;
      const ethCoin = bitgo.coin('hteth') as Hteth;
      const walletDataV2 = {
        id: '598f606cd8fc24710d2ebadb1d9459bb',
        coinSpecific: {
          baseAddress: '0xdc485da076ed4a2b19584e9a1fdbb974f89b60f4',
          walletVersion: 2,
        },
        coin: 'hteth',
        keys: [
          '598f606cd8fc24710d2ebad89dce86c2',
          '598f606cc8e43aef09fcb785221d9dd2',
          '5935d59cf660764331bafcade1855fd7',
        ],
        receiveAddress: {
          address: '0xdc485da076ed4a2b19584e9a1fdbb974f89b60f4',
        },
      };
      const ethWalletV2 = new Wallet(bitgo, ethCoin, walletDataV2);
      const isWalletAddressSpy = sinon.spy(ethCoin, 'isWalletAddress');

      // Mock keychain requests
      nock(bgUrl).get(`/api/v2/hteth/key/598f606cd8fc24710d2ebad89dce86c2`).reply(200, {
        id: '598f606cd8fc24710d2ebad89dce86c2',
        pub: 'xpub661MyMwAqRbcGrCxCX39zb3TvYjTqfUGwEUZHjnraRFm1WeMw9gfCD1wwc2wUDmBBZ2TkccJMwf5eBTja8r3z6HMxoTZGW6nvyoJMQFsecv',
        ethAddress: '0x9d16bb867b792c5e3bf636a0275f2db8601bd7d4',
        source: 'user',
        type: 'independent',
      });
      nock(bgUrl).get(`/api/v2/hteth/key/598f606cc8e43aef09fcb785221d9dd2`).reply(200, {
        id: '598f606cc8e43aef09fcb785221d9dd2',
        pub: 'xpub661MyMwAqRbcGKhdeC4nr1ta8d27xThtfFFHgbxWMrVb595meMS8i3fBMrTz8EdQMWBKHHKzxapGgheoMymVvRcQmaGDykRTBbtXqbiu9ps',
        ethAddress: '0x2dfce5cfeb5c03fbe680cd39ac0d2b25399b7d22',
        source: 'backup',
        type: 'independent',
      });
      nock(bgUrl).get(`/api/v2/hteth/key/5935d59cf660764331bafcade1855fd7`).reply(200, {
        id: '5935d59cf660764331bafcade1855fd7',
        pub: 'xpub661MyMwAqRbcGzTn5eyNGDkb18R43nH79HokYLc5PXZM19V8UrbuLdVRaCQMs4EeCAjnqmoYXqfyusTU46WoZMDyLpmTzoUX66ZBwGFjt1a',
        ethAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
        source: 'bitgo',
        type: 'independent',
      });

      // Mock address creation API
      nock(bgUrl)
        .post(`/api/v2/hteth/wallet/${ethWalletV2.id()}/address`)
        .reply(200, {
          id: '638a48c6c3dba40007a3497fa49a080c',
          address: '0xf636ceddffe41d106586875c0e56dc8feb6268f7',
          chain: 0,
          index: 23,
          coin: 'hteth',
          wallet: ethWalletV2.id(),
          coinSpecific: {
            forwarderVersion: 2,
            salt: '0x17',
          },
        });

      await ethWalletV2.createAddress({ chain: 0 });

      // Verify isWalletAddress was called with walletVersion 2
      isWalletAddressSpy.calledOnce.should.be.true();
      const calledParams = isWalletAddressSpy.firstCall.args[0];
      calledParams.should.have.property('walletVersion', 2);
    });
  });

  describe('EVM Cross Chain Recovery', function () {
    const baseUrl = common.Environments.test.etherscanBaseUrl as string;
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

    describe('Non-BitGo Recovery for Hot Wallets (MPCv2)', function () {
      const baseUrl = common.Environments.test.etherscanBaseUrl as string;
      let bitgo: TestBitGoAPI;
      let basecoin: Hteth;

      before(function () {
        bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
        basecoin = bitgo.coin('hteth') as Hteth;
      });

      it('should build a recovery transaction for MPCv2 kind of hot wallets', async function () {
        nock(baseUrl)
          .get('/api')
          .query(mockData.getTxListRequest(mockData.getNonBitGoRecoveryForHotWalletsMPCv2().bitgoFeeAddress))
          .reply(200, mockData.getTxListResponse);

        nock(baseUrl)
          .get('/api')
          .query(mockData.getBalanceRequest(mockData.getNonBitGoRecoveryForHotWalletsMPCv2().bitgoFeeAddress))
          .reply(200, mockData.getBalanceResponse);

        nock(baseUrl)
          .get('/api')
          .query(mockData.getBalanceRequest(mockData.getNonBitGoRecoveryForHotWalletsMPCv2().walletContractAddress))
          .reply(200, mockData.getBalanceResponse);

        nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

        const params = mockData.getNonBitGoRecoveryForHotWalletsMPCv2();

        const transaction = await (basecoin as AbstractEthLikeNewCoins).recover({
          userKey: params.userKey,
          backupKey: params.backupKey,
          walletPassphrase: params.walletPassphrase,
          walletContractAddress: params.walletContractAddress,
          bitgoFeeAddress: params.bitgoFeeAddress,
          recoveryDestination: params.recoveryDestination,
          eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
          gasLimit: 500000,
          bitgoDestinationAddress: params.bitgoDestinationAddress,
          intendedChain: params.intendedChain,
        });

        should.exist(transaction);
        transaction.should.have.property('txHex');
      });

      it('should throw an error for invalid user key', async function () {
        const params = mockData.getInvalidNonBitGoRecoveryParams();

        await assert.rejects(
          async () => {
            await (basecoin as AbstractEthLikeNewCoins).recover({
              userKey: params.userKey,
              backupKey: params.backupKey,
              walletPassphrase: params.walletPassphrase,
              walletContractAddress: params.walletContractAddress,
              bitgoFeeAddress: params.bitgoFeeAddress,
              recoveryDestination: params.recoveryDestination,
              eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
              gasLimit: 500000,
              bitgoDestinationAddress: params.bitgoDestinationAddress,
              intendedChain: params.intendedChain,
            });
          },
          Error,
          'user key is invalid'
        );
      });
    });

    describe('Build Unsigned Sweep for Self-Custody Cold Wallets (MPCv2)', function () {
      const baseUrl = common.Environments.test.etherscanBaseUrl as string;
      let bitgo: TestBitGoAPI;
      let basecoin: Hteth;

      before(function () {
        bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
        basecoin = bitgo.coin('hteth') as Hteth;
      });

      it('should generate an unsigned sweep without derivation seed', async function () {
        nock(baseUrl)
          .get('/api')
          .query(mockData.getTxListRequest(mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().address))
          .reply(200, mockData.getTxListResponse);

        nock(baseUrl)
          .get('/api')
          .query(mockData.getBalanceRequest(mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().address))
          .reply(200, mockData.getBalanceResponse);
        nock(baseUrl)
          .get('/api')
          .query(
            mockData.getBalanceRequest(
              mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().walletContractAddress
            )
          )
          .reply(200, mockData.getBalanceResponse);

        nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

        const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
        const sweepResult = await (basecoin as AbstractEthLikeNewCoins).recover({
          userKey: params.commonKeyChain, // Box A Data
          backupKey: params.commonKeyChain, // Box B Data
          derivationSeed: params.derivationSeed, // Key Derivation Seed (optional)
          recoveryDestination: params.recoveryDestination, // Destination Address
          gasLimit: 200000, // Gas Limit
          eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 }, // Max Fee Per Gas and Max Priority Fee Per Gas
          walletContractAddress: params.walletContractAddress,
          isTss: true,
          replayProtectionOptions: {
            chain: '42',
            hardfork: 'london',
          },
        });
        should.exist(sweepResult);
        const output = sweepResult as UnsignedSweepTxMPCv2;
        output.should.have.property('txRequests');
        output.txRequests.should.have.length(1);
        output.txRequests[0].should.have.property('transactions');
        output.txRequests[0].transactions.should.have.length(1);
        output.txRequests[0].should.have.property('walletCoin');
        output.txRequests[0].transactions.should.have.length(1);
        output.txRequests[0].transactions[0].should.have.property('unsignedTx');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('serializedTxHex');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('signableHex');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('derivationPath');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('feeInfo');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('parsedTx');
        const parsedTx = output.txRequests[0].transactions[0].unsignedTx.parsedTx as { spendAmount: string };
        parsedTx.should.have.property('spendAmount');
        (output.txRequests[0].transactions[0].unsignedTx.parsedTx as { outputs: any[] }).should.have.property(
          'outputs'
        );
      });

      it('should throw an error for invalid address', async function () {
        const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
        params.recoveryDestination = 'invalidAddress';

        // Ensure userKey and backupKey are the same
        params.userKey =
          '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446';
        params.backupKey =
          '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446';

        await assert.rejects(
          async () => {
            await (basecoin as AbstractEthLikeNewCoins).recover({
              recoveryDestination: params.recoveryDestination, // Destination Address
              gasLimit: 2000, // Gas Limit
              eip1559: { maxFeePerGas: 200, maxPriorityFeePerGas: 10000 }, // Max Fee Per Gas and Max Priority Fee Per Gas
              userKey: params.userKey, // Provide the userKey
              backupKey: params.backupKey, // Provide the backupKey
              walletContractAddress: params.walletContractAddress, // Provide the walletContractAddress
              isTss: true,
              replayProtectionOptions: {
                chain: '42',
                hardfork: 'london',
              },
            });
          },
          Error,
          'Error: invalid address'
        );
      });
    });

    describe('Build Unsigned Consolidation for Self-Custody Cold Wallets (MPCv2)', function () {
      const baseUrl = common.Environments.test.etherscanBaseUrl as string;
      let bitgo: TestBitGoAPI;
      let basecoin: Hteth;

      before(function () {
        bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
        basecoin = bitgo.coin('hteth') as Hteth;
      });

      it('should generate an unsigned consolidation for wallet v5', async function () {
        nock(baseUrl)
          .get('/api')
          .query(mockData.getTxListRequest(mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().address))
          .times(2)
          .reply(200, mockData.getTxListResponse);

        nock(baseUrl)
          .get('/api')
          .query(mockData.getBalanceRequest(mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().address))
          .times(2)
          .reply(200, mockData.getBalanceResponse);
        nock(baseUrl)
          .get('/api')
          .query(
            mockData.getBalanceRequest(
              mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().walletContractAddress
            )
          )
          .reply(200, mockData.getBalanceResponse);

        nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

        const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
        const consolidationResult = await (basecoin as AbstractEthLikeNewCoins).recoverConsolidations({
          backupKey: params.commonKeyChain, // Box B Data
          derivationSeed: params.derivationSeed, // Key Derivation Seed (optional)
          recoveryDestination: params.recoveryDestination, // Destination Address
          gasLimit: 200000, // Gas Limit
          eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 }, // Max Fee Per Gas and Max Priority Fee Per Gas
          walletContractAddress: params.walletContractAddress,
          isTss: true,
          replayProtectionOptions: {
            chain: '42',
            hardfork: 'london',
          },
          bitgoFeeAddress: '0x33a42faea3c6e87021347e51700b48aaf49aa1e7',
          startingScanIndex: 1,
          endingScanIndex: 2,
        });
        should.exist(consolidationResult);
        const unsignedBuilConsolidation = consolidationResult as UnsignedBuilConsolidation;
        unsignedBuilConsolidation.should.have.property('transactions');
        unsignedBuilConsolidation.transactions.should.have.length(1);

        const output = unsignedBuilConsolidation.transactions[0] as MPCSweepTxs;
        output.should.have.property('txRequests');
        output.txRequests[0].should.have.property('transactions');
        output.txRequests[0].transactions.should.have.length(1);
        output.txRequests[0].should.have.property('walletCoin');
        output.txRequests[0].transactions.should.have.length(1);
        output.txRequests[0].transactions[0].should.have.property('unsignedTx');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('serializedTxHex');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('signableHex');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('derivationPath');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('feeInfo');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('parsedTx');
        const parsedTx = output.txRequests[0].transactions[0].unsignedTx.parsedTx as { spendAmount: string };
        parsedTx.should.have.property('spendAmount');
        (output.txRequests[0].transactions[0].unsignedTx.parsedTx as { outputs: any[] }).should.have.property(
          'outputs'
        );
      });

      it('should generate an unsigned consolidation for wallet v6', async function () {
        nock(baseUrl)
          .get('/api')
          .query(mockData.getTxListRequest(mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().address))
          .times(2)
          .reply(200, mockData.getTxListResponse);

        nock(baseUrl)
          .get('/api')
          .query(mockData.getBalanceRequest(mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().address))
          .times(2)
          .reply(200, mockData.getBalanceResponse);
        nock(baseUrl)
          .get('/api')
          .query(
            mockData.getBalanceRequest(
              mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2().walletContractAddress
            )
          )
          .reply(200, mockData.getBalanceResponse);

        nock(baseUrl).get('/api').query(mockData.getContractCallRequest).reply(200, mockData.getContractCallResponse);

        const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
        const consolidationResult = await (basecoin as AbstractEthLikeNewCoins).recoverConsolidations({
          userKey: params.commonKeyChain, // Box A Data
          backupKey: params.commonKeyChain, // Box B Data
          derivationSeed: params.derivationSeed, // Key Derivation Seed (optional)
          recoveryDestination: params.recoveryDestination, // Destination Address
          gasLimit: 200000, // Gas Limit
          eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 }, // Max Fee Per Gas and Max Priority Fee Per Gas
          isTss: true,
          walletContractAddress: '123', // Wrong wallet address so that we can skip v5 address generation
          replayProtectionOptions: {
            chain: '42',
            hardfork: 'london',
          },
          bitgoFeeAddress: '0x33a42faea3c6e87021347e51700b48aaf49aa1e7',
          startingScanIndex: 1,
          endingScanIndex: 2,
        });
        should.exist(consolidationResult);
        const unsignedBuilConsolidation = consolidationResult as UnsignedBuilConsolidation;
        unsignedBuilConsolidation.should.have.property('transactions');
        unsignedBuilConsolidation.transactions.should.have.length(1);

        const output = unsignedBuilConsolidation.transactions[0] as MPCSweepTxs;
        output.should.have.property('txRequests');
        output.txRequests[0].should.have.property('transactions');
        output.txRequests[0].transactions.should.have.length(1);
        output.txRequests[0].should.have.property('walletCoin');
        output.txRequests[0].transactions.should.have.length(1);
        output.txRequests[0].transactions[0].should.have.property('unsignedTx');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('serializedTxHex');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('signableHex');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('derivationPath');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('feeInfo');
        output.txRequests[0].transactions[0].unsignedTx.should.have.property('parsedTx');
        const parsedTx = output.txRequests[0].transactions[0].unsignedTx.parsedTx as { spendAmount: string };
        parsedTx.should.have.property('spendAmount');
        (output.txRequests[0].transactions[0].unsignedTx.parsedTx as { outputs: any[] }).should.have.property(
          'outputs'
        );
      });

      it('should throw an error for invalid address', async function () {
        const params = mockData.getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2();
        params.recoveryDestination = 'invalidAddress';

        // Ensure userKey and backupKey are the same
        params.userKey =
          '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446';
        params.backupKey =
          '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446';

        await assert.rejects(
          async () => {
            await (basecoin as AbstractEthLikeNewCoins).recover({
              recoveryDestination: params.recoveryDestination, // Destination Address
              gasLimit: 2000, // Gas Limit
              eip1559: { maxFeePerGas: 200, maxPriorityFeePerGas: 10000 }, // Max Fee Per Gas and Max Priority Fee Per Gas
              userKey: params.userKey, // Provide the userKey
              backupKey: params.backupKey, // Provide the backupKey
              walletContractAddress: params.walletContractAddress, // Provide the walletContractAddress
              isTss: true,
              replayProtectionOptions: {
                chain: '42',
                hardfork: 'london',
              },
            });
          },
          Error,
          'Error: invalid address'
        );
      });
    });
  });

  describe('RecoveryBlockchainExplorerQuery', () => {
    it('should override the token parameter with a custom API key', async function () {
      const coin = bitgo.coin('teth') as Teth;
      const query = {
        module: 'account',
        action: 'balance',
        address: '0x1234567890123456789012345678901234567890',
      };
      const customApiKey = 'custom-api-key-for-test';

      // Mock the environment API token
      const originalApiToken = common.Environments.test.etherscanApiToken;
      common.Environments.test.etherscanApiToken = 'default-environment-api-key';

      // Mock the request.get function to capture the query parameters
      const originalGet = request.get;
      let capturedQuery;

      request.get = function (url: string) {
        return {
          query: function (params: Record<string, any>) {
            capturedQuery = params;
            return {
              ok: true,
              body: { result: '100000000' },
            } as any;
          },
        } as any;
      };

      try {
        // Call with default API key
        await coin.recoveryBlockchainExplorerQuery(query);
        capturedQuery.should.have.property('apikey', 'default-environment-api-key');

        // Call with custom API key
        await coin.recoveryBlockchainExplorerQuery(query, customApiKey);
        capturedQuery.should.have.property('apikey', customApiKey);
      } finally {
        // Restore original function and API token
        request.get = originalGet;
        common.Environments.test.etherscanApiToken = originalApiToken;
      }
    });
  });

  describe('Audit Key', () => {
    let coin: Hteth;
    before(() => {
      coin = bitgo.coin('hteth') as Hteth;
    });

    describe('MultiSig', () => {
      const { key } = ethMultiSigBackupKey;

      it('should return { isValid: true } for valid inputs', () => {
        coin.assertIsValidKey({
          encryptedPrv: key,
          walletPassphrase: 'ZQ8MhxT84m4P',
        });
      });

      it('should throw error if the walletPassphrase is incorrect', () => {
        assert.throws(
          () =>
            coin.assertIsValidKey({
              encryptedPrv: key,
              walletPassphrase: 'foo',
            }),
          { message: "failed to decrypt prv: ccm: tag doesn't match" }
        );
      });

      it('should throw error if the key is altered', () => {
        const alteredKey = key.replace(/[0-9]/g, '0');
        assert.throws(
          () =>
            coin.assertIsValidKey({
              encryptedPrv: alteredKey,
              walletPassphrase: 'kAm[EFQ6o=SxlcLFDw%,',
            }),
          { message: 'failed to decrypt prv: json decrypt: invalid parameters' }
        );
      });
    });

    describe('TSS', () => {
      const { key: keyString, commonKeychain } = ethTssBackupKey;
      const key = keyString.replace(/\s/g, '');
      const walletPassphrase = 'kAm[EFQ6o=SxlcLFDw%,';
      const multiSigType = 'tss';

      it('should not throw for valid inputs', () => {
        coin.assertIsValidKey({
          encryptedPrv: key,
          publicKey: commonKeychain,
          walletPassphrase,
          multiSigType,
        });
      });

      it('should throw if the commonKeychain is altered', () => {
        const alteredCommonKeychain = generateRandomPassword(10);
        assert.throws(
          () =>
            coin.assertIsValidKey({
              encryptedPrv: key,
              publicKey: alteredCommonKeychain,
              walletPassphrase,
              multiSigType,
            }),
          { message: 'Invalid common keychain' }
        );
      });

      it('should throw error if the walletPassphrase is incorrect', () => {
        const incorrectPassphrase = 'foo';
        assert.throws(
          () =>
            coin.assertIsValidKey({
              encryptedPrv: key,
              publicKey: commonKeychain,
              walletPassphrase: incorrectPassphrase,
              multiSigType,
            }),
          { message: "failed to decrypt prv: ccm: tag doesn't match" }
        );
      });

      it('should throw error if the key is altered', () => {
        const alteredKey = key.replace(/[0-9]/g, '0');
        assert.throws(
          () =>
            coin.assertIsValidKey({
              encryptedPrv: alteredKey,
              publicKey: commonKeychain,
              walletPassphrase,
              multiSigType,
            }),
          { message: 'failed to decrypt prv: json decrypt: invalid parameters' }
        );
      });
    });
  });
});
