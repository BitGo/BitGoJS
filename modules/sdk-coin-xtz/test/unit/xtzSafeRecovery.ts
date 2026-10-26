import should from 'should';
import nock from 'nock';
import Sinon from 'sinon';
import {
  common,
  buildSafeRecoverKeyParams,
  deriveSafeWalletKeys,
  RecoveryKeyMismatchError,
  RecoveryProviderError,
  type DecryptedSafeRoots,
  type Secp256k1MultisigChildKeys,
} from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Txtz, XtzLib } from '../../src';
import { chainheadData, packDataToSign } from '../fixtures';

const walletContractAddress = 'KT1RsZPTQ9BCmL6RMDgJuPdVPwAEERSoqmJi';
const recoveryDestination = 'tz2RtnvELVAW5dUTtsBNG6cbSA2eQFiYt4Rp';
const baseUrl = common.Environments.test.xtzExplorerBaseUrl as string;
const rpcUrl = common.Environments.test.xtzRpcUrl as string;

/**
 * End-to-end Safe XTZ recovery: derive slot-1 (secp256k1Multisig) children from real roots,
 * map them with buildSafeRecoverKeyParams, and prove `Xtz.recover()` accepts them while (a) verifying
 * the user/backup/bitgo keys are the KT1 contract owners in both signed and unsigned modes, and
 * (b) leaving the legacy path (no bitgoKey) untouched.
 *
 * The storage mock matches the REAL TZKT normalized shape: `/v1/contracts/{addr}/storage` returns
 * storage keyed by its Michelson field annotations, so the generic multisig type
 * `pair (nat %stored_counter) (pair (nat %threshold) (list %keys key))` yields
 * `{ stored_counter, threshold, keys: ["sppk...", ...] }`. Verified against live TZKT: the endpoint
 * returns normalized JSON, not micheline.
 */
