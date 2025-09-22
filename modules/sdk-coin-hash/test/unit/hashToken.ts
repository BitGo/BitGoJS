import should = require('should');
import sinon from 'sinon';
import BigNumber from 'bignumber.js';
import { beforeEach } from 'mocha';

import { mockSerializedChallengeWithProofs, TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';
import { BitGoAPI } from '@bitgo-beta/sdk-api';
import { coins, NetworkType } from '@bitgo-beta/statics';
import { EcdsaRangeProof, EcdsaTypes } from '@bitgo-beta/sdk-lib-mpc';
import { CosmosTransaction, SendMessage } from '@bitgo-beta/abstract-cosmos';
import { HashToken } from '../../src';
import { HashUtils } from '../../src/lib/utils';
import { mainnetAddress, testnetAddress, wrwUser } from '../resources/hash';

describe('Hash Tokens', function () {
  let bitgo: TestBitGoAPI;
  let mainnetHashToken;
  let testnetHashToken;
  const testnetTokenName = 'thash:ylds';
  const mainnetTokenName = 'hash:ylds';
  let testnetUtils: HashUtils;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    HashToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    mainnetHashToken = bitgo.coin(mainnetTokenName);
    testnetHashToken = bitgo.coin(testnetTokenName);
    testnetUtils = new HashUtils(NetworkType.TESTNET);
  });

  it('should return constants for Hash YLDS testnet token', function () {
    testnetHashToken.getChain().should.equal(testnetTokenName);
    testnetHashToken.getBaseChain().should.equal('thash');
    testnetHashToken.getFullName().should.equal('Hash Token');
    testnetHashToken.getBaseFactor().should.equal(1e6);
    testnetHashToken.type.should.equal(testnetTokenName);
    testnetHashToken.name.should.equal('Testnet YLDS Token');
    testnetHashToken.coin.should.equal('thash');
    testnetHashToken.network.should.equal('Testnet');
    testnetHashToken.denom.should.equal('uylds.fcc');
    testnetHashToken.decimalPlaces.should.equal(6);
  });

  it('should return constants for Hash YLDS mainnet token', function () {
    mainnetHashToken.getChain().should.equal(mainnetTokenName);
    mainnetHashToken.getBaseChain().should.equal('hash');
    mainnetHashToken.getFullName().should.equal('Hash Token');
    mainnetHashToken.getBaseFactor().should.equal(1e6);
    mainnetHashToken.type.should.equal(mainnetTokenName);
    mainnetHashToken.name.should.equal('YLDS Token');
    mainnetHashToken.coin.should.equal('hash');
    mainnetHashToken.network.should.equal('Mainnet');
    mainnetHashToken.denom.should.equal('uylds.fcc');
    mainnetHashToken.decimalPlaces.should.equal(6);
  });

  it('should return denomination for YLDS token on hash using hash as coinFamily', function () {
    testnetUtils.getTokenDenomsUsingCoinFamily('hash').should.deepEqual(['uylds.fcc']);
  });

  describe('Address Validation', () => {
    it('should get address details without memoId', function () {
      const mainnetAddressDetails = mainnetHashToken.getAddressDetails(mainnetAddress.noMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.noMemoIdAddress);
      should.not.exist(mainnetAddressDetails.memoId);

      const testnetAddressDetails = testnetHashToken.getAddressDetails(testnetAddress.noMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.noMemoIdAddress);
      should.not.exist(testnetAddressDetails.memoId);
    });

    it('should get address details with memoId', function () {
      const mainnetAddressDetails = mainnetHashToken.getAddressDetails(mainnetAddress.validMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.validMemoIdAddress.split('?')[0]);
      mainnetAddressDetails.memoId.should.equal('2');

      const testnetAddressDetails = testnetHashToken.getAddressDetails(testnetAddress.validMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.validMemoIdAddress.split('?')[0]);
      testnetAddressDetails.memoId.should.equal('2');
    });

    it('should throw on multiple memo id address', () => {
      (() => {
        mainnetHashToken.getAddressDetails(mainnetAddress.multipleMemoIdAddress);
      }).should.throw();
      (() => {
        testnetHashToken.getAddressDetails(testnetAddress.multipleMemoIdAddress);
      }).should.throw();
    });

    it('should validate wallet receive address', async function () {
      const receiveAddress = {
        address: 'tp1496r8u4a48k6khknrhzd6c8cm3c64ewxy5p2rj?memoId=7',
        coinSpecific: {
          rootAddress: 'tp1496r8u4a48k6khknrhzd6c8cm3c64ewxy5p2rj',
          memoID: '7',
        },
      };
      const isValid = await testnetHashToken.isWalletAddress(receiveAddress);
      isValid.should.equal(true);
    });

    it('should validate account addresses correctly', () => {
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.address1), true);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.address2), true);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.address3), false);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.address4), false);
      should.equal(mainnetHashToken._utils.isValidAddress('dfjk35y'), false);
      should.equal(mainnetHashToken._utils.isValidAddress(undefined as unknown as string), false);
      should.equal(mainnetHashToken._utils.isValidAddress(''), false);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.validMemoIdAddress), true);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.multipleMemoIdAddress), false);

      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.address1), true);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.address2), true);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.address3), false);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.address4), false);
      should.equal(testnetHashToken._utils.isValidAddress('dfjk35y'), false);
      should.equal(testnetHashToken._utils.isValidAddress(undefined as unknown as string), false);
      should.equal(testnetHashToken._utils.isValidAddress(''), false);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.validMemoIdAddress), true);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.multipleMemoIdAddress), false);
    });

    it('should validate validator addresses correctly', () => {
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(mainnetAddress.validatorAddress1), true);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(mainnetAddress.validatorAddress2), true);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(mainnetAddress.validatorAddress3), false);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(mainnetAddress.validatorAddress4), false);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress('dfjk35y'), false);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(undefined as unknown as string), false);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(''), false);

      should.equal(testnetHashToken._utils.isValidValidatorAddress(testnetAddress.validatorAddress1), true);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(testnetAddress.validatorAddress2), true);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(testnetAddress.validatorAddress3), false);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(testnetAddress.validatorAddress4), false);
      should.equal(testnetHashToken._utils.isValidValidatorAddress('dfjk35y'), false);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(undefined as unknown as string), false);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(''), false);
    });
  });

  describe('Recover transaction: success path', () => {
    const sandBox = sinon.createSandbox();
    const destinationAddress = wrwUser.destinationAddress;
    const coin = coins.get('thash:ylds');
    const testBalance = [
      {
        denom: 'nhash',
        amount: '150000000000',
      },
      {
        denom: 'uylds.fcc',
        amount: '10000',
      },
    ];
    const testAccountNumber = '123';
    const testSequenceNumber = '0';
    const testChainId = 'test-chain';

    beforeEach(() => {
      const accountBalance = sandBox.stub(HashToken.prototype, 'getAccountBalance' as keyof HashToken);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testBalance);

      const accountDetails = sandBox.stub(HashToken.prototype, 'getAccountDetails' as keyof HashToken);
      accountDetails.withArgs(wrwUser.senderAddress).resolves([testAccountNumber, testSequenceNumber]);

      const chainId = sandBox.stub(HashToken.prototype, 'getChainId' as keyof HashToken);
      chainId.withArgs().resolves(testChainId);

      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(mockSerializedChallengeWithProofs);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);
    });

    afterEach(() => {
      sandBox.restore();
      sinon.restore();
    });

    it('should recover funds for non-bitgo recoveries', async function () {
      const res = await testnetHashToken.recover({
        userKey: wrwUser.userPrivateKey,
        backupKey: wrwUser.backupPrivateKey,
        bitgoKey: wrwUser.bitgoPublicKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destinationAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledOnce(testnetHashToken.getAccountBalance);
      sandBox.assert.calledOnce(testnetHashToken.getAccountDetails);
      sandBox.assert.calledOnce(testnetHashToken.getChainId);

      const txn = new CosmosTransaction(coin, testnetUtils);
      txn.enrichTransactionDetailsFromRawTransaction(res.serializedTx);
      const txnJson = txn.toJson();

      // The last sendMessage is of the native coin type
      const len = txnJson.sendMessages.length;
      const sendMessage = txnJson.sendMessages[len - 1].value as SendMessage;
      const tokenSendMessage = txnJson.sendMessages[0].value as SendMessage;
      const balance = new BigNumber(testBalance[0].amount);
      const gasAmount = new BigNumber(5000000000);
      const actualBalance = balance.minus(gasAmount);
      should.equal(sendMessage.toAddress, destinationAddress);
      should.equal(sendMessage.amount[0].amount, actualBalance.toFixed());
      should.equal(sendMessage.amount[0].denom, testBalance[0].denom);
      should.equal(tokenSendMessage.toAddress, destinationAddress);
      should.equal(tokenSendMessage.amount[0].amount, testBalance[1].amount);
      should.equal(tokenSendMessage.amount[0].denom, testBalance[1].denom);
    });

    it('should recover funds for Unsigned Sweep Transaction', async function () {
      const res = await testnetHashToken.recover({
        userKey: wrwUser.userPrivateKey,
        backupKey: wrwUser.backupPrivateKey,
        bitgoKey: wrwUser.bitgoPublicKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destinationAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledOnce(testnetHashToken.getAccountBalance);
      sandBox.assert.calledOnce(testnetHashToken.getAccountDetails);
      sandBox.assert.calledOnce(testnetHashToken.getChainId);

      const unsignedSweepTxnDeserialize = new CosmosTransaction(coin, testnetUtils);
      unsignedSweepTxnDeserialize.enrichTransactionDetailsFromRawTransaction(res.serializedTx);
      const unsignedSweepTxnJson = unsignedSweepTxnDeserialize.toJson();

      // The last sendMessage is of the native coin type
      const len = unsignedSweepTxnJson.sendMessages.length;
      const sendMessage = unsignedSweepTxnJson.sendMessages[len - 1].value as SendMessage;
      const tokenSendMessage = unsignedSweepTxnJson.sendMessages[0].value as SendMessage;
      const balance = new BigNumber(testBalance[0].amount);
      const gasAmount = new BigNumber(5000000000);
      const actualBalance = balance.minus(gasAmount);
      should.equal(sendMessage.toAddress, destinationAddress);
      should.equal(sendMessage.amount[0].amount, actualBalance.toFixed());
      should.equal(sendMessage.amount[0].denom, testBalance[0].denom);
      should.equal(tokenSendMessage.toAddress, destinationAddress);
      should.equal(tokenSendMessage.amount[0].amount, testBalance[1].amount);
      should.equal(tokenSendMessage.amount[0].denom, testBalance[1].denom);
    });
  });

  describe('Recover transaction: failure path', () => {
    const sandBox = sinon.createSandbox();
    const destinationAddress = wrwUser.destinationAddress;
    const testZeroBalance = [
      {
        denom: 'nhash',
        amount: '0',
      },
      {
        denom: 'uylds.fcc',
        amount: '1000',
      },
    ];
    const testAccountNumber = '123';
    const testSequenceNumber = '0';
    const testChainId = 'test-chain';

    beforeEach(() => {
      const accountBalance = sandBox.stub(HashToken.prototype, 'getAccountBalance' as keyof HashToken);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testZeroBalance);

      const accountDetails = sandBox.stub(HashToken.prototype, 'getAccountDetails' as keyof HashToken);
      accountDetails.withArgs(wrwUser.senderAddress).resolves([testAccountNumber, testSequenceNumber]);

      const chainId = sandBox.stub(HashToken.prototype, 'getChainId' as keyof HashToken);
      chainId.withArgs().resolves(testChainId);

      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(mockSerializedChallengeWithProofs);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);
    });

    afterEach(() => {
      sandBox.restore();
      sinon.restore();
    });

    it('should throw error if backupkey is not present', async function () {
      await testnetHashToken
        .recover({
          userKey: wrwUser.userPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing backupKey');
    });

    it('should throw error if userkey is not present', async function () {
      await testnetHashToken
        .recover({
          backupKey: wrwUser.backupPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing userKey');
    });

    it('should throw error if wallet passphrase is not present', async function () {
      await testnetHashToken
        .recover({
          userKey: wrwUser.userPrivateKey,
          backupKey: wrwUser.backupPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing wallet passphrase');
    });

    it('should throw error if there is no balance', async function () {
      await testnetHashToken
        .recover({
          userKey: wrwUser.userPrivateKey,
          backupKey: wrwUser.backupPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('Did not have enough funds to recover');
    });
  });
});
