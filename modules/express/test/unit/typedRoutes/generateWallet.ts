import * as assert from 'assert';
import * as sinon from 'sinon';
import { agent as supertest } from 'supertest';
import 'should';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import { BitGo } from 'bitgo';
import { PostGenerateWallet } from '../../../src/typedRoutes/api/v2/generateWallet';

describe('Generate Wallet Typed Routes Tests', function () {
  let agent: ReturnType<typeof supertest>;

  before(function () {
    const { app } = require('../../../src/expressApp');
    const config = require('../../../src/config').DefaultConfig;
    const testApp = app(config);
    agent = supertest(testApp);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('Success Cases', function () {
    it('should successfully generate wallet with all parameters', async function () {
      const coin = 'tbtc';
      const label = 'Test Wallet';
      const passphrase = 'mySecurePassphrase123';
      const enterprise = 'enterprise123';

      const mockWallet = {
        id: 'wallet123',
        coin,
        label,
        toJSON: sinon.stub().returns({
          id: 'wallet123',
          coin,
          label,
          keys: ['userKey123', 'backupKey123', 'bitgoKey123'],
        }),
      };

      const walletResponse = {
        wallet: mockWallet,
        userKeychain: {
          id: 'userKey123',
          pub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
          encryptedPrv: 'encrypted_user_prv',
        },
        backupKeychain: {
          id: 'backupKey123',
          pub: 'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa',
          encryptedPrv: 'encrypted_backup_prv',
        },
        bitgoKeychain: {
          id: 'bitgoKey123',
          pub: 'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6LBpB85b3D2yc8sfvZU521AAwdZafEz7mnzBBsz4wKY5fTtTQBm',
        },
      };

      const generateWalletStub = sinon.stub().resolves(walletResponse);
      const walletsStub = { generateWallet: generateWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label,
        passphrase,
        enterprise,
      });

      res.status.should.equal(200);
      res.body.should.have.property('wallet');
      res.body.wallet.should.have.property('id', 'wallet123');
      res.body.wallet.should.have.property('label', label);
      res.body.should.have.property('userKeychain');
      res.body.should.have.property('backupKeychain');
      res.body.should.have.property('bitgoKeychain');

      generateWalletStub.should.have.been.calledOnce();
      generateWalletStub.firstCall.args[0].should.have.property('label', label);
      generateWalletStub.firstCall.args[0].should.have.property('passphrase', passphrase);
      generateWalletStub.firstCall.args[0].should.have.property('enterprise', enterprise);
    });

    it('should successfully generate wallet with optional type and multisigType', async function () {
      const coin = 'tbtc';
      const label = 'Test Wallet';
      const passphrase = 'mySecurePassphrase123';
      const enterprise = 'enterprise123';
      const type = 'cold';
      const multisigType = 'tss';

      const mockWallet = {
        id: 'wallet456',
        coin,
        label,
        toJSON: sinon.stub().returns({
          id: 'wallet456',
          coin,
          label,
          type,
          multisigType,
        }),
      };

      const walletResponse = {
        wallet: mockWallet,
        userKeychain: { id: 'userKey456' },
        backupKeychain: { id: 'backupKey456' },
        bitgoKeychain: { id: 'bitgoKey456' },
      };

      const generateWalletStub = sinon.stub().resolves(walletResponse);
      const walletsStub = { generateWallet: generateWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label,
        passphrase,
        enterprise,
        type,
        multisigType,
      });

      res.status.should.equal(200);
      res.body.should.have.property('wallet');
      res.body.wallet.should.have.property('id', 'wallet456');

      generateWalletStub.should.have.been.calledOnce();
      generateWalletStub.firstCall.args[0].should.have.property('type', type);
      generateWalletStub.firstCall.args[0].should.have.property('multisigType', multisigType);
    });

    it('should generate wallet without keychains when includeKeychains=false', async function () {
      const coin = 'tbtc';
      const label = 'Test Wallet';
      const passphrase = 'mySecurePassphrase123';
      const enterprise = 'enterprise123';

      const mockWallet = {
        id: 'wallet789',
        coin,
        label,
        toJSON: sinon.stub().returns({
          id: 'wallet789',
          coin,
          label,
        }),
      };

      const walletResponse = {
        wallet: mockWallet,
        userKeychain: { id: 'userKey789' },
        backupKeychain: { id: 'backupKey789' },
        bitgoKeychain: { id: 'bitgoKey789' },
      };

      const generateWalletStub = sinon.stub().resolves(walletResponse);
      const walletsStub = { generateWallet: generateWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).query({ includeKeychains: 'false' }).send({
        label,
        passphrase,
        enterprise,
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', 'wallet789');
      res.body.should.not.have.property('userKeychain');
      res.body.should.not.have.property('backupKeychain');
      res.body.should.not.have.property('bitgoKeychain');
    });

    it('should successfully generate wallet with backupXpubProvider', async function () {
      const coin = 'tbtc';
      const label = 'Test Wallet';
      const passphrase = 'mySecurePassphrase123';
      const enterprise = 'enterprise123';
      const backupXpubProvider = 'dai';

      const mockWallet = {
        id: 'walletKRS',
        coin,
        label,
        toJSON: sinon.stub().returns({
          id: 'walletKRS',
          coin,
          label,
        }),
      };

      const walletResponse = {
        wallet: mockWallet,
        userKeychain: { id: 'userKeyKRS' },
        backupKeychain: { id: 'backupKeyKRS', provider: 'dai' },
        bitgoKeychain: { id: 'bitgoKeyKRS' },
      };

      const generateWalletStub = sinon.stub().resolves(walletResponse);
      const walletsStub = { generateWallet: generateWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label,
        passphrase,
        enterprise,
        backupXpubProvider,
      });

      res.status.should.equal(200);
      res.body.should.have.property('wallet');
      res.body.should.have.property('backupKeychain');
      res.body.backupKeychain.should.have.property('provider', 'dai');

      generateWalletStub.should.have.been.calledOnce();
      generateWalletStub.firstCall.args[0].should.have.property('backupXpubProvider', backupXpubProvider);
    });

    it('should successfully generate MPC wallet with bitgoKeyId and commonKeychain', async function () {
      const coin = 'tbtc';
      const label = 'MPC Test Wallet';
      const enterprise = 'enterprise123';
      const bitgoKeyId = 'bitgoMpcKey123';
      const commonKeychain = 'commonKeychain123';

      const mockWallet = {
        id: 'walletMPC',
        coin,
        label,
        multisigType: 'tss',
        toJSON: sinon.stub().returns({
          id: 'walletMPC',
          coin,
          label,
          multisigType: 'tss',
        }),
      };

      const walletResponse = {
        wallet: mockWallet,
        userKeychain: { id: 'userKeyMPC' },
        backupKeychain: { id: 'backupKeyMPC' },
        bitgoKeychain: { id: bitgoKeyId },
      };

      const generateWalletStub = sinon.stub().resolves(walletResponse);
      const walletsStub = { generateWallet: generateWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label,
        enterprise,
        multisigType: 'tss',
        type: 'cold',
        bitgoKeyId,
        commonKeychain,
      });

      res.status.should.equal(200);
      res.body.should.have.property('wallet');
      res.body.wallet.should.have.property('multisigType', 'tss');

      generateWalletStub.should.have.been.calledOnce();
      generateWalletStub.firstCall.args[0].should.have.property('bitgoKeyId', bitgoKeyId);
      generateWalletStub.firstCall.args[0].should.have.property('commonKeychain', commonKeychain);
    });

    it('should successfully generate EVM keyring wallet with evmKeyRingReferenceWalletId', async function () {
      const coin = 'tpolygon';
      const label = 'EVM Keyring Child Wallet';
      const evmKeyRingReferenceWalletId = 'referenceWallet123';

      const mockWallet = {
        id: 'walletKeyring',
        coin,
        label,
        evmKeyRingReferenceWalletId,
        toJSON: sinon.stub().returns({
          id: 'walletKeyring',
          coin,
          label,
          evmKeyRingReferenceWalletId,
          multisigType: 'tss',
        }),
      };

      const walletResponse = {
        wallet: mockWallet,
        userKeychain: { id: 'userKeyKeyring' },
        backupKeychain: { id: 'backupKeyKeyring' },
        bitgoKeychain: { id: 'bitgoKeyKeyring' },
      };

      const generateWalletStub = sinon.stub().resolves(walletResponse);
      const walletsStub = { generateWallet: generateWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label,
        evmKeyRingReferenceWalletId,
      });

      res.status.should.equal(200);
      res.body.should.have.property('wallet');
      res.body.wallet.should.have.property('evmKeyRingReferenceWalletId', evmKeyRingReferenceWalletId);

      generateWalletStub.should.have.been.calledOnce();
      generateWalletStub.firstCall.args[0].should.have.property('label', label);
      generateWalletStub.firstCall.args[0].should.have.property(
        'evmKeyRingReferenceWalletId',
        evmKeyRingReferenceWalletId
      );
    });
  });

  describe('Codec Validation', function () {
    it('should return 400 when label is missing', async function () {
      const coin = 'tbtc';

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        enterprise: 'enterprise123',
        passphrase: 'password',
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/label/);
    });

    it('should return 400 when label is not a string', async function () {
      const coin = 'tbtc';

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label: 123,
        enterprise: 'enterprise123',
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/label/);
    });

    it('should return 400 when type is invalid', async function () {
      const coin = 'tbtc';

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label: 'Test Wallet',
        enterprise: 'enterprise123',
        type: 'invalid_type',
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/type/);
    });

    it('should return 400 when multisigType is invalid', async function () {
      const coin = 'tbtc';

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label: 'Test Wallet',
        enterprise: 'enterprise123',
        multisigType: 'invalid_multisig',
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/multisigType/);
    });

    it('should return 400 when backupXpubProvider is invalid', async function () {
      const coin = 'tbtc';

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label: 'Test Wallet',
        enterprise: 'enterprise123',
        backupXpubProvider: 'invalid_provider',
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/backupXpubProvider/);
    });

    it('should return 400 when disableTransactionNotifications is not boolean', async function () {
      const coin = 'tbtc';

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label: 'Test Wallet',
        enterprise: 'enterprise123',
        disableTransactionNotifications: 'true',
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/disableTransactionNotifications/);
    });
  });

  describe('Handler Errors', function () {
    it('should return error when SDK generateWallet fails', async function () {
      const coin = 'tbtc';
      const label = 'Test Wallet';
      const enterprise = 'enterprise123';

      const generateWalletStub = sinon.stub().rejects(new Error('Insufficient funds'));
      const walletsStub = { generateWallet: generateWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/generate`).send({
        label,
        enterprise,
        passphrase: 'password',
      });

      res.status.should.equal(500);
      res.body.should.have.property('error');
      res.body.error.should.match(/Insufficient funds/);
    });
  });

  describe('Route Definition', function () {
    it('should have correct route metadata', function () {
      assert.strictEqual(PostGenerateWallet.method, 'POST');
      assert.strictEqual(PostGenerateWallet.path, '/api/v2/{coin}/wallet/generate');
      assert.ok(PostGenerateWallet.response[200]);
      assert.ok(PostGenerateWallet.response[400]);
    });
  });
});
