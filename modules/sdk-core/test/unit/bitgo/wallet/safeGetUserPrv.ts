/**
 * @prettier
 */
import 'should';
import * as sinon from 'sinon';
import {
  fetchRootKeychainForSafeChild,
  InvalidRootKeychainSourceError,
  PendingApproval,
  RequestTracer,
  Wallet,
} from '../../../../src';
import { BaseCoin } from '../../../../src/bitgo/baseCoin';

require('should-sinon');

describe('WCN-1200 safe child getUserPrv root-fetch detour', function () {
  const prv =
    'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g';
  const derivedPrv =
    'xprv9yoG67Td11uwjXwbV8zEmrySVXERu5FZAsLD9suBeEJbgJqANs8Yng5dEJoii7hag5JermK6PbfxgDmSzW7ewWeLmeJEkmPfmZUSLdETtHx';
  const passphrase = 'test-passphrase';
  const rootKeyId = 'root-key-id';

  let mockBitGo: any;
  let mockBaseCoin: any;
  let keychainsGetStub: sinon.SinonStub;
  let encryptStub: sinon.SinonStub;
  let decryptStub: sinon.SinonStub;

  const baseWalletData = {
    id: 'wallet-id',
    coin: 'tbtc',
    keys: ['user-key', 'backup-key', 'bitgo-key'],
    type: 'hot',
    multisigType: 'onchain',
    enterprise: 'ent-id',
  };

  beforeEach(function () {
    keychainsGetStub = sinon.stub();
    encryptStub = sinon.stub();
    decryptStub = sinon.stub();

    mockBitGo = {
      encrypt: encryptStub,
      decrypt: decryptStub,
      url: sinon.stub().returns('https://test.bitgo.com/'),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      getChain: sinon.stub().returns('tbtc'),
      getFamily: sinon.stub().returns('btc'),
      getFullName: sinon.stub().returns('Test Bitcoin'),
      keychains: sinon.stub().returns({
        get: keychainsGetStub,
        getKeysForSigning: sinon.stub().resolves([]),
      }),
      deriveKeyWithSeed: sinon.stub().callsFake(({ key, seed }: { key: string; seed: string }) => {
        // Match BaseCoin.deriveKeyWithSeedBip32 for the known fixture seed
        if (key === prv && seed === '123') {
          return { key: derivedPrv, derivationPath: 'm/999999/...' };
        }
        return { key: `derived(${key},${seed})`, derivationPath: 'm/0' };
      }),
      url: sinon.stub().callsFake((path: string) => `https://test.bitgo.com/api/v2/tbtc${path}`),
      supportsStaking: sinon.stub().returns(false),
      supportsTss: sinon.stub().returns(false),
      getMPCAlgorithm: sinon.stub(),
      keyIdsForSigning: sinon.stub().returns([0, 1, 2]),
    };

    // decryptKeychainPrivateKey uses bitgo.decrypt
    decryptStub.callsFake(({ input, password }: { input: string; password: string }) => {
      if (password !== passphrase) {
        return null;
      }
      // encrypted payloads in these tests are just the plaintext prefixed
      if (typeof input === 'string' && input.startsWith('enc:')) {
        return input.slice(4);
      }
      return null;
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  function makeWallet(overrides: Record<string, unknown> = {}): Wallet {
    return new Wallet(mockBitGo, mockBaseCoin as unknown as BaseCoin, {
      ...baseWalletData,
      ...overrides,
    });
  }

  describe('fetchRootKeychainForSafeChild', function () {
    it('throws InvalidRootKeychainSourceError when root source is backup', async function () {
      keychainsGetStub.resolves({
        id: rootKeyId,
        source: 'backup',
        encryptedPrv: 'enc:root',
        type: 'independent',
        pub: 'root-pub',
      });

      await fetchRootKeychainForSafeChild(mockBaseCoin.keychains(), {
        id: 'child-key',
        parent: rootKeyId,
        type: 'independent',
        pub: 'child-pub',
      }).should.be.rejectedWith(InvalidRootKeychainSourceError);
    });

    it('returns the root keychain when source is user', async function () {
      const root = {
        id: rootKeyId,
        source: 'user',
        encryptedPrv: 'enc:root',
        type: 'independent',
        pub: 'root-pub',
      };
      keychainsGetStub.resolves(root);

      const result = await fetchRootKeychainForSafeChild(mockBaseCoin.keychains(), {
        id: 'child-key',
        parent: rootKeyId,
        type: 'independent',
        pub: 'child-pub',
      });
      result.should.eql(root);
    });
  });

  describe('getUserPrv', function () {
    it('throws when keychain has no encryptedPrv on a non-safe wallet', async function () {
      const wallet = makeWallet();
      await wallet
        .getUserPrv({
          keychain: {
            id: 'child-key',
            pub: 'pub',
            type: 'independent',
          },
          walletPassphrase: passphrase,
        })
        .should.be.rejectedWith('keychain does not have property encryptedPrv');
    });

    it('fetches root and derives child key for safe root-share spender', async function () {
      const wallet = makeWallet({ safeId: 'safe-id-1' });
      keychainsGetStub.resolves({
        id: rootKeyId,
        source: 'user',
        encryptedPrv: `enc:${prv}`,
        type: 'independent',
        pub: 'root-pub',
      });

      const result = await wallet.getUserPrv({
        keychain: {
          id: 'child-key',
          pub: 'child-pub',
          type: 'independent',
          parent: rootKeyId,
          derivedFromParentWithSeed: '123',
        },
        walletPassphrase: passphrase,
      });

      result.should.eql(derivedPrv);
      keychainsGetStub.calledOnceWithExactly({ id: rootKeyId }).should.be.true();
    });

    it('decrypts child encryptedPrv as-is for hardened individual safe spender', async function () {
      const childPrv = 'child-level-prv';
      const wallet = makeWallet({ safeId: 'safe-id-1' });

      const result = await wallet.getUserPrv({
        keychain: {
          id: 'child-key',
          pub: 'child-pub',
          type: 'independent',
          parent: rootKeyId,
          derivedFromParentWithSeed: '123',
          encryptedPrv: `enc:${childPrv}`,
        },
        walletPassphrase: passphrase,
      });

      result.should.eql(childPrv);
      keychainsGetStub.notCalled.should.be.true();
      mockBaseCoin.deriveKeyWithSeed.notCalled.should.be.true();
    });

    it('does not auto-populate coldDerivationSeed when explicit prv and encryptedPrv are present', async function () {
      const childPrv = 'child-level-prv';
      const wallet = makeWallet({ safeId: 'safe-id-1' });

      const result = await wallet.getUserPrv({
        prv: childPrv,
        keychain: {
          id: 'child-key',
          pub: 'child-pub',
          type: 'independent',
          parent: rootKeyId,
          derivedFromParentWithSeed: '123',
          encryptedPrv: `enc:${childPrv}`,
        },
      });

      result.should.eql(childPrv);
      mockBaseCoin.deriveKeyWithSeed.notCalled.should.be.true();
    });

    it('still auto-populates coldDerivationSeed for SMC with params.prv and no encryptedPrv', async function () {
      const wallet = makeWallet();

      const result = await wallet.getUserPrv({
        prv,
        keychain: {
          id: 'smc-key',
          pub: 'smc-pub',
          type: 'independent',
          derivedFromParentWithSeed: '123',
        },
      });

      result.should.eql(derivedPrv);
      mockBaseCoin.deriveKeyWithSeed.calledOnce.should.be.true();
    });
  });

  describe('signing guards', function () {
    it('getUserKeyAndSignTssTransaction allows safe child keychain without encryptedPrv', async function () {
      const wallet = makeWallet({
        safeId: 'safe-id-1',
        multisigType: 'tss',
        type: 'hot',
      });
      const childKeychain = {
        id: 'child-key',
        pub: 'child-pub',
        type: 'tss' as const,
        parent: rootKeyId,
        commonKeychain: 'ck',
      };
      mockBaseCoin.keychains.returns({
        get: keychainsGetStub,
        getKeysForSigning: sinon.stub().resolves([childKeychain]),
      });
      const signStub = sinon.stub(Wallet.prototype, 'signTransaction').resolves({ txHex: 'signed' } as any);

      const result = await wallet.getUserKeyAndSignTssTransaction({
        txRequestId: 'tx-req',
        walletPassphrase: passphrase,
      });

      result.should.eql({ txHex: 'signed' });
      signStub.calledOnce.should.be.true();
      const signArgs = signStub.firstCall.args[0] as { keychain: unknown };
      signArgs.keychain.should.eql(childKeychain);
    });

    it('signTransaction hot-wallet branch allows safe child keychain without encryptedPrv', async function () {
      const wallet = makeWallet({
        safeId: 'safe-id-1',
        multisigType: 'tss',
        type: 'hot',
      });
      const childKeychain = {
        id: 'child-key',
        pub: 'child-pub',
        type: 'tss' as const,
        parent: rootKeyId,
        commonKeychain: 'ck',
      };
      mockBaseCoin.keychains.returns({
        get: keychainsGetStub,
        getKeysForSigning: sinon.stub().resolves([childKeychain]),
      });
      mockBaseCoin.presignTransaction = sinon.stub().callsFake(async (params: any) => params);
      mockBaseCoin.getMPCAlgorithm = sinon.stub().returns('eddsa');
      const getUserPrvStub = sinon.stub(Wallet.prototype, 'getUserPrv').resolves('derived-prv');
      // Avoid constructing real TSS utils — stub the private sign path
      const signTssStub = sinon.stub(Wallet.prototype as any, 'signTransactionTss').resolves({ txHex: 'signed' });

      const result = await wallet.signTransaction({
        walletPassphrase: passphrase,
        txPrebuild: { txRequestId: 'tx-req' },
      });

      result.should.eql({ txHex: 'signed' });
      getUserPrvStub.calledOnce.should.be.true();
      signTssStub.calledOnce.should.be.true();
    });
  });
});

describe('WCN-1200 recreateAndSignTSSTransaction safe path', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('uses getUserPrv for safe child wallets instead of getPrv', async function () {
    const childUserKeychain = {
      id: 'child-key',
      pub: 'child-pub',
      type: 'tss',
      parent: 'root-key-id',
      derivedFromParentWithSeed: 'seed',
    };
    const getKeysForSigning = sinon.stub().resolves([childUserKeychain]);
    const getUserPrv = sinon.stub().resolves('decryptedPrv');
    const getPrv = sinon.stub().resolves('should-not-be-called');
    const recreateTxRequest = sinon.stub().resolves({
      apiVersion: 'lite',
      txRequestId: 'tx-req',
      unsignedTxs: [{ serializedTxHex: 'deadbeef', signableHex: 'ab', derivationPath: 'm/0' }],
      transactions: [],
    });

    const wallet: any = {
      safeId: () => 'safe-id-1',
      getUserPrv,
      getPrv,
      baseCoin: {
        keychains: () => ({ getKeysForSigning }),
        supportsTss: () => true,
        getMPCAlgorithm: () => 'eddsa',
      },
      multisigTypeVersion: () => undefined,
    };

    const pendingApproval = new PendingApproval(
      {} as any,
      wallet.baseCoin,
      {
        id: 'pa0',
        txRequestId: 'tx-req',
        info: { type: 'transactionRequest', transactionRequest: { recipients: [], coinSpecific: {} } },
        state: 'pending',
        creator: 'test',
      } as any,
      wallet
    );
    (pendingApproval as any).tssUtils = { recreateTxRequest };

    const result = await pendingApproval.recreateAndSignTSSTransaction(
      { walletPassphrase: 'pass' },
      new RequestTracer()
    );

    result.should.eql({ txHex: 'deadbeef' });
    getPrv.notCalled.should.be.true();
    getKeysForSigning.calledOnce.should.be.true();
    getUserPrv
      .calledOnceWithExactly({
        keychain: childUserKeychain,
        walletPassphrase: 'pass',
      })
      .should.be.true();
    recreateTxRequest.calledOnce.should.be.true();
  });
});
