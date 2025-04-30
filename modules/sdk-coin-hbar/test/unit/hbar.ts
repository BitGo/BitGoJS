import assert from 'assert';

import * as _ from 'lodash';
import Sinon, { SinonStub } from 'sinon';
import { randomBytes } from 'crypto';
import { BigNumber } from 'bignumber.js';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI, encrypt } from '@bitgo/sdk-api';
import { TxData, Transfer } from '../../src/lib/iface';
import { Wallet } from '@bitgo/sdk-core';

import * as TestData from '../fixtures/hbar';
import { Hbar, Thbar, KeyPair, HbarToken } from '../../src';
import { getBuilderFactory } from './getBuilderFactory';
import { hbarBackupKey } from './fixtures/hbarBackupKey';

describe('Hedera Hashgraph:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let token;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('thbar', Thbar.createInstance);
    bitgo.safeRegister('hbar', Hbar.createInstance);
    HbarToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('thbar');
    token = bitgo.coin('thbar:usdc');
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('hbar');
    basecoin.should.be.an.instanceof(Hbar);
  });

  it('should check valid addresses', async function () {
    const badAddresses = [
      '',
      '0.0',
      'YZ09fd-',
      '0.0.0.a',
      'sadasdfggg',
      '0.2.a.b',
      '0.0.100?=sksjd',
      '0.0.41098?memoId=',
    ];
    const goodAddresses = [
      '0',
      '0.0.0',
      '0.0.41098',
      '0.0.0?memoId=84',
      '0.0.41098',
      '0.0.41098?memoId=2aaaaa',
      '0.0.41098?memoId=1',
    ];

    badAddresses.map((addr) => {
      basecoin.isValidAddress(addr).should.equal(false);
    });
    goodAddresses.map((addr) => {
      basecoin.isValidAddress(addr).should.equal(true);
    });

    const hexAddress = '0x23C3E227BE97281A70A549c7dDB8d5Caad3E7C84';
    basecoin.isValidAddress(hexAddress).should.equal(false);
  });

  it('should explain a transaction', async function () {
    const tx = JSON.parse(TestData.rawTransactionForExplain);
    const explain = await basecoin.explainTransaction(tx);

    explain.id.should.equal('0.0.43285@1600529800.643093586');
    explain.outputAmount.should.equal('2200000000');
    explain.timestamp.should.equal('1600529800.643093586');
    explain.expiration.should.equal('180');
    explain.outputs[0].amount.should.equal('2200000000');
    explain.outputs[0].address.should.equal('0.0.43283');
    explain.outputs[0].memo.should.equal('1');
    explain.fee.should.equal(1160407);
    explain.changeAmount.should.equal('0');
  });

  it('should explain a token transfer transaction', async function () {
    const tokenTransferParam = {
      txHex: TestData.UNSIGNED_TOKEN_TRANSFER,
      feeInfo: {
        size: 1000,
        fee: 1160407,
        feeRate: 1160407,
      },
    };
    const explain = await basecoin.explainTransaction(tokenTransferParam);

    explain.id.should.equal('0.0.81320@1596110493.372646570');
    explain.outputAmount.should.equal('0');
    explain.timestamp.should.equal('1596110493.372646570');
    explain.expiration.should.equal('180');
    explain.outputs[0].amount.should.equal('10');
    explain.outputs[0].address.should.equal('0.0.75861');
    explain.outputs[0].memo.should.equal('');
    explain.outputs[0].tokenName.should.equal('thbar:usdc');
    explain.fee.should.equal(1160407);
    explain.changeAmount.should.equal('0');
  });

  it('should explain a multirecipients transfer transaction', async function () {
    const multiTransferParam = {
      txHex: TestData.UNSIGNED_MULTI_TRANSFER,
      feeInfo: {
        size: 1000,
        fee: 1160407,
        feeRate: 1160407,
      },
    };
    const explain = await basecoin.explainTransaction(multiTransferParam);

    explain.id.should.equal('0.0.81320@1596110493.372646570');
    explain.outputAmount.should.equal('25');
    explain.expiration.should.equal('180');
    explain.outputs[0].amount.should.equal('10');
    explain.outputs[0].address.should.equal('0.0.75861');
    explain.outputs[0].memo.should.equal('');
    explain.outputs[1].amount.should.equal('15');
    explain.outputs[1].address.should.equal('0.0.78963');
    explain.fee.should.equal(1160407);
    explain.changeAmount.should.equal('0');
  });

  it('should explain a multirecipients token transfer transaction', async function () {
    const tokenMultiTransferParam = {
      txHex: TestData.UNSIGNED_TOKEN_MULTI_TRANSFER,
      feeInfo: {
        size: 1000,
        fee: 1160407,
        feeRate: 1160407,
      },
    };
    const explain = await basecoin.explainTransaction(tokenMultiTransferParam);

    explain.id.should.equal('0.0.81320@1596110493.372646570');
    explain.outputAmount.should.equal('0');
    explain.timestamp.should.equal('1596110493.372646570');
    explain.expiration.should.equal('180');
    explain.outputs[0].amount.should.equal('10');
    explain.outputs[0].address.should.equal('0.0.75861');
    explain.outputs[0].memo.should.equal('');
    explain.outputs[0].tokenName.should.equal('thbar:usdc');
    explain.outputs[1].amount.should.equal('15');
    explain.outputs[1].address.should.equal('0.0.78963');
    explain.outputs[1].tokenName.should.equal('thbar:usdc');
    explain.fee.should.equal(1160407);
    explain.changeAmount.should.equal('0');
  });

  it('should explain a token associate transaction', async function () {
    const tokenAssociateParam = {
      txHex: TestData.UNSIGNED_TOKEN_ASSOCIATE,
      feeInfo: {
        size: 1000,
        fee: 1160407,
        feeRate: 1160407,
      },
    };
    const explain = await basecoin.explainTransaction(tokenAssociateParam);

    explain.id.should.equal('0.0.81320@1596110493.372646570');
    explain.outputAmount.should.equal('0');
    explain.timestamp.should.equal('1596110493.372646570');
    explain.expiration.should.equal('180');
    explain.outputs[0].amount.should.equal('0');
    explain.outputs[0].address.should.equal('0.0.81320');
    explain.outputs[0].memo.should.equal('');
    explain.outputs[0].tokenName.should.equal('thbar:usdc');
    explain.fee.should.equal(1160407);
    explain.changeAmount.should.equal('0');
  });

  it('should verify isWalletAddress', async function () {
    const baseAddress = '0.0.41098';
    const validAddress1 = '0.0.41098?memoId=1';
    const validAddress2 = '0.0.41098?memoId=2';
    const unrelatedValidAddress = '0.1.41098?memoId=1';
    const invalidAddress = '0.0.0.a';
    (await basecoin.isWalletAddress({ address: validAddress1, baseAddress })).should.true();
    (await basecoin.isWalletAddress({ address: validAddress2, baseAddress })).should.true();
    (await basecoin.isWalletAddress({ address: validAddress2, baseAddress: validAddress1 })).should.true();
    (await basecoin.isWalletAddress({ address: unrelatedValidAddress, baseAddress })).should.false();

    assert.rejects(
      async () => basecoin.isWalletAddress({ address: invalidAddress, baseAddress }),
      `invalid address ${invalidAddress}`
    );
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should generate a keypair from a seed', function () {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.prv.should.equal(
        '302e020100300506032b65700422042080350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f'
      );
      keyPair.pub.should.equal(
        '302a300506032b65700321009cc402b5c75214269c2826e3c6119377cab6c367601338661c87a4e07c6e0333'
      );
    });

    it('should validate a stellar seed', function () {
      basecoin.isStellarSeed('SBMWLNV75BPI2VB4G27RWOMABVRTSSF7352CCYGVELZDSHCXWCYFKXIX').should.ok();
    });

    it('should convert a stellar seed to an hbar prv', function () {
      const seed = basecoin.convertFromStellarSeed('SBMWLNV75BPI2VB4G27RWOMABVRTSSF7352CCYGVELZDSHCXWCYFKXIX');
      seed.should.equal(
        '302e020100300506032b6570042204205965b6bfe85e8d543c36bf1b39800d633948bfdf742160d522f2391c57b0b055'
      );
    });
  });

  describe('Verify Transaction:', () => {
    let newTxPrebuild;
    let newTxParams;
    let newTxParamsWithError;
    let newTxParamsWithExtraData;
    const txPrebuild = {
      recipients: [
        {
          address: 'lionteste212',
          amount: '1000',
        },
      ],
      txHex: TestData.UNSIGNED_MULTI_TRANSFER,
      txid: '586c5b59b10b134d04c16ac1b273fe3c5529f34aef75db4456cd469c5cdac7e2',
      isVotingTransaction: false,
      coin: 'thbar',
      feeInfo: {
        size: 1000,
        fee: 1160407,
        feeRate: 1160407,
      },
    };
    const txParams = {
      txPrebuild,
      recipients: [
        {
          address: '0.0.75861',
          amount: '10',
        },
        {
          address: '0.0.78963',
          amount: '15',
        },
      ],
    };
    const memo = { value: '' };
    const txParamsWithError = {
      txPrebuild,
      recipients: [
        {
          address: '0.0.75861',
          amount: '1000',
        },
      ],
    };
    const txParamsWithExtraData = {
      txPrebuild,
      recipients: [
        {
          address: '0.0.75861',
          amount: '10',
          data: undefined,
        },
        {
          address: '0.0.78963',
          amount: '15',
          data: undefined,
        },
      ],
    };
    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      coin: 'thbar',
      keys: [
        '5b3424f91bf349930e34017500000000',
        '5b3424f91bf349930e34017600000000',
        '5b3424f91bf349930e34017700000000',
      ],
      coinSpecific: {
        baseAddress: '0.0.2935',
      },
      multisigType: 'onchain',
    };
    const walletObj = new Wallet(bitgo, basecoin, walletData);

    before(function () {
      newTxPrebuild = () => {
        return _.cloneDeep(txPrebuild);
      };
      newTxParams = () => {
        return _.cloneDeep(txParams);
      };
      newTxParamsWithError = () => {
        return _.cloneDeep(txParamsWithError);
      };
      newTxParamsWithExtraData = () => {
        return _.cloneDeep(txParamsWithExtraData);
      };
    });

    it('should verify native transfer transactions', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should fail verify when input `recipients` is absent', async function () {
      const txParams = newTxParams();
      txParams.recipients = undefined;
      const txPrebuild = newTxPrebuild();
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo: memo, wallet: walletObj } as any)
        .should.be.rejectedWith('missing required tx params property recipients');
    });

    it('should fail verify transactions when have different recipients', async function () {
      const txParams = newTxParamsWithError();
      const txPrebuild = newTxPrebuild();
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo, wallet: walletObj } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should succeed to verify transactions when recipients has extra data', async function () {
      const txParams = newTxParamsWithExtraData();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify create associated token account transaction', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = TestData.UNSIGNED_TOKEN_ASSOCIATE;
      txParams.recipients = [
        {
          address: '0.0.81320',
          amount: '0',
          tokenName: 'thbar:usdc',
        },
      ];
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should fail verify create associated token account transaction with mismatch recipients', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = TestData.UNSIGNED_TOKEN_ASSOCIATE;
      txParams.recipients = [
        {
          address: '0.0.81321',
          amount: '0',
          tokenName: 'thbar:usdc',
        },
      ];
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo, wallet: walletObj } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should verify token transfer transaction', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = TestData.UNSIGNED_TOKEN_MULTI_TRANSFER;
      txParams.recipients = [
        {
          address: '0.0.75861',
          amount: '10',
          tokenName: 'thbar:usdc',
        },
        {
          address: '0.0.78963',
          amount: '15',
          tokenName: 'thbar:usdc',
        },
      ];
      const validTransaction = await token.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify token transfer transaction with any token name on token base coin', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = TestData.UNSIGNED_TOKEN_MULTI_TRANSFER;
      txParams.recipients = [
        {
          address: '0.0.75861',
          amount: '10',
          tokenName: 'thbar:usdc',
        },
        {
          address: '0.0.78963',
          amount: '15',
        },
      ];
      (await token.verifyTransaction({ txParams, txPrebuild, memo, wallet: walletObj } as any)).should.equal(true);
    });

    it('should fail to verify token transfer with mismatched recipients', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = TestData.UNSIGNED_TOKEN_MULTI_TRANSFER;
      txParams.recipients = [
        {
          address: '0.0.75861',
          amount: '11',
          tokenName: 'thbar:usdc',
        },
        {
          address: '0.0.78963',
          amount: '15',
        },
      ];
      await token
        .verifyTransaction({ txParams, txPrebuild, memo, wallet: walletObj } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify token transfer with incorrect token name', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = TestData.UNSIGNED_TOKEN_MULTI_TRANSFER;
      txParams.recipients = [
        {
          address: '0.0.75861',
          amount: '11',
          tokenName: 'thbar:usdc',
        },
        {
          address: '0.0.78963',
          amount: '15',
          tokenName: 'invalidtoken',
        },
      ];
      await token
        .verifyTransaction({ txParams, txPrebuild, memo, wallet: walletObj } as any)
        .should.be.rejectedWith('Incorrect token name specified in recipients');
    });

    it('should success to verify transfer having address with memo id', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = TestData.UNSIGNED_TOKEN_ASSOCIATE;
      txParams.recipients = [
        {
          address: '0.0.81320?memoId=1',
          amount: '0',
          tokenName: 'thbar:usdc',
        },
      ];
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPair = new KeyPair();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(keyPair.getKeys(), messageToSign);
      keyPair.verifySignature(messageToSign, Uint8Array.from(Buffer.from(signature, 'hex'))).should.equals(true);
    });

    it('should fail with missing private key', async () => {
      const keyPair = new KeyPair({
        pub: '302a300506032b6570032100d8fd745361df270776a3ab1b55d5590ec00a26ab45eea37197dc9894a81fcb82',
      }).getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      await basecoin.signMessage(keyPair, messageToSign).should.be.rejectedWith('Invalid key pair options');
    });
  });

  describe('Sign transaction:', () => {
    const destination = '0.0.129369';
    const source = '0.0.1234';
    const amount = '100000';
    /**
     * Build an unsigned account-lib multi-signature send transaction
     * @param destination The destination address of the transaction
     * @param source The account sending thist ransaction
     * @param amount The amount to send to the recipient
     */
    const buildUnsignedTransaction = async function ({ destination, source, amount = '100000' }) {
      const factory = getBuilderFactory('thbar');
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({
        fee: '100000',
      });
      txBuilder.source({ address: source });
      txBuilder.send({ address: destination, amount });

      return await txBuilder.build();
    };

    it('should sign transaction', async function () {
      const key = new KeyPair();
      const unsignedTransaction = await buildUnsignedTransaction({
        destination,
        source,
        amount,
      });

      const tx = await basecoin.signTransaction({
        prv: key.getKeys().prv!.toString(),
        txPrebuild: {
          txHex: unsignedTransaction.toBroadcastFormat(),
        },
      });

      const factory = getBuilderFactory('thbar');
      const txBuilder = factory.from(tx.halfSigned.txHex);
      const signedTx = await txBuilder.build();
      const txJson = signedTx.toJson() as TxData;
      txJson.should.have.properties('to', 'amount');
      txJson.to?.should.equal(destination);
      txJson.from.should.equal(source);
      txJson.amount?.should.equal(amount);
      (txJson.instructionsData as Transfer).params.recipients[0].should.deepEqual({
        address: destination,
        amount,
      });
      signedTx.signature.length.should.equal(1);
    });

    it('should fully sign transaction with root key', async function () {
      const key1 = basecoin.generateRootKeyPair();
      const key2 = basecoin.generateRootKeyPair();

      const unsignedTransaction = await buildUnsignedTransaction({
        destination,
        source,
        amount,
      });

      const txHalfSigned = await basecoin.signTransaction({
        prv: key1.prv,
        txPrebuild: {
          txHex: unsignedTransaction.toBroadcastFormat(),
        },
      });

      const factory = getBuilderFactory('thbar');
      const txBuilderHalfSigned = factory.from(txHalfSigned.halfSigned.txHex);
      const halfSignedTx = await txBuilderHalfSigned.build();
      const halfSignedTxJson = halfSignedTx.toJson() as TxData;
      halfSignedTxJson.should.have.properties('to', 'amount');
      halfSignedTxJson.to?.should.equal(destination);
      halfSignedTxJson.from.should.equal(source);
      halfSignedTxJson.amount?.should.equal(amount);
      (halfSignedTxJson.instructionsData as Transfer).params.recipients[0].should.deepEqual({
        address: destination,
        amount,
      });
      halfSignedTx.signature.length.should.equal(1);

      const txSigned = await basecoin.signTransaction({
        prv: key2.prv,
        txPrebuild: {
          txHex: halfSignedTx.toBroadcastFormat(),
        },
      });

      const txBuilderSigned = factory.from(txSigned.txHex);
      const signedTx = await txBuilderSigned.build();
      const signedTxJson = signedTx.toJson() as TxData;
      signedTxJson.should.have.properties('to', 'amount');
      signedTxJson.to?.should.equal(destination);
      signedTxJson.from.should.equal(source);
      signedTxJson.amount?.should.equal(amount);
      (signedTxJson.instructionsData as Transfer).params.recipients[0].should.deepEqual({
        address: destination,
        amount,
      });
      signedTx.signature.length.should.equal(2);
    });
  });

  describe('Recovery', function () {
    const defaultValidDuration = '180';
    const defaultFee = 10000000;
    const defaultNodeId = '0.0.3';
    const userKey =
      '{"iv":"WlPuJOejRWgj/NTd3UMgrw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"6yAVFvreHSQ=","ct":"8j/lBVkFByKlVhaS9JWmmLja5yTokjaIiLDxMIDjMojVEim9T36WAm5qW6v1V0A7QcEuGiVl3PKMDa+Gr6tI/HT58DW5RE+pHzya9MUQpAgNrJr8VEWjrXWqZECVtra1/bKCyB+mozc="}';
    const userPub = '302a300506032b6570032100ddd53a1591d72b181109bd3e57b18603740490b9ab4d37bc7fa27480e6b8c911';
    const backupKey =
      '{"iv":"D5DVDozQx9B02JeFV0/OVA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"7FUNF8M35bo=","ct":"ZiPsu5Qe/AIS4JQXt+rrusHnYCy4CqurM16R5wJrd4CEx7u85y3yy5ErnsdyYYcc3txyNmUIQ2/CBq/LKoKO/VIeU++CnKxzGuHGcNI47BPk3RQK42a66uIQn/yTR++XgdK1KhvUL3U="}';
    const backupPub = '302a300506032b65700321006293e4ec9bf1b2d8fae631119107248a65e2207a05d32a11f42cc3d9a3005d4a';
    const rootAddress = '0.0.7671186';
    const walletPassphrase = 'TestPasswordPleaseIgnore';
    const recoveryDestination = '0.0.7651908';
    const bitgoKey = '5a93b01ea87e963f61c974a89d62e3841392f1ba020fbbcc65a8089ca025abbb';
    const memo = '4';
    const balance = '1000000000';
    const formatBalanceResponse = (balance: string) =>
      new BigNumber(balance).dividedBy(basecoin.getBaseFactor()).toFixed(9) + ' ℏ';
    const tokenId = '0.0.429274';

    describe('Non-BitGo', async function () {
      const sandBox = Sinon.createSandbox();

      afterEach(function () {
        sandBox.verifyAndRestore();
      });

      it('should build and sign the recovery tx', async function () {
        const expectedAmount = new BigNumber(balance).minus(defaultFee).toString();
        const getBalanceStub = sandBox
          .stub(Hbar.prototype, 'getAccountBalance')
          .resolves({ hbars: formatBalanceResponse(balance), tokens: [] });

        const recovery = await basecoin.recover({
          userKey,
          backupKey,
          rootAddress,
          walletPassphrase,
          recoveryDestination: recoveryDestination + '?memoId=' + memo,
        });

        recovery.should.not.be.undefined();
        recovery.should.have.property('id');
        recovery.should.have.property('tx');
        recovery.should.have.property('coin', 'thbar');
        recovery.should.have.property('nodeId', defaultNodeId);
        getBalanceStub.callCount.should.equal(1);
        const txBuilder = basecoin.getBuilderFactory().from(recovery.tx);
        const tx = await txBuilder.build();
        tx.toBroadcastFormat().should.equal(recovery.tx);
        const txJson = tx.toJson();
        txJson.amount.should.equal(expectedAmount);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(defaultFee);
        txJson.node.should.equal(defaultNodeId);
        txJson.memo.should.equal(memo);
        txJson.validDuration.should.equal(defaultValidDuration);
        txJson.should.have.property('startTime');
        recovery.should.have.property('startTime', txJson.startTime);
        recovery.should.have.property('id', rootAddress + '@' + txJson.startTime);
      });

      it('should throw for invalid rootAddress', async function () {
        const invalidRootAddress = 'randomstring';
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress: 'randomstring',
              walletPassphrase,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
            });
          },
          { message: 'invalid rootAddress, got: ' + invalidRootAddress }
        );
      });

      it('should throw for invalid recoveryDestination', async function () {
        const invalidRecoveryDestination = 'randomstring';
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress,
              walletPassphrase,
              recoveryDestination: 'randomstring',
            });
          },
          { message: 'invalid recoveryDestination, got: ' + invalidRecoveryDestination }
        );
      });

      it('should throw for invalid nodeId', async function () {
        const invalidNodeId = 'a.2.3';
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress,
              walletPassphrase,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              nodeId: invalidNodeId,
            });
          },
          { message: 'invalid nodeId, got: ' + invalidNodeId }
        );
      });

      it('should throw for invalid maxFee', async function () {
        const invalidMaxFee = '-32';
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress,
              walletPassphrase,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              maxFee: invalidMaxFee,
            });
          },
          { message: 'invalid maxFee, got: ' + invalidMaxFee }
        );
      });

      it('should throw if there is no enough balance to recover', async function () {
        const getBalanceStub = sandBox
          .stub(Hbar.prototype, 'getAccountBalance')
          .resolves({ hbars: formatBalanceResponse('100'), tokens: [] });
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress,
              walletPassphrase,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
            });
          },
          { message: 'Insufficient balance to recover, got balance: 100 fee: 10000000' }
        );

        getBalanceStub.callCount.should.equal(1);
      });

      it('should throw if the walletPassphrase is undefined', async function () {
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
            });
          },
          { message: 'walletPassphrase is required for non-bitgo recovery' }
        );
      });

      it('should throw if the walletPassphrase is wrong', async function () {
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress,
              walletPassphrase: 'randompassword',
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
            });
          },
          {
            message:
              "unable to decrypt userKey or backupKey with the walletPassphrase provided, got error: password error - ccm: tag doesn't match",
          }
        );
      });

      it('should build and sign the recovery tx for tokens', async function () {
        const balance = '100';
        const data = {
          hbars: '1',
          tokens: [{ tokenId: tokenId, balance: balance, decimals: 6 }],
        };
        const getBalanceStub = sandBox.stub(Hbar.prototype, 'getAccountBalance').resolves(data);

        const recovery = await basecoin.recover({
          userKey,
          backupKey,
          rootAddress,
          walletPassphrase,
          recoveryDestination: recoveryDestination + '?memoId=' + memo,
          tokenId: tokenId,
        });

        recovery.should.not.be.undefined();
        recovery.should.have.property('id');
        recovery.should.have.property('tx');
        recovery.should.have.property('coin', 'thbar');
        recovery.should.have.property('nodeId', defaultNodeId);
        getBalanceStub.callCount.should.equal(1);
        const txBuilder = basecoin.getBuilderFactory().from(recovery.tx);
        const tx = await txBuilder.build();
        tx.toBroadcastFormat().should.equal(recovery.tx);
        const txJson = tx.toJson();
        txJson.amount.should.equal(balance);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(defaultFee);
        txJson.node.should.equal(defaultNodeId);
        txJson.memo.should.equal(memo);
        txJson.validDuration.should.equal(defaultValidDuration);
        txJson.should.have.property('startTime');
        recovery.should.have.property('startTime', txJson.startTime);
        recovery.should.have.property('id', rootAddress + '@' + txJson.startTime);
      });

      it('should throw error for non supported invalid tokenId', async function () {
        const invalidTokenId = 'randomstring';
        const data = {
          hbars: '1',
          tokens: [{ tokenId: tokenId, balance: '100', decimals: 6 }],
        };
        sandBox.stub(Hbar.prototype, 'getAccountBalance').resolves(data);
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress: rootAddress,
              walletPassphrase,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              tokenId: invalidTokenId,
            });
          },
          { message: 'Unsupported token: ' + invalidTokenId }
        );
      });

      it('should throw error for insufficient balance for tokenId if token balance not exist', async function () {
        const data = {
          hbars: '100',
          tokens: [{ tokenId: 'randomString', balance: '100', decimals: 6 }],
        };
        sandBox.stub(Hbar.prototype, 'getAccountBalance').resolves(data);
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress: rootAddress,
              walletPassphrase,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              tokenId: tokenId,
            });
          },
          { message: 'Insufficient balance to recover token: ' + tokenId + ' for account: ' + rootAddress }
        );
      });

      it('should throw error for insufficient balance for tokenId if token balance exist with 0 amount', async function () {
        const data = {
          hbars: '100',
          tokens: [{ tokenId: 'randomString', balance: '0', decimals: 6 }],
        };
        sandBox.stub(Hbar.prototype, 'getAccountBalance').resolves(data);
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress: rootAddress,
              walletPassphrase,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              tokenId: tokenId,
            });
          },
          { message: 'Insufficient balance to recover token: ' + tokenId + ' for account: ' + rootAddress }
        );
      });

      it('should throw error for insufficient native balance for token transfer', async function () {
        const data = {
          hbars: '0.01',
          tokens: [{ tokenId: tokenId, balance: '10', decimals: 6 }],
        };
        sandBox.stub(Hbar.prototype, 'getAccountBalance').resolves(data);
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress: rootAddress,
              walletPassphrase,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              tokenId: tokenId,
            });
          },
          { message: 'Insufficient native balance to recover tokens, got native balance: 1000000 fee: ' + defaultFee }
        );
      });
    });

    describe('Unsigned Sweep', function () {
      const sandBox = Sinon.createSandbox();
      let getBalanceStub: SinonStub;

      afterEach(function () {
        sandBox.verifyAndRestore();
      });

      it('should build unsigned sweep tx', async function () {
        getBalanceStub = sandBox
          .stub(Hbar.prototype, 'getAccountBalance')
          .resolves({ hbars: formatBalanceResponse(balance), tokens: [] });
        const startTime = (Date.now() / 1000 + 10).toFixed(); // timestamp in seconds, 10 seconds from now
        const expectedAmount = new BigNumber(balance).minus(defaultFee).toString();

        const recovery = await basecoin.recover({
          userKey: userPub,
          backupKey: backupPub,
          rootAddress,
          bitgoKey,
          recoveryDestination: recoveryDestination + '?memoId=' + memo,
          startTime,
        });

        getBalanceStub.callCount.should.equal(1);

        recovery.should.not.be.undefined();
        recovery.should.have.property('txHex');
        recovery.should.have.property('id', rootAddress + '@' + startTime + '.0');
        recovery.should.have.property('userKey', userPub);
        recovery.should.have.property('backupKey', backupPub);
        recovery.should.have.property('bitgoKey', bitgoKey);
        recovery.should.have.property('address', rootAddress);
        recovery.should.have.property('coin', 'thbar');
        recovery.should.have.property('maxFee', defaultFee.toString());
        recovery.should.have.property('recipients', [{ address: recoveryDestination, amount: expectedAmount }]);
        recovery.should.have.property('amount', expectedAmount);
        recovery.should.have.property('validDuration', defaultValidDuration);
        recovery.should.have.property('nodeId', defaultNodeId);
        recovery.should.have.property('memo', memo);
        recovery.should.have.property('startTime', startTime + '.0');
        const txBuilder = basecoin.getBuilderFactory().from(recovery.txHex);
        const tx = await txBuilder.build();
        const txJson = tx.toJson();
        txJson.id.should.equal(rootAddress + '@' + startTime + '.0');
        txJson.amount.should.equal(expectedAmount);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(defaultFee);
        txJson.node.should.equal(defaultNodeId);
        txJson.memo.should.equal(memo);
        txJson.validDuration.should.equal(defaultValidDuration);
        txJson.startTime.should.equal(startTime + '.0');
        txJson.validDuration.should.equal(defaultValidDuration);
      });

      it('should build unsigned sweep tx for tokens', async function () {
        const balance = '100';
        const data = {
          hbars: '1',
          tokens: [{ tokenId: tokenId, balance: balance, decimals: 6 }],
        };
        getBalanceStub = sandBox.stub(Hbar.prototype, 'getAccountBalance').resolves(data);
        const startTime = (Date.now() / 1000 + 10).toFixed(); // timestamp in seconds, 10 seconds from now
        const recovery = await basecoin.recover({
          userKey: userPub,
          backupKey: backupPub,
          rootAddress,
          bitgoKey,
          recoveryDestination: recoveryDestination + '?memoId=' + memo,
          startTime,
          tokenId: tokenId,
        });

        getBalanceStub.callCount.should.equal(1);

        recovery.should.not.be.undefined();
        recovery.should.have.property('txHex');
        recovery.should.have.property('id', rootAddress + '@' + startTime + '.0');
        recovery.should.have.property('userKey', userPub);
        recovery.should.have.property('backupKey', backupPub);
        recovery.should.have.property('bitgoKey', bitgoKey);
        recovery.should.have.property('address', rootAddress);
        recovery.should.have.property('coin', 'thbar');
        recovery.should.have.property('maxFee', defaultFee.toString());
        recovery.should.have.property('recipients', [
          { address: recoveryDestination, amount: balance, tokenName: 'thbar:usdc' },
        ]);
        recovery.should.have.property('amount', balance);
        recovery.should.have.property('validDuration', defaultValidDuration);
        recovery.should.have.property('nodeId', defaultNodeId);
        recovery.should.have.property('memo', memo);
        recovery.should.have.property('startTime', startTime + '.0');
        const txBuilder = basecoin.getBuilderFactory().from(recovery.txHex);
        const tx = await txBuilder.build();
        const txJson = tx.toJson();
        txJson.id.should.equal(rootAddress + '@' + startTime + '.0');
        txJson.amount.should.equal(balance);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(defaultFee);
        txJson.node.should.equal(defaultNodeId);
        txJson.memo.should.equal(memo);
        txJson.validDuration.should.equal(defaultValidDuration);
        txJson.startTime.should.equal(startTime + '.0');
        txJson.validDuration.should.equal(defaultValidDuration);
      });

      it('should throw if startTime is undefined', async function () {
        const startTime = undefined;

        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey: userPub,
              backupKey: backupPub,
              rootAddress,
              bitgoKey,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              startTime,
            });
          },
          { message: 'start time is required for unsigned sweep' }
        );
      });

      it('should throw for invalid userKey', async function () {
        const startTime = (Date.now() / 1000 + 10).toFixed();
        const invalidUserPub = '302a300506032b6570032100randomstring';
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey: invalidUserPub,
              backupKey: backupPub,
              bitgoKey,
              rootAddress,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              startTime,
            });
          },
          { message: 'invalid userKey, got: ' + invalidUserPub }
        );
      });

      it('should throw for invalid backupKey', async function () {
        const invalidBackupPub = '302a300506032b6570032100randomstring';
        const startTime = (Date.now() / 1000 + 10).toFixed();
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey: userPub,
              backupKey: invalidBackupPub,
              bitgoKey,
              rootAddress,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              startTime,
            });
          },
          { message: 'invalid backupKey, got: ' + invalidBackupPub }
        );
      });

      it('should throw if startTime is a valid timestamp', async function () {
        const startTime = 'asd';

        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey: userPub,
              backupKey: backupPub,
              rootAddress,
              bitgoKey,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              startTime,
            });
          },
          { message: 'invalid startTime, got: ' + startTime }
        );
      });

      it('should throw if startTime is not a future date', async function () {
        const startTime = (Date.now() / 1000 - 1).toString(); // timestamp in seconds, 1 second ago

        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey: userPub,
              backupKey: backupPub,
              rootAddress,
              bitgoKey,
              recoveryDestination: recoveryDestination + '?memoId=' + memo,
              startTime,
            });
          },
          { message: 'startTime must be a future timestamp, got: ' + startTime }
        );
      });
    });

    describe('Recovery with root keys', function () {
      const sandBox = Sinon.createSandbox();
      let getBalanceStub: SinonStub;
      const walletPassphrase = 'testbtcpassword1999';
      const userEddsaRootXPrv =
        '{"iv":"lHOTkiuucR2JWFD1x1gqpQ==","v":1,"iter":10000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"HkFrDVH++d8=","ct":"NBtbYdFEK84oH9uxwl/UrhRsW5nGJPnMSpRAo8Blrc7WTSPxGXmVS/EpUYEV03HG06/EnyBR0/Y6bjLQz4gkL6cGJD9hgyKqDvc9RtKHagEbo75oxPr0zP+r1HMUGBW38Ttgor674gBeb1Myew69xcS9KgguNxwz77X6fdeBhrfogLY22vcuLA=="}';
      const userEddsaRootPub = 'd9cb9c9c617cfa0b715849516bb054a2b5d78c0e3eeef011176fb8bc0108c531';
      const backupEddsaRootXprv =
        '{"iv":"sBoEFBBNoi2YVICPf16/BQ==","v":1,"iter":10000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"HkFrDVH++d8=","ct":"GscOqJC+Iq+Lr39plQp5ZCamVlpJHOltGTZ7/UnUunIhFmZWMBLxjEVnMOtPreb0NZ4/SFqO/N3mZvq6JbB7vWRxJuqkBIiVcIRwkSWdW55cboKx2ec3ajg8+uO2pbvNDs26Q+9NtZ4jZnKNqSUXiCmtJXLRHQ32oyD+olKRpIR2NQo2+7kIEw=="}';
      const backupEddsaRootPub = 'f163b1b8ee4c3343a97ac1d2470b967e967ac7b4e3731cacf02f28a1434a2f99';
      const rootAddress = '0.0.3644667';
      const memoId = '0';

      beforeEach(function () {
        getBalanceStub = sandBox
          .stub(Hbar.prototype, 'getAccountBalance')
          .resolves({ hbars: formatBalanceResponse(balance), tokens: [] });
      });

      afterEach(function () {
        sandBox.verifyAndRestore();
      });

      it('should build and sign non-bitgo recovery tx with root keys', async function () {
        const expectedAmount = new BigNumber(balance).minus(defaultFee).toString();

        const recovery = await basecoin.recover({
          userKey: userEddsaRootXPrv,
          backupKey: backupEddsaRootXprv,
          rootAddress,
          walletPassphrase,
          recoveryDestination: recoveryDestination + '?memoId=' + memoId,
        });

        getBalanceStub.callCount.should.equal(1);

        recovery.should.not.be.undefined();
        recovery.should.have.property('id');
        recovery.should.have.property('tx');
        recovery.should.have.property('coin', 'thbar');
        recovery.should.have.property('nodeId', defaultNodeId);
        getBalanceStub.callCount.should.equal(1);
        const txBuilder = basecoin.getBuilderFactory().from(recovery.tx);
        const tx = await txBuilder.build();
        tx.toBroadcastFormat().should.equal(recovery.tx);
        const txJson = tx.toJson();
        txJson.amount.should.equal(expectedAmount);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(defaultFee);
        txJson.node.should.equal(defaultNodeId);
        txJson.memo.should.equal(memoId);
        txJson.validDuration.should.equal(defaultValidDuration);
        txJson.should.have.property('startTime');
        recovery.should.have.property('startTime', txJson.startTime);
        recovery.should.have.property('id', rootAddress + '@' + txJson.startTime);
      });

      it('should build unsigned sweep tx', async function () {
        const startTime = (Date.now() / 1000 + 10).toFixed(); // timestamp in seconds, 10 seconds from now
        const expectedAmount = new BigNumber(balance).minus(defaultFee).toString();

        const recovery = await basecoin.recover({
          userKey: userEddsaRootPub,
          backupKey: backupEddsaRootPub,
          rootAddress,
          bitgoKey,
          recoveryDestination: recoveryDestination + '?memoId=' + memoId,
          startTime,
        });

        getBalanceStub.callCount.should.equal(1);

        recovery.should.not.be.undefined();
        recovery.should.have.property('txHex');
        recovery.should.have.property('id', rootAddress + '@' + startTime + '.0');
        recovery.should.have.property('userKey', userEddsaRootPub);
        recovery.should.have.property('backupKey', backupEddsaRootPub);
        recovery.should.have.property('bitgoKey', bitgoKey);
        recovery.should.have.property('address', rootAddress);
        recovery.should.have.property('coin', 'thbar');
        recovery.should.have.property('maxFee', defaultFee.toString());
        recovery.should.have.property('recipients', [{ address: recoveryDestination, amount: expectedAmount }]);
        recovery.should.have.property('amount', expectedAmount);
        recovery.should.have.property('validDuration', defaultValidDuration);
        recovery.should.have.property('nodeId', defaultNodeId);
        recovery.should.have.property('memo', memoId);
        recovery.should.have.property('startTime', startTime + '.0');
        const txBuilder = basecoin.getBuilderFactory().from(recovery.txHex);
        const tx = await txBuilder.build();
        const txJson = tx.toJson();
        txJson.id.should.equal(rootAddress + '@' + startTime + '.0');
        txJson.amount.should.equal(expectedAmount);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(defaultFee);
        txJson.node.should.equal(defaultNodeId);
        txJson.memo.should.equal(memoId);
        txJson.validDuration.should.equal(defaultValidDuration);
        txJson.startTime.should.equal(startTime + '.0');
        txJson.validDuration.should.equal(defaultValidDuration);
      });
    });
  });

  describe('broadcastTransaction', function () {
    const sandBox = Sinon.createSandbox();

    afterEach(function () {
      sandBox.verifyAndRestore();
    });

    it('should succeed if the startTime and serializedSignedTransaction are valid', async function () {
      const startTime = (Date.now() / 1000 - 3).toFixed(); // timestamp in seconds, -3 seconds from now so it's valid after 2 seconds
      const expectedResponse = { txId: '0.0.7668465@' + startTime + '.0', status: 'SUCCESS' };
      const broadcastStub = sandBox.stub(Hbar.prototype, 'clientBroadcastTransaction').resolves(expectedResponse);
      const serializedSignedTransaction =
        '1acc010a640a20592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f88312611a40105b7d250c81f3705bc0b85168ce3fd00330131bb7701378681c8c2e6a09a91828715e7334f4ef28d20ff09887c6e87c0a5c693e23824c26f3ba161fce0448050a640a20a6905095616c3cfaa1bf61b53de30e938ce4112c3cc4d25393ec6b9bf4dea0631a40bf98c5b89b7a08544edaa1f4c08a0dfa6ec3f78b7e2fd27049283984050f38ccf0303ee57a377cc0a725ffd99d69e9fd914770ab0949ba556d84b3b00cb07e0d22500a130a0608cea8c1ad0612090800100018f185d40312060800100018031880c2d72f220308b40132013472240a220a0f0a090800100018f185d40310d3b0510a0f0a090800100018c484d30310d4b051';
      const result = await basecoin.broadcastTransaction({ serializedSignedTransaction, startTime });
      broadcastStub.callCount.should.equal(1);
      result.should.deepEqual(expectedResponse);
    });

    it('should throw if the startTime is expired', async function () {
      const startTime = (Date.now() / 1000 - 2000).toFixed(); // timestamp in seconds, 2000 seconds from now
      const serializedSignedTransaction =
        '1acc010a640a20592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f88312611a40105b7d250c81f3705bc0b85168ce3fd00330131bb7701378681c8c2e6a09a91828715e7334f4ef28d20ff09887c6e87c0a5c693e23824c26f3ba161fce0448050a640a20a6905095616c3cfaa1bf61b53de30e938ce4112c3cc4d25393ec6b9bf4dea0631a40bf98c5b89b7a08544edaa1f4c08a0dfa6ec3f78b7e2fd27049283984050f38ccf0303ee57a377cc0a725ffd99d69e9fd914770ab0949ba556d84b3b00cb07e0d22500a130a0608cea8c1ad0612090800100018f185d40312060800100018031880c2d72f220308b40132013472240a220a0f0a090800100018f185d40310d3b0510a0f0a090800100018c484d30310d4b051';
      await assert.rejects(
        async () => {
          await basecoin.broadcastTransaction({ serializedSignedTransaction, startTime });
        },
        (error: any) => {
          assert.ok(error.message.includes('Failed to broadcast transaction, error: startTime window expired'));
          return true;
        }
      );
    });

    it('should throw if the serializedSignedTransaction is invalid', async function () {
      const startTime = (Date.now() / 1000 - 10).toFixed(); // timestamp in seconds, 10 seconds from now
      const serializedSignedTransaction = 'randomstring';
      await assert.rejects(async () => {
        await basecoin.broadcastTransaction({ serializedSignedTransaction, startTime });
      });
    });

    it('should throw if the startTime in the tx is invalid', async function () {
      const expectedResponse =
        'transaction 0.0.7668465@1706056301.000000000 failed precheck with status INVALID_TRANSACTION_START';
      sandBox.stub(Hbar.prototype, 'clientBroadcastTransaction').rejects(new Error(expectedResponse));
      const serializedSignedTransaction =
        '1acc010a640a20592a4fbb7263c59d450e651df96620dc9208ee7c7d9d6f2fdcb91c53f88312611a40105b7d250c81f3705bc0b85168ce3fd00330131bb7701378681c8c2e6a09a91828715e7334f4ef28d20ff09887c6e87c0a5c693e23824c26f3ba161fce0448050a640a20a6905095616c3cfaa1bf61b53de30e938ce4112c3cc4d25393ec6b9bf4dea0631a40bf98c5b89b7a08544edaa1f4c08a0dfa6ec3f78b7e2fd27049283984050f38ccf0303ee57a377cc0a725ffd99d69e9fd914770ab0949ba556d84b3b00cb07e0d22500a130a0608cea8c1ad0612090800100018f185d40312060800100018031880c2d72f220308b40132013472240a220a0f0a090800100018f185d40310d3b0510a0f0a090800100018c484d30310d4b051';

      await assert.rejects(
        async () => {
          await basecoin.broadcastTransaction({ serializedSignedTransaction });
        },
        { message: expectedResponse }
      );
    });
  });

  describe('deriveKeyWithSeed', function () {
    it('should derive key with seed', function () {
      (() => {
        basecoin.deriveKeyWithSeed('test');
      }).should.throw('method deriveKeyWithSeed not supported for eddsa curve');
    });
  });

  describe('Generate wallet Root key pair: ', () => {
    it('should generate key pair', () => {
      const kp = basecoin.generateRootKeyPair();
      basecoin.isValidPub(kp.pub).should.equal(true);
      const keypair = new KeyPair({ prv: kp.prv }).getKeys(true);
      keypair.should.have.property('prv');
      keypair.prv?.should.equal(kp.prv.slice(0, 64));
      keypair.pub.should.equal(kp.pub);
    });

    it('should generate key pair from seed', () => {
      const seed = Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex');
      const kp = basecoin.generateRootKeyPair(seed);
      basecoin.isValidPub(kp.pub).should.equal(true);
      kp.pub.should.equal('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a');
      kp.prv.should.equal(
        '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a'
      );

      const keypair = new KeyPair({ prv: kp.prv }).getKeys(true);
      keypair.should.have.property('prv');
      keypair.prv?.should.equal(kp.prv.slice(0, 64));
      keypair.pub.should.equal(kp.pub);
    });
  });

  describe('AuditKey', () => {
    const { key } = hbarBackupKey;
    const walletPassphrase = 'kAm[EFQ6o=SxlcLFDw%,';

    it('should return { isValid: true) } for valid inputs', async () => {
      const result = await basecoin.auditKey({
        coinName: 'hbar',
        encryptedPrv: key,
        walletPassphrase,
      });

      result.should.deepEqual({ isValid: true });
    });

    it('should return { isValid: false } if the walletPassphrase is incorrect', async () => {
      const result = await basecoin.auditKey({
        coinName: 'hbar',
        encryptedPrv: key,
        walletPassphrase: 'foo',
      });
      result.should.deepEqual({ isValid: false, message: "failed to decrypt prv: ccm: tag doesn't match" });
    });

    it('should return { isValid: false } if the key is altered', async () => {
      const alteredKey = key.replace(/[0-9]/g, '0');
      const result = await basecoin.auditKey({
        coinName: 'hbar',
        encryptedPrv: alteredKey,
        walletPassphrase,
      });

      result.isValid.should.equal(false);
    });

    it('should return { isValid: false } if the key is not a valid key', async () => {
      const invalidKey = '#@)$#($*@)#($*';
      const encryptedPrv = encrypt(walletPassphrase, invalidKey);
      const result = await basecoin.auditKey({
        coinName: 'hbar',
        encryptedPrv,
        walletPassphrase,
      });
      result.should.deepEqual({ isValid: false, message: 'Invalid private key' });
    });
  });
});
