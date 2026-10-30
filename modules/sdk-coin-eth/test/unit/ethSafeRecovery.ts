import should from 'should';
import nock from 'nock';
import Sinon from 'sinon';
import { DklsUtils, DklsVrfUtils, getDerivationPath } from '@bitgo/sdk-lib-mpc';
import {
  buildSafeRecoverKeyParams,
  common,
  deriveSafeWalletKeys,
  Ecdsa,
  ErrorNoInputToRecover,
  RecoveryKeyMismatchError,
  RecoveryProviderError,
  type DecryptedSafeRoots,
  type EcdsaMpcChildKeys,
} from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import {
  AbstractEthLikeNewCoins,
  KeyPair as EthKeyPair,
  RecoveryInfo,
  UnsignedSweepTxMPCv2,
} from '@bitgo/abstract-eth';
import { FeeMarketEIP1559Transaction } from '@ethereumjs/tx';
import * as EthLikeCommon from '@ethereumjs/common';
import { toBuffer } from 'ethereumjs-util';
import { Hteth } from '../../src';
import * as mockData from '../fixtures/eth';

const recoveryDestination = '0xd5ADdE17feD8baed3F32b84AF05B8F2816f7b560';
const baseUrl = common.Environments.test.etherscanBaseUrl as string;

/**
 * End-to-end Safe EVM TSS recovery: derive slot-3 (ecdsaMpc) children from real DKG roots, map them
 * with buildSafeRecoverKeyParams, and prove `AbstractEthLikeNewCoins.recover()` accepts both shapes
 * the mapper emits — signed `{ userKey, backupKey, bitgoKey, walletPassphrase, isTss }` and unsigned
 * `{ bitgoKey, isTss }` with no user or backup key at all.
 *
 * The unsigned shape is the gap this suite pins: before WCN-3946 `validateRecoveryParams` rejected it
 * with `missing userKey`, and the unsigned sweep builders never checked the derived `m/0` base address
 * against `walletContractAddress`, so a wrong passphrase silently produced a sweep of someone else's
 * wallet instead of failing closed.
 */
