import should from 'should';
import nock from 'nock';
import { bip32 } from '@bitgo/secp256k1';
import {
  buildSafeRecoverKeyParams,
  common,
  deriveSafeWalletKeys,
  ErrorNoInputToRecover,
  RecoveryKeyMismatchError,
  RecoveryProviderError,
  type DecryptedSafeRoots,
  type Secp256k1MultisigChildKeys,
} from '@bitgo/sdk-core';
import { optionalDeps } from '@bitgo/abstract-eth';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TavaxC, KeyPair as AvaxcKeyPair } from '../../src';

const walletContractAddress = '0xe0b1fe098050f2745b450de419b5cafc7e826699';
const recoveryDestination = '0x94b51ebb8c3b90404ad262f42c1588bd94242ecb';
const rpcUrl = common.Environments.test.avaxcNetworkBaseUrl as string;
const rpcPath = '/ext/bc/C/rpc';

const isSignerSelector = optionalDeps.ethAbi.methodID('isSigner', ['address']).toString('hex');
const nextSequenceIdSelector = optionalDeps.ethAbi.methodID('getNextSequenceId', []).toString('hex');

const ENCODED_TRUE = '0x' + '0'.repeat(63) + '1';
const ENCODED_FALSE = '0x' + '0'.repeat(64);

/**
 * End-to-end Safe AVAXC recovery: derive slot-1 (secp256k1Multisig) children from real roots, map
 * them with buildSafeRecoverKeyParams, and prove `AvaxC.recover()` honours the same three contracts
 * the base EVM class does.
 *
 * `AvaxC` overrides `recover()` rather than reusing `recoverEthLike`, so before WCN-3946 it skipped
 * `assertRecoveryKeysAreWalletSigners` entirely and happily built a zero-value sweep of an empty
 * wallet. It also speaks JSON-RPC 2.0 to `/ext/bc/C/rpc` rather than the Etherscan REST API, so the
 * inherited `queryIsWalletSigner` could not have worked here even if it had been called.
 */
