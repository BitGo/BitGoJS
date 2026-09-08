import * as assert from 'assert';
import { encode } from 'cbor-x';
import * as sinon from 'sinon';
import { DklsUtils, DklsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { BitGoBase, ECDSAUtils } from '../../../../../../src';

function encodeEnvelope(signingKeyShare: Buffer, vrfKeyShare: Buffer): string {
  return Buffer.from(
    encode({
      version: ECDSAUtils.MPC_VRF_KEY_ENVELOPE_VERSION,
      prvKeyShare: new Uint8Array(signingKeyShare),
      vrf: new Uint8Array(vrfKeyShare),
    })
  ).toString('base64');
}

describe('MPCv2 keyshare envelopes', function () {
  this.timeout(30000);

  it('parses a versioned envelope and preserves legacy reduced shares', function () {
    const reducedKeyShare = Buffer.from([1, 2, 3]);
    const vrfKeyShare = Buffer.from([4, 5, 6]);
    const versioned = ECDSAUtils.parseMpcV2KeyShareEnvelope(encodeEnvelope(reducedKeyShare, vrfKeyShare));
    assert.deepStrictEqual(versioned.signingKeyShare, reducedKeyShare);
    assert.deepStrictEqual(versioned.vrfKeyShare, vrfKeyShare);

    const legacy = ECDSAUtils.parseMpcV2KeyShareEnvelope(reducedKeyShare.toString('base64'));
    assert.deepStrictEqual(legacy.signingKeyShare, reducedKeyShare);
    assert.strictEqual(legacy.vrfKeyShare, undefined);
  });

  it('returns VRF keyshares when recovery parses safe-root reduced envelopes', async function () {
    const [userDkg, backupDkg] = await DklsUtils.generateDKGKeyShares();
    const [userVrf, backupVrf] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const userEnvelope = encodeEnvelope(userDkg.getReducedKeyShare(), userVrf.getKeyShare());
    const backupEnvelope = encodeEnvelope(backupDkg.getReducedKeyShare(), backupVrf.getKeyShare());

    // The first decrypt is the GG18/MPCv1 probe; the following two are the actual
    // reduced key reads. This mirrors BitGoBase.decrypt without requiring a network.
    const decrypt = sinon.stub();
    decrypt.onCall(0).resolves(userEnvelope);
    decrypt.onCall(1).resolves(userEnvelope);
    decrypt.onCall(2).resolves(backupEnvelope);
    const bitgo = { decrypt } as unknown as BitGoBase;

    const recovered = await ECDSAUtils.getMpcV2RecoveryKeyShares(
      'encrypted-user-key',
      'encrypted-backup-key',
      'test-passphrase',
      bitgo
    );

    assert.ok(recovered.userKeyShare.length > 0);
    assert.ok(recovered.backupKeyShare.length > 0);
    assert.ok(recovered.commonKeyChain);
    assert.deepStrictEqual(recovered.userVrfKeyShare, userVrf.getKeyShare());
    assert.deepStrictEqual(recovered.backupVrfKeyShare, backupVrf.getKeyShare());
  });
});
