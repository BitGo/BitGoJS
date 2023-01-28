import { TestBitGo } from '@bitgo/sdk-test';
import { EcdsaUnifiedWallets, GenerateUnifiedWalletOptions, UnifiedWallet } from '../../src';
import { BitgoGPGPublicKey, common, ECDSAUtils } from '@bitgo/sdk-core';
import * as openpgp from 'openpgp';
import { bitgoKeyChain, backupKeychain, userKeyChain } from '../fixtures/ecdsaUnifiedWalletFixtures';
import * as sinon from 'sinon';
import nock = require('nock');
import { BitGoAPI } from '@bitgo/sdk-api';
import { Teth } from '@bitgo/sdk-coin-eth';

describe('EVM Wallets:', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  let evmWallets: EcdsaUnifiedWallets;
  let bgUrl: string;
  let sandbox: sinon.SinonSandbox;

  before(function () {
    bitgo.safeRegister('teth', Teth.createInstance);
    bitgo.initializeTestVars();
    evmWallets = new EcdsaUnifiedWallets(bitgo, 'teth');
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
      const tethWalletId = '123-teth';
      const tethAddress = 'bitgo, california';
      const tethWalletData = { id: tethWalletId, receiveAddress: { address: tethAddress } };
      const bitgoGPGPublicKeyResponse: BitgoGPGPublicKey = {
        name: 'irrelevant',
        publicKey: bitgoGpgKeyPair.publicKey,
        enterpriseId,
      };
      const expected: UnifiedWallet = {
        id: 'great unified wallet',
        wallets: [{ coinName: 'teth', walletId: tethWalletId, address: tethAddress }],
        curve: 'Ecdsa',
      };
      sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'createBitgoKeychain').resolves(bitgoKeyChain);
      sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'createBackupKeychain').resolves(backupKeychain);
      sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'createUserKeychain').resolves(userKeyChain);
      nock(bgUrl).get(`/api/v2/teth/tss/pubkey`).reply(200, bitgoGPGPublicKeyResponse);
      nock(bgUrl).post('/api/v2/teth/wallet').reply(200, tethWalletData);
      nock(bgUrl).post('/api/v2/wallet/evm').reply(200, expected);
      params = {
        label: 'test123',
        multisigType: 'tss',
        walletVersion: 3,
        passphrase: 'test123',
      };
      const result = await evmWallets.generateUnifiedWallet(params as GenerateUnifiedWalletOptions, ['teth']);
      result.should.deepEqual(expected);
    });
  });
});
