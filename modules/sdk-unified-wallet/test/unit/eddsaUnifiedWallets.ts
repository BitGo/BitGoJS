import { TestBitGo } from '@bitgo/sdk-test';
import { EddsaUnifiedWallets, GenerateUnifiedWalletOptions, UnifiedWallet } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';
import * as sinon from 'sinon';
import { Tsol } from '@bitgo/sdk-coin-sol';
import nock = require('nock');
import { KeychainsTriplet, common } from '@bitgo/sdk-core';
import { UnifiedWallets } from '../../src/unifiedWallets';
import { keyTriplet } from '../fixtures/ecdsaUnifiedWalletFixtures';

describe('EDDSA Unified Wallets', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  let unifiedWallets: EddsaUnifiedWallets;
  let sandbox: sinon.SinonSandbox;
  let bgUrl: string;
  const solWalletId = 'sol-123-sol';
  const solAddress = 'sol, milkyway';
  const solWalletData = { id: solWalletId, receiveAddress: { address: solAddress } };
  const expected: UnifiedWallet = {
    id: '',
    wallets: [{ coin: 'tsol', walletId: solWalletId, address: solAddress }],
    curve: 'eddsa',
    keys: ['1', '3', '2'],
  };

  before(function () {
    bitgo.safeRegister('tsol', Tsol.createInstance);
    bitgo.initializeTestVars();
    unifiedWallets = new EddsaUnifiedWallets(bitgo);
    bgUrl = common.Environments[bitgo.getEnv()].uri;
    nock.cleanAll();
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('Generate EDDSA Unified wallet', function () {
    let params;

    it('should validate parameters for generateUnifiedWallet', async function () {
      params = {};
      await unifiedWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('missing required string parameter label');

      params = { label: 'test123' };
      await unifiedWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet only supports TSS');

      params = { ...params, multisigType: 'blsdkg' };
      await unifiedWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet only supports TSS');

      params = { ...params, multisigType: 'tss' };
      await unifiedWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');

      params = { ...params, walletVersion: 2 };
      await unifiedWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');
    });

    it('should validate parameters for generateUnifiedWalletFromKeys', async function () {
      params = {};
      await unifiedWallets
        .generateUnifiedWalletFromKeys({} as KeychainsTriplet, params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('missing required string parameter label');

      params = { label: 'test123' };
      await unifiedWallets
        .generateUnifiedWalletFromKeys({} as KeychainsTriplet, params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet only supports TSS');

      params = { ...params, multisigType: 'blsdkg' };
      await unifiedWallets
        .generateUnifiedWalletFromKeys({} as KeychainsTriplet, params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet only supports TSS');

      params = { ...params, multisigType: 'tss' };
      await unifiedWallets
        .generateUnifiedWalletFromKeys({} as KeychainsTriplet, params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');

      params = { ...params, walletVersion: 2 };
      await unifiedWallets
        .generateUnifiedWalletFromKeys({} as KeychainsTriplet, params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');
    });

    it('should correctly generate wallet', async function () {
      sandbox.stub(UnifiedWallets.prototype, 'generateKeychainsTriplet').resolves(keyTriplet);
      nock(bgUrl).post('/api/v2/tsol/wallet').reply(200, solWalletData);
      nock(bgUrl).post('/api/v2/wallet/evm').reply(200, expected);
      params = {
        label: 'test123',
        multisigType: 'tss',
        walletVersion: 3,
        passphrase: 'test123',
      };
      const result = await unifiedWallets.generateUnifiedWallet(params as GenerateUnifiedWalletOptions);
      result.should.deepEqual(expected);
    });

    it('should correctly generate wallet using keychainTriplet', async function () {
      nock(bgUrl).post('/api/v2/tsol/wallet').reply(200, solWalletData);
      nock(bgUrl).post('/api/v2/wallet/evm').reply(200, expected);
      params = {
        label: 'test123',
        multisigType: 'tss',
        walletVersion: 3,
        passphrase: 'test123',
      };
      const result = await unifiedWallets.generateUnifiedWalletFromKeys(
        keyTriplet,
        params as GenerateUnifiedWalletOptions
      );
      result.should.deepEqual(expected);
    });
  });

  describe('EDDSA Unified wallet functions', function () {
    it('should get unified wallet by id', async function () {
      const evmWalletId = '123';
      await unifiedWallets.getUnifiedWalletById(evmWalletId).should.rejectedWith('Not yet implemented');
    });

    it('should get unified wallet by address', async function () {
      const address = '0x0';
      await unifiedWallets.getUnifiedWalletByAddress(address).should.rejectedWith('Not yet implemented');
    });

    it('should get all unified wallets', async function () {
      const limit = 15;
      const order = 'DESC';
      const page = 0;
      nock(bgUrl).get('/api/v2/wallet/evm').query({ limit, order, page }).reply(200, [expected]);
      const result = await unifiedWallets.getUnifiedWallets();
      result.should.deepEqual([expected]);
    });

    describe('get specific coin wallet', function () {
      const evmWalletId = '123';
      it('should return valid coin wallet', async function () {
        await unifiedWallets.getCoinWalletById(evmWalletId, 'tsol').should.rejectedWith('Not yet implemented');
      });
    });
  });
});