describe('Safe EVM TSS recovery end-to-end', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: AbstractEthLikeNewCoins;
  const sandbox = Sinon.createSandbox();

  // Deriving real DKG roots is the slow part, so each distinct key set is built once.
  let safeKeys: EcdsaMpcChildKeys;
  let otherKeys: EcdsaMpcChildKeys;
  let walletContractAddress: string;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('hteth', Hteth.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('hteth') as unknown as AbstractEthLikeNewCoins;

    safeKeys = await deriveEcdsaMpcKeys();
    otherKeys = await deriveEcdsaMpcKeys();
    walletContractAddress = baseAddressOf(safeKeys.commonKeychain);
  });

  afterEach(function () {
    nock.cleanAll();
    sandbox.restore();
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
      coin: 'hteth',
      slot: 'ecdsaMpc',
      account: 0,
      roots: await ecdsaMpcRoots(),
    });
    if (derived.slot !== 'ecdsaMpc') {
      throw new Error('expected ecdsaMpc slot');
    }
    return derived.keys;
  }

  /** The wallet's base address: the `m/0` child of the common keychain, exactly as recover() derives it. */
  function baseAddressOf(commonKeychain: string): string {
    const pub = new Ecdsa().deriveUnhardened(commonKeychain, 'm/0').slice(0, 66);
    return new EthKeyPair({ pub }).getAddress();
  }

  async function unsignedKeyParams(keys: EcdsaMpcChildKeys) {
    return buildSafeRecoverKeyParams({ bitgo, coin: 'hteth', slot: 'ecdsaMpc', keys, mode: 'unsigned' });
  }

  function stubBaseAddressBalance(address: string, balance = mockData.getBalanceResponse) {
    nock(baseUrl).get('/api').query(mockData.getTxListRequest(address)).reply(200, mockData.getTxListResponse);
    nock(baseUrl).get('/api').query(mockData.getBalanceRequest(address)).reply(200, balance);
  }

  function pendingBalanceMocks(): string[] {
    return nock.pendingMocks();
  }

  it('maps an unsigned Safe recovery to { bitgoKey, isTss, broadcast } with no user or backup key', async function () {
    const keyParams = await unsignedKeyParams(safeKeys);
    keyParams.should.eql({
      slot: 'ecdsaMpc',
      mode: 'unsigned',
      bitgoKey: safeKeys.commonKeychain,
      isTss: true,
      broadcast: false,
    });
  });

  it('builds an unsigned sweep from bitgoKey alone', async function () {
    const keyParams = await unsignedKeyParams(safeKeys);
    stubBaseAddressBalance(walletContractAddress);

    const sweep = (await basecoin.recover({
      ...keyParams,
      walletContractAddress,
      recoveryDestination,
      gasLimit: 200000,
      eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
      replayProtectionOptions: { chain: '560048', hardfork: 'london' },
    })) as UnsignedSweepTxMPCv2;

    should.exist(sweep);
    sweep.txRequests.should.have.length(1);
    const unsignedTx = sweep.txRequests[0].transactions[0].unsignedTx;
    unsignedTx.should.have.properties('serializedTxHex', 'signableHex', 'derivationPath', 'feeInfo');
    unsignedTx.derivationPath.should.equal('m/0');
    // The sweep is built against the common keychain's own base address, not some caller-supplied one.
    (unsignedTx.parsedTx as { outputs: { address: string }[] }).outputs[0].address.should.equal(recoveryDestination);
  });

  it('recovers a Safe EVM wallet in signed mode via the real MPCv2 signing path', async function () {
    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'hteth',
      slot: 'ecdsaMpc',
      keys: safeKeys,
      mode: 'signed',
    });
    if (keyParams.mode !== 'signed') {
      throw new Error('expected signed key params');
    }
    keyParams.bitgoKey.should.equal(safeKeys.commonKeychain);
    stubBaseAddressBalance(walletContractAddress);

    const recovery = (await basecoin.recover({
      ...keyParams,
      walletContractAddress,
      recoveryDestination,
      gasLimit: 200000,
      eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
      replayProtectionOptions: { chain: '560048', hardfork: 'london' },
    })) as RecoveryInfo;

    recovery.id.should.be.a.String();
    recovery.tx.should.startWith('0x');
    // A fully signed transaction recovers the base address as its sender.
    const signedTx = FeeMarketEIP1559Transaction.fromSerializedTx(toBuffer(recovery.tx), {
      common: EthLikeCommon.default.custom({ chainId: 560048 }, { baseChain: 'mainnet', hardfork: 'london' }),
    });
    signedTx.getSenderAddress().toString().toLowerCase().should.equal(walletContractAddress.toLowerCase());
    signedTx.to?.toString().toLowerCase().should.equal(recoveryDestination.toLowerCase());
  });

  it('still accepts the legacy shape that puts the common keychain in userKey and backupKey', async function () {
    stubBaseAddressBalance(walletContractAddress);

    const sweep = (await basecoin.recover({
      userKey: safeKeys.commonKeychain,
      backupKey: safeKeys.commonKeychain,
      isTss: true,
      walletContractAddress,
      recoveryDestination,
      gasLimit: 200000,
      eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
      replayProtectionOptions: { chain: '560048', hardfork: 'london' },
    })) as UnsignedSweepTxMPCv2;

    sweep.txRequests.should.have.length(1);
  });

  it('fails closed with RecoveryKeyMismatchError before any balance query when the keys are for another wallet', async function () {
    // A wrong passphrase yields a valid but different keycard, so the derived m/0 address does not
    // match the wallet being recovered.
    const keyParams = await unsignedKeyParams(otherKeys);
    stubBaseAddressBalance(walletContractAddress);

    let caughtError: unknown;
    try {
      await basecoin.recover({
        ...keyParams,
        walletContractAddress,
        recoveryDestination,
        gasLimit: 200000,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        replayProtectionOptions: { chain: '560048', hardfork: 'london' },
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryKeyMismatchError);
    (caughtError as Error).message.should.match(/does not match the given wallet contract address/);
    // Both explorer mocks are untouched: the mismatch fires before the balance check.
    pendingBalanceMocks().should.have.length(2);
  });

  it('refuses to sweep an empty wallet once the keys do match', async function () {
    const keyParams = await unsignedKeyParams(safeKeys);
    stubBaseAddressBalance(walletContractAddress, { status: '1', message: 'OK', result: '0' });

    let caughtError: unknown;
    try {
      await basecoin.recover({
        ...keyParams,
        walletContractAddress,
        recoveryDestination,
        gasLimit: 200000,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        replayProtectionOptions: { chain: '560048', hardfork: 'london' },
      });
    } catch (e) {
      caughtError = e;
    }

    should.exist(caughtError);
    // An empty wallet cannot even cover gas, so the base-class gas guard fires first. What matters
    // for the orchestrator is that it is NOT reported as a key mismatch.
    (caughtError as Error).message.should.match(/has balance 0 Gwei/);
    (caughtError as Error).should.not.be.instanceOf(RecoveryKeyMismatchError);
  });

  it('still builds a derivationSeed sweep, whose base address is a child the caller cannot predict', async function () {
    // Regression guard: the m/0 key-mismatch check must NOT apply when a derivationSeed is set.
    // getDerivationPath hashes the seed into m/999999/x/y, so the swept address can never equal
    // any walletContractAddress the caller could supply, and asserting on it would make every
    // derivationSeed sweep impossible.
    const derivationSeed = 'abc123';
    const derivedPub = new Ecdsa()
      .deriveUnhardened(safeKeys.commonKeychain, getDerivationPath(derivationSeed))
      .slice(0, 66);
    const seedAddress = new EthKeyPair({ pub: derivedPub }).getAddress();
    seedAddress.should.not.equal(walletContractAddress);
    stubBaseAddressBalance(seedAddress);

    const sweep = (await basecoin.recover({
      userKey: safeKeys.commonKeychain,
      backupKey: safeKeys.commonKeychain,
      isTss: true,
      derivationSeed,
      walletContractAddress,
      recoveryDestination,
      gasLimit: 200000,
      eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
      replayProtectionOptions: { chain: '560048', hardfork: 'london' },
    })) as UnsignedSweepTxMPCv2;

    sweep.txRequests.should.have.length(1);
    sweep.txRequests[0].transactions[0].unsignedTx.derivationPath.should.equal(getDerivationPath(derivationSeed));
  });

  it('refuses an unsigned sweep with no walletContractAddress rather than skipping the key check', async function () {
    const keyParams = await unsignedKeyParams(safeKeys);
    stubBaseAddressBalance(walletContractAddress);

    let caughtError: unknown;
    try {
      await basecoin.recover({
        ...keyParams,
        walletContractAddress: '',
        recoveryDestination,
        gasLimit: 200000,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        replayProtectionOptions: { chain: '560048', hardfork: 'london' },
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).message.should.match(/invalid walletContractAddress/);
    // Nothing was queried: there was never an address to verify the keychain against.
    pendingBalanceMocks().should.have.length(2);
  });

  it('surfaces an explorer failure rather than reporting an empty wallet', async function () {
    const keyParams = await unsignedKeyParams(safeKeys);
    nock(baseUrl)
      .get('/api')
      .query(mockData.getTxListRequest(walletContractAddress))
      .reply(200, mockData.getTxListResponse);
    nock(baseUrl).get('/api').query(mockData.getBalanceRequest(walletContractAddress)).reply(500, 'node unavailable');

    let caughtError: unknown;
    try {
      await basecoin.recover({
        ...keyParams,
        walletContractAddress,
        recoveryDestination,
        gasLimit: 200000,
        eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
        replayProtectionOptions: { chain: '560048', hardfork: 'london' },
      });
    } catch (e) {
      caughtError = e;
    }

    (caughtError as Error).should.be.instanceOf(RecoveryProviderError);
    // A dead explorer must never be mistaken for an empty wallet or a wrong passphrase.
    (caughtError as Error).should.not.be.instanceOf(ErrorNoInputToRecover);
    (caughtError as Error).should.not.be.instanceOf(RecoveryKeyMismatchError);
  });
});
