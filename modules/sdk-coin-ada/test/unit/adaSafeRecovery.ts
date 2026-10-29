import assert from 'assert';
import Sinon from 'sinon';
import nacl from 'tweetnacl';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { MPSUtil, MpsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { buildSafeRecoverKeyParams, deriveSafeWalletKeys, type DecryptedSafeRoots } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { Ada, Tada } from '../../src';
import { Transaction } from '../../src/lib';
import { address, endpointResponses } from '../resources';

/**
 * End-to-end Safe ADA recovery: real MPS DKG + VRF roots -> deriveSafeWalletKeys (slot-4 eddsaMpc
 * child) -> buildSafeRecoverKeyParams -> Ada.recover() with the real MPS 2-of-2 signing path. Only
 * chain queries are mocked.
 *
 * ADA is a second EdDSA family next to SOL, so this confirms the slot-4 key params are not
 * SOL-specific: the derived child keychain is accepted as `bitgoKey` and the witness verifies.
 */
describe('Safe ADA recovery end-to-end', function () {
  const sandbox = Sinon.createSandbox();
  let bitgo: TestBitGoAPI;
  let basecoin: Tada;
  let roots: DecryptedSafeRoots;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('ada', Ada.createInstance);
    bitgo.safeRegister('tada', Tada.createInstance);
    basecoin = bitgo.coin('tada') as Tada;

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
    const derived = await deriveSafeWalletKeys({ coin: 'tada', slot: 'eddsaMpc', account, roots });
    assert(derived.slot === 'eddsaMpc');
    const { address: walletAddress, accountId } = await basecoin.getAdaAddressAndAccountId({
      bitgoKey: derived.keys.commonKeychain,
      index: 0,
    });
    return { derived, walletAddress, accountId };
  }

  function stubChain(walletAddress: string): void {
    const getDataFromNode = sandbox.stub(Ada.prototype, 'getDataFromNode' as keyof Ada);
    getDataFromNode
      .withArgs('address_info', { _addresses: [walletAddress] })
      .resolves(endpointResponses.addressInfoResponse.OneUTXO);
    getDataFromNode.withArgs('tip').resolves(endpointResponses.tipInfoResponse);
  }

  it('recovers a Safe ADA wallet offline: derive -> map -> sign, verifiable under the derived key', async function () {
    const { derived, walletAddress, accountId } = await deriveChild(0);
    stubChain(walletAddress);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'tada',
      slot: 'eddsaMpc',
      keys: derived.keys,
      mode: 'signed',
    });
    assert(keyParams.mode === 'signed');

    const recovery = await basecoin.recover({
      ...keyParams,
      recoveryDestination: address.address2,
    });
    assert('serializedTx' in recovery);

    const tx = new Transaction(coins.get('tada'));
    tx.fromRawTransaction(recovery.serializedTx);
    const { outputs, witnesses } = tx.toJson();
    assert.strictEqual(outputs[0].address, address.address2);
    assert.strictEqual(witnesses.length, 1);
    assert.strictEqual(witnesses[0].publicKey, accountId);
    assert.strictEqual(
      nacl.sign.detached.verify(
        new Uint8Array(tx.signablePayload),
        new Uint8Array(Buffer.from(witnesses[0].signature, 'hex')),
        new Uint8Array(Buffer.from(accountId, 'hex'))
      ),
      true
    );
  });

  it('returns an unsigned sweep for the derived child keychain without any key material', async function () {
    const { derived, walletAddress } = await deriveChild(0);
    stubChain(walletAddress);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'tada',
      slot: 'eddsaMpc',
      keys: derived.keys,
      mode: 'unsigned',
    });
    assert(keyParams.mode === 'unsigned');
    assert(!('userKey' in keyParams) && !('backupKey' in keyParams) && !('walletPassphrase' in keyParams));

    const recovery = await basecoin.recover({
      ...keyParams,
      recoveryDestination: address.address2,
    });
    assert('txRequests' in recovery);

    const unsignedTx = recovery.txRequests[0].transactions[0].unsignedTx;
    assert.strictEqual(unsignedTx.coinSpecific?.commonKeychain, derived.keys.commonKeychain);
    assert.strictEqual(unsignedTx.derivationPath, 'm/0');
    assert(unsignedTx.signableHex);

    const tx = new Transaction(coins.get('tada'));
    tx.fromRawTransaction(unsignedTx.serializedTx);
    const { outputs, witnesses } = tx.toJson();
    assert.strictEqual(outputs[0].address, address.address2);
    assert.strictEqual(witnesses.length, 0);
  });

  it('fails closed when the signing shares belong to a different account than bitgoKey', async function () {
    const account0 = await deriveChild(0);
    const account1 = await deriveChild(1);
    stubChain(account0.walletAddress);

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'tada',
      slot: 'eddsaMpc',
      keys: account1.derived.keys,
      mode: 'signed',
    });
    assert(keyParams.mode === 'signed');

    await assert.rejects(
      basecoin.recover({
        ...keyParams,
        bitgoKey: account0.derived.keys.commonKeychain,
        recoveryDestination: address.address2,
      }),
      /commonKeyChain from keycard does not match bitgoKey/
    );
  });
});