describe('Safe AVAXC recovery end-to-end', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: TavaxC;

  let safeKeys: Secp256k1MultisigChildKeys;
  let otherKeys: Secp256k1MultisigChildKeys;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tavaxc', TavaxC.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tavaxc') as TavaxC;

    safeKeys = await deriveSecp256k1MultisigKeys([1, 2, 3]);
    otherKeys = await deriveSecp256k1MultisigKeys([4, 5, 6]);
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
      coin: 'tavaxc',
      slot: 'secp256k1Multisig',
      account: 0,
      roots: secp256k1Roots(seeds),
    });
    if (derived.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig slot');
    }
    return derived.keys;
  }

  function keyParams(keys: Secp256k1MultisigChildKeys, mode: 'signed' | 'unsigned') {
    return buildSafeRecoverKeyParams({ bitgo, coin: 'tavaxc', slot: 'secp256k1Multisig', keys, mode });
  }

  function addressOf(xpub: string): string {
    return new AvaxcKeyPair({ pub: xpub }).getAddress().toLowerCase();
  }

  type RpcRequest = { method: string; params: unknown[] };
  type RpcOverrides = {
    /** EOA addresses the wallet contract reports as signers; everything else answers false. */
    signers?: string[];
    /** wei balance of the wallet contract being swept */
    walletBalance?: string;
    /** wei balance of the backup key EOA, which pays the gas */
    backupBalance?: string;
  };

  /** Records every JSON-RPC method the recovery actually asked for, in order. */
  let rpcCalls: RpcRequest[];

  function stubRpc(overrides: RpcOverrides = {}): void {
    const { signers = [], walletBalance = '0x9c450d592ee800', backupBalance = '0x9c450d592ee800' } = overrides;
    rpcCalls = [];
    nock(rpcUrl)
      .persist()
      .post(rpcPath)
      .reply(200, (uri, body) => {
        const request = body as RpcRequest & { id: number };
        rpcCalls.push({ method: request.method, params: request.params });
        return { jsonrpc: '2.0', id: request.id, result: rpcResult(request, signers, walletBalance, backupBalance) };
      });
  }

  function rpcResult(
    request: RpcRequest,
    signers: string[],
    walletBalance: string,
    backupBalance: string
  ): string | undefined {
    const [first] = request.params as [{ to?: string; data?: string } | string];
    if (request.method === 'eth_getTransactionCount') {
      return '0x7';
    }
    if (request.method === 'eth_getBalance') {
      return (first as string).toLowerCase() === walletContractAddress ? walletBalance : backupBalance;
    }
    if (request.method === 'eth_call') {
      const data = optionalDeps.ethUtil.stripHexPrefix((first as { data: string }).data);
      if (data.startsWith(isSignerSelector)) {
        // the probed address is the last 20 bytes of the single abi-encoded argument
        const probed = `0x${data.slice(-40)}`.toLowerCase();
        return signers.includes(probed) ? ENCODED_TRUE : ENCODED_FALSE;
      }
      if (data.startsWith(nextSequenceIdSelector)) {
        return '0x0000000000000000000000000000000000000000000000000000000000000003';
      }
    }
    return undefined;
  }

  function signersOf(keys: Secp256k1MultisigChildKeys): string[] {
    return [addressOf(keys.user.pub), addressOf(keys.backup.pub)];
  }

  it('recovers a Safe AVAXC wallet in signed mode after verifying both keys are contract signers', async function () {
    const params = await keyParams(safeKeys, 'signed');
    stubRpc({ signers: signersOf(safeKeys) });

    const recovery = await basecoin.recover({
      userKey: params.userKey,
      backupKey: params.backupKey,
      bitgoKey: params.bitgoKey,
      walletPassphrase: params.walletPassphrase,
      walletContractAddress,
      recoveryDestination,
    });

    should.exist(recovery);
    (recovery as { tx: string }).tx.should.be.a.String();
    // The signer check ran before the nonce query, not after it.
    rpcCalls[0].method.should.equal('eth_call');
    rpcCalls.findIndex((c) => c.method === 'eth_getTransactionCount').should.be.above(1);
  });

  it('recovers a Safe AVAXC wallet in unsigned mode (xpubs only, no passphrase)', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    should.not.exist(params.walletPassphrase);
    stubRpc({ signers: signersOf(safeKeys) });

    const recovery = await basecoin.recover({
      userKey: params.userKey,
      backupKey: params.backupKey,
      bitgoKey: params.bitgoKey,
      walletContractAddress,
      recoveryDestination,
    });

    should.exist(recovery);
    (recovery as unknown as { txHex: string }).txHex.should.be.a.String();
    (recovery as unknown as { walletContractAddress: string }).walletContractAddress.should.equal(
      walletContractAddress
    );
  });

  it('fails closed with RecoveryKeyMismatchError before any balance query on a wrong passphrase', async function () {
    // A wrong passphrase decrypts to a valid but different keycard, whose EOAs are not signers on
    // the wallet contract.
    const params = await keyParams(otherKeys, 'signed');
    stubRpc({ signers: signersOf(safeKeys) });

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletPassphrase: params.walletPassphrase,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryKeyMismatchError);
    (caughtError as Error).message.should.match(/are not signers of wallet contract/);
    // Only the two isSigner probes were made; no balance or nonce query followed.
    rpcCalls.every((c) => c.method === 'eth_call').should.be.true();
  });

  it('reports an empty wallet as ErrorNoInputToRecover once the keys do check out', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    stubRpc({ signers: signersOf(safeKeys), walletBalance: '0x0' });

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(ErrorNoInputToRecover);
    (caughtError as Error).message.should.match(/no balance of this coin or token to recover/);
  });

  it('keeps an unfunded backup key a plain error, distinct from an empty wallet', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    stubRpc({ signers: signersOf(safeKeys), backupBalance: '0x0' });

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).message.should.match(/must have a balance of at least/);
    (caughtError as Error).should.not.be.instanceOf(ErrorNoInputToRecover);
    (caughtError as Error).should.not.be.instanceOf(RecoveryKeyMismatchError);
  });

  it('surfaces a dead avax.network node as RecoveryProviderError, not as a key mismatch', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    nock(rpcUrl).persist().post(rpcPath).reply(500, 'node unavailable');

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryProviderError);
    (caughtError as Error).should.not.be.instanceOf(RecoveryKeyMismatchError);
    (caughtError as Error).should.not.be.instanceOf(ErrorNoInputToRecover);
  });

  it('surfaces an empty isSigner response as RecoveryProviderError rather than assuming not-a-signer', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    nock(rpcUrl)
      .persist()
      .post(rpcPath)
      .reply(200, (uri, body) => ({ jsonrpc: '2.0', id: (body as { id: number }).id, result: '0x' }));

    let caughtError: unknown;
    try {
      await basecoin.recover({
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletContractAddress,
        recoveryDestination,
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryProviderError);
    (caughtError as Error).message.should.match(/Could not read the signer set/);
  });
});
