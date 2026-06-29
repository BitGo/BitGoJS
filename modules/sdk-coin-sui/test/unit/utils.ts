import should from 'should';
import * as testData from '../resources/sui';
import utils from '../../src/lib/utils';
import nock from 'nock';

describe('Sui util library', function () {
  describe('isValidAddress', function () {
    it('should succeed to validate valid address', function () {
      for (const address of testData.addresses.validAddresses) {
        should.equal(utils.isValidAddress(address), true);
      }
    });
    it('should fail to validate invalid addresses', function () {
      for (const address of testData.addresses.invalidAddresses) {
        should.doesNotThrow(() => utils.isValidAddress(address));
        should.equal(utils.isValidAddress(address), false);
      }
      // @ts-expect-error Testing for missing param, should not throw an error
      should.doesNotThrow(() => utils.isValidAddress(undefined));
      // @ts-expect-error Testing for missing param, should return false
      should.equal(utils.isValidAddress(undefined), false);
    });
  });

  describe('isValidRawTransaction', function () {
    it('should succeed to validate a valid raw transaction', function () {
      should.equal(utils.isValidRawTransaction(testData.TRANSFER), true);
    });
    it('should fail to validate an invalid raw transaction', function () {
      should.doesNotThrow(() => utils.isValidRawTransaction(testData.INVALID_RAW_TX));
      should.equal(utils.isValidRawTransaction(testData.INVALID_RAW_TX), false);
    });
  });

  describe('normalizeHexId', function () {
    it('should succeed to normalize hexId with no prefix', function () {
      const hexId = 'cba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08';
      const expectedNormalized = '0xcba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08';
      should.equal(utils.normalizeHexId(hexId), expectedNormalized);
    });
    it('should return the hexId with prefix already', function () {
      const hexId = '0xcba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08';
      should.equal(utils.normalizeHexId(hexId), hexId);
    });
  });

  describe('getBalance', function () {
    const nodeUrl = 'https://fullnode.testnet.sui.io';
    const owner = '0xb7db6234a33f1e35f7114dac69574c6b7b193f3c4a0801e5ddb9fae4009af637';

    afterEach(function () {
      nock.cleanAll();
    });

    it('should return all funds in address balance when fundsInAddressBalance equals totalBalance', async function () {
      // Real response from testnet: all 2 SUI held in address balance, not in coin objects
      nock(nodeUrl)
        .post('/')
        .reply(200, {
          jsonrpc: '2.0',
          id: 1,
          result: {
            coinType: '0x2::sui::SUI',
            coinObjectCount: 1,
            totalBalance: '2000000',
            lockedBalance: {},
            fundsInAddressBalance: '2000000',
          },
        });

      const balanceInfo = await utils.getBalance(nodeUrl, owner);
      balanceInfo.totalBalance.should.equal('2000000');
      balanceInfo.fundsInAddressBalance.should.equal('2000000');
      balanceInfo.coinObjectBalance.should.equal('0');
    });

    it('should correctly split totalBalance into coinObjectBalance and fundsInAddressBalance', async function () {
      nock(nodeUrl)
        .post('/')
        .reply(200, {
          jsonrpc: '2.0',
          id: 1,
          result: {
            coinType: '0x2::sui::SUI',
            coinObjectCount: 2,
            totalBalance: '1900000000',
            lockedBalance: {},
            fundsInAddressBalance: '900000000',
          },
        });

      const balanceInfo = await utils.getBalance(nodeUrl, owner);
      balanceInfo.totalBalance.should.equal('1900000000');
      balanceInfo.fundsInAddressBalance.should.equal('900000000');
      balanceInfo.coinObjectBalance.should.equal('1000000000');
    });

    it('should handle legacy response without fundsInAddressBalance (all funds in coin objects)', async function () {
      nock(nodeUrl)
        .post('/')
        .reply(200, {
          jsonrpc: '2.0',
          id: 1,
          result: {
            coinType: '0x2::sui::SUI',
            coinObjectCount: 1,
            totalBalance: '1900000000',
            lockedBalance: {},
          },
        });

      const balanceInfo = await utils.getBalance(nodeUrl, owner);
      balanceInfo.totalBalance.should.equal('1900000000');
      balanceInfo.fundsInAddressBalance.should.equal('0');
      balanceInfo.coinObjectBalance.should.equal('1900000000');
    });

    it('should return zero balances for an empty account', async function () {
      nock(nodeUrl)
        .post('/')
        .reply(200, {
          jsonrpc: '2.0',
          id: 1,
          result: {
            coinType: '0x2::sui::SUI',
            coinObjectCount: 0,
            totalBalance: '0',
            lockedBalance: {},
            fundsInAddressBalance: '0',
          },
        });

      const balanceInfo = await utils.getBalance(nodeUrl, owner);
      balanceInfo.totalBalance.should.equal('0');
      balanceInfo.fundsInAddressBalance.should.equal('0');
      balanceInfo.coinObjectBalance.should.equal('0');
    });

    it('should query with a custom coin type', async function () {
      const packageId = '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8';
      const coinType = `${packageId}::deep::DEEP`;

      nock(nodeUrl)
        .post('/', (body) => body.params[1] === coinType)
        .reply(200, {
          jsonrpc: '2.0',
          id: 1,
          result: {
            coinType,
            coinObjectCount: 1,
            totalBalance: '1000',
            lockedBalance: {},
            fundsInAddressBalance: '0',
          },
        });

      const balanceInfo = await utils.getBalance(nodeUrl, owner, coinType);
      balanceInfo.totalBalance.should.equal('1000');
      balanceInfo.fundsInAddressBalance.should.equal('0');
      balanceInfo.coinObjectBalance.should.equal('1000');
    });
  });
});
