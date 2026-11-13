import 'should';
import * as assert from 'assert';
import * as sinon from 'sinon';
import type { SafeData } from '@bitgo/public-types';
import { DklsTypes, DklsUtils, DklsVrfUtils, MPSUtil, MpsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { ApiResponseError, IncorrectPasswordError } from '../../../../src/bitgo/errors';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';
import type { Keychain } from '../../../../src/bitgo/keychain';
import type { KeychainsTriplet } from '../../../../src/bitgo/baseCoin';
import { Safe } from '../../../../src/bitgo/safe/safe';
import {
  buildSafeKeycardRoots,
  SafeKeycardBackupsOnCurrentPasswordError,
  decryptSafeKeycardBoxD,
  type SafeKeycardMaterial,
} from '../../../../src/bitgo/safe/keycard';
import { buildSafeMpcKeyEnvelopes } from '../../../../src/bitgo/utils/tss/keyShareEnvelope';

const CURRENT_PW = 'current-password';
const KEYCARD_PW = 'creation-password';

/** The envelope pair `buildSafeMpcKeyEnvelopes` produces (named locally: the leaf exports no type). */
interface EnvelopePair {
  envelope: Buffer;
  reducedEnvelope: Buffer;
}

/** Real per-slot MPC root material, exactly as the creation ceremonies produce it. */
interface MpcSlotFixtures {
  user: EnvelopePair;
  backup: EnvelopePair;
  commonKeychain: string;
}

/** Deterministic base64 of a buffer — the browser-safe form the ceremonies use. */
const btoaBytes = (buf: Uint8Array): string => btoa(String.fromCharCode.apply(null, Array.from(buf)));

/** Decrypt stub keyed by `${password}:${input}` — unrecognized pairs fail like a real wrong password. */
function makeMockBitGo(entries: Record<string, string>): {
  bitgo: BitGoBase;
  sessionEncrypt: sinon.SinonStub;
  createSession: sinon.SinonStub;
} {
  const session = {
    encrypt: sinon.stub().callsFake(async (p: string) => `SESSION[${p}]`),
    decrypt: sinon.stub(),
    destroy: sinon.stub(),
  };
  const bitgo = {
    decrypt: sinon.stub().callsFake(async ({ input, password }: { input: string; password: string }) => {
      const plaintext = entries[`${password}:${input}`];
      if (plaintext === undefined) {
        throw new Error('decrypt failed');
      }
      return plaintext;
    }),
    createEncryptionSession: sinon.stub().resolves(session),
  } as unknown as BitGoBase;
  return {
    bitgo,
    sessionEncrypt: session.encrypt,
    createSession: bitgo.createEncryptionSession as unknown as sinon.SinonStub,
  };
}

function makeKeychain(overrides: Partial<Keychain>): Keychain {
  return { id: 'id', type: 'independent', pub: 'pub', ...overrides };
}

describe('safe keycard regeneration (keycard.ts)', function (this: Mocha.Suite) {
  this.timeout(120000);

  const mpc = {} as { ecdsa: MpcSlotFixtures; eddsa: MpcSlotFixtures };

  before(async function () {
    const [ecdsaUser, ecdsaBackup] = await DklsUtils.generateDKGKeyShares();
    const [ecdsaVrfUser, ecdsaVrfBackup] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const [eddsaUser, eddsaBackup] = await MPSUtil.generateEdDsaDKGKeyShares();
    const [eddsaVrfUser, eddsaVrfBackup] = await MpsVrfUtils.generateVrfDKGKeyShares();
    mpc.ecdsa = {
      user: buildSafeMpcKeyEnvelopes(
        ecdsaUser.getKeyShare(),
        ecdsaUser.getReducedKeyShare(),
        ecdsaVrfUser.getKeyShare()
      ),
      backup: buildSafeMpcKeyEnvelopes(
        ecdsaBackup.getKeyShare(),
        ecdsaBackup.getReducedKeyShare(),
        ecdsaVrfBackup.getKeyShare()
      ),
      commonKeychain: DklsTypes.getCommonKeychain(ecdsaUser.getKeyShare()),
    };
    mpc.eddsa = {
      user: buildSafeMpcKeyEnvelopes(
        eddsaUser.getKeyShare(),
        eddsaUser.getReducedKeyShare(),
        eddsaVrfUser.getKeyShare()
      ),
      backup: buildSafeMpcKeyEnvelopes(
        eddsaBackup.getKeyShare(),
        eddsaBackup.getReducedKeyShare(),
        eddsaVrfBackup.getKeyShare()
      ),
      commonKeychain: eddsaUser.getCommonKeychain(),
    };
  });

  /** All four roots' material, envelopes decryptable under the given (user, backup) passwords. */
  function makeMaterial(
    userPassword: string,
    backupPassword: string
  ): { material: SafeKeycardMaterial; entries: Record<string, string> } {
    const entries: Record<string, string> = {
      [`${userPassword}:enc-user-secp`]: 'xprv-user',
      [`${backupPassword}:enc-backup-secp`]: 'xprv-backup',
      [`${userPassword}:enc-user-ed25519`]: 'S-user-seed',
      [`${backupPassword}:enc-backup-ed25519`]: 'S-backup-seed',
      [`${userPassword}:enc-user-ecdsa`]: mpc.ecdsa.user.envelope.toString('base64'),
      [`${backupPassword}:enc-backup-ecdsa`]: mpc.ecdsa.backup.envelope.toString('base64'),
      [`${userPassword}:enc-user-eddsa`]: mpc.eddsa.user.envelope.toString('base64'),
      [`${backupPassword}:enc-backup-eddsa`]: mpc.eddsa.backup.envelope.toString('base64'),
    };
    const root = (userEnc: string, backupEnc: string, commonKeychain?: string): KeychainsTriplet => ({
      userKeychain: makeKeychain({ id: 'user', encryptedPrv: userEnc, commonKeychain }),
      backupKeychain: makeKeychain({ id: 'backup', encryptedPrv: backupEnc, commonKeychain }),
      bitgoKeychain: makeKeychain({ id: 'bitgo', commonKeychain }),
    });
    return {
      material: {
        roots: {
          secp256k1Multisig: root('enc-user-secp', 'enc-backup-secp'),
          ed25519Multisig: root('enc-user-ed25519', 'enc-backup-ed25519'),
          ecdsaMpc: root('enc-user-ecdsa', 'enc-backup-ecdsa', mpc.ecdsa.commonKeychain),
          eddsaMpc: root('enc-user-eddsa', 'enc-backup-eddsa', mpc.eddsa.commonKeychain),
        },
      },
      entries,
    };
  }

  describe('buildSafeKeycardRoots', function () {
    it('re-encrypts user material under the keycard password and copies multisig backups byte-identical', async function () {
      const { material, entries } = makeMaterial(KEYCARD_PW, KEYCARD_PW);
      const { bitgo, createSession, sessionEncrypt } = makeMockBitGo(entries);

      const roots = await buildSafeKeycardRoots({
        bitgo,
        material,
        currentPassphrase: KEYCARD_PW,
        keycardPassphrase: KEYCARD_PW,
      });

      sinon.assert.calledOnce(createSession);
      sinon.assert.calledWithMatch(createSession, KEYCARD_PW);
      roots.secp256k1Multisig!.userKeychain.encryptedPrv!.should.equal('SESSION[xprv-user]');
      roots.secp256k1Multisig!.backupKeychain.encryptedPrv!.should.equal('enc-backup-secp');
      roots.secp256k1Multisig!.bitgoKeychain.should.equal(material.roots.secp256k1Multisig!.bitgoKeychain);
      roots.ed25519Multisig!.userKeychain.encryptedPrv!.should.equal('SESSION[S-user-seed]');
      // 2 multisig user re-encryptions + 4 MPC reduced envelopes share one KDF session.
      sessionEncrypt.callCount.should.equal(6);
    });

    it('reduces MPC roots to the ceremony-shaped reducedEncryptedPrv and never touches encryptedPrv', async function () {
      const { material, entries } = makeMaterial(CURRENT_PW, KEYCARD_PW);
      const { bitgo } = makeMockBitGo(entries);

      const roots = await buildSafeKeycardRoots({
        bitgo,
        material,
        currentPassphrase: CURRENT_PW,
        keycardPassphrase: KEYCARD_PW,
      });

      for (const slot of ['ecdsaMpc', 'eddsaMpc'] as const) {
        const triplet = roots[slot]!;
        assert.ok(triplet.userKeychain.reducedEncryptedPrv, `${slot} user reducedEncryptedPrv`);
        assert.ok(triplet.backupKeychain.reducedEncryptedPrv, `${slot} backup reducedEncryptedPrv`);
        triplet.userKeychain.encryptedPrv!.should.equal(material.roots[slot]!.userKeychain.encryptedPrv);
        triplet.backupKeychain.encryptedPrv!.should.equal(material.roots[slot]!.backupKeychain.encryptedPrv);
      }
      // Byte-equal to the reduced envelope the creation ceremony stores (DKLS and MPS reduce paths).
      roots.ecdsaMpc!.userKeychain.reducedEncryptedPrv!.should.equal(
        `SESSION[${btoaBytes(mpc.ecdsa.user.reducedEnvelope)}]`
      );
      roots.eddsaMpc!.userKeychain.reducedEncryptedPrv!.should.equal(
        `SESSION[${btoaBytes(mpc.eddsa.user.reducedEnvelope)}]`
      );
    });

    it('copies an already-reduced MPC backup (generateSafe shape) as-is after verifying the creation password', async function () {
      const { material, entries } = makeMaterial(CURRENT_PW, KEYCARD_PW);
      // generateSafe shape: WP redacts the backup encryptedPrv on key-add; the ceremony keeps
      // the local reducedEncryptedPrv under the creation password.
      const reducedBackup = makeKeychain({
        id: 'backup',
        encryptedPrv: undefined,
        reducedEncryptedPrv: 'enc-reduced-backup-ecdsa',
        commonKeychain: mpc.ecdsa.commonKeychain,
      });
      const generateSafeShape: SafeKeycardMaterial = {
        roots: { ecdsaMpc: { ...material.roots.ecdsaMpc!, backupKeychain: reducedBackup } },
      };
      const { bitgo } = makeMockBitGo({
        ...entries,
        [`${KEYCARD_PW}:enc-reduced-backup-ecdsa`]: btoaBytes(mpc.ecdsa.backup.reducedEnvelope),
      });

      const roots = await buildSafeKeycardRoots({
        bitgo,
        material: generateSafeShape,
        currentPassphrase: CURRENT_PW,
        keycardPassphrase: KEYCARD_PW,
      });
      roots.ecdsaMpc!.backupKeychain.should.equal(reducedBackup);
      roots.ecdsaMpc!.userKeychain.reducedEncryptedPrv!.should.equal(
        `SESSION[${btoaBytes(mpc.ecdsa.user.reducedEnvelope)}]`
      );

      // The copied reduced envelope is still checked against the creation password.
      await assert.rejects(
        buildSafeKeycardRoots({
          bitgo,
          material: generateSafeShape,
          currentPassphrase: CURRENT_PW,
          keycardPassphrase: 'mistyped-creation-password',
        }),
        (e: unknown) => e instanceof IncorrectPasswordError && /keycard \(creation\) password/.test(e.message)
      );

      // Neither envelope present: named error, not a decrypt of undefined.
      const noBackupEnvelope: SafeKeycardMaterial = {
        roots: {
          ecdsaMpc: {
            ...material.roots.ecdsaMpc!,
            backupKeychain: makeKeychain({ id: 'backup', commonKeychain: mpc.ecdsa.commonKeychain }),
          },
        },
      };
      await buildSafeKeycardRoots({
        bitgo,
        material: noBackupEnvelope,
        currentPassphrase: CURRENT_PW,
        keycardPassphrase: KEYCARD_PW,
      }).should.be.rejectedWith(/ecdsaMpc backup root is missing both encryptedPrv and reducedEncryptedPrv/);
    });

    it('names backups rotated by a pre-WCN-3920 password change instead of calling the creation password wrong', async function () {
      // A password change that ran before backups were write-protected re-encrypted them too:
      // every envelope, user and backup, is under the current password.
      const { material, entries } = makeMaterial(CURRENT_PW, CURRENT_PW);
      const { bitgo, sessionEncrypt } = makeMockBitGo(entries);
      const isRotatedBackups = (slot: string) => (e: unknown) =>
        e instanceof SafeKeycardBackupsOnCurrentPasswordError &&
        e instanceof IncorrectPasswordError && // existing wrong-password handlers still catch it
        e.slot === slot;

      // Multisig path (backup copied, verified by trial decrypt).
      await assert.rejects(
        buildSafeKeycardRoots({
          bitgo,
          material: { roots: { secp256k1Multisig: material.roots.secp256k1Multisig! } },
          currentPassphrase: CURRENT_PW,
          keycardPassphrase: KEYCARD_PW,
        }),
        isRotatedBackups('secp256k1Multisig')
      );
      // MPC path (full backup envelope reduced).
      await assert.rejects(
        buildSafeKeycardRoots({
          bitgo,
          material: { roots: { ecdsaMpc: material.roots.ecdsaMpc! } },
          currentPassphrase: CURRENT_PW,
          keycardPassphrase: KEYCARD_PW,
        }),
        isRotatedBackups('ecdsaMpc')
      );
      sinon.assert.notCalled(sessionEncrypt);

      // The documented recovery: rebuild with the current password as the keycard password.
      const roots = await buildSafeKeycardRoots({
        bitgo,
        material,
        currentPassphrase: CURRENT_PW,
        keycardPassphrase: CURRENT_PW,
      });
      Object.keys(roots).should.deepEqual(['secp256k1Multisig', 'ed25519Multisig', 'ecdsaMpc', 'eddsaMpc']);
      roots.secp256k1Multisig!.backupKeychain.encryptedPrv!.should.equal('enc-backup-secp');
    });

    it('falls back to reducing the full envelope when reducedEncryptedPrv is null on the wire', async function () {
      const { material, entries } = makeMaterial(CURRENT_PW, KEYCARD_PW);
      const { bitgo } = makeMockBitGo(entries);
      const ecdsa = material.roots.ecdsaMpc!;
      const nullReduced = {
        ...ecdsa.backupKeychain,
        reducedEncryptedPrv: null as unknown as string,
      };

      const roots = await buildSafeKeycardRoots({
        bitgo,
        material: { roots: { ecdsaMpc: { ...ecdsa, backupKeychain: nullReduced } } },
        currentPassphrase: CURRENT_PW,
        keycardPassphrase: KEYCARD_PW,
      });
      roots.ecdsaMpc!.backupKeychain.reducedEncryptedPrv!.should.equal(
        `SESSION[${btoaBytes(mpc.ecdsa.backup.reducedEnvelope)}]`
      );
    });

    it('throws IncorrectPasswordError when the current password does not open a user envelope', async function () {
      const { material } = makeMaterial(CURRENT_PW, KEYCARD_PW);
      const { bitgo } = makeMockBitGo({}); // nothing decrypts

      await buildSafeKeycardRoots({
        bitgo,
        material,
        currentPassphrase: 'wrong',
        keycardPassphrase: KEYCARD_PW,
      }).should.be.rejectedWith(IncorrectPasswordError);
    });

    it('rejects a wrong creation password on a multisig-only subset instead of emitting a mixed-password keycard', async function () {
      const { material, entries } = makeMaterial(CURRENT_PW, KEYCARD_PW);
      const { bitgo, sessionEncrypt } = makeMockBitGo(entries);
      const multisigOnly: SafeKeycardMaterial = {
        roots: {
          secp256k1Multisig: material.roots.secp256k1Multisig!,
          ed25519Multisig: material.roots.ed25519Multisig!,
        },
      };
      const isWrongCreationPassword = (e: unknown): boolean =>
        e instanceof IncorrectPasswordError &&
        !(e instanceof SafeKeycardBackupsOnCurrentPasswordError) &&
        /keycard \(creation\) password/.test(e.message);

      // Mistyped creation password: the user envelope opens, but the backups would not.
      await assert.rejects(
        buildSafeKeycardRoots({
          bitgo,
          material: multisigOnly,
          currentPassphrase: CURRENT_PW,
          keycardPassphrase: 'mistyped-creation-password',
        }),
        isWrongCreationPassword
      );
      // Password changed but the caller passed the current password for both.
      await assert.rejects(
        buildSafeKeycardRoots({
          bitgo,
          material: multisigOnly,
          currentPassphrase: CURRENT_PW,
          keycardPassphrase: CURRENT_PW,
        }),
        isWrongCreationPassword
      );
      sinon.assert.notCalled(sessionEncrypt);

      // The right creation password verifies once and builds both slots.
      const decryptStub = bitgo.decrypt as unknown as sinon.SinonStub;
      decryptStub.resetHistory();
      const roots = await buildSafeKeycardRoots({
        bitgo,
        material: multisigOnly,
        currentPassphrase: CURRENT_PW,
        keycardPassphrase: KEYCARD_PW,
      });
      Object.keys(roots).should.deepEqual(['secp256k1Multisig', 'ed25519Multisig']);
      // 1 backup verification + 2 user decrypts.
      decryptStub.callCount.should.equal(3);
    });

    it('throws a named error when a root is missing its envelope, and when roots is empty', async function () {
      const { material, entries } = makeMaterial(KEYCARD_PW, KEYCARD_PW);
      const { bitgo } = makeMockBitGo(entries);
      const missingEnvelope: SafeKeycardMaterial = { roots: { secp256k1Multisig: material.roots.secp256k1Multisig! } };
      missingEnvelope.roots.secp256k1Multisig!.userKeychain.encryptedPrv = undefined;

      await buildSafeKeycardRoots({
        bitgo,
        material: missingEnvelope,
        currentPassphrase: KEYCARD_PW,
        keycardPassphrase: KEYCARD_PW,
      }).should.be.rejectedWith(/secp256k1Multisig user\/backup root is missing encryptedPrv/);
      await buildSafeKeycardRoots({
        bitgo,
        material: { roots: {} },
        currentPassphrase: KEYCARD_PW,
        keycardPassphrase: KEYCARD_PW,
      }).should.be.rejectedWith(/carries no root slots/);
    });

    it('throws on a null, undefined or unknown slot instead of dropping it', async function () {
      const { material, entries } = makeMaterial(KEYCARD_PW, KEYCARD_PW);
      const { bitgo } = makeMockBitGo(entries);
      const cases: [Record<string, unknown>, RegExp][] = [
        [{ ...material.roots, eddsaMpc: null }, /eddsaMpc root is not a keychain triplet/],
        [{ secp256k1Multisig: material.roots.secp256k1Multisig, ecdsaMpc: undefined }, /ecdsaMpc root is not/],
        [{ ecdsaMpc: { ...material.roots.ecdsaMpc, bitgoKeychain: null } }, /ecdsaMpc root is not/],
        [{ ...material.roots, bogusSlot: material.roots.ecdsaMpc }, /unknown root slot bogusSlot/],
      ];
      for (const [roots, error] of cases) {
        await buildSafeKeycardRoots({
          bitgo,
          material: { roots } as SafeKeycardMaterial,
          currentPassphrase: KEYCARD_PW,
          keycardPassphrase: KEYCARD_PW,
        }).should.be.rejectedWith(error);
      }
    });

    it('rejects an MPC triplet whose keys disagree on commonKeychain', async function () {
      const { material, entries } = makeMaterial(KEYCARD_PW, KEYCARD_PW);
      const { bitgo } = makeMockBitGo(entries);
      const ecdsaMpc = material.roots.ecdsaMpc!;
      ecdsaMpc.bitgoKeychain = { ...ecdsaMpc.bitgoKeychain, commonKeychain: mpc.eddsa.commonKeychain };
      await buildSafeKeycardRoots({
        bitgo,
        material: { roots: { ecdsaMpc } },
        currentPassphrase: KEYCARD_PW,
        keycardPassphrase: KEYCARD_PW,
      }).should.be.rejectedWith(/ecdsaMpc root has mismatched commonKeychain/);
    });
  });

  describe('decryptSafeKeycardBoxD', function () {
    it('returns the creation password for the right code and IncorrectPasswordError otherwise', async function () {
      const good = makeMockBitGo({ '123456:box-d': 'creation-password' });
      (
        await decryptSafeKeycardBoxD({ bitgo: good.bitgo, boxD: 'box-d', passcodeEncryptionCode: '123456' })
      ).should.equal('creation-password');
      const bad = makeMockBitGo({});
      await decryptSafeKeycardBoxD({
        bitgo: bad.bitgo,
        boxD: 'box-d',
        passcodeEncryptionCode: '000000',
      }).should.be.rejectedWith(IncorrectPasswordError);
    });
  });
  describe('Safe.requestKeycardAccess / claimKeycardMaterial', function () {
    const safeDataWire = {
      id: 'safe-1',
      enterpriseId: 'ent-1',
      label: 'l',
      status: 'active',
      creator: 'c',
      users: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    } as unknown as SafeData;

    /** One root key in WP's claim projection (WCN-3921 `SafeKeycardRootKey`). */
    const wireKey = (id: string, source: string, fields: Record<string, unknown> = {}) => ({
      id,
      type: 'tss',
      source,
      ...fields,
    });
    const wireTriplet = () => ({
      user: wireKey('u1', 'user'),
      backup: wireKey('b1', 'backup'),
      bitgo: wireKey('g1', 'bitgo'),
    });

    function makeSafe() {
      const mockBitGo = {
        url: sinon.stub().callsFake((path: string) => path),
        post: sinon.stub(),
      };
      return { safe: new Safe(mockBitGo as unknown as BitGoBase, safeDataWire), mockBitGo };
    }

    it('decodes a granted keycardAccess window', async function () {
      const { safe, mockBitGo } = makeSafe();
      mockBitGo.post.returns({
        send: sinon
          .stub()
          .returns({ result: sinon.stub().resolves({ keycardAccess: { expiresAt: '2026-11-10T00:00:00Z' } }) }),
      });

      const result = await safe.requestKeycardAccess();
      sinon.assert.calledWithMatch(mockBitGo.post, '/enterprise/ent-1/safes/safe-1/keycard/request');
      if (!('keycardAccess' in result)) {
        throw new Error('expected keycardAccess');
      }
      result.keycardAccess.expiresAt.should.equal('2026-11-10T00:00:00Z');
    });

    it('decodes a pending approval instead of access', async function () {
      const { safe, mockBitGo } = makeSafe();
      mockBitGo.post.returns({
        send: sinon
          .stub()
          .returns({ result: sinon.stub().resolves({ pendingApproval: { id: 'pa-1', state: 'pending' } }) }),
      });

      const result = await safe.requestKeycardAccess();
      if (!('pendingApproval' in result)) {
        throw new Error('expected pendingApproval');
      }
      result.pendingApproval.id.should.equal('pa-1');
      result.pendingApproval.state.should.equal('pending');
    });

    it('claims material and maps claimed triplets to the KeychainsTriplet shape, stripping unknown fields', async function () {
      const { safe, mockBitGo } = makeSafe();
      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves({
            id: 'kc-1',
            roots: {
              ecdsaMpc: {
                user: wireKey('u1', 'user', { encryptedPrv: 'enc', commonKeychain: 'ck', extra: 'dropped' }),
                backup: wireKey('b1', 'backup'),
                bitgo: wireKey('g1', 'bitgo'),
              },
            },
            passcodeEncryptionCode: '123456',
          }),
        }),
      });

      const material = await safe.claimKeycardMaterial();
      sinon.assert.calledWithMatch(mockBitGo.post, '/enterprise/ent-1/safes/safe-1/keycard');
      material.passcodeEncryptionCode!.should.equal('123456');
      const triplet = material.roots.ecdsaMpc!;
      triplet.userKeychain.should.deepEqual({
        id: 'u1',
        type: 'tss',
        source: 'user',
        encryptedPrv: 'enc',
        commonKeychain: 'ck',
      });
      triplet.backupKeychain.id.should.equal('b1');
      triplet.bitgoKeychain.id.should.equal('g1');
    });

    it('maps a 409 with a pending approval id to { pendingApprovalId } and rethrows other 409s', async function () {
      const { safe, mockBitGo } = makeSafe();
      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().rejects(new ApiResponseError('conflict', 409, { pendingApproval: 'pa-earlier' })),
        }),
      });
      (await safe.requestKeycardAccess()).should.deepEqual({ pendingApprovalId: 'pa-earlier' });

      const notActive = new ApiResponseError('SafeNotActive', 409, { error: 'SafeNotActive', name: 'SafeNotActive' });
      mockBitGo.post.returns({ send: sinon.stub().returns({ result: sinon.stub().rejects(notActive) }) });
      await assert.rejects(safe.requestKeycardAccess(), (e: unknown) => e === notActive);
    });

    it('treats a null passcodeEncryptionCode (pre-code safe) as absent', async function () {
      const { safe, mockBitGo } = makeSafe();
      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves({
            roots: { ecdsaMpc: wireTriplet() },
            passcodeEncryptionCode: null,
          }),
        }),
      });

      const material = await safe.claimKeycardMaterial();
      assert.strictEqual(material.passcodeEncryptionCode, undefined);
      material.roots.ecdsaMpc!.userKeychain.id.should.equal('u1');
    });

    it('rejects an unknown slot key and empty claimed roots', async function () {
      const { safe, mockBitGo } = makeSafe();
      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves({
            roots: { bogusSlot: wireTriplet() },
          }),
        }),
      });
      await safe.claimKeycardMaterial().should.be.rejectedWith(/SafeKeycardMaterial/);

      mockBitGo.post.returns({ send: sinon.stub().returns({ result: sinon.stub().resolves({ roots: {} }) }) });
      await safe.claimKeycardMaterial().should.be.rejectedWith(/no root material/);
    });

    it('rejects a claimed key that does not match the WP root-key projection', async function () {
      const { safe, mockBitGo } = makeSafe();
      const malformed = [
        { ...wireTriplet(), user: { id: 'u1', source: 'user' } }, // missing type
        { ...wireTriplet(), backup: wireKey('b1', 'backup', { encryptedPrv: 42 }) }, // wrong field type
        { user: wireKey('u1', 'user'), backup: wireKey('b1', 'backup') }, // missing bitgo
      ];
      for (const ecdsaMpc of malformed) {
        mockBitGo.post.returns({
          send: sinon.stub().returns({ result: sinon.stub().resolves({ roots: { ecdsaMpc } }) }),
        });
        await safe.claimKeycardMaterial().should.be.rejectedWith(/SafeKeycardMaterial/);
      }
    });
  });
});
