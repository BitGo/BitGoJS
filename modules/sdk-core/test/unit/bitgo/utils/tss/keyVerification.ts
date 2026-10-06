import * as assert from 'assert';
import 'should';
import { Ed25519Bip32HdTree } from '@bitgo/sdk-lib-mpc';
import Eddsa from '../../../../../src/account-lib/mpc/tss';
import {
  eddsaUserSigningMaterialMatchesCommonKeychain,
  parseEddsaUserSigningMaterial,
} from '../../../../../src/bitgo/utils/tss/keyVerification';

describe('TSS EdDSA key verification', function () {
  let matchingPrv: string;
  let commonKeychain: string;
  let otherPrv: string;
  let backupStylePrv: string;

  before(async function () {
    const hdTree = await Ed25519Bip32HdTree.initialize();
    const MPC = await Eddsa.initialize(hdTree);

    const userKeyShare = MPC.keyShare(1, 2, 3);
    const backupKeyShare = MPC.keyShare(2, 2, 3);
    const bitgoKeyShare = MPC.keyShare(3, 2, 3);
    const combined = MPC.keyCombine(userKeyShare.uShare, [backupKeyShare.yShares[1], bitgoKeyShare.yShares[1]]);
    commonKeychain = combined.pShare.y + combined.pShare.chaincode;
    matchingPrv = JSON.stringify({
      uShare: userKeyShare.uShare,
      bitgoYShare: bitgoKeyShare.yShares[1],
      backupYShare: backupKeyShare.yShares[1],
    });

    // an independent key generation for the negative case
    const otherUserKeyShare = MPC.keyShare(1, 2, 3);
    const otherBackupKeyShare = MPC.keyShare(2, 2, 3);
    const otherBitgoKeyShare = MPC.keyShare(3, 2, 3);
    otherPrv = JSON.stringify({
      uShare: otherUserKeyShare.uShare,
      bitgoYShare: otherBitgoKeyShare.yShares[1],
      backupYShare: otherBackupKeyShare.yShares[1],
    });

    // backup-style signing material: the holder is the backup party (i=2), so it carries
    // userYShare instead of backupYShare
    backupStylePrv = JSON.stringify({
      uShare: backupKeyShare.uShare,
      bitgoYShare: bitgoKeyShare.yShares[2],
      userYShare: userKeyShare.yShares[2],
    });
  });

  describe('parseEddsaUserSigningMaterial', function () {
    it('parses well-formed user signing material', function () {
      const parsed = parseEddsaUserSigningMaterial(matchingPrv);
      parsed.should.have.property('uShare');
      parsed.should.have.property('bitgoYShare');
      parsed.should.have.property('backupYShare');
    });

    it('rejects input that is not valid JSON without echoing the input', function () {
      const prv = 'not json';
      assert.throws(
        () => parseEddsaUserSigningMaterial(prv),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.ok(!err.message.includes(prv), 'error message must not echo the input');
          return true;
        }
      );
    });

    it('rejects input that parses to a non-object', function () {
      assert.throws(() => parseEddsaUserSigningMaterial('123'), /signing material is not an object/);
    });

    it('rejects material missing any of the three required shares', function () {
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      assert.throws(
        () => parseEddsaUserSigningMaterial(JSON.stringify({ bitgoYShare, backupYShare })),
        /missing uShare/
      );
      assert.throws(
        () => parseEddsaUserSigningMaterial(JSON.stringify({ uShare, backupYShare })),
        /missing bitgoYShare/
      );
      assert.throws(
        () => parseEddsaUserSigningMaterial(JSON.stringify({ uShare, bitgoYShare })),
        /missing backupYShare/
      );
    });

    it('rejects backup-style material; only user signing material is accepted', function () {
      assert.throws(() => parseEddsaUserSigningMaterial(backupStylePrv), /missing backupYShare/);
    });

    it('rejects shares that are not share-shaped objects', function () {
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      // array shares are malformed; null shares count as missing
      assert.throws(
        () => parseEddsaUserSigningMaterial(JSON.stringify({ uShare, bitgoYShare: [], backupYShare })),
        /bitgoYShare is not a valid share/
      );
      assert.throws(
        () => parseEddsaUserSigningMaterial(JSON.stringify({ uShare, bitgoYShare: null, backupYShare })),
        /missing bitgoYShare/
      );
      assert.throws(
        () => parseEddsaUserSigningMaterial(JSON.stringify({ uShare: {}, bitgoYShare, backupYShare })),
        /uShare is not a valid share/
      );
    });

    it('rejects shares with malformed fields', function () {
      const malformed = JSON.stringify({
        uShare: { i: 1, t: 2, n: 3, y: 'not-hex', seed: 'ab', chaincode: 'cd' },
        bitgoYShare: { i: 1, j: 3, y: 'ab', u: 'cd', chaincode: 'ef', v: '01' },
        backupYShare: { i: 1, j: 2, y: 'ab', u: 'cd', chaincode: 'ef' },
      });
      assert.throws(() => parseEddsaUserSigningMaterial(malformed), /uShare is not a valid share/);
    });

    it('rejects hex fields of the wrong length', function () {
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      const truncatedChaincode = JSON.stringify({
        uShare: { ...uShare, chaincode: uShare.chaincode.slice(0, 62) },
        bitgoYShare,
        backupYShare,
      });
      assert.throws(() => parseEddsaUserSigningMaterial(truncatedChaincode), /uShare is not a valid share/);
    });

    it('rejects a non-hex v field on a Y share when present', function () {
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      const tampered = JSON.stringify({
        uShare,
        backupYShare,
        bitgoYShare: { ...bitgoYShare, v: 'zz' },
      });
      assert.throws(() => parseEddsaUserSigningMaterial(tampered), /bitgoYShare is not a valid share/);
    });

    it('accepts a Y share without the optional v field', function () {
      // v is optional on the YShare type, so parsing must allow it; verification separately
      // rejects material without it with a distinct unable-to-verify error (see below)
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      const withoutV = { ...bitgoYShare };
      delete withoutV.v;
      const vlessPrv = JSON.stringify({ uShare, bitgoYShare: withoutV, backupYShare });
      const parsed = parseEddsaUserSigningMaterial(vlessPrv);
      parsed.bitgoYShare.should.not.have.property('v');
    });
  });

  describe('eddsaUserSigningMaterialMatchesCommonKeychain', function () {
    it('returns true when the combined key equals the commonKeychain', async function () {
      const match = await eddsaUserSigningMaterialMatchesCommonKeychain({ prv: matchingPrv, commonKeychain });
      match.should.equal(true);
    });

    it('returns false for material from a different key generation', async function () {
      const match = await eddsaUserSigningMaterialMatchesCommonKeychain({ prv: otherPrv, commonKeychain });
      match.should.equal(false);
    });

    it('rejects malformed material without echoing the input', async function () {
      await assert.rejects(eddsaUserSigningMaterialMatchesCommonKeychain({ prv: 'not json', commonKeychain }), {
        message: 'Invalid user key - could not parse signing material',
      });
    });

    it('rejects inconsistent shares with a constant error instead of the raw combine failure', async function () {
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      const tampered = JSON.stringify({
        uShare,
        bitgoYShare,
        backupYShare: { ...backupYShare, v: '00'.repeat(32) },
      });
      await assert.rejects(eddsaUserSigningMaterialMatchesCommonKeychain({ prv: tampered, commonKeychain }), {
        message: 'Invalid user key - could not combine signing material',
      });
    });

    it('returns false for a wrong seed behind otherwise genuine public fields', async function () {
      // keyCombine derives the private scalar from the seed but rebuilds the common keychain from
      // the declared y fields, so without an explicit seed/y binding a caller who knows only the
      // public commonKeychain could verify against a seed they do not hold
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      const forged = JSON.stringify({
        uShare: { ...uShare, seed: 'ab'.repeat(32) },
        bitgoYShare,
        backupYShare,
      });
      const match = await eddsaUserSigningMaterialMatchesCommonKeychain({ prv: forged, commonKeychain });
      match.should.equal(false);
    });

    it('rejects material that omits a VSS commitment instead of judging it a non-match', async function () {
      // keyCombine only verifies a Y share's secret u when v is present, so material that drops
      // v would otherwise pass combine with an arbitrary u; it cannot be verified at all and
      // must not be reported as a clean non-match
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      const bitgoWithoutV = { ...bitgoYShare, u: 'cd'.repeat(32) };
      delete bitgoWithoutV.v;
      const forged = JSON.stringify({
        uShare,
        bitgoYShare: bitgoWithoutV,
        backupYShare,
      });
      await assert.rejects(eddsaUserSigningMaterialMatchesCommonKeychain({ prv: forged, commonKeychain }), {
        message: 'Unable to verify key - signing material has no VSS commitment',
      });
    });

    it('rejects otherwise-genuine material without a VSS commitment as unverifiable', async function () {
      // shares without v may be genuine (the server did not always return vssProof), so the
      // answer must be "cannot verify", never "not this wallet's key"
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      const bitgoWithoutV = { ...bitgoYShare };
      delete bitgoWithoutV.v;
      const vless = JSON.stringify({ uShare, bitgoYShare: bitgoWithoutV, backupYShare });
      await assert.rejects(eddsaUserSigningMaterialMatchesCommonKeychain({ prv: vless, commonKeychain }), {
        message: 'Unable to verify key - signing material has no VSS commitment',
      });
    });

    it('returns false when a Y share carries a mismatched secret with its commitment present', async function () {
      const { uShare, bitgoYShare, backupYShare } = parseEddsaUserSigningMaterial(matchingPrv);
      const forged = JSON.stringify({
        uShare,
        bitgoYShare: { ...bitgoYShare, u: 'cd'.repeat(32) },
        backupYShare,
      });
      // a present-but-failing commitment is a combine failure, surfaced as the constant error
      await assert.rejects(eddsaUserSigningMaterialMatchesCommonKeychain({ prv: forged, commonKeychain }), {
        message: 'Invalid user key - could not combine signing material',
      });
    });
  });
});
