import assert from 'assert';
import { MPSTypes, MPSUtil, MpsVrfUtils } from '../../../../src/tss';

describe('deriveSafeEddsaMpcChild', function () {
  it('returns matching legacy child shares and derives different accounts', async function () {
    const [userDkg, backupDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const [vrfUser, vrfBackup] = await MpsVrfUtils.generateVrfDKGKeyShares();
    const userRoot = { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() };
    const backupRoot = { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() };
    const params = { userRoot, backupRoot, account: 0, coinType: 501, safeSlotOrdinal: 4 };

    const child = await MpsVrfUtils.deriveSafeEddsaMpcChild(params);
    assert.notStrictEqual(child.commonKeychain, userDkg.getCommonKeychain());

    const getCommonKeychain = (base64ReducedKeyShare: string): string => {
      const reduced = MPSTypes.getDecodedReducedKeyShare(Buffer.from(base64ReducedKeyShare, 'base64'));
      assert.deepStrictEqual(Object.keys(reduced).sort(), ['keyShare', 'pub', 'rootChainCode']);
      return Buffer.from(reduced.pub).toString('hex') + Buffer.from(reduced.rootChainCode).toString('hex');
    };
    assert.strictEqual(getCommonKeychain(child.userChild), child.commonKeychain);
    assert.strictEqual(getCommonKeychain(child.backupChild), child.commonKeychain);

    const nextAccount = await MpsVrfUtils.deriveSafeEddsaMpcChild({ ...params, account: 1 });
    assert.notStrictEqual(nextAccount.commonKeychain, child.commonKeychain);
  });
});
