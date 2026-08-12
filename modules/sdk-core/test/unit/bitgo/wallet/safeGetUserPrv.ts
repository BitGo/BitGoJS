/**
 * @prettier
 */
import 'should';
import * as sinon from 'sinon';
import {
  deriveSafeChildHardenedFromXprv,
  fetchRootKeychainForSafeChild,
  getSafeHardenedDerivationPath,
  IncorrectPasswordError,
  InvalidRootKeychainSourceError,
  MissingEncryptedKeychainError,
  PendingApproval,
  RequestTracer,
  SafeDerivedPublicKeyMismatchError,
  SafeOwnerSigningNotImplementedError,
  Wallet,
} from '../../../../src';
import { BaseCoin } from '../../../../src/bitgo/baseCoin';

require('should-sinon');

describe('WCN-1200 safe child getUserPrv root-fetch detour', function () {
  const prv =
    'xprv9s21ZrQH143K3hekyNj7TciR4XNYe1kMj68W2ipjJGNHETWP7o42AjDnSPgKhdZ4x8NBAvaL72RrXjuXNdmkMqLERZza73oYugGtbLFXG8g';
  // Soft deriveKeyWithSeedBip32(prv, '123') — must NOT be used for safe owners.
  const softDerivedPrv =
    'xprv9yoG67Td11uwjXwbV8zEmrySVXERu5FZAsLD9suBeEJbgJqANs8Yng5dEJoii7hag5JermK6PbfxgDmSzW7ewWeLmeJEkmPfmZUSLdETtHx';
  const hardened = deriveSafeChildHardenedFromXprv(prv, '123');
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
        if (key === prv && seed === '123') {
          return { key: softDerivedPrv, derivationPath: 'm/999999/...' };
        }
        return { key: `derived(${key},${seed})`, derivationPath: 'm/0' };
      }),
      url: sinon.stub().callsFake((path: string) => `https://test.bitgo.com/api/v2/tbtc${path}`),
      supportsStaking: sinon.stub().returns(false),
      supportsTss: sinon.stub().returns(false),
      getMPCAlgorithm: sinon.stub(),
      keyIdsForSigning: sinon.stub().returns([0, 1, 2]),
    };

    decryptStub.callsFake(({ input, password }: { input: string; password: string }) => {
      if (password !== passphrase) {
        return null;
      }
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

  describe('safeDerivation', function () {
    it('builds the hardened path from the mint index', function () {
      getSafeHardenedDerivationPath(123).should.eql("m/999999'/123'");
      getSafeHardenedDerivationPath('0').should.eql("m/999999'/0'");
    });

    it('rejects a non-integer index', function () {
      (() => getSafeHardenedDerivationPath('abc')).should.throw(/Invalid safe derivation index/);
    });

    it('hardened-derives a child that differs from soft deriveKeyWithSeed', function () {
      hardened.derivationPath.should.eql("m/999999'/123'");
      hardened.prv.should.not.eql(softDerivedPrv);
      hardened.prv.should.eql(
        'xprv9wMxE3idjgW7UoSodEZgYpy7aSzt32GC7j63s277VwkRbVvnkRubmFqZ4UUghHVTaSbdHZA3NM8FuwH4CoTQzaVzzUh1BwKcNYn17NczoQy'
      );
      hardened.pub.should.eql(
        'xpub6AMJdZFXa44QhHXGjG6guxur8UqNSUz3Ux1efQWj4HHQUJFwHyDrK4A2ukru4QZ9PfhTYbPLBNYFL7gbdhTidSppW1aQ9QgYPT5cBFmoDEu'
      );
    });
  });

  describe('fetchRootKeychainForSafeChild', function () {
    it('throws when child keychain has no parent', async function () {
      await fetchRootKeychainForSafeChild(mockBaseCoin.keychains(), {
        id: 'child-key',
        type: 'independent',
        pub: 'child-pub',
      }).should.be.rejectedWith('childKeychain.parent is required to fetch the root keychain');
      keychainsGetStub.notCalled.should.be.true();
    });

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

    it('throws when root keychain has no encryptedPrv', async function () {
      keychainsGetStub.resolves({
        id: rootKeyId,
        source: 'user',
        type: 'independent',
        pub: 'root-pub',
      });

      await fetchRootKeychainForSafeChild(mockBaseCoin.keychains(), {
        id: 'child-key',
        parent: rootKeyId,
        type: 'independent',
        pub: 'child-pub',
      }).should.be.rejectedWith(/does not have property encryptedPrv/);
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

    it('throws for a non-safe wallet even when keychain has parent', async function () {
      const wallet = makeWallet();
      await wallet
        .getUserPrv({
          keychain: {
            id: 'child-key',
            pub: 'pub',
            type: 'independent',
            parent: rootKeyId,
          },
          walletPassphrase: passphrase,
        })
        .should.be.rejectedWith('keychain does not have property encryptedPrv');
      keychainsGetStub.notCalled.should.be.true();
    });

    it('throws for a safe wallet when keychain has no parent', async function () {
      const wallet = makeWallet({ safeId: 'safe-id-1' });
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
      keychainsGetStub.notCalled.should.be.true();
    });

    it('fetches root and hardened-derives child key for safe owner', async function () {
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
          pub: hardened.pub,
          type: 'independent',
          parent: rootKeyId,
          derivedFromParentWithSeed: '123',
        },
        walletPassphrase: passphrase,
      });

      result.should.eql(hardened.prv);
      result.should.not.eql(softDerivedPrv);
      keychainsGetStub.calledOnceWithExactly({ id: rootKeyId }).should.be.true();
      mockBaseCoin.deriveKeyWithSeed.notCalled.should.be.true();
    });

    it('throws when onchain safe owner is missing derivedFromParentWithSeed', async function () {
      const wallet = makeWallet({ safeId: 'safe-id-1' });
      keychainsGetStub.resolves({
        id: rootKeyId,
        source: 'user',
        encryptedPrv: `enc:${prv}`,
        type: 'independent',
        pub: 'root-pub',
      });

      await wallet
        .getUserPrv({
          keychain: {
            id: 'child-key',
            pub: hardened.pub,
            type: 'independent',
            parent: rootKeyId,
          },
          walletPassphrase: passphrase,
        })
        .should.be.rejectedWith(/missing derivedFromParentWithSeed/);
    });

    it('fails closed for TSS safe owner instead of returning the root prv', async function () {
      const wallet = makeWallet({ safeId: 'safe-id-1', multisigType: 'tss' });

      await wallet
        .getUserPrv({
          keychain: {
            id: 'child-key',
            pub: 'unrelated-child-pub',
            type: 'tss',
            parent: rootKeyId,
            derivedFromParentWithSeed: '123',
            commonKeychain: 'ck',
          },
          walletPassphrase: passphrase,
        })
        .should.be.rejectedWith(SafeOwnerSigningNotImplementedError);
      keychainsGetStub.notCalled.should.be.true();
      mockBaseCoin.deriveKeyWithSeed.notCalled.should.be.true();
    });

    it('fails closed for ed25519 onchain safe owner instead of BIP32-deriving', async function () {
      mockBaseCoin.getFamily.returns('xlm');
      const wallet = makeWallet({ safeId: 'safe-id-1', coin: 'txlm' });

      await wallet
        .getUserPrv({
          keychain: {
            id: 'child-key',
            pub: 'child-pub',
            type: 'independent',
            parent: rootKeyId,
            derivedFromParentWithSeed: '123',
          },
          walletPassphrase: passphrase,
        })
        .should.be.rejectedWith(SafeOwnerSigningNotImplementedError);
      keychainsGetStub.notCalled.should.be.true();
      mockBaseCoin.deriveKeyWithSeed.notCalled.should.be.true();
    });

    it('aborts locally when derived pub does not match registered child pub', async function () {
      const wallet = makeWallet({ safeId: 'safe-id-1' });
      keychainsGetStub.resolves({
        id: rootKeyId,
        source: 'user',
        encryptedPrv: `enc:${prv}`,
        type: 'independent',
        pub: 'root-pub',
      });

      await wallet
        .getUserPrv({
          keychain: {
            id: 'child-key',
            pub: 'xpub-wrong-registered-key',
            type: 'independent',
            parent: rootKeyId,
            derivedFromParentWithSeed: '123',
          },
          walletPassphrase: passphrase,
        })
        .should.be.rejectedWith(SafeDerivedPublicKeyMismatchError);
    });

    it('decrypts child encryptedPrv as-is for wallet sharee (hardened child prv)', async function () {
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

      result.should.eql(softDerivedPrv);
      mockBaseCoin.deriveKeyWithSeed.calledOnce.should.be.true();
    });

    it('does not apply an explicit coldDerivationSeed after decrypting encryptedPrv', async function () {
      const wallet = makeWallet();
      const childPrv = prv;

      const result = await wallet.getUserPrv({
        keychain: {
          id: 'smc-key',
          pub: 'smc-pub',
          type: 'independent',
          encryptedPrv: `enc:${childPrv}`,
        },
        walletPassphrase: passphrase,
        coldDerivationSeed: '123',
      });

      result.should.eql(childPrv);
      mockBaseCoin.deriveKeyWithSeed.notCalled.should.be.true();
    });

    it('throws encryptedPrv error before walletPassphrase when both are missing', async function () {
      const wallet = makeWallet();
      await wallet
        .getUserPrv({
          keychain: {
            id: 'child-key',
            pub: 'pub',
            type: 'independent',
          },
        })
        .should.be.rejectedWith('keychain does not have property encryptedPrv');
    });
  });

  describe('getEncryptedUserKeychain', function () {
    it('still fails for a safe owner so wallet sharing cannot obtain root material', async function () {
      const wallet = makeWallet({ safeId: 'safe-id-1' });
      keychainsGetStub.resolves({
        id: 'user-key',
        pub: 'child-pub',
        type: 'independent',
        parent: rootKeyId,
        derivedFromParentWithSeed: '123',
      });

      await wallet.getEncryptedUserKeychain().should.be.rejectedWith(MissingEncryptedKeychainError);
      keychainsGetStub.called.should.be.true();
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
      keychainsGetStub.resolves({
        id: rootKeyId,
        source: 'user',
        encryptedPrv: `enc:${prv}`,
        type: 'independent',
        pub: 'root-pub',
      });
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
      const signArgs = signStub.firstCall.args[0] as { keychain: typeof childKeychain };
      signArgs.keychain.should.eql(childKeychain);
    });

    it('getUserKeyAndSignTssTransaction rejects wrong passphrase early for safe child wallets', async function () {
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
      keychainsGetStub.resolves({
        id: rootKeyId,
        source: 'user',
        encryptedPrv: `enc:${prv}`,
        type: 'independent',
        pub: 'root-pub',
      });
      mockBaseCoin.keychains.returns({
        get: keychainsGetStub,
        getKeysForSigning: sinon.stub().resolves([childKeychain]),
      });
      const signStub = sinon.stub(Wallet.prototype, 'signTransaction');

      await wallet
        .getUserKeyAndSignTssTransaction({
          txRequestId: 'tx-req',
          walletPassphrase: 'wrong-passphrase',
        })
        .should.be.rejectedWith(IncorrectPasswordError);

      signStub.notCalled.should.be.true();
      keychainsGetStub.calledOnce.should.be.true();
    });

    it('signTransaction does not pass the root prv into TSS signing for a safe owner', async function () {
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
      keychainsGetStub.resolves({
        id: rootKeyId,
        source: 'user',
        encryptedPrv: `enc:${prv}`,
        type: 'independent',
        pub: 'root-pub',
      });
      mockBaseCoin.keychains.returns({
        get: keychainsGetStub,
        getKeysForSigning: sinon.stub().resolves([childKeychain]),
      });
      mockBaseCoin.presignTransaction = sinon.stub().callsFake(async (params: any) => params);
      mockBaseCoin.getMPCAlgorithm = sinon.stub().returns('eddsa');
      const signTssStub = sinon.stub(Wallet.prototype as any, 'signTransactionTss').resolves({ txHex: 'signed' });

      await wallet
        .signTransaction({
          walletPassphrase: passphrase,
          txPrebuild: { txRequestId: 'tx-req' },
        })
        .should.be.rejectedWith(SafeOwnerSigningNotImplementedError);
      signTssStub.notCalled.should.be.true();
    });
  });
});

