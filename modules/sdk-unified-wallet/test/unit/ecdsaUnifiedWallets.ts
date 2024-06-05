import { TestBitGo } from '@bitgo/sdk-test';
import { EcdsaEVMUnifiedWallets, GenerateUnifiedWalletOptions, UnifiedWallet } from '../../src';
import { common, KeychainsTriplet } from '@bitgo/sdk-core';
import { keyTriplet } from '../fixtures/ecdsaUnifiedWalletFixtures';
import * as sinon from 'sinon';
import nock = require('nock');
import { BitGoAPI } from '@bitgo/sdk-api';
import { Gteth } from '@bitgo/sdk-coin-eth';
import { Tpolygon } from '@bitgo/sdk-coin-polygon';
import { UnifiedWallets } from '../../src/unifiedWallets';

describe('EVM Wallets:', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  let evmWallets: EcdsaEVMUnifiedWallets;
  let bgUrl: string;
  let sandbox: sinon.SinonSandbox;
  const ethWalletId = 'eth-123-eth';
  const polygonWalletId = '456-polygon';
  const ethAddress = 'bitgo, california';
  const expected: UnifiedWallet = {
    id: 'great unified wallet',
    wallets: [
      { coin: 'hteth', walletId: ethWalletId, address: ethAddress },
      { coin: 'tpolygon', walletId: polygonWalletId, address: ethAddress },
    ],
    curve: 'ecdsa',
    keys: [],
  };

  before(function () {
    bitgo.safeRegister('gteth', Gteth.createInstance);
    bitgo.safeRegister('hteth', Gteth.createInstance);
    bitgo.safeRegister('tpolygon', Tpolygon.createInstance);
    bitgo.initializeTestVars();
    evmWallets = new EcdsaEVMUnifiedWallets(bitgo);
    bgUrl = common.Environments[bitgo.getEnv()].uri;
    nock.cleanAll();
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('Generate EVM wallet:', function () {
    let params;
    const ethWalletData = { id: ethWalletId, receiveAddress: { address: ethAddress } };
    const polygonWalletData = { id: polygonWalletId, receiveAddress: { address: ethAddress } };

    it('should validate parameters for generateUnifiedWallet', async function () {
      params = {};
      await evmWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('missing required string' + ' parameter' + ' label');

      params = { label: 'test123' };
      await evmWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet only supports TSS');

      params = { ...params, multisigType: 'tss' };
      await evmWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');

      params = { ...params, walletVersion: 2 };
      await evmWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');
    });

    it('should validate parameters for generateUnifiedWalletFromKeys', async function () {
      params = {};
      await evmWallets
        .generateUnifiedWalletFromKeys({} as KeychainsTriplet, params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('missing required string' + ' parameter' + ' label');

      params = { label: 'test123' };
      await evmWallets
        .generateUnifiedWalletFromKeys({} as KeychainsTriplet, params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet only supports TSS');

      params = { ...params, multisigType: 'tss' };
      await evmWallets
        .generateUnifiedWalletFromKeys({} as KeychainsTriplet, params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');

      params = { ...params, walletVersion: 2 };
      await evmWallets
        .generateUnifiedWalletFromKeys({} as KeychainsTriplet, params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');
    });

    it('should correctly generate wallet', async function () {
      sandbox.stub(UnifiedWallets.prototype, 'generateKeychainsTriplet').resolves(keyTriplet);
      nock(bgUrl).post('/api/v2/gteth/wallet').reply(200, ethWalletData);
      nock(bgUrl).post('/api/v2/hteth/wallet').reply(200, ethWalletData);
      nock(bgUrl).post('/api/v2/tpolygon/wallet').reply(200, polygonWalletData);
      nock(bgUrl).post('/api/v2/wallet/evm').reply(200, expected);
      params = {
        label: 'test123',
        multisigType: 'tss',
        walletVersion: 3,
        passphrase: 'test123',
      };
      const result = await evmWallets.generateUnifiedWallet(params as GenerateUnifiedWalletOptions);
      result.should.deepEqual(expected);
    });

    it('should correctly generate wallet using keychainTriplet', async function () {
      params = {
        label: 'test123',
        multisigType: 'tss',
        walletVersion: 3,
        passphrase: 'test123',
      };
      nock(bgUrl).post('/api/v2/hteth/wallet').reply(200, ethWalletData);
      nock(bgUrl).post('/api/v2/gteth/wallet').reply(200, ethWalletData);
      nock(bgUrl).post('/api/v2/tpolygon/wallet').reply(200, polygonWalletData);
      nock(bgUrl).post('/api/v2/wallet/evm').reply(200, expected);
      const result = await evmWallets.generateUnifiedWalletFromKeys(keyTriplet, params);
      result.should.deepEqual(expected);
    });
  });

  describe('Unified Wallet functions', function () {
    it('should get unified wallet by id', async function () {
      const evmWalletId = '123';
      nock(bgUrl)
        .get('/api/v2/wallet/evm')
        .query({ evmWalletId })
        .reply(200, { result: [expected] });
      const result = await evmWallets.getUnifiedWalletById(evmWalletId);
      result.should.deepEqual(expected);
    });

    it('should get unified wallet by address', async function () {
      const address = '0x0';
      nock(bgUrl)
        .get('/api/v2/wallet/evm')
        .query({ address })
        .reply(200, { result: [expected] });
      const result = await evmWallets.getUnifiedWalletByAddress(address);
      result.should.deepEqual(expected);
    });

    it('should get all unified wallets', async function () {
      const limit = 15;
      const order = 'DESC';
      const page = 0;
      nock(bgUrl).get('/api/v2/wallet/evm').query({ limit, order, page }).reply(200, [expected]);
      const result = await evmWallets.getUnifiedWallets();
      result.should.deepEqual([expected]);
    });

    describe('get specific coin wallet', function () {
      const evmWalletId = '123';
      it('should validate parameters', async function () {
        await evmWallets.getCoinWalletById('', 'test').should.be.rejectedWith('Id field cannot be empty');
        nock(bgUrl)
          .get('/api/v2/wallet/evm')
          .query({ evmWalletId })
          .reply(200, { result: [expected] });
        await evmWallets.getCoinWalletById(evmWalletId, 'test').should.be.rejectedWith('unsupported coin test');
      });
      it('should return valid coin wallet', async function () {
        const expectedEthWallet = {
          bitgo,
          coin: bitgo.coin('hteth'),
        };
        nock(bgUrl)
          .get('/api/v2/wallet/evm')
          .query({ evmWalletId })
          .reply(200, { result: [expected] });
        nock(bgUrl).get('/api/v2/hteth/wallet/eth-123-eth').reply(200, expectedEthWallet);
        const result = await evmWallets.getCoinWalletById(evmWalletId, 'hteth');
        result.baseCoin.getFullName().should.equal('Holesky Testnet Ethereum');
      });
    });
  });
});
