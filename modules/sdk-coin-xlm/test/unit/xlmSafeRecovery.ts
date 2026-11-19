import assert from 'assert';
import nock from 'nock';
import Sinon from 'sinon';
import * as stellar from 'stellar-sdk';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import {
  buildSafeRecoverKeyParams,
  decodeEd25519StrKeySecretSeed,
  deriveSafeWalletKeys,
  encodeDerivableEd25519Pub,
  encodeEd25519ChainCode,
  RecoveryKeyMismatchError,
  type DecryptedSafeRoots,
  type DecryptedSafeRootsWithExternal,
} from '@bitgo/sdk-core';
import { Txlm } from '../../src';

/**
 * End-to-end Safe XLM recovery: derive slot-2 children from real roots -> buildSafeRecoverKeyParams
 * -> `Xlm.recover()`. The user child is a hardened seed and the backup child is a seedless soft
 * extended key, so signed recovery signs the backup leg through the lazy external signer; the final
 * transaction carries real signatures that verify under the derived child keys.
 */
describe('Safe XLM recovery end-to-end', function () {
  const horizon = 'https://horizon-testnet.stellar.org';
  const rootAddress = 'GBIEJQUARJ33DIZU4AIRDOKYPSVK66Z3O5XU7OOI7LUOAJWTPI4OA4JI';
  const recoveryDestination = 'GDDHCKMYYYCVXOSAVMSEIYGYNX74LIAV3ACXYQ6WPMDUF7W3KZNWTHTH';
  let bitgo: TestBitGoAPI;
  const sandbox = Sinon.createSandbox();
  let basecoin: Txlm;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('txlm', Txlm.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txlm') as Txlm;
  });

  afterEach(function () {
    nock.cleanAll();
    sandbox.restore();
  });

  // The ed25519Multisig root fixture the sdk-core unit tests pin (with a distinct BitGo root, so the
  // backup child and the BitGo child are different keys and a slot swap changes every assertion).
  const SAFE_SEED = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';
  const backupChainCode = Buffer.alloc(32, 0xab);

  function ed25519Roots(): DecryptedSafeRoots {
    const bitgoRootPub = stellar.Keypair.fromRawEd25519Seed(Buffer.alloc(32, 0x22)).rawPublicKey();
    return {
      secp256k1Multisig: { user: 'u', backup: 'b', bitgo: 'g' },
      ed25519Multisig: {
        user: SAFE_SEED,
        backup: { prv: SAFE_SEED, chainCode: encodeEd25519ChainCode(backupChainCode) },
        bitgo: encodeDerivableEd25519Pub(bitgoRootPub, Buffer.alloc(32, 0xcd)),
      },
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

  // External backup root: only the composite pub (root pub + chain code) is on the keycard.
  function externalEd25519Roots(): DecryptedSafeRootsWithExternal {
    const local = ed25519Roots();
    const backupRootPub = stellar.Keypair.fromRawEd25519Seed(decodeEd25519StrKeySecretSeed(SAFE_SEED)).rawPublicKey();
    return {
      ...local,
      ed25519Multisig: {
        user: local.ed25519Multisig.user,
        backup: { external: true, pub: encodeDerivableEd25519Pub(backupRootPub, backupChainCode) },
        bitgo: local.ed25519Multisig.bitgo,
      },
    };
  }

  async function deriveChildren(
    roots: DecryptedSafeRootsWithExternal = ed25519Roots(),
    externalBackupRootPrv?: string
  ) {
    const derived = await deriveSafeWalletKeys({
      coin: 'txlm',
      slot: 'ed25519Multisig',
      account: 0,
      roots,
      externalBackupRootPrv,
    });
    assert(derived.slot === 'ed25519Multisig');
    const [userPub, backupPub] = [derived.keys.user.pub, derived.keys.backup.pub].map((pub) =>
      stellar.StrKey.encodeEd25519PublicKey(Buffer.from(pub, 'hex'))
    );
    return { derived, userPub, backupPub };
  }

  function nockHorizon(signers: string[]): void {
    nock(`${horizon}/accounts`)
      .get('/' + rootAddress)
      .reply(200, {
        sequence: '35995558267060226',
        balances: [{ asset_type: 'native', balance: '6500000000' }],
        signers: signers.map((key) => ({ key, weight: 1, type: 'ed25519_public_key' })),
      });
    nock(`${horizon}/accounts`)
      .get('/' + recoveryDestination)
      .reply(200, { sequence: '35995558267060213', balances: 13131313 });
    nock(horizon)
      .get('/ledgers')
      .query({ order: 'desc', limit: 1 })
      .reply(200, { records: [{ base_reserve_in_stroops: '5000000', base_fee_in_stroops: 100 }] })
      .persist();
  }

  it('recovers a Safe XLM wallet: user seed and lazy backup signer sign verifiable signatures', async function () {
    const { derived, userPub, backupPub } = await deriveChildren();
    assert.notStrictEqual(derived.keys.user.pub, derived.keys.backup.pub);
    nockHorizon([userPub, backupPub]);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txlm',
      slot: 'ed25519Multisig',
      keys: derived.keys,
      mode: 'signed',
    });
    assert(keyParams.mode === 'signed');
    assert(!('rootAddress' in keyParams));

    const recovery = await basecoin.recover({
      userKey: keyParams.userKey,
      walletPassphrase: keyParams.walletPassphrase,
      externalBackupSigner: keyParams.externalBackupSigner,
      rootAddress,
      recoveryDestination,
    });

    const tx = new stellar.Transaction(recovery.txBase64, stellar.Networks.TESTNET);
    assert.strictEqual(tx.signatures.length, 2);
    assert.ok(stellar.Keypair.fromPublicKey(userPub).verify(tx.hash(), tx.signatures[0].signature()));
    assert.ok(stellar.Keypair.fromPublicKey(backupPub).verify(tx.hash(), tx.signatures[1].signature()));
    assert.strictEqual(recovery.coin, 'txlm');
  });

  it('recovers a Safe XLM wallet from the caller-supplied external backup root prv', async function () {
    const { derived, userPub, backupPub } = await deriveChildren(externalEd25519Roots(), SAFE_SEED);
    assert(derived.keys.backup.kind === 'extended');
    nockHorizon([userPub, backupPub]);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txlm',
      slot: 'ed25519Multisig',
      keys: derived.keys,
      mode: 'signed',
    });
    assert(keyParams.mode === 'signed');

    const recovery = await basecoin.recover({
      userKey: keyParams.userKey,
      walletPassphrase: keyParams.walletPassphrase,
      externalBackupSigner: keyParams.externalBackupSigner,
      rootAddress,
      recoveryDestination,
    });

    const tx = new stellar.Transaction(recovery.txBase64, stellar.Networks.TESTNET);
    assert.strictEqual(tx.signatures.length, 2);
    assert.ok(stellar.Keypair.fromPublicKey(userPub).verify(tx.hash(), tx.signatures[0].signature()));
    assert.ok(stellar.Keypair.fromPublicKey(backupPub).verify(tx.hash(), tx.signatures[1].signature()));

    // The same keys as the local-root recovery for the same seed and chain code.
    const local = await deriveChildren();
    assert.strictEqual(derived.keys.backup.pub, local.derived.keys.backup.pub);
  });

  it('returns an unsigned sweep for the derived child pubs without encrypting or decrypting', async function () {
    const { derived, userPub, backupPub } = await deriveChildren();
    nockHorizon([userPub, backupPub]);
    const encryptSpy = sandbox.spy(bitgo, 'encrypt');
    const decryptSpy = sandbox.spy(bitgo, 'decrypt');

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txlm',
      slot: 'ed25519Multisig',
      keys: derived.keys,
      mode: 'unsigned',
    });
    assert(keyParams.mode === 'unsigned');
    assert.strictEqual(keyParams.userKey, userPub);
    assert.strictEqual(keyParams.backupKey, backupPub);

    const { userKey, backupKey } = keyParams;
    const recovery = await basecoin.recover({ userKey, backupKey, rootAddress, recoveryDestination });

    const tx = new stellar.Transaction(recovery.txBase64, stellar.Networks.TESTNET);
    assert.strictEqual(tx.signatures.length, 0);
    Sinon.assert.notCalled(encryptSpy);
    Sinon.assert.notCalled(decryptSpy);
  });

  it('fails closed with RecoveryKeyMismatchError when the derived keys are not signers of rootAddress', async function () {
    const { derived } = await deriveChildren();
    const otherSigner = stellar.Keypair.random().publicKey();
    nockHorizon([otherSigner]);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txlm',
      slot: 'ed25519Multisig',
      keys: derived.keys,
      mode: 'unsigned',
    });
    assert(keyParams.mode === 'unsigned');

    await assert.rejects(
      basecoin.recover({ ...keyParams, rootAddress, recoveryDestination }),
      (err) => err instanceof RecoveryKeyMismatchError && err.code === 'recovery_key_mismatch'
    );
  });

  it('fails closed with RecoveryKeyMismatchError in signed mode too, before signing anything', async function () {
    const { derived } = await deriveChildren();
    nockHorizon([stellar.Keypair.random().publicKey()]);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'txlm',
      slot: 'ed25519Multisig',
      keys: derived.keys,
      mode: 'signed',
    });
    assert(keyParams.mode === 'signed');

    await assert.rejects(
      basecoin.recover({
        userKey: keyParams.userKey,
        walletPassphrase: keyParams.walletPassphrase,
        externalBackupSigner: keyParams.externalBackupSigner,
        rootAddress,
        recoveryDestination,
      }),
      (err) => err instanceof RecoveryKeyMismatchError && err.code === 'recovery_key_mismatch'
    );
  });
});
