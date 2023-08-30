/**
 * @prettier
 */

import should = require('should');
import { randomBytes } from 'crypto';
import * as sinon from 'sinon';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import {
  rawTx,
  enterpriseAccounts as accounts,
  privateKeys,
  publicKeys,
  wrwUser,
  address,
  endpointResponses,
  testnetUTXO,
} from '../resources';
import * as _ from 'lodash';
import { Ada, KeyPair, Tada } from '../../src';
import { Transaction } from '../../src/lib';
import { TransactionType } from '../../../sdk-core/src/account-lib/baseCoin/enum';

describe('ADA', function () {
  const coinName = 'ada';
  const tcoinName = 't' + coinName;
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPrebuild = {
    txHex: rawTx.unsignedTx,
    txInfo: {},
  };

  const txParams = {
    recipients: [
      {
        address: rawTx.outputAddress1.address,
        amount: '5000000',
      },
      {
        address: rawTx.outputAddress2.address,
        amount: '248329150',
      },
    ],
  };

  const transactionExplanation = {
    displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'],
    id: '1088141814e014e07d5e6c3ffb6c877a5c6ee2210694570e01bfc9a6ee6eedf5',
    outputs: [
      {
        address:
          'addr_test1qqnnvptrc3rec64q2n9jh572ncu5wvdtt8uvg4g3aj96s5dwu9nj70mlahzglm9939uevupsmj8dcdqv25d5n5r8vw8sn7prey',
        amount: '7823121',
      },
      {
        address: 'addr_test1vr8rakm66rcfv4fcxqykg5lf0yv7lsyk9mvapx369jpvtcgfcuk7f',
        amount: '13041641',
      },
    ],
    outputAmount: '20864762',
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: '167261' },
    type: 'Transfer',
    certificates: [],
    withdrawals: [],
    pledgeDetails: undefined,
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister(coinName, Ada.createInstance);
    bitgo.safeRegister(tcoinName, Tada.createInstance);
    basecoin = bitgo.coin(tcoinName);
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin(tcoinName);
    localBasecoin.should.be.an.instanceof(Tada);
    localBasecoin.getChain().should.equal(tcoinName);
    localBasecoin.getFullName().should.equal('Testnet Ada');

    localBasecoin = bitgo.coin(coinName);
    localBasecoin.should.be.an.instanceof(Ada);
    localBasecoin.getChain().should.equal(coinName);
    localBasecoin.getFullName().should.equal('Cardano ADA');
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPair = new KeyPair();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(keyPair.getKeys(), messageToSign);
      keyPair.verifySignature(messageToSign, Uint8Array.from(signature)).should.equals(false);
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
          txHex: rawTx.unsignedTx2,
        },
        pubs: [publicKeys.pubKey1],
        prv: privateKeys.prvKey4,
      });
      signed.txHex.should.equal(rawTx.signedTx2);
    });

    it('should fail to sign transaction with an invalid key', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: rawTx.unsignedTx2,
          },
          pubs: [publicKeys.pubKey1],
          prv: privateKeys.prvKey2,
        });
      } catch (e) {
        should.equal(e.message, 'Private key cannot sign the transaction');
      }
    });

    it('should fail to build transaction with missing params', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: rawTx.unsignedTx,
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
    it('should succeed to verify unsigned transaction in hex encoding', async () => {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify signed transaction in hex encoding', async () => {
      const txPrebuild = {
        txHex: rawTx.signedTx,
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
        .should.be.rejectedWith('cannot find recipient in expected output');
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
  });

  describe('Explain Transactions:', () => {
    it('should explain an unsigned transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txPrebuild: {
          txHex: rawTx.unsignedTx2,
        },
      });
      console.log(explainedTransaction);
      explainedTransaction.should.deepEqual(transactionExplanation);
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

  describe('Parse Raw Transactions', () => {
    it('should parse staking pledge transaction', function () {
      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(rawTx.unsignedNewPledgeTx);
      should.equal(tx.type, TransactionType.StakingPledge);
    });

    it('should parse staking activation tx', function () {
      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(rawTx.unsignedStakingActiveTx);
      should.equal(tx.type, TransactionType.StakingActivate);
    });

    it('should parse staking deactivation tx', function () {
      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(rawTx.unsignedStakingDeactiveTx);
      should.equal(tx.type, TransactionType.StakingDeactivate);
    });
  });

  describe('Parse Transactions:', () => {
    it('should parse an unsigned transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txPrebuild: {
          txHex: rawTx.unsignedTx2,
        },
      });

      parsedTransaction.should.deepEqual(transactionExplanation);
    });

    it('should parse a signed transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txPrebuild: {
          txHex: rawTx.signedTx2,
        },
      });

      parsedTransaction.should.deepEqual(transactionExplanation);
    });

    it('should fail parse a signed transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Ada.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin
        .parseTransaction({
          txPrebuild: {
            txHex: rawTx.signedTx,
          },
        })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });

  describe('Recover Transactions:', () => {
    const destAddr = address.address2;
    const sandBox = sinon.createSandbox();

    beforeEach(function () {
      const callBack = sandBox.stub(Ada.prototype, 'getDataFromNode' as keyof Ada);
      callBack
        .withArgs('address_info', {
          _addresses: [wrwUser.walletAddress0],
        })
        .resolves(endpointResponses.addressInfoResponse.OneUTXO);
      callBack.withArgs('tip').resolves(endpointResponses.tipInfoResponse);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recoveries', async function () {
      const res = await basecoin.recover({
        userKey: wrwUser.userKey,
        backupKey: wrwUser.backupKey,
        bitgoKey: wrwUser.bitgoKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destAddr,
      });
      res.should.not.be.empty();
      res[0].should.hasOwnProperty('serializedTx');
      sandBox.assert.calledTwice(basecoin.getDataFromNode);

      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(res[0].serializedTx);
      const txJson = tx.toJson();
      const fee = Number(tx.explainTransaction().fee.fee);
      should.deepEqual(txJson.inputs[0].transaction_id, testnetUTXO.UTXO_1.tx_hash);
      should.deepEqual(txJson.inputs[0].transaction_index, testnetUTXO.UTXO_1.tx_index);
      should.deepEqual(txJson.outputs[0].address, destAddr);
      should.deepEqual(Number(txJson.outputs[0].amount) + fee, testnetUTXO.UTXO_1.value);
    });

    it('should recover a txn for unsigned sweep recoveries', async function () {
      const res = await basecoin.recover({
        bitgoKey: wrwUser.bitgoKey,
        recoveryDestination: destAddr,
      });
      res.should.not.be.empty();
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledTwice(basecoin.getDataFromNode);

      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(res.txRequests[0].transactions[0].unsignedTx.serializedTx);
      const txJson = tx.toJson();
      const fee = Number(tx.explainTransaction().fee.fee);
      should.deepEqual(txJson.inputs[0].transaction_id, testnetUTXO.UTXO_1.tx_hash);
      should.deepEqual(txJson.inputs[0].transaction_index, testnetUTXO.UTXO_1.tx_index);
      should.deepEqual(txJson.outputs[0].address, destAddr);
      should.deepEqual(Number(txJson.outputs[0].amount) + fee, testnetUTXO.UTXO_1.value);
    });
  });

  describe('Recover Transactions Multiple UTXO:', () => {
    const destAddr = address.address2;
    const sandBox = sinon.createSandbox();

    beforeEach(function () {
      const callBack = sandBox.stub(Ada.prototype, 'getDataFromNode' as keyof Ada);
      callBack
        .withArgs('address_info', {
          _addresses: [wrwUser.walletAddress0],
        })
        .resolves(endpointResponses.addressInfoResponse.TwoUTXO);
      callBack.withArgs('tip').resolves(endpointResponses.tipInfoResponse);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recoveries', async function () {
      const res = await basecoin.recover({
        userKey: wrwUser.userKey,
        backupKey: wrwUser.backupKey,
        bitgoKey: wrwUser.bitgoKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destAddr,
      });
      res.should.not.be.empty();
      res[0].should.hasOwnProperty('serializedTx');
      sandBox.assert.calledTwice(basecoin.getDataFromNode);

      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(res[0].serializedTx);
      const txJson = tx.toJson();
      const fee = Number(tx.explainTransaction().fee.fee);
      should.deepEqual(txJson.inputs[0].transaction_id, testnetUTXO.UTXO_1.tx_hash);
      should.deepEqual(txJson.inputs[0].transaction_index, testnetUTXO.UTXO_1.tx_index);
      should.deepEqual(txJson.inputs[1].transaction_id, testnetUTXO.UTXO_2.tx_hash);
      should.deepEqual(txJson.inputs[1].transaction_index, testnetUTXO.UTXO_2.tx_index);
      should.deepEqual(txJson.outputs[0].address, destAddr);
      should.deepEqual(Number(txJson.outputs[0].amount) + fee, testnetUTXO.UTXO_1.value + testnetUTXO.UTXO_2.value);
    });

    it('should recover a txn for unsigned sweep recoveries', async function () {
      const res = await basecoin.recover({
        bitgoKey: wrwUser.bitgoKey,
        recoveryDestination: destAddr,
      });
      res.should.not.be.empty();
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledTwice(basecoin.getDataFromNode);

      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(res.txRequests[0].transactions[0].unsignedTx.serializedTx);
      const txJson = tx.toJson();
      const fee = Number(tx.explainTransaction().fee.fee);
      should.deepEqual(txJson.inputs[0].transaction_id, testnetUTXO.UTXO_1.tx_hash);
      should.deepEqual(txJson.inputs[0].transaction_index, testnetUTXO.UTXO_1.tx_index);
      should.deepEqual(txJson.inputs[1].transaction_id, testnetUTXO.UTXO_2.tx_hash);
      should.deepEqual(txJson.inputs[1].transaction_index, testnetUTXO.UTXO_2.tx_index);
      should.deepEqual(txJson.outputs[0].address, destAddr);
      should.deepEqual(Number(txJson.outputs[0].amount) + fee, testnetUTXO.UTXO_1.value + testnetUTXO.UTXO_2.value);
    });
  });

  describe('Recover Transactions for wallet with multiple addresses:', () => {
    const destAddr = address.address2;
    const sandBox = sinon.createSandbox();

    beforeEach(function () {
      const callBack = sandBox.stub(Ada.prototype, 'getDataFromNode' as keyof Ada);
      callBack
        .withArgs('address_info', {
          _addresses: [wrwUser.walletAddress0],
        })
        .resolves(endpointResponses.addressInfoResponse.ZeroUTXO);
      callBack
        .withArgs('address_info', {
          _addresses: [wrwUser.walletAddress1],
        })
        .resolves(endpointResponses.addressInfoResponse.OneUTXO);
      callBack.withArgs('tip').resolves(endpointResponses.tipInfoResponse);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recoveries at address 1 but search from address 0', async function () {
      const res = await basecoin.recover({
        userKey: wrwUser.userKey,
        backupKey: wrwUser.backupKey,
        bitgoKey: wrwUser.bitgoKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destAddr,
      });
      res.should.not.be.empty();
      res[0].should.hasOwnProperty('serializedTx');
      res[0].should.hasOwnProperty('scanIndex');
      res[0].scanIndex.should.equal(1);
      sandBox.assert.calledThrice(basecoin.getDataFromNode);

      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(res[0].serializedTx);
      const txJson = tx.toJson();
      const fee = Number(tx.explainTransaction().fee.fee);
      should.deepEqual(txJson.inputs[0].transaction_id, testnetUTXO.UTXO_1.tx_hash);
      should.deepEqual(txJson.inputs[0].transaction_index, testnetUTXO.UTXO_1.tx_index);
      should.deepEqual(txJson.outputs[0].address, destAddr);
      should.deepEqual(Number(txJson.outputs[0].amount) + fee, testnetUTXO.UTXO_1.value);
    });

    it('should recover a txn for non-bitgo recoveries at address 1 but search from address 1', async function () {
      const res = await basecoin.recover({
        userKey: wrwUser.userKey,
        backupKey: wrwUser.backupKey,
        bitgoKey: wrwUser.bitgoKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destAddr,
        startingScanIndex: 1,
      });
      res.should.not.be.empty();
      res[0].should.hasOwnProperty('serializedTx');
      res[0].should.hasOwnProperty('scanIndex');
      res[0].scanIndex.should.equal(1);
      sandBox.assert.calledTwice(basecoin.getDataFromNode);

      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(res[0].serializedTx);
      const txJson = tx.toJson();
      const fee = Number(tx.explainTransaction().fee.fee);
      should.deepEqual(txJson.inputs[0].transaction_id, testnetUTXO.UTXO_1.tx_hash);
      should.deepEqual(txJson.inputs[0].transaction_index, testnetUTXO.UTXO_1.tx_index);
      should.deepEqual(txJson.outputs[0].address, destAddr);
      should.deepEqual(Number(txJson.outputs[0].amount) + fee, testnetUTXO.UTXO_1.value);
    });
  });

  describe('Recover Transactions Failure:', () => {
    const destAddr = address.address2;
    const numIteration = 10;
    const sandBox = sinon.createSandbox();

    beforeEach(function () {
      const callBack = sandBox.stub(Ada.prototype, 'getDataFromNode' as keyof Ada);
      callBack
        .withArgs('address_info', sinon.match.has('_addresses'))
        .resolves(endpointResponses.addressInfoResponse.ZeroUTXO);
      callBack.withArgs('tip').resolves(endpointResponses.tipInfoResponse);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should fail to recover due to not finding an address with funds', async function () {
      await basecoin
        .recover({
          userKey: wrwUser.userKey,
          backupKey: wrwUser.backupKey,
          bitgoKey: wrwUser.bitgoKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destAddr,
          scan: numIteration,
        })
        .should.rejectedWith('Did not find an address with funds to recover');
      sandBox.assert.callCount(basecoin.getDataFromNode, numIteration);
    });
  });
});
