import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import utils from '../../src/lib/utils';
import { getBuilderFactory } from './getBuilderFactory';

import { Icp, Ticp } from '../../src/index';
import nock from 'nock';
import * as testData from '../resources/icp';
import assert from 'assert';
import should from 'should';
nock.enableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('icp', Icp.createInstance);

describe('Internet computer', function () {
  let bitgo;
  let basecoin;
  const factory = getBuilderFactory('icp');
  let txBuilder: any;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('icp', Icp.createInstance);
    bitgo.safeRegister('ticp', Ticp.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('icp');

    txBuilder = factory.getTransferBuilder();
    txBuilder.sender(testData.Accounts.account1.address, testData.Accounts.account1.publicKey);
    txBuilder.receiverId(testData.Accounts.account2.address);
    txBuilder.amount('10');
    txBuilder.memo(testData.MetaDataWithMemo.memo);

    await txBuilder.build();
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
    nock.cleanAll();
  });

  it('should return the right info', function () {
    const icp = bitgo.coin('icp');
    const ticp = bitgo.coin('ticp');

    icp.getChain().should.equal('icp');
    icp.getFamily().should.equal('icp');
    icp.getFullName().should.equal('Internet Computer');
    icp.getBaseFactor().should.equal(1e8);
    icp.supportsTss().should.equal(true);

    ticp.getChain().should.equal('ticp');
    ticp.getFamily().should.equal('icp');
    ticp.getFullName().should.equal('Testnet Internet Computer');
    ticp.getBaseFactor().should.equal(1e8);
    icp.supportsTss().should.equal(true);
  });

  describe('Address creation', () => {
    const hexEncodedPublicKey =
      '047a83e378053f87b49aeae53b3ed274c8b2ffbe59d9a51e3c4d850ca8ac1684f7131b778317c0db04de661c7d08321d60c0507868af41fe3150d21b3c6c757367';
    const hexEncodedPublicKey2 = '02ad010ce68b75266c723bf25fbe3a0c48eb29f14b25925b06b7f5026a0f12702e';
    const invalidPublicKey = 'invalid-public-key';
    const validAccountID = '8b84c3a3529d02a9decb5b1a27e7c8d886e17e07ea0a538269697ef09c2a27b4';
    const validAccountID2 = '2b9b89604362e185544c8bba76cadff1a3af26e1467e8530d13743a08a52dd7b';

    it('should return true when validating a hex encoded public key', function () {
      basecoin.isValidPub(hexEncodedPublicKey).should.equal(true);
    });

    it('should return true when validating a hex encoded public key with 33 bytes ', function () {
      basecoin.isValidPub(hexEncodedPublicKey2).should.equal(true);
    });

    it('should return false when validating a invalid public key', function () {
      basecoin.isValidPub(invalidPublicKey).should.equal(false);
    });

    it('should return valid address from a valid hex encoded public key', async function () {
      const accountID = await basecoin.getAddressFromPublicKey(hexEncodedPublicKey);
      accountID.should.deepEqual(validAccountID);
    });

    it('should return valid address from a valid hex encoded public key with 33 bytes', async function () {
      const accountID = await basecoin.getAddressFromPublicKey(hexEncodedPublicKey2);
      accountID.should.deepEqual(validAccountID2);
    });

    it('should throw an error when invalid public key is provided', function () {
      (() => basecoin.getAddressFromPublicKey(invalidPublicKey)).should.throw('Invalid hex-encoded public key format.');
    });

    it('should return valid address from a valid hex encoded public key', function () {
      const accountID = utils.getAddressFromPublicKey(hexEncodedPublicKey);
      accountID.should.deepEqual(validAccountID);
    });

    it('should throw an error when invalid public key is provided', function () {
      (() => utils.getAddressFromPublicKey(invalidPublicKey)).should.throw('Invalid hex-encoded public key format.');
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

  describe('Sign a raw txn with a private key', () => {
    it('should sign a raw txn with a private key', async () => {
      const unsignedTxn = txBuilder.transaction.unsignedTransaction;
      unsignedTxn.should.be.a.String();
      const payloadsData = txBuilder.transaction.payloadsData;
      const serializedTxFormat = {
        serializedTxHex: payloadsData,
        publicKey: testData.Accounts.account1.publicKey,
      };
      const serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
      const signedTxn = await basecoin.signTransaction({
        txPrebuild: {
          txHex: serializedTxHex,
        },
        prv: testData.Accounts.account1.secretKey,
      });
      signedTxn.should.be.a.string;
      const parsedTransaction = await factory.parseTransaction(signedTxn.txHex, true);
      should.equal(parsedTransaction.operations[0].account.address, testData.Accounts.account1.address);
      should.equal(parsedTransaction.operations[1].account.address, testData.Accounts.account2.address);
      should.equal(parsedTransaction.operations[2].account.address, testData.Accounts.account1.address);
      should.equal(parsedTransaction.operations[0].amount.value, '-10');
      should.equal(parsedTransaction.account_identifier_signers[0].address, testData.Accounts.account1.address);
    });
  });

  describe('Verify a transaction', () => {
    it('should successfully verify a transaction with signable Hex', async () => {
      const unsignedTxn = txBuilder.transaction.unsignedTransaction;
      unsignedTxn.should.be.a.String();
      const payloadsData = txBuilder.transaction.payloadsData;
      const serializedTxFormat = {
        serializedTxHex: payloadsData,
        publicKey: testData.Accounts.account1.publicKey,
      };
      const signableHex = payloadsData.payloads[0].hex_bytes;
      const serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
      const txParams = {
        recipients: [
          {
            address: testData.Accounts.account2.address,
            amount: '10',
          },
        ],
      };
      const response = await basecoin.verifyTransaction({
        txPrebuild: {
          txHex: serializedTxHex,
          txInfo: signableHex,
        },
        txParams: txParams,
      });
      assert(response);
    });

    it('should successfully verify a transaction without signable Hex', async () => {
      const unsignedTxn = txBuilder.transaction.unsignedTransaction;
      unsignedTxn.should.be.a.String();
      const payloadsData = txBuilder.transaction.payloadsData;
      const serializedTxFormat = {
        serializedTxHex: payloadsData,
        publicKey: testData.Accounts.account1.publicKey,
      };
      const serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
      const txParams = {
        recipients: [
          {
            address: testData.Accounts.account2.address,
            amount: '10',
          },
        ],
      };
      const response = await basecoin.verifyTransaction({
        txPrebuild: {
          txHex: serializedTxHex,
        },
        txParams: txParams,
      });
      assert(response);
    });

    it('should fail to verify a transaction with wrong signable Hex', async () => {
      const unsignedTxn = txBuilder.transaction.unsignedTransaction;
      unsignedTxn.should.be.a.String();
      const payloadsData = txBuilder.transaction.payloadsData;
      const serializedTxFormat = {
        serializedTxHex: payloadsData,
        publicKey: testData.Accounts.account1.publicKey,
      };
      const serializedTxHex = Buffer.from(JSON.stringify(serializedTxFormat), 'utf-8').toString('hex');
      const txParams = {
        recipients: [
          {
            address: testData.Accounts.account2.address,
            amount: '10',
          },
        ],
      };

      const wrongSignableHexValues =
        '0a69632d72657175657374523de3c7c5b4613155b74ede2e54493f6acbe8bf6d910154fbbb3a98ba3e0098';

      await basecoin
        .verifyTransaction({
          txPrebuild: {
            txHex: serializedTxHex,
            txInfo: wrongSignableHexValues,
          },
          txParams: txParams,
        })
        .should.rejectedWith('generated signableHex is not equal to params.signableHex');
    });
  });

  describe('Address Verification', () => {
    const addressVerificationData = {
      commonKeychain:
        '036b38ca5e63e9800b5040af498eb6e9a9c77e244ac2858edafa4bd0926a635731c3fabde9007a5771e93621d9fcb1c879660208dc79cc609fe8ddd189f7a955ab',
      rootAddress: 'fd3eaed3e2064bd30ab497e22e8ac5a0dcadd81fa5353879dbab64e259ec70c0',
    };

    describe('Wallet VersionKey 1', () => {
      let keychains;

      before(function () {
        keychains = [
          { commonKeychain: addressVerificationData.commonKeychain },
          { commonKeychain: addressVerificationData.commonKeychain },
          { commonKeychain: addressVerificationData.commonKeychain },
        ];
      });

      it('should verify a valid memo-based address', async function () {
        const rootAddress = addressVerificationData.rootAddress;
        const addressWithMemo = `${rootAddress}?memoId=123`;

        const params = {
          address: addressWithMemo,
          rootAddress: rootAddress,
          walletVersion: 1,
          keychains: keychains,
          index: 0,
        };

        const result = await basecoin.isWalletAddress(params);
        result.should.equal(true);
      });

      it('should verify address with memoId=0', async function () {
        const rootAddress = addressVerificationData.rootAddress;
        const addressWithMemo = `${rootAddress}?memoId=0`;

        const params = {
          address: addressWithMemo,
          rootAddress: rootAddress,
          walletVersion: 1,
          keychains: keychains,
          index: 0,
        };

        const result = await basecoin.isWalletAddress(params);
        result.should.equal(true);
      });

      it('should fail when extracted root does not match provided rootAddress param', async function () {
        const rootAddress = addressVerificationData.rootAddress;
        const differentAddress = testData.Accounts.account2.address;
        const addressWithMemo = `${differentAddress}?memoId=123`;

        const params = {
          address: addressWithMemo,
          rootAddress: rootAddress,
          walletVersion: 1,
          keychains: keychains,
          index: 0,
        };

        // The extracted root (differentAddress) doesn't match provided rootAddress
        await basecoin
          .isWalletAddress(params)
          .should.be.rejectedWith(`address validation failure: expected ${rootAddress} but got ${differentAddress}`);
      });

      it('should throw error when rootAddress is missing for wallet version 1', async function () {
        const address = `${addressVerificationData.rootAddress}?memoId=123`;

        const params = {
          address: address,
          walletVersion: 1,
          keychains: keychains,
          index: 0,
        };

        await basecoin.isWalletAddress(params).should.be.rejectedWith('rootAddress is required for wallet version 1');
      });

      it('should throw error when memoId is missing for wallet version 1', async function () {
        const rootAddress = addressVerificationData.rootAddress;

        const params = {
          address: rootAddress,
          rootAddress: rootAddress,
          walletVersion: 1,
          keychains: keychains,
          index: 0,
        };

        await basecoin
          .isWalletAddress(params)
          .should.be.rejectedWith('memoId is required for wallet version 1 addresses');
      });

      it('should handle large memoId values', async function () {
        const rootAddress = addressVerificationData.rootAddress;
        const largeMemoId = '9007199254740991';
        const addressWithMemo = `${rootAddress}?memoId=${largeMemoId}`;

        const params = {
          address: addressWithMemo,
          rootAddress: rootAddress,
          walletVersion: 1,
          keychains: keychains,
          index: 0,
        };

        const result = await basecoin.isWalletAddress(params);
        result.should.equal(true);
      });

      it('should fail when rootAddress does not match commonKeychain derivation', async function () {
        // Use a rootAddress that doesn't match what's derived from commonKeychain
        const invalidRootAddress = testData.Accounts.account1.address;
        const addressWithMemo = `${invalidRootAddress}?memoId=123`;

        const params = {
          address: addressWithMemo,
          rootAddress: invalidRootAddress,
          walletVersion: 1,
          keychains: keychains,
          index: 0,
        };

        // rootAddress is cryptographically verified against commonKeychain
        await basecoin
          .isWalletAddress(params)
          .should.be.rejectedWith(`address validation failure: address ${invalidRootAddress} is not a wallet address`);
      });
    });

    describe('Wallet VersionKey 2+', () => {
      let keychains;

      before(function () {
        keychains = [
          { commonKeychain: addressVerificationData.commonKeychain },
          { commonKeychain: addressVerificationData.commonKeychain },
          { commonKeychain: addressVerificationData.commonKeychain },
        ];
      });

      it('should verify a valid TSS root address (index 0)', async function () {
        const params = {
          address: addressVerificationData.rootAddress,
          rootAddress: addressVerificationData.rootAddress,
          keychains: keychains,
          index: 0,
          walletVersion: 2,
        };

        const result = await basecoin.isWalletAddress(params);
        result.should.equal(true);
      });

      it('should throw error for invalid TSS address', async function () {
        const invalidAddress = testData.Accounts.account2.address;

        const params = {
          address: invalidAddress,
          keychains: keychains,
          index: 0,
          walletVersion: 2,
        };

        await basecoin
          .isWalletAddress(params)
          .should.be.rejectedWith(`address validation failure: address ${invalidAddress} is not a wallet address`);
      });

      it('should throw error when keychains is missing', async function () {
        const params = {
          address: addressVerificationData.rootAddress,
          keychains: [],
          index: 0,
          walletVersion: 2,
        };

        await basecoin.isWalletAddress(params).should.be.rejectedWith('missing required param keychains');
      });

      it('should handle string index', async function () {
        const params = {
          address: addressVerificationData.rootAddress,
          rootAddress: addressVerificationData.rootAddress,
          keychains: keychains,
          index: '0',
          walletVersion: 2,
        };

        const result = await basecoin.isWalletAddress(params);
        result.should.equal(true);
      });
    });

    describe('Address validation', () => {
      it('should throw error for invalid address format', async function () {
        const invalidAddress = 'invalid-address';

        const params = {
          address: invalidAddress,
          walletVersion: 2,
          keychains: [{ commonKeychain: addressVerificationData.commonKeychain }],
          index: 0,
        };

        await basecoin.isWalletAddress(params).should.be.rejectedWith(`invalid address: ${invalidAddress}`);
      });
    });
  });
});
