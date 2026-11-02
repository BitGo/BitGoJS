import should from 'should';
import nock from 'nock';
import { DklsUtils, DklsVrfUtils } from '@bitgo/sdk-lib-mpc';
import {
  buildSafeRecoverKeyParams,
  deriveSafeWalletKeys,
  Ecdsa,
  Environments,
  ErrorNoInputToRecover,
  RecoveryKeyMismatchError,
  RecoveryProviderError,
  type DecryptedSafeRoots,
  type EcdsaMpcChildKeys,
} from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tatom } from '../../src';

const recoveryDestination = 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32';
const chainId = 'theta-testnet-001';

/**
 * End-to-end Safe Cosmos recovery: derive slot-3 (ecdsaMpc) children from real DKG roots, map them
 * with buildSafeRecoverKeyParams, and prove `CosmosCoin.recover()` derives the sender from the keys
 * in both modes and refuses to touch a wallet those keys do not control.
 *
 * Two gaps are pinned here. In unsigned mode `getSenderDetails` used to trust `params.rootAddress`
 * verbatim as the sender while deriving a public key it never compared against it — so a wrong
 * keycard swept whatever address the caller named. And neither mode checked `rootAddress` at all,
 * so a wrong passphrase (which still yields a valid, different common keychain) surfaced as
 * "no balance" rather than as a key mismatch.
 */
