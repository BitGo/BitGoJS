import { randomBytes } from 'crypto';

import should from 'should';
import _ from 'lodash';
import sinon from 'sinon';
import nock from 'nock';
import assert from 'assert';

import { BitGoAPI } from '@bitgo-beta/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';
import { coins } from '@bitgo-beta/statics';
import { common, TransactionPrebuild, Wallet } from '@bitgo-beta/sdk-core';

import { KeyPair, Near, TNear, Transaction } from '../../src';
import nearUtils from '../../src/lib/utils';
import { getBuilderFactory } from './getBuilderFactory';

import {
  rawTx,
  accounts,
  validatorContractAddress,
  blockHash,
  NearResponses,
  keys,
  accountInfo,
  nonce,
  ovcResponse,
} from '../fixtures/near';
import * as testData from '../resources/near';

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

    it('should succeed to verify unsigned self storage deposit transaction', async () => {
      const txPrebuild = {
        txHex: testData.rawTx.selfStorageDeposit.unsigned,
      };
      const txParams = {
        type: 'enabletoken',
        recipients: [
          {
            address: testData.accounts.account1.address,
            amount: '0',
            tokenName: 'tnear:tnep24dp',
          },
        ],
      };
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify signed self storage deposit transaction', async () => {
      const txPrebuild = {
        txHex: testData.rawTx.selfStorageDeposit.signed,
      };
      const txParams = {
        type: 'enabletoken',
        recipients: [
          {
            address: testData.accounts.account1.address,
            amount: '0',
            tokenName: 'tnear:tnep24dp',
          },
        ],
      };
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify unsigned storage deposit transaction', async () => {
      const txPrebuild = {
        txHex: testData.rawTx.storageDeposit.unsigned,
      };
      const txParams = {
        type: 'enabletoken',
        recipients: [
          {
            address: testData.accounts.account2.address,
            amount: '0',
            tokenName: 'tnear:tnep24dp',
          },
        ],
      };
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify signed storage deposit transaction', async () => {
      const txPrebuild = {
        txHex: testData.rawTx.storageDeposit.signed,
      };
      const txParams = {
        type: 'enabletoken',
        recipients: [
          {
            address: testData.accounts.account2.address,
            amount: '0',
            tokenName: 'tnear:tnep24dp',
          },
        ],
      };
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
        .nonce(BigInt(1));
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
        .nonce(BigInt(1));
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
        .nonce(BigInt(1));
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

    it('should verify a spoofed consolidation transaction', async function () {
      // Set up wallet data
      const walletData = {
        id: '62e156dbd641c000076bbabe04041a90',
        coin: 'tnear',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: '3a1b77653ea1705ad297db7abe259953b4ad5d2ecc5b50bee9a486f785dd90db',
        },
        multisigType: 'tss',
      };

      const consolidationTx = {
        txRequestId: '03fdf51a-28e1-4268-b5be-a4afc030ff64',
        walletId: '62e156dbd641c000076bbabe',
        txHex:
          '400000006562376433623333313166616261653338393062363731383536343838383066663831383766353465623565626665343336646131313338333130396638623500eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5c8a6d8a6f86100004000000061393465333937306165633436626262313536393331636130393065643735666633616164653439373966666566366437346337326435613234376365393466ad19fa7faa45643200f99a992715a02f9806bcbf0c5737ccdf5d61172d61a4f901000000030038bf94dd153d9d7fa7010000000000',
        feeInfo: {
          fee: 85332111947887500000,
          feeString: '85332111947887500377',
        },
        txInfo: {
          minerFee: '0',
          spendAmount: '1999915088987500000000000',
          spendAmounts: [
            {
              coinName: 'tnear',
              amountString: '1999915088987500000000000',
            },
          ],
          payGoFee: '0',
          outputs: [
            {
              address: 'a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f',
              value: 1.9999150889875e24,
              wallet: '62e156dbd641c000076bbabe',
              wallets: ['62e156dbd641c000076bbabe'],
              enterprise: '6111785f59548d0007a4d13c',
              enterprises: ['6111785f59548d0007a4d13c'],
              valueString: '1999915088987500000000000',
              coinName: 'tnear',
              walletType: 'hot',
              walletTypes: ['hot'],
            },
          ],
          inputs: [
            {
              value: 1.9999150889875e24,
              address: 'eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5',
              valueString: '1999915088987500000000000',
            },
          ],
          type: '0',
        },
        consolidateId: '68ae77ec62346a69d0aee5a2dda69c8c',
        coin: 'tnear',
      };
      const bgUrl = common.Environments['mock'].uri;
      const walletObj = new Wallet(bitgo, basecoin, walletData);

      nock(bgUrl)
        .post('/api/v2/tnear/wallet/62e156dbd641c000076bbabe04041a90/consolidateAccount/build')
        .reply(200, [
          {
            ...consolidationTx,
            txHex:
              '400000006139346533393730616563343662626231353639333163613039306564373566663361616465343937396666656636643734633732643561323437636539346600a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f1f3dec154a5700004000000066326137386638303336663861343266383730313962316431646336336131623337623139333365653632646464353365373438633530323266316435373961fb6130e6cc30c926fccde8043ce4e43a810ea63b4d3f93623a54176ff8db1cd001000000030000004a480114169545080000000000',
          },
        ]);

      nock(bgUrl)
        .get('/api/v2/tnear/key/5b3424f91bf349930e34017500000000')
        .reply(200, [
          {
            encryptedPrv: 'fakePrv',
          },
        ]);

      nock(bgUrl)
        .get('/api/v2/tnear/wallet/62e156dbd641c000076bbabe04041a90/addresses?sort=-1&limit=1')
        .reply(200, [
          {
            address: 'a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f',
          },
        ]);

      // Call the function to test
      await assert.rejects(
        async () => {
          await walletObj.sendAccountConsolidations({
            walletPassphrase: 'password',
            verification: {
              consolidationToBaseAddress: true,
            },
          });
        },
        {
          message: 'tx outputs does not match with expected address',
        }
      );
    });

    it('should verify valid a consolidation transaction', async () => {
      // Set up wallet data
      const walletData = {
        id: '62e156dbd641c000076bbabe04041a90',
        coin: 'tnear',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: '3a1b77653ea1705ad297db7abe259953b4ad5d2ecc5b50bee9a486f785dd90db',
        },
        multisigType: 'tss',
      };

      const consolidationTx = {
        txRequestId: '03fdf51a-28e1-4268-b5be-a4afc030ff64',
        walletId: '62e156dbd641c000076bbabe',
        txHex:
          '400000006562376433623333313166616261653338393062363731383536343838383066663831383766353465623565626665343336646131313338333130396638623500eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5c8a6d8a6f86100004000000061393465333937306165633436626262313536393331636130393065643735666633616164653439373966666566366437346337326435613234376365393466ad19fa7faa45643200f99a992715a02f9806bcbf0c5737ccdf5d61172d61a4f901000000030038bf94dd153d9d7fa7010000000000',
        feeInfo: {
          fee: 85332111947887500000,
          feeString: '85332111947887500377',
        },
        txInfo: {
          minerFee: '0',
          spendAmount: '1999915088987500000000000',
          spendAmounts: [
            {
              coinName: 'tnear',
              amountString: '1999915088987500000000000',
            },
          ],
          payGoFee: '0',
          outputs: [
            {
              address: 'a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f',
              value: 1.9999150889875e24,
              wallet: '62e156dbd641c000076bbabe',
              wallets: ['62e156dbd641c000076bbabe'],
              enterprise: '6111785f59548d0007a4d13c',
              enterprises: ['6111785f59548d0007a4d13c'],
              valueString: '1999915088987500000000000',
              coinName: 'tnear',
              walletType: 'hot',
              walletTypes: ['hot'],
            },
          ],
          inputs: [
            {
              value: 1.9999150889875e24,
              address: 'eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5',
              valueString: '1999915088987500000000000',
            },
          ],
          type: '0',
        },
        consolidateId: '68ae77ec62346a69d0aee5a2dda69c8c',
        coin: 'tnear',
      };
      const bgUrl = common.Environments['mock'].uri;

      nock(bgUrl)
        .get('/api/v2/tnear/wallet/62e156dbd641c000076bbabe04041a90/addresses?sort=-1&limit=1')
        .reply(200, [
          {
            address: 'a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f',
          },
        ]);

      try {
        if (
          !(await basecoin.verifyTransaction({
            blockhash: '',
            feePayer: '',
            txParams: {},
            txPrebuild: consolidationTx as unknown as TransactionPrebuild,
            walletType: 'tss',
            wallet: new Wallet(bitgo, basecoin, walletData),
            verification: {
              consolidationToBaseAddress: true,
            },
          }))
        ) {
          assert.fail('Transaction should pass verification');
        }
      } catch (e) {
        assert.fail('Transaction should pass verification');
      }
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
        .nonce(BigInt(1));
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
        .nonce(BigInt(1));
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
        .nonce(BigInt(1));
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
        .nonce(BigInt(1));
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
        .nonce(BigInt(1));
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
        .nonce(BigInt(1));
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
        recoveryDestination: accountInfo.recoveryDestination,
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
        recoveryDestination: accountInfo.recoveryDestination,
      });

      // Assertions for the structure of the result
      should.exist(res);
      res.should.have.property('txRequests').which.is.an.Array();
      res.txRequests[0].should.have.property('transactions').which.is.an.Array();
      res.txRequests[0].transactions[0].should.have.property('unsignedTx');

      // Assertions for the unsigned transaction
      const unsignedTx = res.txRequests[0].transactions[0].unsignedTx;
      unsignedTx.should.have.property('serializedTx').which.is.a.String();
      unsignedTx.should.have.property('scanIndex', 0);
      unsignedTx.should.have.property('coin', 'tnear');
      unsignedTx.should.have.property(
        'signableHex',
        'c27d684b6f09c4b603d9bf8a08baedf12b8bb951f314acd747b16bb75cfbf687'
      );
      unsignedTx.should.have.property('derivationPath', 'm/0');

      // Assertions for parsed transaction
      const parsedTx = unsignedTx.parsedTx;
      parsedTx.should.have.property('inputs').which.is.an.Array();
      parsedTx.inputs[0].should.have.property(
        'address',
        'f256196dae617aa348149c1e61e997272492668d517506d7a6e2392e06ea532c'
      );
      parsedTx.inputs[0].should.have.property('valueString', '1.97885506094866269650000001e+26');
      parsedTx.inputs[0].should.have.property('value', 1.9788550609486627e26);

      parsedTx.should.have.property('outputs').which.is.an.Array();
      parsedTx.outputs[0].should.have.property('address', accountInfo.recoveryDestination);
      parsedTx.outputs[0].should.have.property('valueString', '1.97885506094866269650000001e+26');
      parsedTx.outputs[0].should.have.property('coinName', 'tnear');

      parsedTx.should.have.property('spendAmount', '1.97885506094866269650000001e+26');
      parsedTx.should.have.property('type', '');

      // Assertions for fee info
      unsignedTx.should.have.property('feeInfo');
      unsignedTx.feeInfo.should.have.property('fee', 68628637968750000000);
      unsignedTx.feeInfo.should.have.property('feeString', '68628637968750000000');

      // Assertions for coin-specific data
      unsignedTx.should.have.property('coinSpecific');
      unsignedTx.coinSpecific.should.have.property(
        'commonKeychain',
        '8699d2e05d60a3f7ab733a74ccf707f3407494b60f4253616187f5262e20737519a1763de0bcc4d165a7fa0e4dde67a1426ec4cc9fcd0820d749e6589dcfa08e'
      );
    });

    it('should take OVC output and generate a signed sweep transaction for NEAR', async function () {
      const params = ovcResponse; // NEAR-specific response fixture
      const recoveryTxn = await basecoin.createBroadcastableSweepTransaction(params);

      // Validate the serialized transaction
      recoveryTxn.transactions[0].serializedTx.should.equal(
        'QAAAAGIzODNjYWM2ZjNjZDY0OTViZDZhYjg3NzMwMGE4NzliN2RiYzRhMTZhYjBlZjE5NzlkZTZmNzNkYjAyNDlmYWEAs4PKxvPNZJW9arh3MAqHm328SharDvGXneb3PbAkn6oBuZUj6a0AAEAAAABlYWRiMzIwOGZiOWU5MWY2MGQ3NmUzYzUxNzEzZDA1Y2I0YTU5NDFlNWYzNTVlMWZmOThlMTQwYTcxMjNlODRl2hbJtC4rwLyWAbMzTgTcRmr5xpWlrXOXbzxMWcP7wwcBAAAAA9A1oVfvpz3o4hcAAAAAAAAAvAIWOj2c1QhqbWcClZ8dW7KQcfG9gYFkimbRDyI8t8L4TUiUyRXMYv5U8jaEsNFWteBcUGolFcLQSbbD5MCpDw=='
      );

      // Validate the scan index
      recoveryTxn.transactions[0].scanIndex.should.equal(0);
      recoveryTxn.lastScanIndex.should.equal(0);
    });
  });

  describe('Recover Transactions for wallet with multiple addresses:', () => {
    const destAddr = accountInfo.recoveryDestination;
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
    const destAddr = accountInfo.recoveryDestination;
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

  describe('Recover Token Transactions:', () => {
    const sandBox = sinon.createSandbox();
    const coin = coins.get('tnear:tnep24dp');
    function setUpMock(mockStorageDepositPresent = false) {
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
            method: 'query',
            params: {
              request_type: 'call_function',
              finality: 'final',
              account_id: accountInfo.tokenContractAddress,
              method_name: 'ft_balance_of',
              args_base64: nearUtils.convertToBase64({ account_id: accountInfo.accountId }),
            },
          },
        })
        .resolves(NearResponses.getAccountFungibleTokenBalanceResponse);
      const storageDepositResponse = mockStorageDepositPresent
        ? NearResponses.getStorageBalanceResponsePresent
        : NearResponses.getStorageBalanceResponseNotPresent;
      callBack
        .withArgs({
          payload: {
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'query',
            params: {
              request_type: 'call_function',
              finality: 'final',
              account_id: accountInfo.tokenContractAddress,
              method_name: 'storage_balance_of',
              args_base64: nearUtils.convertToBase64({ account_id: accountInfo.recoveryDestination }),
            },
          },
        })
        .resolves(storageDepositResponse);
    }

    afterEach(() => {
      sandBox.restore();
    });

    it('should recover near token for non-bitgo recoveries with storage deposit', async () => {
      setUpMock();
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination: accountInfo.recoveryDestination,
        walletPassphrase: 'Ghghjkg!455544llll',
        tokenContractAddress: accountInfo.tokenContractAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');

      const NonBitGoTxnDeserialize = new Transaction(coin);
      NonBitGoTxnDeserialize.fromRawTransaction(res.serializedTx);
      const NonBitGoTxnJson = NonBitGoTxnDeserialize.toJson();

      should.equal(NonBitGoTxnJson.nonce, nonce);
      should.equal(NonBitGoTxnJson.signerId, accountInfo.accountId);
      should.equal(NonBitGoTxnJson.publicKey, 'ed25519:' + accountInfo.bs58EncodedPublicKey);
      should.equal(NonBitGoTxnJson.actions.length, 2);
      should.equal(NonBitGoTxnJson.actions[0]?.functionCall?.methodName, 'storage_deposit');
      should.equal(NonBitGoTxnJson.actions[1]?.functionCall?.methodName, 'ft_transfer');
      sandBox.assert.callCount(basecoin.getDataFromNode, 5);
    });

    it('should recover near token for non-bitgo recoveries without storage deposit', async () => {
      setUpMock(true);
      const res = await basecoin.recover({
        userKey: keys.userKey,
        backupKey: keys.backupKey,
        bitgoKey: keys.bitgoKey,
        recoveryDestination: accountInfo.recoveryDestination,
        walletPassphrase: 'Ghghjkg!455544llll',
        tokenContractAddress: accountInfo.tokenContractAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');

      const NonBitGoTxnDeserialize = new Transaction(coin);
      NonBitGoTxnDeserialize.fromRawTransaction(res.serializedTx);
      const NonBitGoTxnJson = NonBitGoTxnDeserialize.toJson();

      should.equal(NonBitGoTxnJson.nonce, nonce);
      should.equal(NonBitGoTxnJson.signerId, accountInfo.accountId);
      should.equal(NonBitGoTxnJson.publicKey, 'ed25519:' + accountInfo.bs58EncodedPublicKey);
      should.equal(NonBitGoTxnJson.actions.length, 1);
      should.equal(NonBitGoTxnJson.actions[0]?.functionCall?.methodName, 'ft_transfer');
      sandBox.assert.callCount(basecoin.getDataFromNode, 5);
    });

    it('should recover near token for unsigned sweep recoveries with storage deposit', async function () {
      setUpMock();
      const res = await basecoin.recover({
        bitgoKey: keys.bitgoKey,
        recoveryDestination: accountInfo.recoveryDestination,
        tokenContractAddress: accountInfo.tokenContractAddress,
      });

      // Assertions for the structure of the result
      should.exist(res);
      res.should.have.property('txRequests').which.is.an.Array();
      res.txRequests[0].should.have.property('transactions').which.is.an.Array();
      res.txRequests[0].transactions[0].should.have.property('unsignedTx');

      // Assertions for the unsigned transaction
      const unsignedTx = res.txRequests[0].transactions[0].unsignedTx;
      unsignedTx.should.have.property('serializedTx').which.is.a.String();
      unsignedTx.should.have.property('scanIndex', 0);
      unsignedTx.should.have.property('coin', 'tnear:tnep24dp');
      unsignedTx.should.have.property(
        'signableHex',
        'ba901a655bfff3683a37a70b7caf1c90c7f9c007b09c6a9bb74540ac611aeac0'
      );
      unsignedTx.should.have.property('derivationPath', 'm/0');

      // Assertions for parsed transaction
      const parsedTx = unsignedTx.parsedTx;
      parsedTx.should.have.property('inputs').which.is.an.Array();
      parsedTx.inputs[0].should.have.property(
        'address',
        'f256196dae617aa348149c1e61e997272492668d517506d7a6e2392e06ea532c'
      );
      parsedTx.inputs[0].should.have.property('valueString', '3.2899939469999999999981e+24');
      parsedTx.inputs[0].should.have.property('value', 3.289993947e24);

      parsedTx.should.have.property('outputs').which.is.an.Array();
      parsedTx.outputs[0].should.have.property('address', accountInfo.recoveryDestination);
      parsedTx.outputs[0].should.have.property('valueString', '3.2899939469999999999981e+24');
      parsedTx.outputs[0].should.have.property('coinName', 'tnear:tnep24dp');

      parsedTx.should.have.property('spendAmount', '3.2899939469999999999981e+24');
      parsedTx.should.have.property('type', '');

      // Assertions for fee info
      unsignedTx.should.have.property('feeInfo');
      unsignedTx.feeInfo.should.have.property('fee', 3e21);
      unsignedTx.feeInfo.should.have.property('feeString', '3000000000000000000000');

      // Assertions for coin-specific data
      unsignedTx.should.have.property('coinSpecific');
      unsignedTx.coinSpecific.should.have.property(
        'commonKeychain',
        '8699d2e05d60a3f7ab733a74ccf707f3407494b60f4253616187f5262e20737519a1763de0bcc4d165a7fa0e4dde67a1426ec4cc9fcd0820d749e6589dcfa08e'
      );
    });

    it('should recover near token for unsigned sweep recoveries without storage deposit', async function () {
      setUpMock(true);
      const res = await basecoin.recover({
        bitgoKey: keys.bitgoKey,
        recoveryDestination: accountInfo.recoveryDestination,
        tokenContractAddress: accountInfo.tokenContractAddress,
      });

      // Assertions for the structure of the result
      should.exist(res);
      res.should.have.property('txRequests').which.is.an.Array();
      res.txRequests[0].should.have.property('transactions').which.is.an.Array();
      res.txRequests[0].transactions[0].should.have.property('unsignedTx');

      // Assertions for the unsigned transaction
      const unsignedTx = res.txRequests[0].transactions[0].unsignedTx;
      unsignedTx.should.have.property('serializedTx').which.is.a.String();
      unsignedTx.should.have.property('scanIndex', 0);
      unsignedTx.should.have.property('coin', 'tnear:tnep24dp');
      unsignedTx.should.have.property(
        'signableHex',
        '2d5da3340c308bd2fce1e0805b890d63d8946cff61818c0960e87203919fffc7'
      );
      unsignedTx.should.have.property('derivationPath', 'm/0');

      // Assertions for parsed transaction
      const parsedTx = unsignedTx.parsedTx;
      parsedTx.should.have.property('inputs').which.is.an.Array();
      parsedTx.inputs[0].should.have.property(
        'address',
        'f256196dae617aa348149c1e61e997272492668d517506d7a6e2392e06ea532c'
      );
      parsedTx.inputs[0].should.have.property('valueString', '3.2899939469999999999981e+24');
      parsedTx.inputs[0].should.have.property('value', 3.289993947e24);

      parsedTx.should.have.property('outputs').which.is.an.Array();
      parsedTx.outputs[0].should.have.property('address', accountInfo.recoveryDestination);
      parsedTx.outputs[0].should.have.property('valueString', '3.2899939469999999999981e+24');
      parsedTx.outputs[0].should.have.property('coinName', 'tnear:tnep24dp');

      parsedTx.should.have.property('spendAmount', '3.2899939469999999999981e+24');
      parsedTx.should.have.property('type', '');

      // Assertions for fee info
      unsignedTx.should.have.property('feeInfo');
      unsignedTx.feeInfo.should.have.property('fee', 3e21);
      unsignedTx.feeInfo.should.have.property('feeString', '3000000000000000000000');

      // Assertions for coin-specific data
      unsignedTx.should.have.property('coinSpecific');
      unsignedTx.coinSpecific.should.have.property(
        'commonKeychain',
        '8699d2e05d60a3f7ab733a74ccf707f3407494b60f4253616187f5262e20737519a1763de0bcc4d165a7fa0e4dde67a1426ec4cc9fcd0820d749e6589dcfa08e'
      );
    });
  });
});
