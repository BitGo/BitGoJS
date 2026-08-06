import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallets } from '../../../../src/bitgo/wallet/wallets';

describe('Wallets - GoAccount (OFC trading) wallet creation', function () {
  let wallets: Wallets;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockKeychains: any;
  let postChain: any;

  const userPrv = 'xprvSomeUserPrivateKey';
  const userPub =
    'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';

  beforeEach(function () {
    mockKeychains = {
      create: sinon.stub().returns({ pub: userPub, prv: userPrv }),
      add: sinon.stub().callsFake(async (params) => ({ id: 'user-key-id', ...params })),
    };

    const mockWalletData = { id: 'wallet-id', keys: ['user-key-id'] };

    postChain = {
      send: sinon.stub(),
    };
    postChain.send.returns({
      result: sinon.stub().resolves(mockWalletData),
    });

    mockBitGo = {
      post: sinon.stub().returns(postChain),
      encrypt: sinon
        .stub()
        .callsFake(
          async ({ password, input }: { password: string; input: string }) => `encrypted:${password}:${input}`
        ),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      getFamily: sinon.stub().returns('ofc'),
      getChain: sinon.stub().returns('ofc'),
      getDefaultMultisigType: sinon.stub().returns('onchain'),
      supportsTss: sinon.stub().returns(false),
      keychains: sinon.stub().returns(mockKeychains),
      url: sinon.stub().returns('/test/url'),
    };

    wallets = new Wallets(mockBitGo, mockBaseCoin);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should forward userKeySigningRequired: false in coinSpecific when provided', async function () {
    const result = await wallets.generateWallet({
      label: 'Test OFC Wallet',
      passphrase: 'test-passphrase',
      enterprise: 'enterprise-123',
      passcodeEncryptionCode: 'pce-code',
      type: 'trading',
      userKeySigningRequired: false,
    });

    assert.ok(postChain.send.calledOnce, 'POST /wallet/add should be called once');
    const sentParams = postChain.send.firstCall.args[0];
    sentParams.should.have.property('coinSpecific');
    sentParams.coinSpecific.should.have.property('userKeySigningRequired', false);

    const keychainParams = mockKeychains.add.firstCall.args[0];
    keychainParams.should.have.property('encryptedPrv', `encrypted:test-passphrase:${userPrv}`);
    keychainParams.should.have.property('originalPasscodeEncryptionCode', 'pce-code');
    result.should.have.property('encryptedWalletPassphrase', 'encrypted:pce-code:test-passphrase');
  });

  it('should forward userKeySigningRequired: true in coinSpecific when explicitly set', async function () {
    await wallets.generateWallet({
      label: 'Test OFC Wallet',
      passphrase: 'test-passphrase',
      enterprise: 'enterprise-123',
      passcodeEncryptionCode: 'pce-code',
      type: 'trading',
      userKeySigningRequired: true,
    });

    const sentParams = postChain.send.firstCall.args[0];
    sentParams.coinSpecific.should.have.property('userKeySigningRequired', true);
  });

  it('should omit coinSpecific when userKeySigningRequired is not provided', async function () {
    await wallets.generateWallet({
      label: 'Test OFC Wallet',
      passphrase: 'test-passphrase',
      enterprise: 'enterprise-123',
      passcodeEncryptionCode: 'pce-code',
      type: 'trading',
    });

    const sentParams = postChain.send.firstCall.args[0];
    sentParams.should.not.have.property('coinSpecific');
  });

  it('should generate a public-only user key when user key signing is disabled and password fields are omitted', async function () {
    const result = await wallets.generateWallet({
      label: 'Passwordless OFC Wallet',
      enterprise: 'enterprise-123',
      type: 'trading',
      userKeySigningRequired: false,
    });

    assert.ok(mockKeychains.add.calledOnce, 'user key should be uploaded once');
    const keychainParams = mockKeychains.add.firstCall.args[0];
    keychainParams.should.have.property('pub', userPub);
    keychainParams.should.not.have.property('encryptedPrv');
    keychainParams.should.not.have.property('originalPasscodeEncryptionCode');

    assert.ok(postChain.send.calledOnce, 'POST /wallet/add should be called once');
    postChain.send.firstCall.args[0].coinSpecific.should.have.property('userKeySigningRequired', false);
    result.should.not.have.property('encryptedWalletPassphrase');
    result.should.not.have.property('warning');
  });

  it('should reject passwordless generation when only one password field is supplied', async function () {
    await assert.rejects(
      wallets.generateWallet({
        label: 'Passwordless OFC Wallet',
        enterprise: 'enterprise-123',
        type: 'trading',
        userKeySigningRequired: false,
        passphrase: 'partial-password-input',
      }),
      /error\(s\) parsing generate go account request params/
    );

    assert.strictEqual(mockKeychains.add.called, false);
    assert.strictEqual(postChain.send.called, false);
  });
});
