import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { randomBytes } from 'crypto';
import should = require('should');
import { Dot, Tdot, KeyPair } from '../../src';
import * as testData from '../fixtures';
import { chainName, txVersion, genesisHash, specVersion } from '../resources';
import * as sinon from 'sinon';

describe('DOT:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let prodCoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('dot', Dot.createInstance);
    bitgo.safeRegister('tdot', Tdot.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tdot');
    prodCoin = bitgo.coin('dot');
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
    const transaction = {
      id: '0x19de156328eea66bd1ec45843569c168e0bb2f2898221029b403df3f23a5489d',
      sender: '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr',
      referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
      blockNumber: 3933,
      genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
      nonce: 200,
      specVersion: 9150,
      transactionVersion: 8,
      eraPeriod: 64,
      chainName: 'Westend',
      tip: 0,
      to: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq',
      amount: '10000000000',
    };

    // TODO: BG-43197
    xit('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txHex: testData.rawTx.transfer.unsigned,
          transaction,
        },
        pubs: [testData.accounts.account1.publicKey],
        prv: testData.accounts.account1.secretKey,
      });
      signed.txHex.should.equal(testData.rawTx.transfer.signed);
    });

    // TODO: BG-43197
    xit('should fail to sign transaction with an invalid key', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: testData.rawTx.transfer.unsigned,
            transaction,
          },
          pubs: [testData.accounts.account2.publicKey],
          prv: testData.accounts.account1.secretKey,
        });
      } catch (e) {
        should.equal(e.message, 'Private key cannot sign the transaction');
      }
    });

    it('should fail to build transaction with missing params', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: testData.rawTx.transfer.unsigned,
            key: testData.accounts.account1.publicKey,
          },
          prv: testData.accounts.account1.secretKey,
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

  describe('Balance Conversion', () => {
    it('should return 10000000000 as tdot base factor', () => {
      // mainnet uses 10 decimal places
      const baseFactor = prodCoin.getBaseFactor();
      baseFactor.should.equal(10000000000);
    });

    it('should return 1000000000000 as dot base factor', () => {
      // westend (test polkadot) uses 12 decimal places
      const baseFactor = basecoin.getBaseFactor();
      baseFactor.should.equal(1000000000000);
    });

    it('should return 4 Dot when base unit is 40000000000 for dot', () => {
      const bigUnit = prodCoin.baseUnitsToBigUnits('40000000000');
      bigUnit.should.equal('4');
    });

    it('should return 0.04 Dot when base unit is 400000000 for dot', () => {
      const bigUnit = prodCoin.baseUnitsToBigUnits('400000000');
      bigUnit.should.equal('0.04');
    });

    it('should return 4 test Dot when base unit is 4000000000000 for tdot', () => {
      const bigUnit = basecoin.baseUnitsToBigUnits('4000000000000');
      bigUnit.should.equal('4');
    });

    it('should return 0.04 test Dot when base unit is 400000000 for tdot', () => {
      const bigUnit = basecoin.baseUnitsToBigUnits('40000000000');
      bigUnit.should.equal('0.04');
    });
  });

  describe('Explain Transactions:', () => {
    it('should explain an unsigned transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction(testData.unsignedTransaction);
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'type',
          'sequenceId',
          'id',
          'blockNumber',
        ],
        sequenceId: 0,
        fee: '10',
        id: '0x0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8',
        type: '0',
        outputs: [
          {
            address: '5DkddSfPsWojjfuH9iJEcUV7ZseQ9EJ6RjtNmCR1w3CEb8S9',
            valueString: '90034235235350',
            coinName: 'tdot',
            wallet: '62a1205751675b2f0fe72328',
          },
        ],
        blockNumber: 8619307,
        outputAmount: 90034235235350,
        changeOutputs: [],
        changeAmount: '0',
      });
    });
  });

  describe('Recover Transactions:', () => {
    const sandBox = sinon.createSandbox();
    const destAddr = testData.accounts.account1.address;
    const nonce = 123;

    beforeEach(function () {
      const accountInfoCB = sandBox.stub(Dot.prototype, 'getAccountInfo' as keyof Dot);
      accountInfoCB.withArgs(testData.wrwUser.walletAddress0).resolves({
        nonce: nonce,
        freeBalance: 8888,
      });
      const headerInfoCB = sandBox.stub(Dot.prototype, 'getHeaderInfo' as keyof Dot);
      headerInfoCB.resolves({
        headerNumber: testData.westendBlock.blockNumber,
        headerHash: testData.westendBlock.hash,
      });
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recoveries', async function () {
      const res = await basecoin.recover({
        userKey: testData.wrwUser.userKey,
        backupKey: testData.wrwUser.backupKey,
        bitgoKey: testData.wrwUser.bitgoKey,
        walletPassphrase: testData.wrwUser.walletPassphrase,
        recoveryDestination: destAddr,
      });
      res.should.not.be.empty();
      res[0].should.hasOwnProperty('serializedTx');
      res[0].should.hasOwnProperty('scanIndex');
      sandBox.assert.calledOnce(basecoin.getAccountInfo);
      sandBox.assert.calledOnce(basecoin.getHeaderInfo);

      // deserialize the txn and verify the fields are what we expect
      const txBuilder = basecoin.getBuilder().from(res[0].serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: basecoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.wrwUser.walletAddress0);
      should.deepEqual(txJson.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, nonce);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, basecoin.SWEEP_TXN_DURATION);
    });

    it('should recover a txn for unsigned-sweep recoveries', async function () {
      const res = await basecoin.recover({
        bitgoKey: testData.wrwUser.bitgoKey,
        recoveryDestination: destAddr,
      });
      res.should.not.be.empty();
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('serializedTx');
      res.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('scanIndex');
      sandBox.assert.calledOnce(basecoin.getAccountInfo);
      sandBox.assert.calledOnce(basecoin.getHeaderInfo);

      // deserialize the txn and verify the fields are what we expect
      const txBuilder = basecoin.getBuilder().from(res.txRequests[0].transactions[0].unsignedTx.serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: basecoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash)
        .sender({ address: testData.wrwUser.walletAddress0 });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.wrwUser.walletAddress0);
      should.deepEqual(txJson.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, nonce);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, basecoin.SWEEP_TXN_DURATION);
    });
  });

  describe('Recover Transactions for wallet with multiple addresses:', () => {
    const sandBox = sinon.createSandbox();
    const destAddr = testData.accounts.account1.address;
    const nonce = 123;

    beforeEach(function () {
      const accountInfoCB = sandBox.stub(Dot.prototype, 'getAccountInfo' as keyof Dot);
      accountInfoCB.withArgs(testData.wrwUser.walletAddress0).resolves({
        nonce: nonce,
        freeBalance: 0,
      });
      accountInfoCB.withArgs(testData.wrwUser.walletAddress1).resolves({
        nonce: nonce,
        freeBalance: 8888,
      });
      const headerInfoCB = sandBox.stub(Dot.prototype, 'getHeaderInfo' as keyof Dot);
      headerInfoCB.resolves({
        headerNumber: testData.westendBlock.blockNumber,
        headerHash: testData.westendBlock.hash,
      });
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recoveries at address 1 but search from address 0', async function () {
      const res = await basecoin.recover({
        userKey: testData.wrwUser.userKey,
        backupKey: testData.wrwUser.backupKey,
        bitgoKey: testData.wrwUser.bitgoKey,
        walletPassphrase: testData.wrwUser.walletPassphrase,
        recoveryDestination: destAddr,
      });
      res.should.not.be.empty();
      res[0].should.hasOwnProperty('serializedTx');
      res[0].should.hasOwnProperty('scanIndex');
      res[0].scanIndex.should.equal(1);
      sandBox.assert.calledTwice(basecoin.getAccountInfo);
      sandBox.assert.calledOnce(basecoin.getHeaderInfo);

      // deserialize the txn and verify the fields are what we expect
      const txBuilder = basecoin.getBuilder().from(res[0].serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: basecoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.wrwUser.walletAddress1);
      should.deepEqual(txJson.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, nonce);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, basecoin.SWEEP_TXN_DURATION);
    });

    it('should recover a txn for non-bitgo recoveries at address 1 but search from address 1', async function () {
      const res = await basecoin.recover({
        userKey: testData.wrwUser.userKey,
        backupKey: testData.wrwUser.backupKey,
        bitgoKey: testData.wrwUser.bitgoKey,
        walletPassphrase: testData.wrwUser.walletPassphrase,
        recoveryDestination: destAddr,
        startingScanIndex: 1,
      });
      res.should.not.be.empty();
      res[0].should.hasOwnProperty('serializedTx');
      res[0].should.hasOwnProperty('scanIndex');
      res[0].scanIndex.should.equal(1);
      sandBox.assert.calledOnce(basecoin.getAccountInfo);
      sandBox.assert.calledOnce(basecoin.getHeaderInfo);

      // deserialize the txn and verify the fields are what we expect
      const txBuilder = basecoin.getBuilder().from(res[0].serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: basecoin.SWEEP_TXN_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.sender, testData.wrwUser.walletAddress1);
      should.deepEqual(txJson.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, nonce);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, basecoin.SWEEP_TXN_DURATION);
    });
  });

  describe('Recover Transaction Failures:', () => {
    const sandBox = sinon.createSandbox();
    const destAddr = testData.accounts.account1.address;
    const nonce = 123;
    const numIteration = 10;

    beforeEach(function () {
      const accountInfoCB = sandBox.stub(Dot.prototype, 'getAccountInfo' as keyof Dot);
      accountInfoCB.resolves({
        nonce: nonce,
        freeBalance: 0,
      });
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should fail to recover due to not finding an address with funds', async function () {
      await basecoin
        .recover({
          userKey: testData.wrwUser.userKey,
          backupKey: testData.wrwUser.backupKey,
          bitgoKey: testData.wrwUser.bitgoKey,
          walletPassphrase: testData.wrwUser.walletPassphrase,
          recoveryDestination: destAddr,
          scan: numIteration,
        })
        .should.rejectedWith('Did not find an address with funds to recover');
      sandBox.assert.callCount(basecoin.getAccountInfo, numIteration);
    });
  });
});
