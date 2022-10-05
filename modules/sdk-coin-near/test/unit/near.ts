import should = require('should');
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { randomBytes } from 'crypto';
import {
  rawTx,
  accounts,
  validatorContractAddress,
  blockHash,
  NearResponses,
  keys,
  accountInfo,
  nonce,
} from '../fixtures/near';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import { KeyPair, Near, TNear, Transaction } from '../../src';
import { getBuilderFactory } from './getBuilderFactory';
import { coins } from '@bitgo/statics';

describe('NEAR:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;
  const factory = getBuilderFactory('tnear');

  const txPrebuild = {
    txHex: rawTx.transfer.unsigned,
    txInfo: {},
  };

  const txParams = {
    recipients: [
      {
        address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
        amount: '1000000000000000000000000',
      },
    ],
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tnear', Near.createInstance);
    bitgo.safeRegister('near', TNear.createInstance);
    basecoin = bitgo.coin('tnear');
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should retun the right info', function () {
    const near = bitgo.coin('near');
    const tnear = bitgo.coin('tnear');

    near.getChain().should.equal('near');
    near.getFamily().should.equal('near');
    near.getFullName().should.equal('Near');
    near.getBaseFactor().should.equal(1e24);

    tnear.getChain().should.equal('tnear');
    tnear.getFamily().should.equal('near');
    tnear.getFullName().should.equal('Testnet Near');
    tnear.getBaseFactor().should.equal(1e24);
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPair = new KeyPair();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(keyPair.getKeys(), messageToSign);
      keyPair.verifySignature(messageToSign, Uint8Array.from(signature)).should.equals(true);
    });

    it('should fail with missing private key', async () => {
      const keyPair = new KeyPair({
        pub: '7788327c695dca4b3e649a0db45bc3e703a2c67428fce360e61800cc4248f4f7',
      }).getKeys();
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
        pubs: [accounts.account1.publicKey],
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
          pubs: [accounts.account2.publicKey],
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
    const amount = '1000000';
    const gas = '125000000000000';

    it('should succeed to verify unsigned transaction in base64 encoding', async () => {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify signed transaction in base64 encoding', async () => {
      const txPrebuild = {
        txHex: rawTx.transfer.signed,
        txInfo: {},
      };

      const txParams = newTxParams();
      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should fail verify transactions when have different recipients', async () => {
      const txPrebuild = newTxPrebuild();

      const txParams = {
        recipients: [
          {
            address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
            amount: '1000000000000000000000000',
          },
          {
            address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
            amount: '2000000000000000000000000',
          },
        ],
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, verification })
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail verify transactions when total amount does not match with expected total amount field', async () => {
      const explainedTx = {
        id: '5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw',
        displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'],
        outputAmount: '90000',
        changeAmount: '0',
        changeOutputs: [],
        outputs: [
          {
            address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
            amount: '1000000000000000000000000',
          },
        ],
        fee: {
          fee: '',
        },
        type: 0,
      };

      const stub = sinon.stub(Transaction.prototype, 'explainTransaction');
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      stub.returns(explainedTx);

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, verification })
        .should.be.rejectedWith('Tx total amount does not match with expected total amount field');
      stub.restore();
    });

    it('should succeed to verify transaction in hex encoding', async () => {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should convert serialized hex string to base64', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const verification = {};
      txPrebuild.txHex = Buffer.from(txPrebuild.txHex, 'base64').toString('hex');
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      validTransaction.should.equal(true);
    });

    it('should verify when input `recipients` is absent', async function () {
      const txParams = newTxParams();
      txParams.recipients = undefined;
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild });
      validTransaction.should.equal(true);
    });

    it('should fail verify when txHex is invalid', async function () {
      const txParams = newTxParams();
      txParams.recipients = undefined;
      const txPrebuild = {};
      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });

    it('should succeed to verify transactions when recipients has extra data', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.data = 'data';

      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild });
      validTransaction.should.equal(true);
    });

    it('should verify activate staking transaction', async function () {
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
      const txPrebuild = {
        txHex: txToBroadcastFormat,
      };
      const txParams = {
        recipients: [
          {
            address: 'lavenderfive.pool.f863973.m0',
            amount: '1000000',
          },
        ],
      };
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild });
      validTransaction.should.equal(true);
    });

    it('should verify deactivate staking transaction', async function () {
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
      const txPrebuild = {
        txHex: txToBroadcastFormat,
      };
      const txParams = {
        recipients: [],
      };
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild });
      validTransaction.should.equal(true);
    });

    it('should verify withdraw staking transaction', async function () {
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
      const txPrebuild = {
        txHex: txToBroadcastFormat,
      };
      const txParams = {
        recipients: [
          {
            address: '61b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d',
            amount: '1000000',
          },
        ],
      };
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild });
      validTransaction.should.equal(true);
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
        displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'],
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
        displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'],
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
        displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'],
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
        displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'],
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
        displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'],
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

  describe('Parse Transactions:', () => {
    const TEN_MILLION_NEAR = '10000000000000000000000000000000';
    const ONE_MILLION_NEAR = '1000000000000000000000000';

    const amount = TEN_MILLION_NEAR;
    const gas = '125000000000000';

    const response1 = {
      address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
      amount: ONE_MILLION_NEAR,
    };

    const response2 = {
      address: 'lavenderfive.pool.f863973.m0',
      amount: TEN_MILLION_NEAR,
    };

    const response3 = {
      address: '61b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d',
      amount: TEN_MILLION_NEAR,
    };

    it('should parse an unsigned transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txPrebuild: {
          txHex: rawTx.transfer.unsigned,
        },
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [response1],
        outputs: [response1],
      });
    });

    it('should parse a signed transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txPrebuild: {
          txHex: rawTx.transfer.signed,
        },
        feeInfo: {
          fee: '',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [response1],
        outputs: [response1],
      });
    });

    it('should fail parse a signed transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Near.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin
        .parseTransaction({
          txPrebuild: {
            txHex: rawTx.transfer.signed,
          },
          feeInfo: {
            fee: '',
          },
        })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });

    it('should parse activate staking transaction', async function () {
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
      const parsedTransaction = await basecoin.parseTransaction({
        txPrebuild: {
          txHex: txToBroadcastFormat,
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [response2],
        outputs: [response2],
      });
    });

    it('should parse deactivate staking transaction', async function () {
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
      const parsedTransaction = await basecoin.parseTransaction({
        txPrebuild: {
          txHex: txToBroadcastFormat,
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [],
        outputs: [],
      });
    });

    it('should parse withdraw staking transaction', async function () {
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

      const parsedTransaction = await basecoin.parseTransaction({
        txPrebuild: {
          txHex: txToBroadcastFormat,
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [response3],
        outputs: [response3],
      });
    });
  });

  describe('Recover Transactions:', () => {
    const sandBox = sinon.createSandbox();
    const coin = coins.get('tnear');
    beforeEach(() => {
      const callBack = sandBox.stub(Near.prototype, 'getDataFromNode' as keyof Near);
      callBack
        .withArgs({
          payload: {
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'query',
            params: {
              request_type: 'view_access_key',
              finality: 'final',
              account_id: accountInfo.accountId,
              public_key: accountInfo.bs58EncodedPublicKey,
            },
          },
        })
        .resolves(NearResponses.getAccessKeyResponse);
      callBack
        .withArgs({
          payload: {
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'query',
            params: {
              request_type: 'view_account',
              finality: 'final',
              account_id: accountInfo.accountId,
            },
          },
        })
        .resolves(NearResponses.getAccountResponse);
      callBack.withArgs().resolves(NearResponses.getProtocolConfigResp);
      callBack
        .withArgs({
          payload: {
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'gas_price',
            params: [accountInfo.blockHash],
          },
        })
        .resolves(NearResponses.getGasPriceResponse);
    });

    afterEach(() => {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recoveries', async function () {
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination: 'abhay-near.testnet',
        walletPassphrase: 'Ghghjkg!455544llll',
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');

      const NonBitGoTxnDeserialize = new Transaction(coin);
      NonBitGoTxnDeserialize.fromRawTransaction(res.serializedTx);
      const NonBitGoTxnJson = NonBitGoTxnDeserialize.toJson();

      should.equal(NonBitGoTxnJson.nonce, nonce);
      should.equal(NonBitGoTxnJson.signerId, accountInfo.accountId);
      should.equal(NonBitGoTxnJson.publicKey, 'ed25519:' + accountInfo.bs58EncodedPublicKey);
      sandBox.assert.callCount(basecoin.getDataFromNode, 4);
    });

    it('should recover a txn for unsigned sweep recoveries', async function () {
      const res = await basecoin.recover({
        bitgoKey: keys.bitgoKey,
        recoveryDestination: 'abhay-near.testnet',
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');

      const UnsignedSweepTxnDeserialize = new Transaction(coin);
      UnsignedSweepTxnDeserialize.fromRawTransaction(res.serializedTx);
      const UnsignedSweepTxnJson = UnsignedSweepTxnDeserialize.toJson();

      should.equal(UnsignedSweepTxnJson.nonce, nonce);
      should.equal(UnsignedSweepTxnJson.signerId, accountInfo.accountId);
      should.equal(UnsignedSweepTxnJson.publicKey, 'ed25519:' + accountInfo.bs58EncodedPublicKey);
      sandBox.assert.callCount(basecoin.getDataFromNode, 4);
    });
  });

  describe('Recover Transactions for wallet with multiple addresses:', () => {
    const destAddr = 'abhay-near.testnet';
    const sandBox = sinon.createSandbox();
    const coin = coins.get('tnear');
    const address1Info = {
      accountId: 'f6842bf4a8e980704fbd9fb799bfbe0a116fd5d8d06f6774e792c68c907d9b20',
      bs58EncodedPublicKey: 'HbJBqyagBqtSNUR74fLMQSjQ8HyQVs66fyMySPhZLXz7',
      blockHash: '844N9aWefd4TvJwdiBgXDVPz4W9z436kohTiXnp5y4fq',
    };

    beforeEach(function () {
      const callBack = sandBox.stub(Near.prototype, 'getDataFromNode' as keyof Near);
      callBack
        .withArgs({
          payload: {
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'query',
            params: {
              request_type: 'view_access_key',
              finality: 'final',
              account_id: address1Info.accountId,
              public_key: address1Info.bs58EncodedPublicKey,
            },
          },
        })
        .resolves(NearResponses.getAccessKeyResponse);
      callBack
        .withArgs({
          payload: {
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'query',
            params: {
              request_type: 'view_account',
              finality: 'final',
              account_id: accountInfo.accountId,
            },
          },
        })
        .resolves(NearResponses.getZeroBalanceAccountResponse);
      callBack
        .withArgs({
          payload: {
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'query',
            params: {
              request_type: 'view_account',
              finality: 'final',
              account_id: address1Info.accountId,
            },
          },
        })
        .resolves(NearResponses.getAccountResponse);
      callBack.withArgs().resolves(NearResponses.getProtocolConfigResp);
      callBack
        .withArgs({
          payload: {
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'gas_price',
            params: [address1Info.blockHash],
          },
        })
        .resolves(NearResponses.getGasPriceResponse);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recoveries at address 1 but search from address 0', async function () {
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination: destAddr,
        walletPassphrase: 'Ghghjkg!455544llll',
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      res.should.hasOwnProperty('scanIndex');
      res.scanIndex.should.equal(1);
      sandBox.assert.callCount(basecoin.getDataFromNode, 5);

      const tx = new Transaction(coin);
      tx.fromRawTransaction(res.serializedTx);
      const txJson = tx.toJson();

      should.equal(txJson.nonce, nonce);
      should.equal(txJson.signerId, address1Info.accountId);
      should.equal(txJson.publicKey, 'ed25519:' + address1Info.bs58EncodedPublicKey);
    });

    it('should recover a txn for non-bitgo recoveries at address 1 but search from address 1', async function () {
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination: destAddr,
        walletPassphrase: 'Ghghjkg!455544llll',
        startingScanIndex: 1,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      res.should.hasOwnProperty('scanIndex');
      res.scanIndex.should.equal(1);
      sandBox.assert.callCount(basecoin.getDataFromNode, 4);

      const tx = new Transaction(coin);
      tx.fromRawTransaction(res.serializedTx);
      const txJson = tx.toJson();

      should.equal(txJson.nonce, nonce);
      should.equal(txJson.signerId, address1Info.accountId);
      should.equal(txJson.publicKey, 'ed25519:' + address1Info.bs58EncodedPublicKey);
    });
  });

  describe('Recover Transaction Failures:', () => {
    const sandBox = sinon.createSandbox();
    const destAddr = 'abhay-near.testnet';
    const numIteration = 10;

    beforeEach(function () {
      const callBack = sandBox.stub(Near.prototype, 'getDataFromNode' as keyof Near);
      callBack
        .withArgs(sinon.match.hasNested('payload.method', 'EXPERIMENTAL_protocol_config'))
        .resolves(NearResponses.getProtocolConfigResp);
      callBack.resolves(NearResponses.getZeroBalanceAccountResponse);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should fail to recover due to not finding an address with funds', async function () {
      await basecoin
        .recover({
          userKey: keys.userKey,
          backupKey: keys.backupKey,
          bitgoKey: keys.bitgoKey,
          walletPassphrase: 'Ghghjkg!455544llll',
          recoveryDestination: destAddr,
          scan: numIteration,
        })
        .should.rejectedWith('Did not find an address with funds to recover');
      // getDataFromNode should be called numIteration + 1 times since we initially
      // call getProtocolConfig
      sandBox.assert.callCount(basecoin.getDataFromNode, numIteration + 1);
    });
  });
});
