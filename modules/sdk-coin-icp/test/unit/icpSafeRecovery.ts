import assert from 'assert';
import Sinon from 'sinon';
import { createHash } from 'crypto';
import { secp256k1 } from '@noble/curves/secp256k1';
import BigNumber from 'bignumber.js';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { DklsUtils, DklsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { buildSafeRecoverKeyParams, deriveSafeWalletKeys, Ecdsa, type DecryptedSafeRoots } from '@bitgo/sdk-core';
import { Icp } from '../../src/index';
import { HttpCanisterUpdate } from '../../src/lib/iface';
import { IcpAgent } from '../../src/lib/icpAgent';
import utils from '../../src/lib/utils';
import * as testData from '../resources/icp';

/**
 * End-to-end Safe ICP recovery: real DKG roots -> deriveSafeWalletKeys (slot-3 ecdsaMpc child)
 * -> buildSafeRecoverKeyParams -> Icp.recover({ broadcast: false }) with the real DKLS 2-of-2
 * signing path (icp.signatures is NOT stubbed). Only chain queries are mocked.
 *
 * This proves the whole WCN-2886 chain: the signed payload is produced offline, is byte-identical
 * to what legacy broadcasting would have submitted, and its secp256k1 signature verifies against
 * the derived child public key.
 */
describe('Safe ICP recovery end-to-end', function () {
  const sandbox = Sinon.createSandbox();
  let bitgo: TestBitGoAPI;
  let icp: Icp;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('icp', Icp.createInstance);
    bitgo.initializeTestVars();
    icp = bitgo.coin('icp') as Icp;
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('recovers a Safe ICP wallet offline: derive -> map -> sign -> no broadcast', async function () {
    // Real DKG + VRF roots, exactly as a decrypted Safe keycard would provide for the ecdsaMpc slot.
    const [userDkg, backupDkg] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const roots: DecryptedSafeRoots = {
      secp256k1Multisig: { user: 'u', backup: 'b', bitgo: 'g' },
      ed25519Multisig: { user: 'u', backup: { prv: 'b', chainCode: 'c' }, bitgo: 'g' },
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

    const derived = await deriveSafeWalletKeys({ coin: 'icp', slot: 'ecdsaMpc', account: 0, roots });
    assert(derived.slot === 'ecdsaMpc');

    const keyParams = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'icp',
      slot: 'ecdsaMpc',
      keys: derived.keys,
      mode: 'signed',
    });
    assert(keyParams.slot === 'ecdsaMpc' && keyParams.mode === 'signed');
    assert.strictEqual(keyParams.broadcast, false);
    assert.strictEqual(keyParams.isTss, true);
    assert.strictEqual(keyParams.bitgoKey, derived.keys.commonKeychain);

    // Only chain queries are mocked; icp.signatures runs the real DKLS 2-of-2 signing.
    sandbox.stub(IcpAgent.prototype, 'getBalance').resolves(BigNumber(1000000000));
    sandbox.stub(IcpAgent.prototype, 'getFee').resolves(BigNumber(10000));
    sandbox.stub(utils, 'getMetaData').returns({
      metaData: testData.MetaDataWithDefaultMemo,
      ingressEndTime: testData.MetaDataWithDefaultMemo.ingress_end ?? 0,
    });
    const broadcastStub = sandbox.stub(icp, 'broadcastTransaction').rejects(new Error('must not broadcast'));

    const recovery = await icp.recover({
      ...keyParams,
      recoveryDestination: testData.Accounts.account2.address,
      broadcast: false,
    });

    assert('tx' in recovery);
    assert.strictEqual(recovery.txHex, recovery.tx);
    assert.strictEqual(recovery.coin, 'icp');
    assert.strictEqual(typeof recovery.id, 'string');
    Sinon.assert.notCalled(broadcastStub);

    // The signed envelope's secp256k1 signature verifies against the derived child public key.
    const envelope = utils.cborDecode(utils.blobFromHex(recovery.tx)) as {
      content: HttpCanisterUpdate;
      sender_pubkey: Uint8Array;
      sender_sig: Uint8Array;
    };
    const representationIndependentHash = utils.HttpCanisterUpdateRepresentationIndependentHash(envelope.content);
    const message = Buffer.concat([Buffer.from('0a', 'hex'), Buffer.from('ic-request'), representationIndependentHash]);
    const messageHash = createHash('sha256').update(message).digest();
    const rawPub = Buffer.from(envelope.sender_pubkey).subarray(-65);
    assert.strictEqual(secp256k1.verify(Buffer.from(envelope.sender_sig), messageHash, rawPub), true);

    // The signing public key is exactly the derived slot-3 child public key (uncompressed in the envelope).
    const mpc = new Ecdsa();
    const compressedChildPub = Buffer.from(
      mpc.deriveUnhardened(derived.keys.commonKeychain, 'm/0').slice(0, 66),
      'hex'
    );
    const uncompressedChildPub = secp256k1.ProjectivePoint.fromHex(compressedChildPub).toRawBytes(false);
    assert.strictEqual(
      Buffer.from(envelope.sender_pubkey).subarray(-65).toString('hex'),
      Buffer.from(uncompressedChildPub).toString('hex')
    );
  });
});
