import assert from 'assert';
import Sinon from 'sinon';
import nacl from 'tweetnacl';
import { Hbar as HbarUnit } from '@hashgraph/sdk';
import { proto } from '@hashgraph/proto';
import { coins } from '@bitgo/statics';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import {
  buildSafeRecoverKeyParams,
  deriveSafeWalletKeys,
  encodeDerivableEd25519Pub,
  encodeEd25519ChainCode,
  encodeHbarPublicKeyDer,
  ErrorNoInputToRecover,
  RecoveryKeyMismatchError,
  RecoveryProviderError,
  type DecryptedSafeRoots,
  type Ed25519MultisigChildKeys,
} from '@bitgo/sdk-core';
import { Hbar, Thbar, Transaction } from '../../src';

// Real derivation, encryption, and signing from decrypted keycard roots. Only chain queries are mocked.
describe('Safe HBAR recovery end-to-end', function () {
  const sandbox = Sinon.createSandbox();
  let bitgo: TestBitGoAPI;
  let basecoin: Hbar;
  let keys: Ed25519MultisigChildKeys;
  let getAccountKeysStub: Sinon.SinonStub;
  let getAccountBalanceStub: Sinon.SinonStub;

  const recoveryParams = {
    rootAddress: '0.0.12345',
    recoveryDestination: '0.0.99999',
    startTime: '1700000010.123456789',
    maxFee: '10000000',
  };

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('thbar', Thbar.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('thbar') as Hbar;

    const seed = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';
    const bitgoRootPub = Buffer.from(nacl.sign.keyPair.fromSeed(Buffer.alloc(32, 0x22)).publicKey);
    const roots: DecryptedSafeRoots = {
      secp256k1Multisig: { user: 'u', backup: 'b', bitgo: 'g' },
      ed25519Multisig: {
        user: seed,
        backup: { prv: seed, chainCode: encodeEd25519ChainCode(Buffer.alloc(32, 0xab)) },
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
    const derived = await deriveSafeWalletKeys({ coin: 'thbar', slot: 'ed25519Multisig', account: 0, roots });
    assert(derived.slot === 'ed25519Multisig');
    keys = derived.keys;
  });

  beforeEach(function () {
    sandbox.useFakeTimers({ now: 1700000000000, toFake: ['Date'] });
    getAccountKeysStub = sandbox
      .stub(basecoin, 'getAccountKeys')
      .resolves([keys.user.pub, keys.backup.pub, keys.bitgo.pub]);
    getAccountBalanceStub = sandbox
      .stub(basecoin, 'getAccountBalance')
      .resolves({ hbars: new HbarUnit(10).toString(), tokens: [] });
  });

  afterEach(function () {
    sandbox.restore();
  });

  async function signedKeyParams() {
    const params = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'thbar',
      slot: 'ed25519Multisig',
      keys,
      mode: 'signed',
    });
    assert(params.mode === 'signed');
    return {
      ...params,
      externalBackupSigner: {
        ...params.externalBackupSigner,
        sign: sandbox.spy(params.externalBackupSigner.sign),
      },
    };
  }

  it('returns public keys and a transaction signed by the derived user and seedless backup children', async function () {
    const keyParams = await signedKeyParams();
    assert(!('rootAddress' in keyParams));
    assert.strictEqual(new Set([keys.user.pub, keys.backup.pub, keys.bitgo.pub]).size, 3);
    const decryptSpy = sandbox.spy(bitgo, 'decrypt');
    const broadcastStub = sandbox.stub(basecoin, 'broadcastTransaction').rejects(new Error('must not broadcast'));

    const recovery = await basecoin.recover({ ...recoveryParams, ...keyParams });
    assert('tx' in recovery);
    assert.strictEqual(recovery.coin, 'thbar');
    assert.strictEqual(recovery.rootAddress, recoveryParams.rootAddress);
    assert.strictEqual(recovery.userKey, encodeHbarPublicKeyDer(Buffer.from(keys.user.pub, 'hex')));
    assert.strictEqual(recovery.backupKey, encodeHbarPublicKeyDer(Buffer.from(keys.backup.pub, 'hex')));
    assert.strictEqual(recovery.bitgoKey, encodeHbarPublicKeyDer(Buffer.from(keys.bitgo.pub, 'hex')));
    assert.notStrictEqual(recovery.userKey, keyParams.userKey);
    assert.deepStrictEqual(
      Object.keys(recovery).sort(),
      ['tx', 'id', 'coin', 'startTime', 'nodeId', 'userKey', 'backupKey', 'bitgoKey', 'rootAddress'].sort()
    );
    const serialized = JSON.stringify(recovery);
    for (const secret of [keys.user.seed, keys.backup.kL, keys.backup.kR, keyParams.walletPassphrase]) {
      assert(!serialized.includes(secret));
    }

    const { bodyBytes, sigMap } = proto.Transaction.decode(Buffer.from(recovery.tx, 'hex'));
    assert(sigMap?.sigPair);
    assert.deepStrictEqual(
      sigMap.sigPair.map((pair) => Buffer.from(pair.pubKeyPrefix ?? []).toString('hex')).sort(),
      [keys.user.pub, keys.backup.pub].sort()
    );
    for (const pair of sigMap.sigPair) {
      assert(pair.ed25519);
      assert(pair.pubKeyPrefix);
      assert(nacl.sign.detached.verify(bodyBytes, pair.ed25519, pair.pubKeyPrefix));
    }
    Sinon.assert.calledOnce(keyParams.externalBackupSigner.sign);
    assert.deepStrictEqual(Buffer.from(keyParams.externalBackupSigner.sign.firstCall.args[0]), Buffer.from(bodyBytes));
    Sinon.assert.calledOnce(decryptSpy);
    Sinon.assert.notCalled(broadcastStub);

    const transaction = new Transaction(coins.get('thbar'));
    transaction.fromRawTransaction(recovery.tx);
    const json = transaction.toJson();
    assert.strictEqual(json.from, recoveryParams.rootAddress);
    assert.strictEqual(json.to, recoveryParams.recoveryDestination);
    assert.strictEqual(json.amount, '990000000');
    assert.strictEqual(json.startTime, recoveryParams.startTime);
    assert.strictEqual(json.fee, Number(recoveryParams.maxFee));
  });

  it('returns public keys and an unsigned transaction without encrypting or decrypting', async function () {
    const encryptSpy = sandbox.spy(bitgo, 'encrypt');
    const decryptSpy = sandbox.spy(bitgo, 'decrypt');
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'thbar',
      slot: 'ed25519Multisig',
      keys,
      mode: 'unsigned',
    });
    assert(keyParams.mode === 'unsigned');
    const recovery = await basecoin.recover({ ...recoveryParams, ...keyParams });
    assert('txHex' in recovery);
    assert.strictEqual(recovery.address, recoveryParams.rootAddress);
    assert.strictEqual(recovery.userKey, encodeHbarPublicKeyDer(Buffer.from(keys.user.pub, 'hex')));
    assert.strictEqual(recovery.backupKey, encodeHbarPublicKeyDer(Buffer.from(keys.backup.pub, 'hex')));
    assert.strictEqual(recovery.bitgoKey, encodeHbarPublicKeyDer(Buffer.from(keys.bitgo.pub, 'hex')));
    const { sigMap } = proto.Transaction.decode(Buffer.from(recovery.txHex, 'hex'));
    assert.strictEqual(sigMap?.sigPair?.length ?? 0, 0);
    Sinon.assert.notCalled(encryptSpy);
    Sinon.assert.notCalled(decryptSpy);
  });

  for (const missingSigner of ['user', 'backup'] as const) {
    it(`rejects a missing on-chain ${missingSigner} key before querying the balance or signing`, async function () {
      const keyParams = await signedKeyParams();
      getAccountKeysStub.resolves(
        [keys.user.pub, keys.backup.pub, keys.bitgo.pub].filter((pub) => pub !== keys[missingSigner].pub)
      );
      await assert.rejects(() => basecoin.recover({ ...recoveryParams, ...keyParams }), RecoveryKeyMismatchError);
      Sinon.assert.notCalled(getAccountBalanceStub);
      Sinon.assert.notCalled(keyParams.externalBackupSigner.sign);
    });
  }

  it('rejects a malformed optional bitgoKey before querying the account, the balance, or signing', async function () {
    const keyParams = await signedKeyParams();
    await assert.rejects(
      () => basecoin.recover({ ...recoveryParams, ...keyParams, bitgoKey: 'not-a-public-key' }),
      /invalid bitgoKey/
    );
    Sinon.assert.notCalled(getAccountKeysStub);
    Sinon.assert.notCalled(getAccountBalanceStub);
    Sinon.assert.notCalled(keyParams.externalBackupSigner.sign);
  });

  it('reports an empty account without invoking the backup signer', async function () {
    const keyParams = await signedKeyParams();
    getAccountBalanceStub.resolves({ hbars: new HbarUnit(0).toString(), tokens: [] });
    await assert.rejects(() => basecoin.recover({ ...recoveryParams, ...keyParams }), ErrorNoInputToRecover);
    Sinon.assert.notCalled(keyParams.externalBackupSigner.sign);
  });

  for (const query of ['keys', 'balance'] as const) {
    it(`preserves a ${query} provider failure instead of treating it as an empty account`, async function () {
      const keyParams = await signedKeyParams();
      const failure = new RecoveryProviderError('fixture provider unavailable');
      const queries = { keys: getAccountKeysStub, balance: getAccountBalanceStub };
      queries[query].rejects(failure);
      await assert.rejects(
        () => basecoin.recover({ ...recoveryParams, ...keyParams }),
        (error) => error === failure
      );
      Sinon.assert.notCalled(keyParams.externalBackupSigner.sign);
      if (query === 'keys') {
        Sinon.assert.notCalled(getAccountBalanceStub);
      }
    });
  }
});