describe('Safe Cosmos recovery end-to-end', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Tatom;
  // The configured node URL has a trailing slash, so requests land on `//cosmos/...`; resolve the
  // real origin and path so nock matches what superagent actually sends.
  let nodeOrigin: string;
  let nodePath: (path: string) => string;

  let safeKeys: EcdsaMpcChildKeys;
  let otherKeys: EcdsaMpcChildKeys;
  let rootAddress: string;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tatom', Tatom.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tatom') as Tatom;
    const nodeUrl = Environments[bitgo.getEnv()].atomNodeUrl;
    nodeOrigin = new URL(nodeUrl).origin;
    nodePath = (path: string) => new URL(nodeUrl + path).pathname;

    safeKeys = await deriveEcdsaMpcKeys();
    otherKeys = await deriveEcdsaMpcKeys();
    rootAddress = senderAddressOf(safeKeys.commonKeychain);
  });

  afterEach(function () {
    nock.cleanAll();
  });

  /** Real DKG + VRF roots, exactly as a decrypted Safe keycard would provide for the ecdsaMpc slot. */
  async function ecdsaMpcRoots(): Promise<DecryptedSafeRoots> {
    const [userDkg, backupDkg] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup] = await DklsVrfUtils.generateVrfDKGKeyShares();
    return {
      secp256k1Multisig: { user: 'u', backup: 'b', bitgo: 'g' },
      ed25519Multisig: { user: 'u', backup: { prv: 'b', chainCode: 'cc' }, bitgo: 'g' },
      ecdsaMpc: {
        user: { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() },
        backup: { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() },
        bitgo: 'g',
      },
      eddsaMpc: {
        user: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        backup: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        bitgo: 'g',
      },
    };
  }

  async function deriveEcdsaMpcKeys(): Promise<EcdsaMpcChildKeys> {
    const derived = await deriveSafeWalletKeys({
      coin: 'tatom',
      slot: 'ecdsaMpc',
      account: 0,
      roots: await ecdsaMpcRoots(),
    });
    if (derived.slot !== 'ecdsaMpc') {
      throw new Error('expected ecdsaMpc slot');
    }
    return derived.keys;
  }

  /** The wallet's address: the `m/0` child of the common keychain, as getSenderDetails derives it. */
  function senderAddressOf(commonKeychain: string): string {
    return basecoin.getAddressFromPublicKey(new Ecdsa().deriveUnhardened(commonKeychain, 'm/0').slice(0, 66));
  }

  function keyParams(keys: EcdsaMpcChildKeys, mode: 'signed' | 'unsigned') {
    return buildSafeRecoverKeyParams({ bitgo, coin: 'tatom', slot: 'ecdsaMpc', keys, mode });
  }

  // comfortably above GAS_AMOUNT so processBalances has something left to sweep
  const FUNDED_BALANCE = [{ denom: 'uatom', amount: '10000000' }];

  function stubNodeQueries(address: string, balances = FUNDED_BALANCE) {
    nock(nodeOrigin)
      .get(nodePath('/cosmos/base/tendermint/v1beta1/blocks/latest'))
      .reply(200, { block: { header: { chain_id: chainId } } });
    nock(nodeOrigin)
      .get(nodePath(`/cosmos/auth/v1beta1/accounts/${address}`))
      .reply(200, { account: { account_number: '12345', sequence: '7' } });
    nock(nodeOrigin)
      .get(nodePath(`/cosmos/bank/v1beta1/balances/${address}`))
      .reply(200, { balances });
  }

  it('recovers a Safe Cosmos wallet in unsigned mode, deriving the sender from bitgoKey', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    if (params.mode !== 'unsigned') {
      throw new Error('expected unsigned key params');
    }
    stubNodeQueries(rootAddress);

    const recovery = await basecoin.recover({ ...params, rootAddress, recoveryDestination });

    should.exist(recovery.signableHex);
    const signableHex = recovery.signableHex as string;
    // The sender baked into the unsigned payload is the address derived from bitgoKey.
    signableHex.should.containEql(Buffer.from(rootAddress).toString('hex'));
    signableHex.should.containEql(Buffer.from(recoveryDestination).toString('hex'));
    nock.pendingMocks().should.have.length(0);
  });

  it('recovers a Safe Cosmos wallet in unsigned mode when no rootAddress is supplied', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    stubNodeQueries(rootAddress);

    const recovery = await basecoin.recover({ ...params, recoveryDestination });

    should.exist(recovery.signableHex);
    const signableHex = recovery.signableHex as string;
    // Without a rootAddress the derived sender is the only address queried, which is what the
    // mocks are keyed on: an undefined sender would have left them pending.
    signableHex.should.containEql(Buffer.from(rootAddress).toString('hex'));
    nock.pendingMocks().should.have.length(0);
  });

  it('recovers a Safe Cosmos wallet in signed mode via the real MPCv2 signing path', async function () {
    const params = await keyParams(safeKeys, 'signed');
    if (params.mode !== 'signed') {
      throw new Error('expected signed key params');
    }
    stubNodeQueries(rootAddress);

    const recovery = await basecoin.recover({ ...params, rootAddress, recoveryDestination });

    should.exist(recovery);
    recovery.should.hasOwnProperty('serializedTx');
  });

  it('fails closed with RecoveryKeyMismatchError in unsigned mode on a wrong passphrase', async function () {
    // A wrong passphrase decrypts to a valid but different keycard, so the derived sender is not
    // the wallet being recovered.
    const params = await keyParams(otherKeys, 'unsigned');
    stubNodeQueries(rootAddress);

    let caughtError: unknown;
    try {
      await basecoin.recover({ ...params, rootAddress, recoveryDestination });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryKeyMismatchError);
    (caughtError as Error).message.should.match(/does not match rootAddress/);
    // No node call was made: the derivation and comparison are entirely offline.
    nock.pendingMocks().should.have.length(3);
  });

  it('fails closed with RecoveryKeyMismatchError in signed mode too', async function () {
    const params = await keyParams(otherKeys, 'signed');
    stubNodeQueries(rootAddress);

    let caughtError: unknown;
    try {
      await basecoin.recover({ ...params, rootAddress, recoveryDestination });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryKeyMismatchError);
    nock.pendingMocks().should.have.length(3);
  });

  it('reports an empty wallet as ErrorNoInputToRecover once the keys do match', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    stubNodeQueries(rootAddress, []);

    let caughtError: unknown;
    try {
      await basecoin.recover({ ...params, rootAddress, recoveryDestination });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(ErrorNoInputToRecover);
    (caughtError as Error).should.not.be.instanceOf(RecoveryKeyMismatchError);
  });

  it('surfaces a dead node as RecoveryProviderError, not as an empty wallet', async function () {
    const params = await keyParams(safeKeys, 'unsigned');
    nock(nodeOrigin)
      .get(nodePath('/cosmos/base/tendermint/v1beta1/blocks/latest'))
      .reply(200, { block: { header: { chain_id: chainId } } });
    nock(nodeOrigin)
      .get(nodePath(`/cosmos/auth/v1beta1/accounts/${rootAddress}`))
      .reply(200, { account: { account_number: '12345', sequence: '7' } });
    nock(nodeOrigin)
      .get(nodePath(`/cosmos/bank/v1beta1/balances/${rootAddress}`))
      .reply(500, { error: 'node unavailable' });

    let caughtError: unknown;
    try {
      await basecoin.recover({ ...params, rootAddress, recoveryDestination });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryProviderError);
    (caughtError as Error).should.not.be.instanceOf(ErrorNoInputToRecover);
  });

  it('rejects an unsigned recovery with no bitgoKey instead of deriving from an empty string', async function () {
    let caughtError: unknown;
    try {
      await basecoin.recover({ bitgoKey: '   ', recoveryDestination });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).message.should.equal('missing bitgoKey');
  });
});
