import { AlgoLib, Talgo } from '../../src';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import * as AlgoResources from '../fixtures/algo';
import { randomBytes } from 'crypto';
import { coins } from '@bitgo/statics';
import Sinon, { SinonStub } from 'sinon';
import assert from 'assert';
import { Algo } from '../../src/algo';
import BigNumber from 'bignumber.js';
import { TransactionBuilderFactory } from '../../src/lib';
import { KeyPair } from '@bitgo/sdk-core';

describe('ALGO:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  const receiver = AlgoResources.accounts.account2;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('talgo', Talgo.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('talgo');
  });

  describe('Should Fail: ', () => {
    it('Does not have a txHex', async () => {
      await basecoin
        .explainTransaction({
          params: {},
        })
        .should.be.rejectedWith('missing explain tx parameters');
    });

    it('Does not have a fee', async () => {
      await basecoin
        .explainTransaction({
          params: {
            txHex: 'Some Valid Hex',
          },
        })
        .should.be.rejectedWith('missing explain tx parameters');
    });
  });

  describe('Transfer Builder: ', () => {
    const buildBaseTransferTransaction = ({ destination, amount = 10000, sender, memo = '' }) => {
      const factory = new AlgoLib.TransactionBuilderFactory(coins.get('algo'));
      const txBuilder = factory.getTransferBuilder();
      const lease = new Uint8Array(randomBytes(32));
      const note = new Uint8Array(Buffer.from(memo, 'utf-8'));
      txBuilder
        .sender({ address: sender })
        .to({ address: destination })
        .amount(amount)
        .isFlatFee(true)
        .fee({
          fee: '1000',
        })
        .firstRound(1)
        .lastRound(100)
        .lease(lease)
        .note(note)
        .testnet();
      return txBuilder;
    };

    /**
     * Build an unsigned account-lib single-signature send transaction
     * @param sender The senders address
     * @param destination The destination address of the transaction
     * @param amount The amount to send to the recipient
     * @param memo Optional note with the transaction
     */
    const buildUnsignedTransaction = async function ({ sender, destination, amount = 10000, memo = '' }) {
      const txBuilder = buildBaseTransferTransaction({ sender, destination, amount, memo });
      return await txBuilder.build();
    };

    /**
     * Build a signed account-lib single-signature send transaction
     * @param sender The senders address
     * @param destination The destination address of the transaction
     * @param amount The amount to send to the recipient
     * @param memo Optional note with the transaction
     */
    const buildSignedTransaction = async function ({ sender, destination, amount = 10000, memo = '' }) {
      const txBuilder = buildBaseTransferTransaction({ sender, destination, amount, memo });
      txBuilder.numberOfSigners(1);
      txBuilder.sign({ key: AlgoResources.accounts.account1.prvKey });
      return await txBuilder.build();
    };

    /**
     * Build a multi-signed account-lib single-signature send transaction
     * @param senders The list of senders
     * @param destination The destination address of the transaction
     * @param amount The amount to send to the recipient
     * @param memo Optional note with the transaction
     */
    const buildMultiSignedTransaction = async function ({ senders, destination, amount = 10000, memo = '' }) {
      const txBuilder = buildBaseTransferTransaction({ sender: senders[0], destination, amount, memo });
      txBuilder.numberOfSigners(2);
      txBuilder.setSigners(senders);
      txBuilder.sign({ key: AlgoResources.accounts.account1.prvKey });
      txBuilder.sign({ key: AlgoResources.accounts.account3.prvKey });
      return await txBuilder.build();
    };

    it('should explain an unsigned transfer transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.transfer.unsigned,
        feeInfo: { fee: '1000' },
      });
      explain.outputAmount.should.equal('10000');
      explain.outputs[0].amount.should.equal('10000');
      explain.outputs[0].address.should.equal(receiver.address);
      Buffer.from(explain.outputs[0].memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
    });

    it('should explain a signed transfer transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.transfer.signed,
        feeInfo: { fee: '1000' },
      });
      explain.outputAmount.should.equal('10000');
      explain.outputs[0].amount.should.equal('10000');
      explain.outputs[0].address.should.equal(receiver.address);
      Buffer.from(explain.outputs[0].memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
    });

    it('should explain a multiSig transfer transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.transfer.multiSigned,
        feeInfo: { fee: '1000' },
      });
      explain.outputAmount.should.equal('10000');
      explain.outputs[0].amount.should.equal('10000');
      explain.outputs[0].address.should.equal(receiver.address);
      Buffer.from(explain.outputs[0].memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
    });

    it('should explain a half signed transfer transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        halfSigned: {
          txHex: AlgoResources.explainRawTx.transfer.halfSigned,
        },
        feeInfo: { fee: '1000' },
      });
      explain.outputAmount.should.equal('10000');
      explain.outputs[0].amount.should.equal('10000');
      explain.outputs[0].address.should.equal(receiver.address);
      Buffer.from(explain.outputs[0].memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
    });

    it('should explain an unsigned transaction', async function () {
      const sender = AlgoResources.accounts.account1.address;
      const destination = AlgoResources.accounts.account2.address;
      const amount = 10000;
      const memo = AlgoResources.explainRawTx.transfer.note;
      const unsignedTransaction = await buildUnsignedTransaction({
        sender,
        destination,
        amount,
        memo,
      });
      const unsignedHex = Buffer.from(unsignedTransaction.toBroadcastFormat()).toString('hex');
      const explain = await basecoin.explainTransaction({
        txHex: unsignedHex,
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.outputs[0].memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.outputs[0].amount.should.equal(amount.toString());
      explain.outputs[0].address.should.equal(destination);
    });

    it('should explain a signed transaction', async function () {
      const sender = AlgoResources.accounts.account1.address;
      const destination = AlgoResources.accounts.account2.address;
      const amount = 10000;
      const memo = AlgoResources.explainRawTx.transfer.note;
      const signedTransaction = await buildSignedTransaction({
        sender,
        destination,
        amount,
        memo,
      });
      const signedHex = Buffer.from(signedTransaction.toBroadcastFormat()).toString('hex');
      const explain = await basecoin.explainTransaction({
        txHex: signedHex,
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.outputs[0].memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.outputs[0].amount.should.equal(amount.toString());
      explain.outputs[0].address.should.equal(destination);
    });

    it('should explain a multiSigned transaction', async function () {
      const senders = [AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address];
      const destination = AlgoResources.accounts.account2.address;
      const amount = 10000;
      const memo = AlgoResources.explainRawTx.transfer.note;
      const signedTransaction = await buildMultiSignedTransaction({
        senders,
        destination,
        amount,
        memo,
      });
      const signedHex = Buffer.from(signedTransaction.toBroadcastFormat()).toString('hex');
      const explain = await basecoin.explainTransaction({
        txHex: signedHex,
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.outputs[0].memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.outputs[0].amount.should.equal(amount.toString());
      explain.outputs[0].address.should.equal(destination);
    });
  });

  describe('Asset Transfer Builder: ', () => {
    const buildBaseAssetTransferTransaction = ({ destination, amount = 1000, tokenId, sender }) => {
      const factory = new AlgoLib.TransactionBuilderFactory(coins.get('algo'));
      const txBuilder = factory.getAssetTransferBuilder();
      const lease = new Uint8Array(randomBytes(32));
      txBuilder
        .sender({ address: sender })
        .isFlatFee(true)
        .fee({
          fee: '1000',
        })
        .tokenId(tokenId)
        .firstRound(1)
        .lastRound(100)
        .lease(lease)
        .to({ address: destination })
        .amount(amount)
        .testnet();
      return txBuilder;
    };

    /**
     * Build an unsigned account-lib single-signature asset transfer transaction
     * @param sender The senders address
     * @param destination The destination address of the transaction
     * @param amount The amount to send to the recipient
     * @param tokenId The assetIndex for the token
     */
    const buildUnsignedTransaction = async function ({ sender, destination, amount = 10000, tokenId }) {
      const txBuilder = buildBaseAssetTransferTransaction({ sender, destination, amount, tokenId });
      return await txBuilder.build();
    };

    /**
     * Build a signed account-lib single-signature send transaction
     * @param sender The senders address
     * @param destination The destination address of the transaction
     * @param amount The amount to send to the recipient
     * @param tokenId The assetIndex for the token
     */
    const buildSignedTransaction = async function ({ sender, destination, amount = 10000, tokenId }) {
      const txBuilder = buildBaseAssetTransferTransaction({ sender, destination, amount, tokenId });
      txBuilder.numberOfSigners(1);
      txBuilder.sign({ key: AlgoResources.accounts.account1.prvKey });
      return await txBuilder.build();
    };

    it('should explain an unsigned asset transfer transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.assetTransfer.unsigned,
        feeInfo: { fee: '1000' },
      });
      explain.outputAmount.should.equal('1000');
      explain.outputs[0].amount.should.equal('1000');
      explain.outputs[0].address.should.equal(receiver.address);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
      explain.tokenId.should.equal(1);
    });

    it('should explain a signed asset transfer transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.assetTransfer.signed,
        feeInfo: { fee: '1000' },
      });
      explain.outputAmount.should.equal('10000000000000000000');
      explain.outputs[0].amount.should.equal('10000000000000000000');
      explain.outputs[0].address.should.equal(receiver.address);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
      explain.tokenId.should.equal(1);
    });

    it('should explain an unsigned transaction', async function () {
      const sender = AlgoResources.accounts.account1.address;
      const destination = AlgoResources.accounts.account2.address;
      const amount = 10000;
      const tokenId = 1;
      const unsignedTransaction = await buildUnsignedTransaction({
        sender,
        destination,
        amount,
        tokenId,
      });
      const unsignedHex = Buffer.from(unsignedTransaction.toBroadcastFormat()).toString('hex');
      const explain = await basecoin.explainTransaction({
        txHex: unsignedHex,
        feeInfo: { fee: '1000' },
      });
      explain.outputs[0].amount.should.equal(amount.toString());
      explain.outputs[0].address.should.equal(destination);
      explain.tokenId.should.equal(1);
    });

    it('should explain a signed transaction', async function () {
      const sender = AlgoResources.accounts.account1.address;
      const destination = AlgoResources.accounts.account2.address;
      const amount = 10000;
      const tokenId = 1;
      const signedTransaction = await buildSignedTransaction({
        sender,
        destination,
        amount,
        tokenId,
      });
      const signedHex = Buffer.from(signedTransaction.toBroadcastFormat()).toString('hex');
      const explain = await basecoin.explainTransaction({
        txHex: signedHex,
        feeInfo: { fee: '1000' },
      });
      explain.outputs[0].amount.should.equal(amount.toString());
      explain.outputs[0].address.should.equal(destination);
      explain.tokenId.should.equal(1);
    });
  });

  describe('Wallet Init Builder: ', () => {
    const buildBaseKeyRegTransaction = ({ sender, memo = '' }) => {
      const factory = new AlgoLib.TransactionBuilderFactory(coins.get('algo'));
      const txBuilder = factory.getWalletInitializationBuilder();
      const lease = new Uint8Array(randomBytes(32));
      const note = new Uint8Array(Buffer.from(memo, 'utf-8'));
      txBuilder
        .sender({ address: sender.address })
        .isFlatFee(true)
        .fee({
          fee: '1000',
        })
        .firstRound(1)
        .lastRound(100)
        .lease(lease)
        .note(note)
        .voteKey(sender.voteKey)
        .selectionKey(sender.selectionKey)
        .voteFirst(1)
        .voteLast(100)
        .voteKeyDilution(9)
        .testnet();
      return txBuilder;
    };

    /**
     * Build an unsigned account-lib single-signature send transaction
     * @param sender The senders address
     * @param memo Optional note with the transaction
     */
    const buildUnsignedTransaction = async function ({ sender, memo = '' }) {
      const txBuilder = buildBaseKeyRegTransaction({ sender, memo });
      return await txBuilder.build();
    };

    /**
     * Build a signed account-lib single-signature send transaction
     * @param sender The senders address
     * @param memo Optional note with the transaction
     */
    const buildSignedTransaction = async function ({ sender, memo = '' }) {
      const txBuilder = buildBaseKeyRegTransaction({ sender, memo });
      txBuilder.numberOfSigners(1);
      txBuilder.sign({ key: AlgoResources.accounts.account1.prvKey });
      return await txBuilder.build();
    };

    /**
     * Build a multi-signed account-lib single-signature send transaction
     * @param senders The list of senders
     * @param memo Optional note with the transaction
     */
    const buildMultiSignedTransaction = async function ({ senders, memo = '' }) {
      const txBuilder = buildBaseKeyRegTransaction({ sender: senders[0], memo });
      txBuilder.numberOfSigners(2);
      txBuilder.setSigners(senders.map(({ address }) => address));
      txBuilder.sign({ key: AlgoResources.accounts.account1.prvKey });
      txBuilder.sign({ key: AlgoResources.accounts.account3.prvKey });
      return await txBuilder.build();
    };

    it('should explain an unsigned KeyReg transfer transaction hex', async function () {
      const sender = AlgoResources.accounts.account1;
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.keyreg.unsigned,
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.memo).toString().should.equal(AlgoResources.explainRawTx.keyreg.note);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
      explain.voteKey.should.equal(sender.voteKey);
      explain.selectionKey.should.equal(sender.selectionKey);
      explain.voteFirst.should.equal(1);
      explain.voteLast.should.equal(100);
      explain.voteKeyDilution.should.equal(9);
    });

    it('should explain a signed transfer transaction hex', async function () {
      const sender = AlgoResources.accounts.account1;
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.keyreg.signed,
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.memo).toString().should.equal(AlgoResources.explainRawTx.keyreg.note);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
      explain.voteKey.should.equal(sender.voteKey);
      explain.selectionKey.should.equal(sender.selectionKey);
      explain.voteFirst.should.equal(1);
      explain.voteLast.should.equal(100);
      explain.voteKeyDilution.should.equal(9);
    });

    it('should explain a multiSig transfer transaction hex', async function () {
      const sender = AlgoResources.accounts.account1;
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.keyreg.multiSigned,
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.memo).toString().should.equal(AlgoResources.explainRawTx.keyreg.note);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
      explain.voteKey.should.equal(sender.voteKey);
      explain.selectionKey.should.equal(sender.selectionKey);
      explain.voteFirst.should.equal(1);
      explain.voteLast.should.equal(100);
      explain.voteKeyDilution.should.equal(9);
    });

    it('should explain a half signed transfer transaction hex', async function () {
      const sender = AlgoResources.accounts.account1;
      const explain = await basecoin.explainTransaction({
        halfSigned: {
          txHex: AlgoResources.explainRawTx.keyreg.halfSigned,
        },
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.memo).toString().should.equal(AlgoResources.explainRawTx.keyreg.note);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
      explain.voteKey.should.equal(sender.voteKey);
      explain.selectionKey.should.equal(sender.selectionKey);
      explain.voteFirst.should.equal(1);
      explain.voteLast.should.equal(100);
      explain.voteKeyDilution.should.equal(9);
    });

    it('should explain an unsigned transaction', async function () {
      const sender = AlgoResources.accounts.account1;
      const memo = AlgoResources.explainRawTx.transfer.note;
      const unsignedTransaction = await buildUnsignedTransaction({
        sender,
        memo,
      });

      const unsignedHex = Buffer.from(unsignedTransaction.toBroadcastFormat()).toString('hex');
      const explain = await basecoin.explainTransaction({
        txHex: unsignedHex,
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.voteKey.should.equal(sender.voteKey);
      explain.selectionKey.should.equal(sender.selectionKey);
      explain.voteFirst.should.equal(1);
      explain.voteLast.should.equal(100);
      explain.voteKeyDilution.should.equal(9);
    });

    it('should explain a signed transaction', async function () {
      const sender = AlgoResources.accounts.account1;
      const memo = AlgoResources.explainRawTx.transfer.note;
      const signedTransaction = await buildSignedTransaction({
        sender,
        memo,
      });
      const signedHex = Buffer.from(signedTransaction.toBroadcastFormat()).toString('hex');
      const explain = await basecoin.explainTransaction({
        txHex: signedHex,
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.voteKey.should.equal(sender.voteKey);
      explain.selectionKey.should.equal(sender.selectionKey);
      explain.voteFirst.should.equal(1);
      explain.voteLast.should.equal(100);
      explain.voteKeyDilution.should.equal(9);
    });

    it('should explain a multiSigned transaction', async function () {
      const senders = [AlgoResources.accounts.account1, AlgoResources.accounts.account3];
      const memo = AlgoResources.explainRawTx.transfer.note;
      const signedTransaction = await buildMultiSignedTransaction({
        senders,
        memo,
      });
      const signedHex = Buffer.from(signedTransaction.toBroadcastFormat()).toString('hex');
      const explain = await basecoin.explainTransaction({
        txHex: signedHex,
        feeInfo: { fee: '1000' },
      });
      Buffer.from(explain.memo).toString().should.equal(AlgoResources.explainRawTx.transfer.note);
      explain.voteKey.should.equal(AlgoResources.accounts.account1.voteKey);
      explain.selectionKey.should.equal(AlgoResources.accounts.account1.selectionKey);
      explain.voteFirst.should.equal(1);
      explain.voteLast.should.equal(100);
      explain.voteKeyDilution.should.equal(9);
    });
  });
  describe('Sign transaction', () => {
    it('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txHex: AlgoResources.rawTx.transfer.unsigned,
          keys: [AlgoResources.accounts.account1.pubKey.toString('hex')],
          addressVersion: 1,
        },
        prv: AlgoResources.accounts.account1.prvKey,
      });
      signed.txHex.should.equal(AlgoResources.rawTx.transfer.signed);
    });

    it('should sign transaction with root key', async function () {
      const keypair = basecoin.generateRootKeyPair(AlgoResources.accounts.account1.secretKey);

      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txHex: AlgoResources.rawTx.transfer.unsigned,
          keys: [keypair.pub],
          addressVersion: 1,
        },
        prv: keypair.prv,
      });
      signed.txHex.should.equal(AlgoResources.rawTx.transfer.signed);
    });

    it('should sign half signed transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          halfSigned: {
            txHex: AlgoResources.rawTx.transfer.halfSigned,
          },
          keys: [
            AlgoResources.accounts.account1.pubKey.toString('hex'),
            AlgoResources.accounts.account3.pubKey.toString('hex'),
          ],
          addressVersion: 1,
        },
        prv: AlgoResources.accounts.account3.prvKey,
      });
      signed.txHex.should.equal(AlgoResources.rawTx.transfer.multisig);
    });

    it('should sign half signed transaction with root key', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          halfSigned: {
            txHex: AlgoResources.rootKeyData.unsignedTx,
          },
          keys: [
            AlgoResources.rootKeyData.userKeyPair.pub,
            AlgoResources.rootKeyData.backupPub,
            AlgoResources.rootKeyData.bitgoPub,
          ],
          addressVersion: 1,
        },
        prv: AlgoResources.rootKeyData.userKeyPair.prv,
      });

      signed.txHex.should.deepEqual(AlgoResources.rootKeyData.halfSignedTx);
      const factory = new TransactionBuilderFactory(coins.get('algo'));
      const tx = await factory.from(signed.txHex).build();
      const txJson = tx.toJson();
      txJson.from.should.equal(AlgoResources.rootKeyData.senderAddress);
    });

    it('should verify sign params if the key array contains addresses', function () {
      const keys = [
        AlgoResources.accounts.account1.address,
        AlgoResources.accounts.account2.address,
        AlgoResources.accounts.account3.address,
      ];

      const verifiedParams = basecoin.verifySignTransactionParams({
        txPrebuild: {
          txHex: AlgoResources.rawTx.transfer.unsigned,
          keys,
          addressVersion: 1,
        },
        prv: AlgoResources.accounts.account2.secretKey.toString('hex'),
      });
      verifiedParams.should.have.properties([
        'txHex',
        'addressVersion',
        'signers',
        'prv',
        'isHalfSigned',
        'numberSigners',
      ]);
      const { txHex, signers, isHalfSigned } = verifiedParams;
      txHex.should.be.equal(AlgoResources.rawTx.transfer.unsigned);
      signers.should.be.deepEqual(keys);
      isHalfSigned.should.be.equal(false);
    });

    it('should sign half signed transaction if the key array contains addresses', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          halfSigned: {
            txHex: AlgoResources.rawTx.transfer.halfSigned,
          },
          keys: [AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address],
          addressVersion: 1,
        },
        prv: AlgoResources.accounts.account3.prvKey,
      });
      signed.txHex.should.equal(AlgoResources.rawTx.transfer.multisig);
    });
  });

  describe('Sign message', () => {
    it('should sign message', async function () {
      const signed = await basecoin.signMessage(
        { prv: AlgoResources.accounts.account1.prvKey },
        AlgoResources.message.unsigned
      );
      signed.toString('hex').should.equal(AlgoResources.message.signed);
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

  describe('Generate wallet Root key pair: ', () => {
    it('should generate key pair', () => {
      const kp = basecoin.generateRootKeyPair();
      basecoin.isValidPub(kp.pub).should.equal(true);
      basecoin.isValidPrv(kp.prv).should.equal(true);
    });

    it('should generate key pair from seed', () => {
      const seed = Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex');
      const kp = basecoin.generateRootKeyPair(seed);
      basecoin.isValidPub(kp.pub).should.equal(true);
      kp.pub.should.equal('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a');
      basecoin.isValidPrv(kp.prv).should.equal(true);
      kp.prv.should.equal(
        '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a'
      );
    });
  });

  describe('Enable, disable and transfer Token ', () => {
    it('should explain an enable token transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.enableToken,
        feeInfo: { fee: '1000' },
      });
      explain.operations.length.should.equals(1);
      explain.operations[0].type.should.equals('enableToken');
      explain.operations[0].coin.should.equals('talgo:USON-16026728');
    });

    it('should explain an disable token transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.disableToken,
        feeInfo: { fee: '1000' },
      });
      explain.operations.length.should.equals(1);
      explain.operations[0].type.should.equals('disableToken');
      explain.operations[0].coin.should.equals('talgo:USON-16026728');
    });
    it('should explain an transfer token transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.assetTransfer.signed,
        feeInfo: { fee: '1000' },
      });
      explain.operations.length.should.equals(1);
      explain.operations[0].type.should.equals('transferToken');
      explain.operations[0].coin.should.equals('AlgoToken unknown');
    });
    it('should explain an enable USDT token transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.enableTokenUSDT,
        feeInfo: { fee: '1000' },
      });
      explain.operations.length.should.equals(1);
      explain.operations[0].type.should.equals('enableToken');
      explain.operations[0].coin.should.equals('talgo:USDt-180447');
    });
    it('should explain an enable USDC token transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.enableTokenUSDC,
        feeInfo: { fee: '1000' },
      });
      explain.operations.length.should.equals(1);
      explain.operations[0].type.should.equals('enableToken');
      explain.operations[0].coin.should.equals('talgo:USDC-10458941');
    });
    it('should explain an disable USDC token transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.disableTokenUSDC,
        feeInfo: { fee: '1000' },
      });
      explain.operations.length.should.equals(1);
      explain.operations[0].type.should.equals('disableToken');
      explain.operations[0].coin.should.equals('talgo:USDC-10458941');
    });
    it('should explain an transfer USDC token transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.USDCAssetTransfer.signed,
        feeInfo: { fee: '1000' },
      });
      explain.operations.length.should.equals(1);
      explain.operations[0].type.should.equals('transferToken');
      explain.operations[0].coin.should.equals('talgo:USDC-10458941');
    });
  });

  describe('deriveKeyWithSeed', function () {
    it('should derive key with seed', function () {
      (() => {
        basecoin.deriveKeyWithSeed('test');
      }).should.throw('method deriveKeyWithSeed not supported for eddsa curve');
    });
  });

  describe('Recovery', function () {
    const fee = 1000;
    const userKey =
      '{"iv":"ZJg0a0+zT+684MUl44Lm4A==","v":1,"iter":10000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"abQy0OL2468=","ct":"LNlSlTJED8jSwHCmUflzqFtRPL+PojzOgfd5mD2nmLVdAoyKCWHvAieKt7lJ7zg417CUi6Qj77/s3lbqmxVsfEsk"}';
    const userPub = 'S4D7DDRAHWZIB2RCZICSRODFCNQXGANHGA7VCWBK5I37SQT6KVHXQNKMTE';
    const backupKey =
      '{"iv":"mZY8XTvHxX8BPc1rdGQQww==","v":1,"iter":10000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"abQy0OL2468=","ct":"UQXo0EaPXb6TIZDYYhKYS9d/fRMNT6ptpl9BgJw3AVooSbO4nppWnTRYlQO7hpON4XY85hYDu/7hy91IX1z1bDDq"}';
    const backupPub = '6FVGZUZOHZSXTTBRLWZDXGYSWVVYNN4ZESIEMZEMIBJCUBHC5C77OIE5RQ';
    const rootAddress = 'FWLNDL7UXCSOPOQXA5VU2DMANZAYCCMBY377HKTGGMZ4GEPEJBFARDOGBA';
    const walletPassphrase = 'Testing@43210!';
    const recoveryDestination = 'GB3YETD5TSTBAIYGYHVWU3O3I7XGOB44HOZA5MOEF5M23CLLZKRQLEVAOA';
    const bitgoPub = 'FJSWLLPRBXEGMWZY5BXA6673YKIK7JOURVCQEOWXC5TQPCXCOK3VHOO2VQ';
    const nativeBalance = 10000000; // 10 ALGO
    const MIN_ACCOUNT_BALANCE = 100000; // 1 AGLO

    const nodeParams = {
      token: '2810c2d168e8417c5f111d38d68327b8cfe2d0ddc02986490c22f8ddf4128bcd',
      baseServer: 'http://localhost/',
      port: 8443,
    };

    describe('Non-BitGo', async function () {
      const sandBox = Sinon.createSandbox();
      const expectedAmount = new BigNumber(nativeBalance).minus(fee).minus(MIN_ACCOUNT_BALANCE).toString();

      afterEach(function () {
        sandBox.verifyAndRestore();
      });

      it('should build and sign the recovery tx', async function () {
        const getBalanceStub = sandBox.stub(Algo.prototype, 'getAccountBalance').resolves(nativeBalance);

        const recovery = await basecoin.recover({
          userKey,
          backupKey,
          rootAddress,
          walletPassphrase,
          fee,
          bitgoKey: bitgoPub,
          recoveryDestination: recoveryDestination,
          firstRound: 5002596,
          nodeParams,
        });

        recovery.should.not.be.undefined();
        recovery.should.have.property('id');
        recovery.should.have.property('tx');
        recovery.should.have.property('fee');
        recovery.should.have.property('coin', 'talgo');
        recovery.should.have.property('firstRound');
        recovery.should.have.property('lastRound');
        getBalanceStub.callCount.should.equal(1);
        const factory = new AlgoLib.TransactionBuilderFactory(coins.get('algo'));
        const txBuilder = factory.from(recovery.tx);
        const tx = await txBuilder.build();
        const txBroadcastFormat = Buffer.from(tx.toBroadcastFormat()).toString('base64');
        txBroadcastFormat.should.deepEqual(recovery.tx);
        const txJson = tx.toJson();
        txJson.amount.should.equal(expectedAmount);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(fee);
      });

      it('should throw for invalid rootAddress', async function () {
        const invalidRootAddress = 'randomstring';
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress: invalidRootAddress,
              walletPassphrase,
              fee,
              recoveryDestination: recoveryDestination,
              firstRound: 5002596,
              nodeParams,
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
              fee,
              recoveryDestination: invalidRecoveryDestination,
              firstRound: 5002596,
              nodeParams,
            });
          },
          { message: 'invalid recoveryDestination, got: ' + invalidRecoveryDestination }
        );
      });

      it('should throw if there is no enough balance to recover', async function () {
        const getBalanceStub = sandBox.stub(Algo.prototype, 'getAccountBalance').resolves(100500);
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress,
              fee,
              walletPassphrase,
              bitgoKey: bitgoPub,
              recoveryDestination,
              firstRound: 5003596,
              nodeParams,
            });
          },
          { message: 'Insufficient balance to recover, got balance: 100500 fee: 1000 min account balance: 100000' }
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
              fee,
              recoveryDestination,
              firstRound: 5003596,
              nodeParams,
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
              bitgoKey: bitgoPub,
              walletPassphrase: 'wrongpassword',
              fee,
              recoveryDestination,
              firstRound: 5003596,
              nodeParams,
            });
          },
          {
            message:
              "unable to decrypt userKey or backupKey with the walletPassphrase provided, got error: password error - ccm: tag doesn't match",
          }
        );
      });

      it('should throw if bitgo key is not provided', async function () {
        await assert.rejects(
          async () => {
            await basecoin.recover({
              userKey,
              backupKey,
              rootAddress,
              walletPassphrase,
              fee,
              recoveryDestination,
              firstRound: 5003596,
              nodeParams,
            });
          },
          {
            message: 'bitgo public key from the keyCard is required for non-bitgo recovery',
          }
        );
      });

      it('should be able to pass a utf-8 encoded note', async function () {
        const note = 'Non-BitGo Recovery Sweep Tx';
        sandBox.stub(Algo.prototype, 'getAccountBalance').resolves(nativeBalance);
        const recovery = await basecoin.recover({
          userKey,
          backupKey,
          rootAddress,
          walletPassphrase,
          fee,
          bitgoKey: bitgoPub,
          recoveryDestination: recoveryDestination,
          firstRound: 5002596,
          nodeParams,
          note,
        });

        recovery.should.not.be.undefined();
        recovery.note.should.be.equal(note);
      });
    });

    describe('Unsigned Sweep', function () {
      const sandBox = Sinon.createSandbox();
      const expectedAmount = new BigNumber(nativeBalance).minus(fee).minus(MIN_ACCOUNT_BALANCE).toString();
      let getBalanceStub: SinonStub;

      beforeEach(function () {
        getBalanceStub = sandBox.stub(Algo.prototype, 'getAccountBalance').resolves(nativeBalance);
      });

      afterEach(function () {
        sandBox.verifyAndRestore();
      });

      it('should build unsigned sweep tx', async function () {
        const recovery = await basecoin.recover({
          userKey: userPub,
          backupKey: backupPub,
          bitgoKey: bitgoPub,
          rootAddress,
          walletPassphrase,
          fee,
          recoveryDestination,
          firstRound: 5003596,
          nodeParams,
        });

        getBalanceStub.callCount.should.equal(1);

        recovery.should.not.be.undefined();
        recovery.should.have.property('txHex');
        recovery.should.have.property('type');
        recovery.should.have.property('amount');
        recovery.should.have.property('feeInfo');
        recovery.should.have.property('coin', 'talgo');
        recovery.firstRound.should.not.be.undefined();
        recovery.lastRound.should.not.be.undefined();
        recovery.should.have.property('keys');
        recovery.keys.should.deepEqual([userPub, backupPub, bitgoPub]);
        recovery.addressVersion.should.equal(1);

        getBalanceStub.callCount.should.equal(1);
        const factory = new AlgoLib.TransactionBuilderFactory(coins.get('algo'));
        const txBuilder = factory.from(recovery.txHex);
        const tx = await txBuilder.build();
        Buffer.from(tx.toBroadcastFormat()).toString('hex').should.deepEqual(recovery.txHex);
        const txJson = tx.toJson();
        txJson.amount.should.equal(expectedAmount);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(fee);
      });
    });

    describe('Recovery with root keys', function () {
      const sandBox = Sinon.createSandbox();
      let userKp: KeyPair;
      let backupKp: KeyPair;
      let rootAddress: string;
      let encryptedUserPrv: string;
      let encryptedBackupPrv: string;

      const expectedAmount = new BigNumber(nativeBalance).minus(fee).minus(MIN_ACCOUNT_BALANCE).toString();
      let getBalanceStub: SinonStub;

      beforeEach(function () {
        const userSeed = Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex');
        userKp = basecoin.generateRootKeyPair(userSeed);
        encryptedUserPrv = bitgo.encrypt({
          input: userKp.prv,
          password: walletPassphrase,
        });
        assert(userKp.pub);

        const backupSeed = Buffer.from('6d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex');
        backupKp = basecoin.generateRootKeyPair(backupSeed);
        encryptedBackupPrv = bitgo.encrypt({
          input: backupKp.prv,
          password: walletPassphrase,
        });
        const bitgoPub = 'FJSWLLPRBXEGMWZY5BXA6673YKIK7JOURVCQEOWXC5TQPCXCOK3VHOO2VQ';
        const userAddress = AlgoLib.algoUtils.privateKeyToAlgoAddress(userKp.prv);
        const backupAddress = AlgoLib.algoUtils.privateKeyToAlgoAddress(backupKp.prv);

        rootAddress = AlgoLib.algoUtils.multisigAddress(1, 2, [userAddress, backupAddress, bitgoPub]);
      });

      afterEach(function () {
        sandBox.verifyAndRestore();
      });

      it('should build and sign non-bitgo recovery tx with root keys', async function () {
        getBalanceStub = sandBox.stub(Algo.prototype, 'getAccountBalance').resolves(nativeBalance);
        const recovery = await basecoin.recover({
          userKey: encryptedUserPrv,
          backupKey: encryptedBackupPrv,
          rootAddress,
          walletPassphrase,
          fee,
          bitgoKey: bitgoPub,
          recoveryDestination: recoveryDestination,
          firstRound: 5002596,
          nodeParams,
        });

        recovery.should.not.be.undefined();
        recovery.should.have.property('id');
        recovery.should.have.property('tx');
        recovery.should.have.property('fee');
        recovery.should.have.property('coin', 'talgo');
        recovery.should.have.property('firstRound');
        recovery.should.have.property('lastRound');
        getBalanceStub.callCount.should.equal(1);
        const factory = new AlgoLib.TransactionBuilderFactory(coins.get('algo'));
        const txBuilder = factory.from(recovery.tx);
        const tx = await txBuilder.build();
        const txBroadcastFormat = Buffer.from(tx.toBroadcastFormat()).toString('base64');
        txBroadcastFormat.should.deepEqual(recovery.tx);
        const txJson = tx.toJson();
        txJson.amount.should.equal(expectedAmount);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(fee);
      });

      it('should build unsigned sweep tx', async function () {
        getBalanceStub = sandBox.stub(Algo.prototype, 'getAccountBalance').resolves(nativeBalance);
        const recovery = await basecoin.recover({
          userKey: userKp.pub!,
          backupKey: backupKp.pub!,
          bitgoKey: bitgoPub,
          rootAddress,
          walletPassphrase,
          fee,
          recoveryDestination,
          firstRound: 5003596,
          nodeParams,
        });

        getBalanceStub.callCount.should.equal(1);

        recovery.should.not.be.undefined();
        recovery.should.have.property('txHex');
        recovery.should.have.property('type');
        recovery.should.have.property('amount');
        recovery.should.have.property('feeInfo');
        recovery.should.have.property('coin', 'talgo');
        recovery.firstRound.should.not.be.undefined();
        recovery.lastRound.should.not.be.undefined();
        recovery.should.have.property('keys');
        recovery.keys.should.deepEqual([userKp.pub, backupKp.pub, bitgoPub]);
        recovery.addressVersion.should.equal(1);

        getBalanceStub.callCount.should.equal(1);
        const factory = new AlgoLib.TransactionBuilderFactory(coins.get('algo'));
        const txBuilder = factory.from(recovery.txHex);
        const tx = await txBuilder.build();
        Buffer.from(tx.toBroadcastFormat()).toString('hex').should.deepEqual(recovery.txHex);
        const txJson = tx.toJson();
        txJson.amount.should.equal(expectedAmount);
        txJson.to.should.equal(recoveryDestination);
        txJson.from.should.equal(rootAddress);
        txJson.fee.should.equal(fee);
      });
    });
  });
});
