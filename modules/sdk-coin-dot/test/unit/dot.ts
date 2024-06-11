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
      accountInfoCB.withArgs('5Dtg2zKjVEL8p9keSM4dQ7nD26sVtMfCsyxkhvZZ9fqBbhw6').resolves({
        nonce: 0,
        freeBalance: 1510000000000,
      });
      const getFeeCB = sandBox.stub(Dot.prototype, 'getFee' as keyof Dot);
      getFeeCB.withArgs(destAddr, testData.wrwUser.walletAddress0, 1510000000000).resolves(15783812856);
    });

    afterEach(function () {
      sandBox.restore();
    });

    it('should generate unsigned sweep correctly', async function () {
      const commonKeychain =
        '3cd14f5d60744287cd3a50510e2964746b6feaad4b2300088eaae60d1a35f0abc518534d43b2614370d9a263aadb57edb5d0b78f816a519cd5896e7352920b67';
      const recoveryDestination = '5GPAveMvmDsjxVT6Q2xiu5kYPbFAmdebHaiNZK14FBaSaAKh';

      const unsigned = await basecoin.recover({ bitgoKey: commonKeychain, recoveryDestination });
      unsigned.txRequests.should.not.be.undefined();
      unsigned.txRequests.length.should.equal(1);
      unsigned.txRequests[0].transactions.length.should.equal(1);
      unsigned.txRequests[0].walletCoin.should.equal('tdot');
      unsigned.txRequests[0].transactions[0].unsignedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.serializedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.scanIndex.should.equal(0);
      unsigned.txRequests[0].transactions[0].unsignedTx.coin.should.equal('tdot');
      unsigned.txRequests[0].transactions[0].unsignedTx.signableHex.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.derivationPath.should.equal('m/0');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs.length.should.equal(1);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].address.should.equal(
        '5Dtg2zKjVEL8p9keSM4dQ7nD26sVtMfCsyxkhvZZ9fqBbhw6'
      );
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].valueString.should.equal('1510000000000');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.inputs[0].value.should.equal(1510000000000);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs.length.should.equal(1);
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].address.should.equal(
        '5GPAveMvmDsjxVT6Q2xiu5kYPbFAmdebHaiNZK14FBaSaAKh'
      );
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].valueString.should.equal('1510000000000');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.outputs[0].coinName.should.equal('tdot');
      unsigned.txRequests[0].transactions[0].unsignedTx.parsedTx.type.should.equal('');
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.fee.should.equal(0);
      unsigned.txRequests[0].transactions[0].unsignedTx.feeInfo.feeString.should.equal('0');
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.firstValid.should.not.be.undefined();
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.maxDuration.should.equal(2400);
      unsigned.txRequests[0].transactions[0].unsignedTx.coinSpecific.commonKeychain.should.equal(
        '3cd14f5d60744287cd3a50510e2964746b6feaad4b2300088eaae60d1a35f0abc518534d43b2614370d9a263aadb57edb5d0b78f816a519cd5896e7352920b67'
      );
    });

    // TODO(COIN-919): Fix failing test
    xit('should take OVC output and generate a signed sweep transaction', async function () {
      const params = testData.ovcResponse;

      const recoveryTxn = await basecoin.createBroadcastableSweepTransaction(params);
      recoveryTxn.transactions[0].serializedTx.should.equal(
        '0x2d02840050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c00057c131cde2be39f4ff23eeba11139c46dd8c6d69ff517abede37381d8d24f0bb30fd8805b2e51a9e2a75338d7fb7edb290be9638debedbfc001d10b8132be0b2b4a0400040400bf0678d312b2b2c7effd2b1f214ee13928d339391d5f5f7056608aa0d32b9edf01'
      );
      recoveryTxn.transactions[0].scanIndex.should.equal(0);
      recoveryTxn.lastScanIndex.should.equal(0);
    });

    // TODO(COIN-919): Fix failing test
    xit('should take consolidation OVC output and generate multiple signed sweep transactions', async function () {
      const params = testData.ovcResponse2;

      const recoveryTxn = await basecoin.createBroadcastableSweepTransaction(params);
      recoveryTxn.transactions[0].serializedTx.should.equal(
        '0x2d028400f053d177371f4919b71017421aa34841ac87c926a14e8a7e75f092693665cb4a009871feb8389e12191b460ebea1f9e1716ada8a31d94ac08f5c15cb5f7be24683cdfc300ae3e6802c6f4b044dd92ea03d15b92399ab45803e43beb5cbff582a031b37000004040050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c01'
      );
      recoveryTxn.transactions[0].scanIndex.should.equal(1);
      recoveryTxn.transactions[1].serializedTx.should.equal(
        '0x2d028400cf7ed9f536373c8f874e780a4269ec1bd6799ed7d4a854c670b0c72805fac87600d153cbb683706ddf320f7b225af14ce4b59b868c07440aefa4c4e1297e49bcd5f6ee84f696b0c2e456e2a7f8779a78a2c832dfb47d5b283eba8408b003c7dd031b37000004040050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c01'
      );
      recoveryTxn.transactions[1].scanIndex.should.equal(2);
      recoveryTxn.transactions[2].serializedTx.should.equal(
        '0x2d0284009482ad7e43b40b7df3383244daafed32b3b9fd7541016b5c907f2d9052f85f8600e255698d110977faf33efb3336ba98ad7eaa2a1a926487fc696a277442d4414b2a441ba92d598f2b1f96f13b28785f5e572984035a608d63c48bd35ba955090e1b37000004040050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c01'
      );
      recoveryTxn.transactions[2].scanIndex.should.equal(3);
      recoveryTxn.lastScanIndex.should.equal(20);
    });

    // TODO(COIN-919): Fix failing test
    xit('should recover a txn for non-bitgo recoveries', async function () {
      const res = await basecoin.recover({
        userKey: testData.wrwUser.userKey,
        backupKey: testData.wrwUser.backupKey,
        bitgoKey: testData.wrwUser.bitgoKey,
        walletPassphrase: testData.wrwUser.walletPassphrase,
        recoveryDestination: destAddr,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      res.should.hasOwnProperty('scanIndex');
      sandBox.assert.calledOnce(basecoin.getAccountInfo);
      sandBox.assert.calledOnce(basecoin.getHeaderInfo);

      // deserialize the txn and verify the fields are what we expect
      const txBuilder = basecoin.getBuilder().from(res.serializedTx);
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

  describe('Build Consolidation Recoveries:', () => {
    const sandBox = sinon.createSandbox();
    const baseAddr = testData.consolidationWrwUser.walletAddress0;
    const nonce = 123;

    beforeEach(function () {
      const accountInfoCB = sandBox.stub(Dot.prototype, 'getAccountInfo' as keyof Dot);
      accountInfoCB.withArgs(testData.consolidationWrwUser.walletAddress1).resolves({
        nonce: nonce,
        freeBalance: 10000000000,
      });
      accountInfoCB.withArgs(testData.consolidationWrwUser.walletAddress2).resolves({
        nonce: nonce,
        freeBalance: 1510000000000,
      });
      accountInfoCB.withArgs(testData.consolidationWrwUser.walletAddress3).resolves({
        nonce: nonce,
        freeBalance: 1510000000000,
      });
      const headerInfoCB = sandBox.stub(Dot.prototype, 'getHeaderInfo' as keyof Dot);
      headerInfoCB.resolves({
        headerNumber: testData.westendBlock.blockNumber,
        headerHash: testData.westendBlock.hash,
      });
      const getFeeCB = sandBox.stub(Dot.prototype, 'getFee' as keyof Dot);
      getFeeCB.withArgs(baseAddr, testData.consolidationWrwUser.walletAddress1, 10000000000).resolves(15783812856);
      getFeeCB.withArgs(baseAddr, testData.consolidationWrwUser.walletAddress2, 1510000000000).resolves(15783812856);
      getFeeCB.withArgs(baseAddr, testData.consolidationWrwUser.walletAddress3, 1510000000000).resolves(15783812856);
    });

    afterEach(function () {
      sandBox.restore();
    });

    // TODO(COIN-919): Fix failing test
    xit('should build signed consolidation recoveries', async function () {
      const res = await basecoin.recoverConsolidations({
        userKey: testData.consolidationWrwUser.userKey,
        backupKey: testData.consolidationWrwUser.backupKey,
        bitgoKey: testData.consolidationWrwUser.bitgoKey,
        walletPassphrase: testData.consolidationWrwUser.walletPassphrase,
        startingScanIndex: 1,
        endingScanIndex: 4,
      });
      res.should.not.be.empty();
      res.transactions.length.should.equal(2);
      sandBox.assert.calledThrice(basecoin.getAccountInfo);
      sandBox.assert.calledTwice(basecoin.getHeaderInfo);

      const txn1 = res.transactions[0];
      txn1.should.hasOwnProperty('serializedTx');
      txn1.should.hasOwnProperty('scanIndex');
      txn1.scanIndex.should.equal(2);
      // deserialize the txn and verify the fields are what we expect
      const txBuilder1 = basecoin.getBuilder().from(txn1.serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder1
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: basecoin.MAX_VALIDITY_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash);
      const tx1 = await txBuilder1.build();
      const txJson1 = tx1.toJson();
      should.deepEqual(txJson1.sender, testData.consolidationWrwUser.walletAddress2);
      should.deepEqual(txJson1.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson1.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson1.genesisHash, genesisHash);
      should.deepEqual(txJson1.specVersion, specVersion);
      should.deepEqual(txJson1.nonce, nonce);
      should.deepEqual(txJson1.tip, 0);
      should.deepEqual(txJson1.transactionVersion, txVersion);
      should.deepEqual(txJson1.chainName, chainName);
      // eraPeriod will always round to the next upper power of 2 for any input value, in this case 2400.
      // 4096 is the "highest" value you can set, but the txn still may fail after 2400 blocks.
      const eraPeriod = 4096;
      should.deepEqual(txJson1.eraPeriod, eraPeriod);
      should.deepEqual(txJson1.to, baseAddr);

      res.lastScanIndex.should.equal(3);
      const txn2 = res.transactions[1];
      txn2.should.hasOwnProperty('serializedTx');
      txn2.should.hasOwnProperty('scanIndex');
      txn2.scanIndex.should.equal(3);
      // deserialize the txn and verify the fields are what we expect
      const txBuilder2 = basecoin.getBuilder().from(txn2.serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder2
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: basecoin.MAX_VALIDITY_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash);
      const tx2 = await txBuilder2.build();
      const txJson2 = tx2.toJson();
      should.deepEqual(txJson2.sender, testData.consolidationWrwUser.walletAddress3);
      should.deepEqual(txJson2.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson2.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson2.genesisHash, genesisHash);
      should.deepEqual(txJson2.specVersion, specVersion);
      should.deepEqual(txJson2.nonce, nonce);
      should.deepEqual(txJson2.tip, 0);
      should.deepEqual(txJson2.transactionVersion, txVersion);
      should.deepEqual(txJson2.chainName, chainName);
      should.deepEqual(txJson2.eraPeriod, eraPeriod);
      should.deepEqual(txJson2.to, baseAddr);
    });

    it('should build unsigned consolidation recoveries', async function () {
      const res = await basecoin.recoverConsolidations({
        bitgoKey: testData.consolidationWrwUser.bitgoKey,
        startingScanIndex: 1,
        endingScanIndex: 4,
      });
      res.should.not.be.empty();
      res.txRequests.length.should.equal(2);
      sandBox.assert.calledThrice(basecoin.getAccountInfo);
      sandBox.assert.calledTwice(basecoin.getHeaderInfo);

      const txn1 = res.txRequests[0].transactions[0].unsignedTx;
      txn1.should.hasOwnProperty('serializedTx');
      txn1.should.hasOwnProperty('signableHex');
      txn1.should.hasOwnProperty('scanIndex');
      txn1.scanIndex.should.equal(2);
      txn1.should.hasOwnProperty('coin');
      txn1.coin.should.equal('tdot');
      txn1.should.hasOwnProperty('derivationPath');
      txn1.derivationPath.should.equal('m/2');

      txn1.should.hasOwnProperty('coinSpecific');
      const coinSpecific1 = txn1.coinSpecific;
      coinSpecific1.should.hasOwnProperty('commonKeychain');
      coinSpecific1.should.hasOwnProperty('firstValid');
      coinSpecific1.firstValid.should.equal(testData.westendBlock.blockNumber);
      coinSpecific1.should.hasOwnProperty('maxDuration');
      coinSpecific1.maxDuration.should.equal(basecoin.MAX_VALIDITY_DURATION);

      // deserialize the txn and verify the fields are what we expect
      const txBuilder1 = basecoin.getBuilder().from(txn1.serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder1
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: basecoin.MAX_VALIDITY_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash)
        .sender({ address: testData.consolidationWrwUser.walletAddress2 });
      const tx1 = await txBuilder1.build();
      const txJson1 = tx1.toJson();
      should.deepEqual(txJson1.sender, testData.consolidationWrwUser.walletAddress2);
      should.deepEqual(txJson1.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson1.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson1.genesisHash, genesisHash);
      should.deepEqual(txJson1.specVersion, specVersion);
      should.deepEqual(txJson1.nonce, nonce);
      should.deepEqual(txJson1.tip, 0);
      should.deepEqual(txJson1.transactionVersion, txVersion);
      should.deepEqual(txJson1.chainName, chainName);
      // eraPeriod will always round to the next upper power of 2 for any input value, in this case 2400.
      // 4096 is the "highest" value you can set, but the txn still may fail after 2400 blocks.
      const eraPeriod = 4096;
      should.deepEqual(txJson1.eraPeriod, eraPeriod);
      should.deepEqual(txJson1.to, baseAddr);

      const txn2 = res.txRequests[1].transactions[0].unsignedTx;
      txn2.should.hasOwnProperty('serializedTx');
      txn2.should.hasOwnProperty('signableHex');
      txn2.should.hasOwnProperty('scanIndex');
      txn2.scanIndex.should.equal(3);
      txn2.should.hasOwnProperty('coin');
      txn2.coin.should.equal('tdot');
      txn2.should.hasOwnProperty('derivationPath');
      txn2.derivationPath.should.equal('m/3');

      txn2.should.hasOwnProperty('coinSpecific');
      const coinSpecific2 = txn2.coinSpecific;
      coinSpecific2.should.hasOwnProperty('commonKeychain');
      coinSpecific2.should.hasOwnProperty('firstValid');
      coinSpecific2.firstValid.should.equal(testData.westendBlock.blockNumber);
      coinSpecific2.should.hasOwnProperty('maxDuration');
      coinSpecific2.maxDuration.should.equal(basecoin.MAX_VALIDITY_DURATION);
      coinSpecific2.should.hasOwnProperty('commonKeychain');
      coinSpecific2.should.hasOwnProperty('lastScanIndex');
      coinSpecific2.lastScanIndex.should.equal(3);

      // deserialize the txn and verify the fields are what we expect
      const txBuilder2 = basecoin.getBuilder().from(txn2.serializedTx);
      // some information isn't deserialized by the from method, so we will
      // supply it again in order to re-build the txn
      txBuilder2
        .validity({
          firstValid: testData.westendBlock.blockNumber,
          maxDuration: basecoin.MAX_VALIDITY_DURATION,
        })
        .referenceBlock(testData.westendBlock.hash)
        .sender({ address: testData.consolidationWrwUser.walletAddress3 });
      const tx2 = await txBuilder2.build();
      const txJson2 = tx2.toJson();
      should.deepEqual(txJson2.sender, testData.consolidationWrwUser.walletAddress3);
      should.deepEqual(txJson2.blockNumber, testData.westendBlock.blockNumber);
      should.deepEqual(txJson2.referenceBlock, testData.westendBlock.hash);
      should.deepEqual(txJson2.genesisHash, genesisHash);
      should.deepEqual(txJson2.specVersion, specVersion);
      should.deepEqual(txJson2.nonce, nonce);
      should.deepEqual(txJson2.tip, 0);
      should.deepEqual(txJson2.transactionVersion, txVersion);
      should.deepEqual(txJson2.chainName, chainName);
      should.deepEqual(txJson2.eraPeriod, eraPeriod);
      should.deepEqual(txJson2.to, baseAddr);
    });

    it('should skip building consolidate transaction if balance is equal to zero', async function () {
      await basecoin
        .recoverConsolidations({
          userKey: testData.consolidationWrwUser.userKey,
          backupKey: testData.consolidationWrwUser.backupKey,
          bitgoKey: testData.consolidationWrwUser.bitgoKey,
          walletPassphrase: testData.consolidationWrwUser.walletPassphrase,
          startingScanIndex: 1,
          endingScanIndex: 2,
        })
        .should.rejectedWith('Did not find an address with funds to recover');
    });

    it('should throw if startingScanIndex is not ge to 1', async () => {
      await basecoin
        .recoverConsolidations({
          userKey: testData.consolidationWrwUser.userKey,
          backupKey: testData.consolidationWrwUser.backupKey,
          bitgoKey: testData.consolidationWrwUser.bitgoKey,
          startingScanIndex: -1,
        })
        .should.be.rejectedWith(
          'Invalid starting or ending index to scan for addresses. startingScanIndex: -1, endingScanIndex: 19.'
        );
    });

    it('should throw if scan factor is too high', async () => {
      await basecoin
        .recoverConsolidations({
          userKey: testData.consolidationWrwUser.userKey,
          backupKey: testData.consolidationWrwUser.backupKey,
          bitgoKey: testData.consolidationWrwUser.bitgoKey,
          startingScanIndex: 1,
          endingScanIndex: 300,
        })
        .should.be.rejectedWith(
          'Invalid starting or ending index to scan for addresses. startingScanIndex: 1, endingScanIndex: 300.'
        );
    });
  });

  describe('Recover Transaction Failures:', () => {
    const sandBox = sinon.createSandbox();
    const destAddr = testData.accounts.account1.address;
    const nonce = 123;

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
        })
        .should.rejectedWith('Did not find address with funds to recover');
    });
  });
});
