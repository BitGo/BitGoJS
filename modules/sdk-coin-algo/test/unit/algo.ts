import { AlgoLib, Talgo } from '../../src';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import * as AlgoResources from '../fixtures/algo';
import { randomBytes } from 'crypto';
import { coins } from '@bitgo/statics';

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

    it('should deterministically derive keypair with seed', () => {
      const derivedKeypair = basecoin.deriveKeyWithSeed({
        key: 'UBI2KNGT742KGIPHMZDJHHSADIT56HRDPVOOCCRYIETD4BAJLCBMQNSCNE',
        seed: 'cold derivation seed',
      });
      console.log(JSON.stringify(derivedKeypair));

      basecoin.isValidPub(derivedKeypair.key).should.be.true();
      derivedKeypair.should.deepEqual({
        key: 'NAYUBR4HQKJBBTNNKXQIY7GMHUCHVAUH5DQ4ZVHVL67CUQLGHRWDKQAHYU',
        derivationPath: "m/999999'/25725073'/5121434'",
      });
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
});
