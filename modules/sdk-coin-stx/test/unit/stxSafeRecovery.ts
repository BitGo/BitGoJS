import should from 'should';
import nock from 'nock';
import { bip32 } from '@bitgo/secp256k1';
import {
  buildSafeRecoverKeyParams,
  deriveSafeWalletKeys,
  ErrorNoInputToRecover,
  RecoveryKeyMismatchError,
  RecoveryProviderError,
  type DecryptedSafeRoots,
  type Secp256k1MultisigChildKeys,
} from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tstx, StxLib } from '../../src';
import * as testData from '../fixtures';

const recoveryDestination = testData.DESTINATION_ADDRESS_WRW;
const nodeUrl = 'https://api.testnet.hiro.so';

/**
 * End-to-end Safe STX recovery: derive slot-1 (secp256k1Multisig) children from real roots, map them
 * with buildSafeRecoverKeyParams, and prove `Stx.recover()` accepts both modes while verifying that
 * the three child pubs really do form the 2-of-3 multisig address being recovered.
 *
 * The mismatch check is the gap this suite pins: before WCN-3946 `recover()` queried the balance and
 * nonce of whatever `rootAddress` it was handed before looking at the keys at all, so a wrong
 * passphrase surfaced as `ErrorNoInputToRecover` (or, worse, built a transfer signed with keys that
 * do not control the address). The mismatch must now fire with zero network calls.
 */
describe('Safe STX recovery end-to-end', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Tstx;

  let safeKeys: Secp256k1MultisigChildKeys;
  let otherKeys: Secp256k1MultisigChildKeys;
  let rootAddress: string;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tstx', Tstx.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tstx') as Tstx;

    safeKeys = await deriveSecp256k1MultisigKeys([1, 2, 3]);
    otherKeys = await deriveSecp256k1MultisigKeys([4, 5, 6]);
    rootAddress = multisigAddressOf(safeKeys);
  });

  afterEach(function () {
    nock.cleanAll();
  });

  /** Distinct secp256k1 root triplets so user, backup and bitgo children are different keys. */
  function secp256k1Roots([u, b, g]: [number, number, number]): DecryptedSafeRoots {
    const root = (fill: number) => bip32.fromSeed(Buffer.alloc(32, fill));
    return {
      secp256k1Multisig: {
        user: root(u).toBase58(),
        backup: root(b).toBase58(),
        bitgo: root(g).neutered().toBase58(),
      },
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

  async function deriveSecp256k1MultisigKeys(seeds: [number, number, number]): Promise<Secp256k1MultisigChildKeys> {
    const derived = await deriveSafeWalletKeys({
      coin: 'tstx',
      slot: 'secp256k1Multisig',
      account: 0,
      roots: secp256k1Roots(seeds),
    });
    if (derived.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig slot');
    }
    return derived.keys;
  }

  /** The wallet's 2-of-3 multisig address over the three child pubs, as `recover()` derives it. */
  function multisigAddressOf(keys: Secp256k1MultisigChildKeys): string {
    const pubs = [keys.user.pub, keys.backup.pub, keys.bitgo.pub].map((xpub) => StxLib.Utils.xpubToSTXPubkey(xpub));
    return StxLib.Utils.getSTXAddressFromPubKeys(pubs, StxLib.Utils.getAddressVersion(testData.HOT_WALLET_ROOT_ADDRESS))
      .address;
  }

  function keyParams(keys: Secp256k1MultisigChildKeys, mode: 'signed' | 'unsigned') {
    return buildSafeRecoverKeyParams({ bitgo, coin: 'tstx', slot: 'secp256k1Multisig', keys, mode });
  }

  function stubNodeQueries(address: string, balance = testData.ACCOUNT_BALANCE_RESPONSE) {
    nock(nodeUrl).get(`/extended/v2/addresses/${address}/balances/stx`).reply(200, balance);
    nock(nodeUrl).get(`/extended/v1/address/${address}/nonces`).reply(200, testData.ACCOUNT_NONCE_RESPONSE);
    nock(nodeUrl, { allowUnmocked: true }).post('/v2/fees/transaction').reply(200, testData.FEE_ESTIMATION_RESPONSE);
  }

  it('recovers a Safe STX wallet in signed mode', async function () {
    const params = await keyParams(safeKeys, 'signed');
    stubNodeQueries(rootAddress);

    const recovery = await basecoin.recover({
      userKey: params.userKey,
      backupKey: params.backupKey,
      bitgoKey: params.bitgoKey,
      walletPassphrase: params.walletPassphrase,
      rootAddress,
      recoveryDestination,
    });

    should.exist(recovery);
    (recovery as { txHex: string }).txHex.should.be.a.String();
  });

  it('recovers a Safe STX wallet in unsigned mode (xpubs only, no passphrase)', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    should.not.exist(params.walletPassphrase);
    stubNodeQueries(rootAddress);

    const recovery = await basecoin.recover({
      userKey: params.userKey,
      backupKey: params.backupKey,
      bitgoKey: params.bitgoKey,
      rootAddress,
      recoveryDestination,
    });

    should.exist(recovery);
    (recovery as { txHex: string }).txHex.should.be.a.String();
  });

  it('fails closed with RecoveryKeyMismatchError and zero network calls on a wrong passphrase', async function () {
    // A wrong passphrase decrypts to a valid but different keycard, so the three child pubs form a
    // different multisig address than the wallet being recovered.
    const params = await keyParams(otherKeys, 'signed');
    stubNodeQueries(rootAddress);

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletPassphrase: params.walletPassphrase,
        rootAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryKeyMismatchError);
    (caughtError as Error).message.should.match(/does not match the given root address/);
    // All three node mocks are untouched: the check is offline and runs before balance and nonce.
    nock.pendingMocks().should.have.length(3);
  });

  it('fails closed with RecoveryKeyMismatchError in unsigned mode too', async function () {
    const params = await keyParams(otherKeys, 'unsigned');
    stubNodeQueries(rootAddress);

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        rootAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryKeyMismatchError);
    nock.pendingMocks().should.have.length(3);
  });

  it('reports an empty wallet as ErrorNoInputToRecover once the keys do match', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    stubNodeQueries(rootAddress, { ...testData.ACCOUNT_BALANCE_RESPONSE, balance: '0' });

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        rootAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(ErrorNoInputToRecover);
  });

  it('surfaces a dead node as RecoveryProviderError, not as an empty wallet', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    nock(nodeUrl).get(`/extended/v2/addresses/${rootAddress}/balances/stx`).reply(500, { error: 'node unavailable' });
    nock(nodeUrl).get(`/extended/v1/address/${rootAddress}/nonces`).reply(200, testData.ACCOUNT_NONCE_RESPONSE);

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        rootAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryProviderError);
    (caughtError as Error).should.not.be.instanceOf(ErrorNoInputToRecover);
  });
});
