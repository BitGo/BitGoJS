import { TxData, Transfer } from '../../src/lib/iface';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import * as TestData from '../fixtures/hbar';
import { randomBytes } from 'crypto';
import { Hbar, Thbar, KeyPair, HbarToken } from '../../src';
import { getBuilderFactory } from './getBuilderFactory';
import { Wallet } from '@bitgo/sdk-core';
import * as _ from 'lodash';
import assert from 'assert';

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
    explain.expiration.should.equal('120');
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
    explain.expiration.should.equal('120');
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
    explain.expiration.should.equal('120');
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
    explain.expiration.should.equal('120');
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
    explain.expiration.should.equal('120');
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
      txBuilder.to(destination);
      txBuilder.amount(amount);

      return await txBuilder.build();
    };

    it('should sign transaction', async function () {
      const key = new KeyPair();
      const destination = '0.0.129369';
      const source = '0.0.1234';
      const amount = '100000';

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
      txJson.to!.should.equal(destination);
      txJson.from!.should.equal(source);
      txJson.amount!.should.equal(amount);
      (txJson.instructionsData as Transfer).params.recipients[0].should.deepEqual({
        address: destination,
        amount,
      });
      signedTx.signature.length.should.equal(1);
    });
  });
});