describe('WCN-1200 recreateAndSignTSSTransaction safe path', function () {
  afterEach(function () {
    sinon.restore();
  });

  function makePendingApproval(wallet: any) {
    const recreateTxRequest = sinon.stub().resolves({
      apiVersion: 'lite',
      txRequestId: 'tx-req',
      unsignedTxs: [{ serializedTxHex: 'deadbeef', signableHex: 'ab', derivationPath: 'm/0' }],
      transactions: [],
    });
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
    return { pendingApproval, recreateTxRequest };
  }

  it('uses getUserPrv for the safe owner (minter) instead of getPrv', async function () {
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
    const { pendingApproval, recreateTxRequest } = makePendingApproval(wallet);

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

  it('uses getPrv for a safe wallet sharee (child encryptedPrv already present)', async function () {
    const childUserKeychain = {
      id: 'child-key',
      pub: 'child-pub',
      type: 'tss',
      parent: 'root-key-id',
      derivedFromParentWithSeed: 'seed',
      encryptedPrv: 'enc:sharee-prv',
    };
    const getKeysForSigning = sinon.stub().resolves([childUserKeychain]);
    const getUserPrv = sinon.stub().resolves('should-not-be-called');
    const getPrv = sinon.stub().resolves('sharee-prv');
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
    const { pendingApproval, recreateTxRequest } = makePendingApproval(wallet);

    const result = await pendingApproval.recreateAndSignTSSTransaction(
      { walletPassphrase: 'pass' },
      new RequestTracer()
    );

    result.should.eql({ txHex: 'deadbeef' });
    getUserPrv.notCalled.should.be.true();
    getPrv.calledOnceWithExactly({ walletPassphrase: 'pass' }).should.be.true();
    recreateTxRequest.calledOnce.should.be.true();
  });
});
