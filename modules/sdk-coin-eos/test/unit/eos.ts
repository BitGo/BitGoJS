/**
 * @prettier
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { bip32 } from '@bitgo/utxo-lib';
import * as ecc from 'eosjs-ecc';
import * as _ from 'lodash';
import should from 'should';
import * as sinon from 'sinon';
import { Eos, Teos } from '../../src';
import { EosInputs, EosResponses } from '../fixtures';
import assert from 'assert';

describe('EOS:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('eos', Eos.createInstance);
    bitgo.safeRegister('teos', Teos.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('teos');
  });

  it('should get address details', function () {
    let addressDetails = basecoin.getAddressDetails('i1skda3kso43');

    addressDetails.address.should.equal('i1skda3kso43');
    should(addressDetails.memoId).be.undefined();

    addressDetails = basecoin.getAddressDetails('ks13k3hdui24?memoId=1');
    addressDetails.address.should.equal('ks13k3hdui24');
    addressDetails.memoId.should.equal('1');

    (() => {
      basecoin.getAddressDetails('ks13k3hdui24?memoId=1&memoId=2');
    }).should.throw();
  });

  it('should get address details with alphanumeric memoid', function () {
    const addressDetails = basecoin.getAddressDetails('i1skda3kso43?memoId=123abc');

    addressDetails.address.should.equal('i1skda3kso43');
    addressDetails.memoId.should.equal('123abc');
  });

  it('should validate address', function () {
    basecoin.isValidAddress('i1skda3kso43').should.equal(true);
    basecoin.isValidAddress('ks13kdh245ls').should.equal(true);
    basecoin.isValidAddress('ks13k3hdui24?memoId=1').should.equal(true);
    basecoin.isValidAddress('ks13k3hdui24?memoId=x').should.equal(true);
  });

  it('verifyAddress should work', async function () {
    await basecoin.verifyAddress({
      address: 'i1skda3kso43',
      rootAddress: 'i1skda3kso43',
    });
    await basecoin.verifyAddress({
      address: 'ks13kdh245ls?memoId=1',
      rootAddress: 'ks13kdh245ls',
    });

    assert.rejects(basecoin.verifyAddress({ address: 'i1skda3kso43=x', rootAddress: 'i1skda3kso43' }));
    assert.rejects(basecoin.verifyAddress({ address: 'i1skda3kso43?memoId=243432', rootAddress: 'ks13kdh245ls' }));
    assert.rejects(basecoin.verifyAddress({ address: 'i1skda3kso43' }));
  });

  it('should generate valid random addresses', () => {
    for (let i = 0; i < 100; i++) {
      const address = basecoin.generateRandomAddress();
      basecoin.isValidAddress(address).should.be.true();
    }
  });

  it('isValidMemo should work', function () {
    basecoin.isValidMemo({ value: '1' }).should.equal(true);
    basecoin.isValidMemo({ value: 'uno' }).should.equal(true);
    basecoin.isValidMemo({ value: EosInputs.string257CharsLong }).should.equal(false);
  });

  it('isValidMemoId should work', function () {
    basecoin.isValidMemoId('1').should.equal(true);
    basecoin.isValidMemoId('123abc').should.equal(true);
    basecoin.isValidMemoId(EosInputs.string257CharsLong).should.equal(false);
  });

  it('should validate pub key', () => {
    const { pub } = basecoin.keychains().create();
    basecoin.isValidPub(pub).should.equal(true);
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
      basecoin.isValidPrv(keyPair.prv).should.equal(true);
    });

    it('should generate a keypair from seed', function () {
      const seed = Buffer.from('c3b09c24731be2851b641d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.pub.should.equal(
        'xpub661MyMwAqRbcF2SUqUMiqxWGwaVX6sH4okTtX8jxJ1A14wfL8W7jZEoNE537JqSESXFpTcXCZahPz7RKQLpAEGsVp233dc5CffLSecpU13X'
      );
      keyPair.prv.should.equal(
        'xprv9s21ZrQH143K2YN1jSpiUpZYPYf2hQZDSXYHikLLjfd2C9LBaxoV1SUtNnZGnXeyJ6uFWMbQTfjXqVfgNqRBw5yyaCtBK1AM8PF3XZtKjQp'
      );
    });
  });

  it('should create unsigned recovery transaction without Bitgo', async function () {
    const userKey =
      'xpub661MyMwAqRbcH1oUADxatLuKkVjaDB2zTNJoZQsGVQEvoogpbXJw24QMokNwFKj9Qhci6KWaCcQKrzpL4LCQXXX3YpTQxgD9KLBjhDrUWo4';
    const backupKey =
      'xpub661MyMwAqRbcH1n6sgY29G7dAxL7twS8rt1jyuuQb1kfnA7s3FJPGoVqb9JenXkeJmC4jZ8iVscn3AH6MkYAVc61FTYCHpxv5cxWar5Jw3C';
    const rootAddress = 'i1skda3kso43';
    const destinationAddress = 'ks13kdh245ls';

    // mock responses to the block chain
    const sandBox = sinon.createSandbox();
    const callBack = sandBox.stub(Eos.prototype, <any>'getDataFromNode');
    callBack
      .withArgs({
        endpoint: '/v1/chain/get_account',
        payload: { account_name: rootAddress },
      })
      .resolves(EosResponses.getAccountResponseSuccess1);
    callBack
      .withArgs({
        endpoint: '/v1/chain/get_account',
        payload: { account_name: destinationAddress },
      })
      .resolves(EosResponses.getAccountResponseSuccess2);
    callBack
      .withArgs({
        endpoint: '/v1/chain/get_info',
      })
      .resolves(EosResponses.getInfoResponseSuccess1);
    callBack
      .withArgs({
        endpoint: '/v1/chain/get_block',
        payload: { block_num_or_id: 191839472 },
      })
      .resolves(EosResponses.getBlockResponseSuccess1);

    // can create unsigned recovery transaction
    const unsignedRecoveryTransaction = await basecoin.recover({
      userKey,
      backupKey,
      bitgoKey: 'key',
      recoveryDestination: destinationAddress,
      rootAddress,
    });
    unsignedRecoveryTransaction.recoveryAmount.should.equal('5.0000');
    unsignedRecoveryTransaction.transaction.signatures.length.should.equal(0);

    // coin and txHex fields are expected during recovery of unsigned transaction using OVC
    unsignedRecoveryTransaction.coin.should.equal('teos');
    unsignedRecoveryTransaction.txHex.should.equal(
      '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a9107468408cdcdb60f03cf4a9e53c000000000100a6823403ea3055000000572d3ccdcd013008c5709804717000000000a8ed3232213008c57098047170806321a22538028650c300000000000004454f530000000000000000000000000000000000000000000000000000000000000000000000000000'
    );

    // destination address and root address can include memoId
    const unsignedRecoveryTransaction2 = await basecoin.recover({
      userKey,
      backupKey,
      bitgoKey: 'key',
      recoveryDestination: `${destinationAddress}?memoId=0`,
      rootAddress: `${rootAddress}?memoId=0`,
    });
    unsignedRecoveryTransaction2.recoveryAmount.should.equal('5.0000');
    unsignedRecoveryTransaction2.transaction.signatures.length.should.equal(0);

    // coin and txHex fields are expected during recovery of unsigned transaction using OVC
    unsignedRecoveryTransaction.coin.should.equal('teos');
    unsignedRecoveryTransaction.txHex.should.equal(
      '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a9107468408cdcdb60f03cf4a9e53c000000000100a6823403ea3055000000572d3ccdcd013008c5709804717000000000a8ed3232213008c57098047170806321a22538028650c300000000000004454f530000000000000000000000000000000000000000000000000000000000000000000000000000'
    );

    sandBox.restore();
  });

  describe('Transactions:', function () {
    const testExplainTransaction = (input, expectedOutput) =>
      async function () {
        const explainedTransaction = await basecoin.explainTransaction(input);
        should.exist(explainedTransaction);
        explainedTransaction.should.deepEqual(expectedOutput);
      };
    it('should generate a valid transaction signature', async function () {
      const signatureData = 'abcd';
      const tx = {
        txHex: signatureData,
        headers: {
          ref_block_num: 1,
          ref_block_prefix: 'asd',
        },
        transaction: {
          signatures: [],
          packed_trx: signatureData,
          compression: 'none',
        },
        recipients: [{}],
      };

      const seed = Buffer.from('c3b09c24731be2851b624d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      const { halfSigned } = await basecoin.signTransaction({ txPrebuild: tx, prv: keyPair.prv });
      const signature = halfSigned.transaction.signatures[0];
      const hdNode = bip32.fromBase58(keyPair.pub);
      const eosPubkey = ecc.PublicKey.fromBuffer(hdNode.publicKey).toString();
      ecc.verify(signature, Buffer.from(signatureData, 'hex'), eosPubkey).should.eql(true);
    });

    it('should explain an EOS transaction', async function () {
      const explainTransactionParams = {
        headers: {
          ref_block_prefix: 100,
          ref_block_num: 995,
          expiration: '2018-04-27T18:40:34.000Z',
        },
        transaction: {
          packed_trx:
            'a26ee35ae30364000000000000000100a6823403ea3055000000572d3ccdcd019013e48c8ce5eed400000000a8ed3232229013e48c8ce5eed4b012362b61b31236640000000000000004454f5300000000013100',
        },
      };

      const explainedTx = await basecoin.explainTransaction(explainTransactionParams);
      explainedTx.outputAmount.should.equal('100');
      explainedTx.outputs.length.should.equal(1);
      explainedTx.outputs[0].amount.should.equal('100');
      explainedTx.outputs[0].address.should.equal('asdfasdfasdf');
      explainedTx.id.should.equal('6132f3bf4a746e6ecad8a31df67d71b4741fc5b7c868ae36dde18309a91df8a6');
      explainedTx.memo.should.equal('1');
    });
    it(
      'explains EOS native transfer transaction',
      testExplainTransaction(EosInputs.explainTransactionInputNative, EosResponses.explainTransactionOutputNative)
    );
    it(
      'explains CHEX token transfer transaction',
      testExplainTransaction(EosInputs.explainTransactionInputChex, EosResponses.explainTransactionOutputChex)
    );
    it(
      'explain EOS Unstake1 transaction',
      testExplainTransaction(EosInputs.explainUnstakeInput1, EosResponses.explainUnstakeOutput1)
    );
    it(
      'explain EOS Unstake2 transaction',
      testExplainTransaction(EosInputs.explainUnstakeInput2, EosResponses.explainUnstakeOutput2)
    );
    it(
      'explain EOS Refund transaction',
      testExplainTransaction(EosInputs.explainRefundInput, EosResponses.explainRefundOutput)
    );
  });

  describe('Transaction Verification', function () {
    let wallet;
    let basecoin;
    let verification;
    let sandBox;
    let newTxPrebuild;
    let newTxParams;

    before(async () => {
      basecoin = bitgo.coin('teos');
      const walletData = {
        id: '5a78dd561c6258a907f1eeaee132f796',
        users: [
          {
            user: '543c11ed356d00cb7600000b98794503',
            permissions: ['admin', 'view', 'spend'],
          },
        ],
        coin: 'teos',
        label: 'Verification Wallet',
        m: 2,
        n: 3,
        keys: [
          '5a78dd56bfe424aa07aa068651b194fd',
          '5a78dd5674a70eb4079f58797dfe2f5e',
          '5a78dd561c6258a907f1eea9f1d079e2',
        ],
        tags: ['5a78dd561c6258a907f1eeaee132f796'],
        disableTransactionNotifications: false,
        freeze: {},
        deleted: false,
        approvalsRequired: 1,
        isCold: true,
        coinSpecific: {},
        clientFlags: [],
        balance: 650000000,
        confirmedBalance: 650000000,
        spendableBalance: 650000000,
        balanceString: '650000000',
        confirmedBalanceString: '650000000',
        spendableBalanceString: '650000000',
        receiveAddress: {
          id: '5a78de2bbfe424aa07aa131ec03c8dc1',
          address: '78xczhaijyhek2',
          chain: 0,
          index: 0,
          coin: 'teos',
          wallet: '5a78dd561c6258a907f1eeaee132f796',
          coinSpecific: {},
        },
        pendingApprovals: [],
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
      const userKeychain = {
        prv: '5KJq565HTrgEJG9EbvJH5BLYTgioAyY27dT9am1kCtn2YVAJEYK',
        pub: 'EOS6g7AAMQkhXp8j73E8BD4KRwtQevEsFgYx8htaQkRVhhXJMgkMZ',
      };
      const backupKeychain = {
        prv: '5KZ1nXXCi5yXH8AjCJqjnCYHCVnhQa9YWGV2D14i8g221dxNwLW',
        pub: 'EOS7gyDLNk12faVb1aqNxj1L2DpBerFkhAsxBs95yW3yxJpqvg9Mt',
      };
      const txPrebuild = {
        recipients: [
          {
            address: 'lionteste212',
            amount: '1000',
          },
        ],
        headers: {
          expiration: '2021-10-28T02:34:05.848',
          ref_block_num: 42915,
          ref_block_prefix: 1204086709,
        },
        txHex:
          '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a9107468401e0c7a61a3a7b5e7c4470000000100408c7a02ea3055000000000085269d00030233330100a6823403ea3055000000572d3ccdcd0120ceb8437333427c00000000a8ed32322220ceb8437333427c20825019ab3ca98be80300000000000004454f53000000000131000000000000000000000000000000000000000000000000000000000000000000',
        transaction: {
          compression: 'none',
          packed_trx:
            '1e0c7a61a3a7b5e7c4470000000100408c7a02ea3055000000000085269d00030233330100a6823403ea3055000000572d3ccdcd0120ceb8437333427c00000000a8ed32322220ceb8437333427c20825019ab3ca98be80300000000000004454f5300000000013100',
          signatures: [],
        },
        txid: '586c5b59b10b134d04c16ac1b273fe3c5529f34aef75db4456cd469c5cdac7e2',
        isVotingTransaction: false,
        coin: 'teos',
      };
      verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub },
        },
      };
      const seed = Buffer.from('c3b09c24731be2851b624d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      const txParams = {
        txPrebuild,
        prv: keyPair.prv,
        recipients: [
          {
            address: 'lionteste212?memoId=1',
            amount: '1000',
          },
        ],
      };

      newTxPrebuild = () => {
        return _.cloneDeep(txPrebuild);
      };
      newTxParams = () => {
        return _.cloneDeep(txParams);
      };
    });

    beforeEach(async () => {
      // mock responses to the block chain
      sandBox = sinon.createSandbox();
      const callBack = sandBox.stub(Eos.prototype, <any>'getDataFromNode');
      callBack
        .withArgs({
          endpoint: '/v1/chain/get_info',
        })
        .resolves(EosResponses.getInfoResponseSuccess1);
      callBack
        .withArgs({
          endpoint: '/v1/chain/get_block',
          payload: { block_num_or_id: 191839472 },
        })
        .resolves(EosResponses.getBlockResponseSuccess1);
    });

    afterEach(async () => {
      sandBox.restore();
    });

    it('should verify a transaction', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      validTransaction.should.equal(true);
    });

    it('should verify a transaction without a memoId', async function () {
      const txPrebuild = newTxPrebuild();

      // txParams with different txPrebuild
      const txPrebuild2 = newTxPrebuild();
      txPrebuild2.recipients[0].address = 'lionteste212';
      const txParams = newTxParams();
      txParams.txPrebuild = txPrebuild2;

      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      validTransaction.should.equal(true);
    });

    it('should throw if different prebuilds are provided in txParams and txPrebuild', async function () {
      const txPrebuild = newTxPrebuild();

      // txParams with different txPrebuild
      const txPrebuild2 = newTxPrebuild();
      txPrebuild2.recipients[0].address = 'sadjghaslsdgo';
      const txParams = newTxParams();
      txParams.txPrebuild = txPrebuild2;

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('inputs txParams.txPrebuild and txPrebuild expected to be equal but were not');
    });

    it('should throw if unpacked txHex is not the same as the unpacked packed_trx', async function () {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex =
        'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf9111111111111111111111111111111111640000000000000100408c7a02ea3055000000000085269d000201310100a6823403ea3055000000572d3ccdcd01d0f9ce64f437f7cf00000000a8ed323222d0f9ce64f437f7cfb012362b61b31236640000000000000004454f53000000000131000000000000000000000000000000000000000000000000000000000000000000';
      const txParams = newTxParams();
      txParams.txPrebuild = txPrebuild;
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('unpacked packed_trx and unpacked txHex are not equal');
    });

    it('should throw if the expected amount is different than actual amount', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].amount = 10000;
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('txHex receive amount does not match expected recipient amount');
    });

    it('should throw if the expected recipient is different than actual recipient', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].address = 'aaaaaaaaaaaa';
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('txHex receive address does not match expected recipient address');
    });

    it('should throw if the expected memo is different than actual memo', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].address = 'lionteste212?memoId=10';
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('txHex receive memoId does not match expected recipient memoId');
    });

    it('should verify transaction with memo id in params only', async function () {
      const txPrebuild = newTxPrebuild();

      txPrebuild.headers = {
        expiration: '2021-11-08T17:24:47.792',
        ref_block_num: 1,
        ref_block_prefix: 100,
      };
      // has memoid in the txaction with value of '1'
      txPrebuild.txHex =
        'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473605d89610100640000000000000100408c7a02ea3055000000000085269d000201300100a6823403ea3055000000572d3ccdcd01001dd9f9a000a53d00000000a8ed323222001dd9f9a000a53d20825019ab3ca98be80300000000000004454f53000000000131000000000000000000000000000000000000000000000000000000000000000000';
      txPrebuild.transaction.packed_trx =
        '605d89610100640000000000000100408c7a02ea3055000000000085269d000201300100a6823403ea3055000000572d3ccdcd01001dd9f9a000a53d00000000a8ed323222001dd9f9a000a53d20825019ab3ca98be80300000000000004454f5300000000013100';
      const txParams = newTxParams();
      txParams.recipients[0].address = 'lionteste212';
      txParams.txPrebuild = txPrebuild;

      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      validTransaction.should.equal(true);
    });

    it('should verify transaction with alpha numeric memo id params', async function () {
      const txPrebuild = newTxPrebuild();

      txPrebuild.headers = {
        expiration: '2021-11-08T17:55:17.518',
        ref_block_num: 1,
        ref_block_prefix: 100,
      };
      // has memoid in the txaction with value of 'QG73WAXXG'
      txPrebuild.txHex =
        'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473866489610100640000000000000100408c7a02ea3055000000000085269d000201300100a6823403ea3055000000572d3ccdcd013085b943b1b54ed700000000a8ed32322a3085b943b1b54ed720825019ab3ca98be80300000000000004454f530000000009514737335741585847000000000000000000000000000000000000000000000000000000000000000000';
      txPrebuild.transaction.packed_trx =
        '866489610100640000000000000100408c7a02ea3055000000000085269d000201300100a6823403ea3055000000572d3ccdcd013085b943b1b54ed700000000a8ed32322a3085b943b1b54ed720825019ab3ca98be80300000000000004454f53000000000951473733574158584700';
      const txParams = newTxParams();
      txParams.recipients[0].address = 'lionteste212';
      txParams.txPrebuild = txPrebuild;

      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      validTransaction.should.equal(true);
    });
  });
});
