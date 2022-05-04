import should = require('should');
import * as accountLib from '@bitgo/account-lib';
import { TestBitGo } from '../../../lib/test_bitgo';
import { randomBytes } from 'crypto';
import { rawTx, accounts, validatorContractAddress, blockHash } from '../../fixtures/coins/near';

describe('NEAR:', function () {
  let bitgo;
  let basecoin;
  const factory = accountLib.register('tnear', accountLib.Near.TransactionBuilderFactory);

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tnear');
  });

  it('should retun the right info', function () {
    const near = bitgo.coin('near');
    const tnear = bitgo.coin('tnear');

    near.getChain().should.equal('near');
    near.getFamily().should.equal('near');
    near.getFullName().should.equal('Near');
    near.getBaseFactor().should.equal(1e+24);

    tnear.getChain().should.equal('tnear');
    tnear.getFamily().should.equal('near');
    tnear.getFullName().should.equal('Testnet Near');
    tnear.getBaseFactor().should.equal(1e+24);
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPair = new accountLib.Near.KeyPair();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(keyPair.getKeys(), messageToSign);
      keyPair.verifySignature(messageToSign, Uint8Array.from(signature)).should.equals(true);
    });

    it('should fail with missing private key', async () => {
      const keyPair = new accountLib.Near.KeyPair({ pub: '7788327c695dca4b3e649a0db45bc3e703a2c67428fce360e61800cc4248f4f7' }).getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      await basecoin.signMessage(keyPair, messageToSign).should.be.rejectedWith('Invalid key pair options');
    });
  });

  describe('Sign transaction', () => {
    it('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txHex: rawTx.transfer.unsigned,
        },
        pubs: [
          accounts.account1.publicKey,
        ],
        prv: accounts.account1.secretKey,
      });
      signed.txHex.should.equal(rawTx.transfer.signed);
    });

    it('should fail to sign transaction with an invalid key', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: rawTx.transfer.unsigned,
          },
          pubs: [
            accounts.account2.publicKey,
          ],
          prv: accounts.account1.secretKey,
        });
      } catch (e) {
        should.equal(e.message, 'Private key cannot sign the transaction');
      }
    });

    it('should fail to build transaction with missing params', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: rawTx.transfer.unsigned,
            key: accounts.account1.publicKey,
          },
          prv: accounts.account1.secretKey,
        });
      } catch (e) {
        should.notEqual(e, null);
      }
    });
  });

  describe('Generate wallet key pair: ', () => {
    it('should generate key pair', () => {
      const kp = basecoin.generateKeyPair();
      basecoin.isValidPub(kp.pub).should.equal(true);
      basecoin.isValidPrv(kp.prv).should.equal(true);
    });

    it('should generate key pair from seed', () => {
      const seed = Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex');
      const kp = basecoin.generateKeyPair(seed);
      basecoin.isValidPub(kp.pub).should.equal(true);
      basecoin.isValidPrv(kp.prv).should.equal(true);
    });
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify transaction in base64 encoding', async () => {
      const txParams = {
      };

      // TO-DO wait for verifyTransaction using explainTranasaction
      const txPrebuild = {
        txHex: rawTx.transfer.unsigned,
        txInfo: {

        },
      };
      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify transaction in hex encoding', async () => {
      const txParams = {
      };

      // TO-DO wait for verifyTransaction using explainTranasaction
      const txPrebuild = {
        txHex: rawTx.transfer.hexUnsigned,
        txInfo: {

        },
      };

      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });
  });

  describe('Explain Transactions:', () => {
    const amount = '1000000';
    const gas = '125000000000000';

    it('should explain an unsigned transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txPrebuild: {
          txHex: rawTx.transfer.signed,
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'type',
        ],
        id: '5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw',
        type: 0,
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '1000000000000000000000000',
        outputs: [
          {
            address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
            amount: '1000000000000000000000000',
          },
        ],
        fee: {
          fee: '',
        },
      });
    });

    it('should explain a signed transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txPrebuild: {
          txHex: rawTx.transfer.signed,
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'type',
        ],
        id: '5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw',
        type: 0,
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '1000000000000000000000000',
        outputs: [
          {
            address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
            amount: '1000000000000000000000000',
          },
        ],
        fee: {
          fee: '',
        },
      });
    });

    it('should explain activate staking transaction', async function () {
      const amount = '1000000';
      const gas = '125000000000000';
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder
        .amount(amount)
        .gas(gas)
        .sender(accounts.account1.address, accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(blockHash.block1)
        .nonce(1);
      txBuilder.sign({ key: accounts.account1.secretKey });
      const tx = await txBuilder.build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txPrebuild: {
          txHex: txToBroadcastFormat,
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'type',
        ],
        id: 'GpiLLaGs2Fk2bd7SQvhkJaZjj74UnPPdF7cUa9pw15je',
        type: 13,
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '1000000',
        outputs: [
          {
            address: 'lavenderfive.pool.f863973.m0',
            amount: '1000000',
          },
        ],
        fee: {
          fee: '',
        },
      });
    });

    it('should explain deactivate staking transaction', async function () {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder
        .amount(amount)
        .gas(gas)
        .sender(accounts.account1.address, accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(blockHash.block1)
        .nonce(1);
      txBuilder.sign({ key: accounts.account1.secretKey });
      const tx = await txBuilder.build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txPrebuild: {
          txHex: txToBroadcastFormat,
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'type',
        ],
        id: 'CDxPRP3DgHN8gYmRDagk5TRuX7fsCRYHcuqoNULyQPUW',
        type: 17,
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [],
        fee: {
          fee: '',
        },
      });
    });

    it('should explain withdraw staking transaction', async function () {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder
        .amount(amount)
        .gas(gas)
        .sender(accounts.account1.address, accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(blockHash.block1)
        .nonce(1);
      txBuilder.sign({ key: accounts.account1.secretKey });
      const tx = await txBuilder.build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txPrebuild: {
          txHex: txToBroadcastFormat,
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'type',
        ],
        id: '52ZX8MUwmYc6WQ67riUBpmntkcSxxT5aKkJYt5CtCZub',
        type: 15,
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '1000000',
        outputs: [
          {
            address: '61b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d',
            amount: '1000000',
          },
        ],
        fee: {
          fee: '',
        },
      });
    });

    it('should fail to explain transaction with missing params', async function () {
      try {
        await basecoin.explainTransaction({
          txPrebuild: {},
        });
      } catch (error) {
        should.equal(error.message, 'Invalid transaction');
      }
    });

    it('should fail to explain transaction with wrong params', async function () {
      try {
        await basecoin.explainTransaction({
          txPrebuild: {
            txHex: 'invalidTxHex',
          },
        });
      } catch (error) {
        should.equal(error.message, 'Invalid transaction');
      }
    });
  });
});