describe('Safe XTZ recovery end-to-end', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Txtz;
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    nock.cleanAll();
    sandbox.restore();
  });

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('txtz', Txtz.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txtz') as Txtz;
  });

  // Distinct secp256k1 root triplets so user, backup and bitgo children are different keys.
  function secp256k1Roots(): DecryptedSafeRoots {
    const user = new XtzLib.KeyPair({ seed: Buffer.alloc(32, 1) }).getExtendedKeys();
    const backup = new XtzLib.KeyPair({ seed: Buffer.alloc(32, 2) }).getExtendedKeys();
    const bitgo = new XtzLib.KeyPair({ seed: Buffer.alloc(32, 3) }).getExtendedKeys();
    if (!user.xprv || !backup.xprv) {
      throw new Error('expected private root keys');
    }
    return {
      secp256k1Multisig: { user: user.xprv, backup: backup.xprv, bitgo: bitgo.xpub },
      ed25519Multisig: { user: 'u', backup: { prv: 'b', chainCode: 'cc' }, bitgo: 'g' },
      ecdsaMpc: {
        user: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        backup: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        bitgo: 'g',
      },
      eddsaMpc: {
        user: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        backup: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        bitgo: 'g',
      },
    };
  }

  interface SafeDerived {
    keys: Secp256k1MultisigChildKeys;
    userPub: string;
    backupPub: string;
    bitgoPub: string;
    feeAddress: string;
  }

  async function deriveSafe(): Promise<SafeDerived> {
    const derived = await deriveSafeWalletKeys({
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      account: 0,
      roots: secp256k1Roots(),
    });
    if (derived.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig slot');
    }
    return {
      keys: derived.keys,
      userPub: new XtzLib.KeyPair({ prv: derived.keys.user.prv }).getKeys().pub,
      backupPub: new XtzLib.KeyPair({ prv: derived.keys.backup.prv }).getKeys().pub,
      bitgoPub: new XtzLib.KeyPair({ pub: derived.keys.bitgo.pub }).getKeys().pub,
      feeAddress: new XtzLib.KeyPair({ prv: derived.keys.backup.prv }).getAddress(),
    };
  }

  // TZKT-normalized generic multisig storage: `{ stored_counter, threshold, keys: ["sppk...", ...] }`.
  function ownerStorage(keys: string[]) {
    return {
      stored_counter: '0',
      threshold: keys.length.toString(),
      keys,
    };
  }

  function stubWalletAccount() {
    nock(baseUrl).get(`/v1/accounts/${walletContractAddress}`).reply(200, {
      address: walletContractAddress,
      type: 'contract',
      kind: 'smart_contract',
      balance: 10000000,
    });
  }

  function stubCoreExplorer() {
    stubWalletAccount();
    nock(baseUrl).get('/v1/head').reply(200, chainheadData);
    nock(rpcUrl)
      .post('/chains/main/blocks/head/helpers/scripts/pack_data', () => true)
      .reply(200, packDataToSign);
  }

  function stubFeeAccount(feeAddress: string) {
    nock(baseUrl).get(`/v1/accounts/${feeAddress}`).reply(200, {
      address: feeAddress,
      type: 'user',
      balance: 1000000,
      counter: 100,
      revealed: true,
    });
  }

  function stubContractStorage(keys: string[]) {
    nock(baseUrl).get(`/v1/contracts/${walletContractAddress}/storage`).reply(200, ownerStorage(keys));
  }

  function pendingStorageCount(): number {
    return nock.pendingMocks().filter((m) => m.includes('/storage')).length;
  }

  it('recovers a Safe XTZ wallet in signed mode after verifying all three owners', async function () {
    const safe = await deriveSafe();
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'signed',
    });
    if (keyParams.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig key params');
    }

    stubCoreExplorer();
    stubFeeAccount(safe.feeAddress);
    stubContractStorage([safe.userPub, safe.bitgoPub, safe.backupPub]);

    const recovery: any = await basecoin.recover({
      userKey: keyParams.userKey,
      backupKey: keyParams.backupKey,
      bitgoKey: keyParams.bitgoKey,
      walletPassphrase: keyParams.walletPassphrase,
      walletContractAddress,
      recoveryDestination,
    });

    should.exist(recovery);
    recovery.id.should.be.a.String();
    recovery.tx.should.be.a.String();
    // The owner check ran and consumed the storage mock: the positive gate is pinned.
    pendingStorageCount().should.equal(0);
  });

  it('recovers a Safe XTZ wallet in unsigned mode (xpubs, no bitgo.decrypt) after verifying owners', async function () {
    const safe = await deriveSafe();
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'unsigned',
    });

    stubCoreExplorer();
    stubFeeAccount(safe.feeAddress);
    stubContractStorage([safe.userPub, safe.bitgoPub, safe.backupPub]);

    const decryptSpy = sandbox.spy(bitgo, 'decrypt');
    const recovery: any = await basecoin.recover({
      userKey: keyParams.userKey,
      backupKey: keyParams.backupKey,
      bitgoKey: keyParams.bitgoKey,
      walletContractAddress,
      recoveryDestination,
    });

    Sinon.assert.notCalled(decryptSpy);
    should.exist(recovery);
    recovery.txHex.should.be.a.String();
    recovery.source.should.equal(walletContractAddress);
    pendingStorageCount().should.equal(0);
  });

  it('signed mode accepts raw xprv user and backup keys without bitgo.decrypt', async function () {
    const safe = await deriveSafe();
    const derived = await deriveSafeWalletKeys({
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      account: 0,
      roots: secp256k1Roots(),
    });
    if (derived.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig slot');
    }

    stubCoreExplorer();
    stubFeeAccount(safe.feeAddress);
    stubContractStorage([safe.userPub, safe.bitgoPub, safe.backupPub]);

    const decryptSpy = sandbox.spy(bitgo, 'decrypt');
    const recovery: any = await basecoin.recover({
      userKey: derived.keys.user.prv,
      backupKey: derived.keys.backup.prv,
      bitgoKey: derived.keys.bitgo.pub,
      walletPassphrase: 'unused-passphrase',
      walletContractAddress,
      recoveryDestination,
    });

    should.exist(recovery);
    recovery.tx.should.be.a.String();
    Sinon.assert.notCalled(decryptSpy);
    pendingStorageCount().should.equal(0);
  });

  it('signed Safe mode accepts an xpub user key without trying to decrypt it', async function () {
    const safe = await deriveSafe();
    const derived = await deriveSafeWalletKeys({
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      account: 0,
      roots: secp256k1Roots(),
    });
    if (derived.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig slot');
    }
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'signed',
    });

    stubCoreExplorer();
    stubFeeAccount(safe.feeAddress);
    stubContractStorage([safe.userPub, safe.bitgoPub, safe.backupPub]);

    const decryptSpy = sandbox.spy(bitgo, 'decrypt');
    const recovery: any = await basecoin.recover({
      userKey: derived.keys.user.pub,
      backupKey: keyParams.backupKey,
      bitgoKey: keyParams.bitgoKey,
      walletPassphrase: keyParams.walletPassphrase,
      walletContractAddress,
      recoveryDestination,
    });

    should.exist(recovery);
    recovery.tx.should.be.a.String();
    // The encrypted backup envelope is decrypted exactly once; the xpub user key is never decrypted.
    decryptSpy.callCount.should.equal(1);
    pendingStorageCount().should.equal(0);
  });

  it('reports a missing userKey as a validation error, not a TypeError', async function () {
    let caughtError: unknown;
    try {
      await (basecoin as any).recover({
        backupKey: 'backup-key-placeholder',
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }
    (caughtError as Error).should.be.instanceOf(Error);
    (caughtError as Error).should.not.be.instanceOf(TypeError);
    (caughtError as Error).message.should.match(/missing userKey/);
  });

  it('legacy signed recovery (no bitgoKey) never queries contract storage', async function () {
    const safe = await deriveSafe();
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'signed',
    });

    stubCoreExplorer();
    stubFeeAccount(safe.feeAddress);
    // No storage mock is registered: any storage query would fail the test with a nock error.

    const storageSpy = sandbox.spy(basecoin, 'recoveryBlockchainExplorerQuery');
    const recovery: any = await basecoin.recover({
      userKey: keyParams.userKey,
      backupKey: keyParams.backupKey,
      walletPassphrase: keyParams.walletPassphrase,
      walletContractAddress,
      recoveryDestination,
    });

    should.exist(recovery);
    recovery.tx.should.be.a.String();
    const storageCalls = storageSpy
      .getCalls()
      .filter((c) => c.args[0]?.actionPath === 'contracts' && c.args[0]?.action === 'storage');
    storageCalls.should.have.length(0);
  });

  it('fails closed with RecoveryKeyMismatchError before the fee-account query when keys are not owners', async function () {
    const safe = await deriveSafe();
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'signed',
    });

    const otherPub = (n: number) => new XtzLib.KeyPair({ seed: Buffer.alloc(32, n) }).getKeys().pub;
    stubWalletAccount();
    stubContractStorage([otherPub(11), otherPub(12), otherPub(13)]);
    stubFeeAccount(safe.feeAddress);

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: keyParams.userKey,
        backupKey: keyParams.backupKey,
        bitgoKey: keyParams.bitgoKey,
        walletPassphrase: keyParams.walletPassphrase,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }
    (caughtError as Error).should.be.instanceOf(RecoveryKeyMismatchError);
    (caughtError as any).code.should.equal('recovery_key_mismatch');
    // The fee-account nock must still be pending: the mismatch fires before any fee/balance check.
    const pendingFee = nock.pendingMocks().filter((m) => m.includes(`/v1/accounts/${safe.feeAddress}`));
    pendingFee.should.have.length(1);
  });

  it('fails closed with RecoveryProviderError when the storage endpoint fails', async function () {
    const safe = await deriveSafe();
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'signed',
    });
    if (keyParams.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig key params');
    }

    stubWalletAccount();
    nock(baseUrl).get(`/v1/contracts/${walletContractAddress}/storage`).replyWithError(new Error('boom'));

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: keyParams.userKey,
        backupKey: keyParams.backupKey,
        bitgoKey: keyParams.bitgoKey,
        walletPassphrase: keyParams.walletPassphrase,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }
    (caughtError as Error).should.be.instanceOf(RecoveryProviderError);
  });

  it('fails closed with RecoveryProviderError on an unexpected storage shape', async function () {
    const safe = await deriveSafe();
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'signed',
    });
    if (keyParams.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig key params');
    }

    stubWalletAccount();
    nock(baseUrl)
      .get(`/v1/contracts/${walletContractAddress}/storage`)
      .reply(200, { stored_counter: '0', threshold: '2', keys: ['not-a-public-key', safe.backupPub] });

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: keyParams.userKey,
        backupKey: keyParams.backupKey,
        bitgoKey: keyParams.bitgoKey,
        walletPassphrase: keyParams.walletPassphrase,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }
    (caughtError as Error).should.be.instanceOf(RecoveryProviderError);
  });

  it('rejects a malformed (private) bitgoKey before any explorer call, without echoing it', async function () {
    const safe = await deriveSafe();
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'signed',
    });
    if (keyParams.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig key params');
    }

    const explorerSpy = sandbox.spy(basecoin, 'recoveryBlockchainExplorerQuery');
    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: keyParams.userKey,
        backupKey: keyParams.backupKey,
        bitgoKey: safe.keys.user.prv,
        walletPassphrase: keyParams.walletPassphrase,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }
    (caughtError as Error).message.should.match(/invalid bitgo key for Safe recovery/);
    (caughtError as Error).message.should.not.containEql('xprv');
    Sinon.assert.notCalled(explorerSpy);
  });

  it('fails closed with RecoveryProviderError when storage reports too many owners', async function () {
    const safe = await deriveSafe();
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'signed',
    });
    if (keyParams.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig key params');
    }

    stubWalletAccount();
    stubContractStorage(Array(101).fill(safe.userPub));

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: keyParams.userKey,
        backupKey: keyParams.backupKey,
        bitgoKey: keyParams.bitgoKey,
        walletPassphrase: keyParams.walletPassphrase,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }
    (caughtError as Error).should.be.instanceOf(RecoveryProviderError);
  });

  it('unsigned mode fails closed with RecoveryKeyMismatchError when the bitgo key is not an owner', async function () {
    const safe = await deriveSafe();
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txtz',
      slot: 'secp256k1Multisig',
      keys: safe.keys,
      mode: 'unsigned',
    });

    const otherPub = (n: number) => new XtzLib.KeyPair({ seed: Buffer.alloc(32, n) }).getKeys().pub;
    stubCoreExplorer();
    stubFeeAccount(safe.feeAddress);
    stubContractStorage([safe.userPub, otherPub(11), safe.backupPub]);

    const decryptSpy = sandbox.spy(bitgo, 'decrypt');
    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: keyParams.userKey,
        backupKey: keyParams.backupKey,
        bitgoKey: keyParams.bitgoKey,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }
    (caughtError as Error).should.be.instanceOf(RecoveryKeyMismatchError);
    Sinon.assert.notCalled(decryptSpy);
  });
});
