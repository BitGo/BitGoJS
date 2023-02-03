import { TestBitGo } from '@bitgo/sdk-test';
import { EcdsaEVMUnifiedWallets, GenerateUnifiedWalletOptions, UnifiedWallet } from '../../src';
import { BitgoGPGPublicKey, common, ECDSAUtils } from '@bitgo/sdk-core';
import * as openpgp from 'openpgp';
import { bitgoKeyChain, backupKeychain, userKeyChain } from '../fixtures/ecdsaUnifiedWalletFixtures';
import * as sinon from 'sinon';
import nock = require('nock');
import { BitGoAPI } from '@bitgo/sdk-api';
import { Eth } from '@bitgo/sdk-coin-eth';
import { Polygon } from '@bitgo/sdk-coin-polygon';

describe('EVM Wallets:', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  let evmWallets: EcdsaEVMUnifiedWallets;
  let bgUrl: string;
  let sandbox: sinon.SinonSandbox;

  before(function () {
    bitgo.safeRegister('eth', Eth.createInstance);
    bitgo.safeRegister('polygon', Polygon.createInstance);
    bitgo.initializeTestVars();
    evmWallets = new EcdsaEVMUnifiedWallets(bitgo, 'eth');
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
    let params = {};

    it('should validate parameters', async function () {
      await evmWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('missing required string' + ' parameter' + ' label');

      params = { label: 'test123' };
      await evmWallets
        .generateUnifiedWallet(params as GenerateUnifiedWalletOptions)
        .should.be.rejectedWith('EVM wallet only supports TSS');

      params = { ...params, multisigType: 'blsdkg' };
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

    it('should correctly generate wallet', async function () {
      const enterpriseId = 'enterprise_id';
      const bitgoGpgKeyPair = await openpgp.generateKey({
        userIDs: [
          {
            name: 'bitgo',
            email: 'bitgo@test.com',
          },
        ],
      });
      const ethWalletId = '123-eth';
      const polygonWalletId = '456-polygon';
      const ethAddress = 'bitgo, california';
      const ethWalletData = { id: ethWalletId, receiveAddress: { address: ethAddress } };
      const polygonWalletData = { id: polygonWalletId, receiveAddress: { address: ethAddress } };
      const bitgoGPGPublicKeyResponse: BitgoGPGPublicKey = {
        name: 'irrelevant',
        publicKey: bitgoGpgKeyPair.publicKey,
        enterpriseId,
      };
      const expected: UnifiedWallet = {
        id: 'great unified wallet',
        wallets: [
          { coin: 'eth', walletId: ethWalletId, address: ethAddress },
          { coin: 'polygon', walletId: polygonWalletId, address: ethAddress },
        ],
        curve: 'ecdsa',
        keys: [],
      };
      sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'createBitgoKeychain').resolves(bitgoKeyChain);
      sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'createBackupKeychain').resolves(backupKeychain);
      sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'createUserKeychain').resolves(userKeyChain);
      nock(bgUrl).get(`/api/v2/eth/tss/pubkey`).reply(200, bitgoGPGPublicKeyResponse);
      nock(bgUrl).post('/api/v2/eth/wallet').reply(200, ethWalletData);
      nock(bgUrl).post('/api/v2/polygon/wallet').reply(200, polygonWalletData);
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
  });
});
