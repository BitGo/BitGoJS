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
  consolidationWrwUser,
  address,
  endpointResponses,
  testnetUTXO,
  ovcResponse,
  ovcResponse2,
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
    id: 'f48f6ea0f75f3f942855cc0edf29e81e1e0724e75f5db8a1575b166fb202176c',
    outputs: [
      {
        address:
          'addr_test1qqnnvptrc3rec64q2n9jh572ncu5wvdtt8uvg4g3aj96s5dwu9nj70mlahzglm9939uevupsmj8dcdqv25d5n5r8vw8sn7prey',
        amount: '7823121',
      },
      {
        address: 'addr_test1vr8rakm66rcfv4fcxqykg5lf0yv7lsyk9mvapx369jpvtcgfcuk7f',
        amount: '13041729',
      },
    ],
    outputAmount: '20864850',
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: '167173' },
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

    it('should take OVC output and generate a signed sweep transaction', async function () {
      const params = ovcResponse;
      const recoveryTxn = await basecoin.createBroadcastableSweepTransaction(params);
      recoveryTxn.transactions[0].serializedTx.should.equal(
        '84a400818258204bd0f991c1532cffe31d4a10db492b43175ec326765b6b29ceee598df2b61f470001818258390087379ebc5533ebe621963c915c3cbc5f08537fcdca4af8f8ae08ed4c87379ebc5533ebe621963c915c3cbc5f08537fcdca4af8f8ae08ed4c1a05f359ff021a00028701031a024972e1a10081825820bbacb13431b99208e6e8cdbf710147feaf06a39d71565e60b411ce9e4fa3f137584001a4ab8236563f69ff309e5786e8f39c629ed57676c692159cb2e0494c9e663355384c13c749d04c17a80ba2a45cc127df480fc64a43199a772f11acd5b14a0ff5f6'
      );
      recoveryTxn.transactions[0].scanIndex.should.equal(0);
      recoveryTxn.lastScanIndex.should.equal(0);
    });

    it('should take consolidation OVC output and generate multiple signed sweep transactions', async function () {
      const params = ovcResponse2;
      const recoveryTxn = await basecoin.createBroadcastableSweepTransaction(params);
      recoveryTxn.transactions[0].serializedTx.should.equal(
        '84a400818258203e62e5ee8b12012c4b949f9777b72165239bb2146ae8b078b4d1c5ca8d3168e300018182583900baf55ebcf9ada1b8ecb1640880fba54d2817690f12b3a106afd08004baf55ebcf9ada1b8ecb1640880fba54d2817690f12b3a106afd080041a00960f7f021a00028701031a0250f7eaa10081825820500e0d725a5ba3a306da3503dfe57b8a14068a09b61b36ec068fcf8cf5c391de5840c836ce6d3262d5654706ea06721522d3b75f6d545245047a7be7463629d88b3f4264b995f591df52bdffcf09da1e6ab9e88de3714c6e2ec1961786cf1c586a07f5f6'
      );
      recoveryTxn.transactions[0].scanIndex.should.equal(1);
      recoveryTxn.transactions[1].serializedTx.should.equal(
        '84a4008182582029c10acf0e08f9523325c88243565af6b32274992189c1153903c410bed7c2c700018182583900baf55ebcf9ada1b8ecb1640880fba54d2817690f12b3a106afd08004baf55ebcf9ada1b8ecb1640880fba54d2817690f12b3a106afd080041a00960f7f021a00028701031a0250f7eaa1008182582062770b224bd314bc526fbd6a94e9082fb6458c425e6e09bad74004dd897e962358403842544f2ff28be054eb7c7997bc303b1e251eb13a41802c82318e592bb24eaa3197c450e797cc8559f0356cd5cdd1ab5eb80c5173e34e9e1d1737533a89520cf5f6'
      );
      recoveryTxn.transactions[1].scanIndex.should.equal(2);
      recoveryTxn.transactions[2].serializedTx.should.equal(
        '84a40081825820dd140f133d865e1bb5642e708fe685bf7601d71d0c99511e5d552da7f8bd10ff00018182583900baf55ebcf9ada1b8ecb1640880fba54d2817690f12b3a106afd08004baf55ebcf9ada1b8ecb1640880fba54d2817690f12b3a106afd080041a00960f7f021a00028701031a0250f7eaa1008182582053b4bb74aa38add458dafc8153f0aa8266acad59322b877ca9c23c5d3873779d5840e94ce7896957d094c6bafbf2ec10df5ebb0f1d2a27a7e31f2d45c531fb687edd6c4d33f8e9b99c7692b6fac6d8399bd8fd47641baae9bbb69f518d42ad11710af5f6'
      );
      recoveryTxn.transactions[2].scanIndex.should.equal(3);
      recoveryTxn.transactions[3].serializedTx.should.equal(
        '84a4008182582015a1d6db5d3f592aa1cda185b6359ca0e2921c3c51959f64222a6b7d95d3392300018182583900baf55ebcf9ada1b8ecb1640880fba54d2817690f12b3a106afd08004baf55ebcf9ada1b8ecb1640880fba54d2817690f12b3a106afd080041a00960f7f021a00028701031a0250f7eaa10081825820600f86ca22d670f0a990ade4e882c05e654343263494735a31517de0819676735840fe199f8e247a4cfabfeb4f9cb574aa35739a0aa98860ee0a85d720c4ab4fecfac7b4504df310b3e4bea04711f60652d4a8cf5eb41817293b8d29977fe695f704f5f6'
      );
      recoveryTxn.transactions[3].scanIndex.should.equal(4);
      recoveryTxn.lastScanIndex.should.equal(20);
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
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledTwice(basecoin.getDataFromNode);

      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(res.serializedTx);
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
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledTwice(basecoin.getDataFromNode);

      const tx = new Transaction(basecoin);
      tx.fromRawTransaction(res.serializedTx);
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

  describe('Build Consolidation Recoveries:', () => {
    const baseAddr = consolidationWrwUser.walletAddress0;
    const sandBox = sinon.createSandbox();

    beforeEach(function () {
      const callBack = sandBox.stub(Ada.prototype, 'getDataFromNode' as keyof Ada);
      callBack
        .withArgs('address_info', {
          _addresses: [consolidationWrwUser.walletAddress1],
        })
        .resolves(endpointResponses.addressInfoResponse.ZeroUTXO);
      callBack
        .withArgs('address_info', {
          _addresses: [consolidationWrwUser.walletAddress2],
        })
        .resolves(endpointResponses.addressInfoResponse.OneUTXO);
      callBack
        .withArgs('address_info', {
          _addresses: [consolidationWrwUser.walletAddress3],
        })
        .resolves(endpointResponses.addressInfoResponse.OneUTXO2);
      callBack.withArgs('tip').resolves(endpointResponses.tipInfoResponse);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should build signed consolidation recoveries', async function () {
      const res = await basecoin.recoverConsolidations({
        userKey: consolidationWrwUser.userKey,
        backupKey: consolidationWrwUser.backupKey,
        bitgoKey: consolidationWrwUser.bitgoKey,
        walletPassphrase: consolidationWrwUser.walletPassphrase,
        startingScanIndex: 1,
        endingScanIndex: 4,
      });
      res.should.not.be.empty();
      res.transactions.length.should.equal(2);
      res.lastScanIndex.should.equal(3);
      const txn1 = res.transactions[0];
      const tx1 = new Transaction(basecoin);
      tx1.fromRawTransaction(txn1.serializedTx);
      const txJson1 = tx1.toJson();
      const fee1 = Number(tx1.explainTransaction().fee.fee);
      should.deepEqual(txJson1.inputs[0].transaction_id, testnetUTXO.UTXO_1.tx_hash);
      should.deepEqual(txJson1.inputs[0].transaction_index, testnetUTXO.UTXO_1.tx_index);
      should.deepEqual(txJson1.outputs[0].address, baseAddr);
      should.deepEqual(Number(txJson1.outputs[0].amount) + fee1, testnetUTXO.UTXO_1.value);

      const txn2 = res.transactions[1];
      const tx2 = new Transaction(basecoin);
      tx2.fromRawTransaction(txn2.serializedTx);
      const txJson2 = tx2.toJson();
      const fee2 = Number(tx2.explainTransaction().fee.fee);
      should.deepEqual(txJson2.inputs[0].transaction_id, testnetUTXO.UTXO_2.tx_hash);
      should.deepEqual(txJson2.inputs[0].transaction_index, testnetUTXO.UTXO_2.tx_index);
      should.deepEqual(txJson2.outputs[0].address, baseAddr);
      should.deepEqual(Number(txJson2.outputs[0].amount) + fee2, testnetUTXO.UTXO_2.value);
    });

    it('should skip building consolidate transaction if balance is equal to zero', async function () {
      await basecoin
        .recoverConsolidations({
          userKey: consolidationWrwUser.userKey,
          backupKey: consolidationWrwUser.backupKey,
          bitgoKey: consolidationWrwUser.bitgoKey,
          walletPassphrase: consolidationWrwUser.walletPassphrase,
          startingScanIndex: 1,
          endingScanIndex: 2,
        })
        .should.rejectedWith('Did not find an address with funds to recover');
    });

    it('should throw if startingScanIndex is not ge to 1', async () => {
      await basecoin
        .recoverConsolidations({
          userKey: consolidationWrwUser.userKey,
          backupKey: consolidationWrwUser.backupKey,
          bitgoKey: consolidationWrwUser.bitgoKey,
          startingScanIndex: -1,
        })
        .should.be.rejectedWith(
          'Invalid starting or ending index to scan for addresses. startingScanIndex: -1, endingScanIndex: 19.'
        );
    });

    it('should throw if scan factor is too high', async () => {
      await basecoin
        .recoverConsolidations({
          userKey: consolidationWrwUser.userKey,
          backupKey: consolidationWrwUser.backupKey,
          bitgoKey: consolidationWrwUser.bitgoKey,
          startingScanIndex: 1,
          endingScanIndex: 300,
        })
        .should.be.rejectedWith(
          'Invalid starting or ending index to scan for addresses. startingScanIndex: 1, endingScanIndex: 300.'
        );
    });
  });

  describe('Recover Transactions Failure:', () => {
    const destAddr = address.address2;
    const sandBox = sinon.createSandbox();

    afterEach(function () {
      sandBox.restore();
    });

    it('should fail to recover due to not finding an address with funds', async function () {
      const callBack = sandBox.stub(Ada.prototype, 'getDataFromNode' as keyof Ada);
      callBack
        .withArgs('address_info', sinon.match.has('_addresses'))
        .resolves(endpointResponses.addressInfoResponse.ZeroUTXO);
      callBack.withArgs('tip').resolves(endpointResponses.tipInfoResponse);
      await basecoin
        .recover({
          userKey: wrwUser.userKey,
          backupKey: wrwUser.backupKey,
          bitgoKey: wrwUser.bitgoKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destAddr,
        })
        .should.rejectedWith('Did not find address with funds to recover');
      sandBox.assert.calledOnce(basecoin.getDataFromNode);
    });

    it('should fail to recover due to not having more than 1 ADA in funds', async function () {
      const callBack = sandBox.stub(Ada.prototype, 'getDataFromNode' as keyof Ada);
      callBack
        .withArgs('address_info', sinon.match.has('_addresses'))
        .resolves(endpointResponses.addressInfoResponse.OneSmallUTXO);
      callBack.withArgs('tip').resolves(endpointResponses.tipInfoResponse);
      await basecoin
        .recover({
          userKey: wrwUser.userKey,
          backupKey: wrwUser.backupKey,
          bitgoKey: wrwUser.bitgoKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destAddr,
        })
        .should.rejectedWith(
          'Insufficient funds to recover, minimum required is 1 ADA plus fees, got 9834455 fees: 165545'
        );
      sandBox.assert.calledTwice(basecoin.getDataFromNode);
    });
  });
});
