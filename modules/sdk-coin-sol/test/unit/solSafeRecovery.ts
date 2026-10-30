import assert from 'assert';
import Sinon from 'sinon';
import * as nacl from 'tweetnacl';
import * as base58 from 'bs58';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { MPSUtil, MpsVrfUtils } from '@bitgo/sdk-lib-mpc';
import {
  buildSafeRecoverKeyParams,
  deriveSafeWalletKeys,
  EDDSAMethods,
  type DecryptedSafeRoots,
} from '@bitgo/sdk-core';
import { KeyPair, Tsol, Sol } from '../../src';
import { TransactionBuilderFactory } from '../../src/lib';
import { coins } from '@bitgo/statics';
import * as testData from '../fixtures/sol';

/**
 * End-to-end Safe SOL recovery: real MPS DKG + VRF roots -> deriveSafeWalletKeys (slot-4 eddsaMpc
 * child) -> buildSafeRecoverKeyParams -> Sol.recover() with the real MPS 2-of-2 signing path. Only
 * chain queries are mocked.
 *
 * This proves the derived child keychain is accepted as `bitgoKey`, the re-encrypted child shares
 * decrypt and sign, and the resulting signature verifies under the derived wallet address.
 */
describe('Safe SOL recovery end-to-end', function () {
  const sandbox = Sinon.createSandbox();
  let bitgo: TestBitGoAPI;
  let basecoin: Tsol;
  let roots: DecryptedSafeRoots;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tsol', Tsol.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol') as Tsol;

    const [userDkg, backupDkg, bitgoDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const [vrfUser, vrfBackup] = await MpsVrfUtils.generateVrfDKGKeyShares();
    roots = {
      secp256k1Multisig: { user: 'u', backup: 'b', bitgo: 'g' },
      ed25519Multisig: { user: 'u', backup: { prv: 'b', chainCode: 'c' }, bitgo: 'g' },
      ecdsaMpc: {
        user: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        backup: { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) },
        bitgo: 'g',
      },
      eddsaMpc: {
        user: { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() },
        backup: { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() },
        bitgo: bitgoDkg.getCommonKeychain(),
      },
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  async function deriveChild(account: number) {
    const derived = await deriveSafeWalletKeys({ coin: 'tsol', slot: 'eddsaMpc', account, roots });
    assert(derived.slot === 'eddsaMpc');
    const mpc = await EDDSAMethods.getInitializedMpcInstance();
    const publicKey = mpc.deriveUnhardened(derived.keys.commonKeychain, 'm/0').slice(0, 64);
    return { derived, publicKey, address: new KeyPair({ pub: publicKey }).getAddress() };
  }

  function stubChain(walletAddress: string): void {
    const getDataFromNode = sandbox.stub(Sol.prototype, 'getDataFromNode' as keyof Sol);
    getDataFromNode
      .withArgs({
        payload: { id: '1', jsonrpc: '2.0', method: 'getLatestBlockhash', params: [{ commitment: 'finalized' }] },
      })
      .resolves(testData.SolResponses.getBlockhashResponse);
    getDataFromNode
      .withArgs({ payload: { id: '1', jsonrpc: '2.0', method: 'getBalance', params: [walletAddress] } })
      .resolves(testData.SolResponses.getAccountBalanceResponse);
    getDataFromNode
      .withArgs({
        payload: {
          id: '1',
          jsonrpc: '2.0',
          method: 'getFeeForMessage',
          params: [Sinon.match.string, { commitment: 'finalized' }],
        },
      })
      .resolves(testData.SolResponses.getFeesForMessageResponse);
  }

  it('recovers a Safe SOL wallet offline: derive -> map -> sign, verifiable under the derived address', async function () {
    const { derived, publicKey, address } = await deriveChild(0);
    stubChain(address);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'tsol',
      slot: 'eddsaMpc',
      keys: derived.keys,
      mode: 'signed',
    });
    assert(keyParams.mode === 'signed');
    assert.strictEqual(keyParams.isTss, true);
    assert.strictEqual(keyParams.broadcast, false);
    assert.strictEqual(keyParams.bitgoKey, derived.keys.commonKeychain);

    const recovery = await basecoin.recover({
      ...keyParams,
      recoveryDestination: testData.keys.destinationPubKey,
    });

    assert('serializedTx' in recovery);
    assert.strictEqual(recovery.scanIndex, 0);

    // The signature on the recovered tx verifies under the derived child wallet key.
    const tx = await new TransactionBuilderFactory(coins.get('tsol')).from(recovery.serializedTx).build();
    assert.strictEqual(tx.signature.length, 1);
    assert.strictEqual(
      nacl.sign.detached.verify(
        new Uint8Array(tx.signablePayload),
        new Uint8Array(base58.decode(tx.signature[0])),
        new Uint8Array(Buffer.from(publicKey, 'hex'))
      ),
      true
    );
  });

  it('returns an unsigned sweep from the derived child address with no key material in the params', async function () {
    const { derived, address } = await deriveChild(0);
    stubChain(address);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'tsol',
      slot: 'eddsaMpc',
      keys: derived.keys,
      mode: 'unsigned',
    });
    assert(keyParams.mode === 'unsigned');
    assert(!('userKey' in keyParams) && !('backupKey' in keyParams) && !('walletPassphrase' in keyParams));

    const recovery = await basecoin.recover({
      ...keyParams,
      recoveryDestination: testData.keys.destinationPubKey,
    });
    assert('txRequests' in recovery);

    const unsignedTx = recovery.txRequests[0].transactions[0].unsignedTx;
    assert.strictEqual(unsignedTx.coinSpecific?.commonKeychain, derived.keys.commonKeychain);
    assert.strictEqual(unsignedTx.derivationPath, 'm/0');
    assert(unsignedTx.signableHex);
    const tx = await new TransactionBuilderFactory(coins.get('tsol')).from(unsignedTx.serializedTx).build();
    assert.strictEqual(tx.inputs[0].address, address);
  });

  it('fails closed when the signing shares belong to a different account than bitgoKey', async function () {
    const account0 = await deriveChild(0);
    const account1 = await deriveChild(1);
    stubChain(account0.address);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'tsol',
      slot: 'eddsaMpc',
      keys: account1.derived.keys,
      mode: 'signed',
    });
    assert(keyParams.mode === 'signed');

    await assert.rejects(
      basecoin.recover({
        ...keyParams,
        bitgoKey: account0.derived.keys.commonKeychain,
        recoveryDestination: testData.keys.destinationPubKey,
      }),
      /commonKeyChain from keycard does not match bitgoKey/
    );
  });

  it('fails closed when the wallet passphrase cannot decrypt the re-encrypted child shares', async function () {
    const { derived, address } = await deriveChild(0);
    stubChain(address);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'tsol',
      slot: 'eddsaMpc',
      keys: derived.keys,
      mode: 'signed',
    });
    assert(keyParams.mode === 'signed');

    await assert.rejects(
      basecoin.recover({
        ...keyParams,
        walletPassphrase: 'not-the-ephemeral-passphrase',
        recoveryDestination: testData.keys.destinationPubKey,
      }),
      /Error decrypting user keychain/
    );
  });
});
