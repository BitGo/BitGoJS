import assert from 'assert';
import { DklsDsg, DklsTypes, DklsUtils, DklsVrfUtils } from '../../../../src/tss';

describe('deriveSafeEcdsaMpcChild', function () {
  it('derives a child both parties agree on, differing from the root', async function () {
    const [userDkg, backupDkg] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup] = await DklsVrfUtils.generateVrfDKGKeyShares();

    const rootCommonKeychain = DklsTypes.getCommonKeychain(userDkg.getKeyShare());

    const { commonKeychain, userChild, backupChild } = await DklsVrfUtils.deriveSafeEcdsaMpcChild({
      userRoot: { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() },
      backupRoot: { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() },
      account: 0,
      coinType: 1,
    });

    assert.notStrictEqual(commonKeychain, rootCommonKeychain, 'child keychain must differ from the root');

    const ckFromReduced = (reduced: string): string => {
      const r = DklsTypes.getDecodedReducedKeyShare(Buffer.from(reduced, 'base64'));
      return Buffer.from(r.pub).toString('hex') + Buffer.from(r.rootChainCode).toString('hex');
    };
    assert.strictEqual(ckFromReduced(userChild), commonKeychain, 'user child must match the derived keychain');
    assert.strictEqual(ckFromReduced(backupChild), commonKeychain, 'backup child must match the derived keychain');
  });

  it('documents the root-signs-root footgun and that derive returns a distinct child', async function () {
    const [userDkg, backupDkg] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup] = await DklsVrfUtils.generateVrfDKGKeyShares();

    const rootCommonKeychain = DklsTypes.getCommonKeychain(userDkg.getKeyShare());

    // Footgun: root reduced shares, rebuilt 2-of-2, DO sign the ROOT key at m/0.
    const toRetrofit = (b: Buffer): DklsTypes.RetrofitData => {
      const r = DklsTypes.getDecodedReducedKeyShare(b);
      return {
        xShare: {
          x: Buffer.from(r.prv).toString('hex'),
          y: Buffer.from(r.pub).toString('hex'),
          chaincode: Buffer.from(r.rootChainCode).toString('hex'),
        },
        xiList: r.xList.slice(0, 2),
      };
    };
    const [rootUser, rootBackup] = await DklsUtils.generate2of2KeyShares(
      toRetrofit(userDkg.getReducedKeyShare()),
      toRetrofit(backupDkg.getReducedKeyShare())
    );
    const messageHash = Buffer.alloc(32, 0x42);
    const rootSig = DklsUtils.verifyAndConvertDklsSignature(
      messageHash,
      (await DklsUtils.executeTillRound(
        5,
        new DklsDsg.Dsg(rootUser.getKeyShare(), 0, 'm/0', messageHash),
        new DklsDsg.Dsg(rootBackup.getKeyShare(), 1, 'm/0', messageHash)
      )) as DklsTypes.DeserializedDklsSignature,
      rootCommonKeychain,
      'm/0',
      undefined,
      false
    );
    assert.ok(rootSig, 'root reduced shares sign the root key at m/0 (the footgun)');

    // The adapter is safe: deriveSafeEcdsaMpcChild returns a CHILD, never the root.
    const { commonKeychain } = await DklsVrfUtils.deriveSafeEcdsaMpcChild({
      userRoot: { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() },
      backupRoot: { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() },
      account: 0,
      coinType: 1,
    });
    assert.notStrictEqual(
      commonKeychain,
      rootCommonKeychain,
      'derived child keychain must differ from the root keychain'
    );
  });

  it('uses the full path: different accounts derive different children (not truncated)', async function () {
    const [userDkg, backupDkg] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup] = await DklsVrfUtils.generateVrfDKGKeyShares();

    const userRoot = { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() };
    const backupRoot = { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() };

    const { commonKeychain: ck0 } = await DklsVrfUtils.deriveSafeEcdsaMpcChild({
      userRoot,
      backupRoot,
      account: 0,
      coinType: 1,
    });
    const { commonKeychain: ck1 } = await DklsVrfUtils.deriveSafeEcdsaMpcChild({
      userRoot,
      backupRoot,
      account: 1,
      coinType: 1,
    });

    assert.notStrictEqual(ck0, ck1, 'different accounts must derive different children (path must not be truncated)');
  });
});
