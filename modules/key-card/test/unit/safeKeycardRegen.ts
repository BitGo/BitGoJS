/**
 * End-to-end Safe keycard tests (WCN-3922): real Safes.generateSafe / Safe.claimKeycardMaterial →
 * buildSafeKeycardRoots → generateSafeQrData → parseSafeKeycardBox → decryptSafeKeycard →
 * deriveSafeWalletKeys, with real encryption and key material. WP is mocked with the wire shapes it
 * serves: backup envelopes redacted on key add (WCN-3920) and the keycard claim projection (WCN-3921).
 */
import 'should';
import * as assert from 'assert';
import * as crypto from 'crypto';
import { createEncryptionSession, decrypt, encrypt } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import { bip32 } from '@bitgo/utxo-lib';
import { DklsTypes, DklsUtils, DklsVrfUtils, MPSUtil, MpsVrfUtils } from '@bitgo/sdk-lib-mpc';
import * as safesLib from '@bitgo/sdk-lib-safes';
import {
  BitGoBase,
  buildSafeKeycardRoots,
  buildSafeMpcKeyEnvelopes,
  decryptSafeKeycard,
  decryptSafeKeycardBoxD,
  deriveSafeWalletKeys,
  Safe,
  SafeKeychainRoots,
  Safes,
} from '@bitgo/sdk-core';
import { generateSafeQrData } from '../../src/generateQrData';
import { QrData, SAFE_ROOT_ORDER, SafeRootKeyType as Slot } from '../../src/types';
import { splitKeys } from '../../src/utils';
import { QRBinaryMaxLength } from '../../src/drawKeycard';

const CREATION_PW = 'safe-creation-password';
const CHANGED_PW = 'safe-password-after-change';
const CODE = 'Ab3dE';
const ALL: Slot[] = ['secp256k1Multisig', 'ed25519Multisig', 'ecdsaMpc', 'eddsaMpc'];
// Per slot (in ALL order): the coin derived on recovery, and the testnet root coin generateSafe uses.
const COIN = ['btc', 'algo', 'eth', 'sol'];
const ROOT_COIN: Record<string, Slot> = { tbtc: ALL[0], txlm: ALL[1], hteth: ALL[2], tsol: ALL[3] };

const cryptoBitGo = {
  encrypt: async ({ input, password }: { input: string; password: string }) => encrypt(password, input),
  decrypt: async ({ input, password }: { input: string; password: string }) => decrypt(password, input),
  createEncryptionSession: async (password: string) => createEncryptionSession(password),
} as unknown as BitGoBase;
const b64 = (buf: Uint8Array): string => Buffer.from(buf).toString('base64');
const reassemble = (data: string): string => splitKeys(data, QRBinaryMaxLength).join('');

type MpcParty = { envelope: Buffer; reducedEnvelope: Buffer; reduced: Buffer; vrf: Buffer };
type Fixture =
  | {
      mpc: false;
      user: string;
      userPub: string;
      backup: string;
      backupPub: string;
      bitgoPub: string;
      decryptedBackup: unknown;
    }
  | { mpc: true; commonKeychain: string; user: MpcParty; backup: MpcParty };

/** Real root material for all four slots, as the creation ceremonies hold it. */
async function buildFixtures(): Promise<Record<Slot, Fixture>> {
  const xprv = () => bip32.fromSeed(crypto.randomBytes(32));
  const ed = () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    return {
      seed: privateKey.export({ format: 'der', type: 'pkcs8' }).subarray(-32),
      pub: publicKey.export({ format: 'der', type: 'spki' }).subarray(-32),
    };
  };
  const [secpUser, secpBackup] = [xprv(), xprv()];
  const [edUser, edBackup, edBitgo] = [ed(), ed(), ed()];
  const chainCode = crypto.randomBytes(32);
  const party = (full: Buffer, reduced: Buffer, vrf: Buffer): MpcParty => ({
    ...buildSafeMpcKeyEnvelopes(full, reduced, vrf),
    reduced,
    vrf,
  });
  const [dkls, dklsVrf, mps, mpsVrf] = await Promise.all([
    DklsUtils.generateDKGKeyShares(),
    DklsVrfUtils.generateVrfDKGKeyShares(),
    MPSUtil.generateEdDsaDKGKeyShares(),
    MpsVrfUtils.generateVrfDKGKeyShares(),
  ]);
  const edBackupSeed = safesLib.encodeEd25519StrKeySecretSeed(edBackup.seed);
  return {
    secp256k1Multisig: {
      mpc: false,
      user: secpUser.toBase58(),
      userPub: secpUser.neutered().toBase58(),
      backup: secpBackup.toBase58(),
      backupPub: secpBackup.neutered().toBase58(),
      bitgoPub: xprv().neutered().toBase58(),
      decryptedBackup: secpBackup.toBase58(),
    },
    ed25519Multisig: {
      mpc: false,
      user: safesLib.encodeEd25519StrKeySecretSeed(edUser.seed),
      userPub: safesLib.encodeEd25519StrKeyPublicKey(edUser.pub),
      backup: edBackupSeed,
      backupPub: safesLib.encodeDerivableEd25519Pub(edBackup.pub, chainCode),
      bitgoPub: safesLib.encodeDerivableEd25519Pub(edBitgo.pub, crypto.randomBytes(32)),
      decryptedBackup: { prv: edBackupSeed, chainCode: safesLib.encodeEd25519ChainCode(chainCode) },
    },
    ecdsaMpc: {
      mpc: true,
      commonKeychain: DklsTypes.getCommonKeychain(dkls[0].getKeyShare()),
      user: party(dkls[0].getKeyShare(), dkls[0].getReducedKeyShare(), dklsVrf[0].getKeyShare()),
      backup: party(dkls[1].getKeyShare(), dkls[1].getReducedKeyShare(), dklsVrf[1].getKeyShare()),
    },
    eddsaMpc: {
      mpc: true,
      commonKeychain: mps[0].getCommonKeychain(),
      user: party(mps[0].getKeyShare(), mps[0].getReducedKeyShare(), mpsVrf[0].getKeyShare()),
      backup: party(mps[1].getKeyShare(), mps[1].getReducedKeyShare(), mpsVrf[1].getKeyShare()),
    },
  };
}

const safeDataWire = {
  id: 'safe-id',
  enterpriseId: 'enterprise-id',
  label: 'Keycard Safe',
  status: 'active',
  creator: 'creator-id',
  users: [{ userId: 'creator-id', permissions: ['admin', 'spend'] }],
  createdAt: '2026-11-11T00:00:00.000Z',
};

/** A key as WP serializes it: id, type, source, MPC commonKeychain, plus `extra`. */
const keyJson = (slot: Slot, fx: Fixture, role: string, extra: Record<string, unknown>) => ({
  id: `${slot}-${role}`,
  type: fx.mpc ? 'tss' : 'independent',
  source: role,
  ...(fx.mpc ? { commonKeychain: fx.commonKeychain } : {}),
  ...extra,
});

/** A BitGo mock answering POSTs from `routes`, keyed by URL suffix. */
function httpBitGo(routes: Record<string, () => unknown>, extra: Record<string, unknown> = {}): BitGoBase {
  const post = (url: string) => ({
    send: () => ({
      result: async () => {
        const suffix = Object.keys(routes).find((s) => url.endsWith(s));
        assert.ok(suffix, `unexpected POST ${url}`);
        return routes[suffix]();
      },
    }),
  });
  return { url: (path: string) => path, post, ...extra } as unknown as BitGoBase;
}

/**
 * Runs the real Safes.generateSafe. Key adds echo the user envelope but never the backup's
 * (WCN-3920): multisig backups carry the envelope createBackup merges back locally, MPC backups only
 * the ceremony's local reducedEncryptedPrv.
 */
async function generateSafe(f: Record<Slot, Fixture>) {
  const calls: { originalPasscodeEncryptionCode?: string }[] = [];
  const keychains = (slot: Slot) => {
    const fx = f[slot];
    const key = (role: string, extra: Record<string, unknown>) => keyJson(slot, fx, role, extra);
    if (fx.mpc) {
      return {
        createMpc: async (p: { passphrase: string; originalPasscodeEncryptionCode?: string }) => {
          calls.push(p);
          const enc = (buf: Buffer) => encrypt(p.passphrase, b64(buf));
          return {
            userKeychain: key('user', {
              encryptedPrv: await enc(fx.user.envelope),
              reducedEncryptedPrv: await enc(fx.user.reducedEnvelope),
            }),
            backupKeychain: key('backup', { reducedEncryptedPrv: await enc(fx.backup.reducedEnvelope) }),
            bitgoKeychain: key('bitgo', {}),
          };
        },
      };
    }
    return {
      create: () => ({ pub: fx.userPub, prv: fx.user }),
      add: async (p: { pub: string; encryptedPrv: string; originalPasscodeEncryptionCode?: string }) => {
        calls.push(p);
        return key('user', p);
      },
      createBackup: async (p: { passphrase: string; originalPasscodeEncryptionCode?: string }) => {
        calls.push(p);
        return key('backup', {
          pub: fx.backupPub,
          prv: fx.backup,
          encryptedPrv: await encrypt(p.passphrase, fx.backup),
        });
      },
      createBitGo: async () => key('bitgo', { pub: fx.bitgoPub }),
    };
  };
  const bitgo = httpBitGo(
    { '/safes': () => ({ id: 'safe-id', status: 'initializing' }), '/finalize': () => safeDataWire },
    {
      getEnv: () => 'test',
      encrypt: cryptoBitGo.encrypt,
      coin: (name: string) => ({ keychains: () => keychains(ROOT_COIN[name]) }),
    }
  );
  const result = await new Safes(bitgo, 'enterprise-id').generateSafe({
    label: 'Keycard Safe',
    passphrase: CREATION_PW,
    passcodeEncryptionCode: CODE,
  });
  return { result, calls };
}

/**
 * The WP claim body (`serializeSafeKeycard`) after a password change: user envelopes rotated to
 * CHANGED_PW, backups still on the creation password, each root projected to the claim fields.
 */
async function claimWire(f: Record<Slot, Fixture>, slots: Slot[]) {
  const roots: Record<string, unknown> = {};
  for (const slot of slots) {
    const fx = f[slot];
    const key = (role: string, extra: Record<string, unknown>) => keyJson(slot, fx, role, extra);
    const [user, backup] = fx.mpc ? [b64(fx.user.envelope), b64(fx.backup.envelope)] : [fx.user, fx.backup];
    roots[slot] = {
      user: key('user', { encryptedPrv: await encrypt(CHANGED_PW, user) }),
      backup: key('backup', {
        encryptedPrv: await encrypt(CREATION_PW, backup),
        ...(fx.mpc ? {} : { pub: fx.backupPub }),
      }),
      bitgo: key('bitgo', fx.mpc ? {} : { pub: fx.bitgoPub }),
    };
  }
  return { roots, passcodeEncryptionCode: CODE };
}

/**
 * Reads a keycard back as recovery does: boxes declare `slots` in canonical order, decrypt under
 * `password` to the original material (MPC: the ceremony's reduced + VRF shares), every present
 * slot derives, absent slots fail by name, and Box D opens to `password`.
 */
async function assertRecovers(qr: QrData, f: Record<Slot, Fixture>, slots: Slot[], password: string) {
  assert.ok(qr.backup && qr.bitgo && qr.passcode, 'keycard must carry boxes A-D');
  const [userKeyBox, backupKeyBox, bitgoKeyBox] = [qr.user, qr.backup, qr.bitgo].map((b) => reassemble(b.data));
  for (const box of [userKeyBox, backupKeyBox, bitgoKeyBox]) {
    Object.keys(safesLib.parseSafeKeycardBox(box)).should.deepEqual(SAFE_ROOT_ORDER.filter((s) => slots.includes(s)));
  }
  const roots = await decryptSafeKeycard({ bitgo: cryptoBitGo, userKeyBox, backupKeyBox, bitgoKeyBox, password });
  for (const slot of ALL) {
    const fx = f[slot];
    const root = roots[slot];
    const derive = deriveSafeWalletKeys({ coin: COIN[ALL.indexOf(slot)], slot, account: 0, roots });
    if (!slots.includes(slot)) {
      assert.strictEqual(root, undefined);
      await derive.should.be.rejectedWith(new RegExp(`missing the '${slot}' root`));
      continue;
    }
    assert.ok(root);
    if (fx.mpc) {
      const mpcRoot = root as { user: { signing: Buffer; vrf: Buffer }; backup: typeof mpcRoot.user; bitgo: string };
      for (const role of ['user', 'backup'] as const) {
        assert.ok(mpcRoot[role].signing.equals(fx[role].reduced), `${slot} ${role} reduced share`);
        assert.ok(mpcRoot[role].vrf.equals(fx[role].vrf), `${slot} ${role} VRF share`);
      }
      mpcRoot.bitgo.should.equal(fx.commonKeychain);
    } else {
      root.should.deepEqual({ user: fx.user, backup: fx.decryptedBackup, bitgo: fx.bitgoPub });
    }
    (await derive).slot.should.equal(slot);
  }
  (
    await decryptSafeKeycardBoxD({ bitgo: cryptoBitGo, boxD: qr.passcode.data, passcodeEncryptionCode: CODE })
  ).should.equal(password);
}

const keycard = (roots: SafeKeychainRoots, passphrase: string) =>
  generateSafeQrData({ coin: coins.get('btc'), roots, passphrase, passcodeEncryptionCode: CODE });

describe('safe keycard end to end (generateSafe / claim → keycard → recovery)', function (this: Mocha.Suite) {
  // Real DKLS / MPS ceremonies, MPC derivation and several KDF runs.
  this.timeout(300000);

  let f: Record<Slot, Fixture>;
  let creationQr: QrData;

  before(async function () {
    f = await buildFixtures();
  });

  it('builds the creation-time keycard from the generateSafe triplets: all 4 roots + Box D', async function () {
    const { result, calls } = await generateSafe(f);
    const { rootKeychains } = result;
    Object.keys(rootKeychains).should.deepEqual(ALL);
    // add/createBackup per multisig root + createMpc per MPC root all carry the passcode code.
    calls.map((c) => c.originalPasscodeEncryptionCode).should.deepEqual(Array(6).fill(CODE));
    for (const slot of ALL) {
      assert.strictEqual(rootKeychains[slot]!.backupKeychain.prv, undefined, `${slot}: no plaintext backup prv`);
    }
    creationQr = await keycard(rootKeychains, CREATION_PW);
    await assertRecovers(creationQr, f, ALL, CREATION_PW);
  });

  for (const slots of [ALL, ['secp256k1Multisig', 'ecdsaMpc'] as Slot[]]) {
    it(`regenerates after a password change via the Box D path: ${slots.join(', ')}`, async function () {
      assert.ok(creationQr?.passcode, 'needs the creation-time keycard');
      const wire = await claimWire(f, slots);
      const material = await new Safe(
        httpBitGo({ '/keycard': () => wire }),
        safeDataWire as never
      ).claimKeycardMaterial();
      Object.keys(material.roots).should.deepEqual(slots);

      // "Use Box D from my keycard": the creation password comes from the original Box D + claimed code.
      const keycardPassphrase = await decryptSafeKeycardBoxD({
        bitgo: cryptoBitGo,
        boxD: creationQr.passcode.data,
        passcodeEncryptionCode: material.passcodeEncryptionCode!,
      });
      keycardPassphrase.should.equal(CREATION_PW);

      const roots = await buildSafeKeycardRoots({
        bitgo: cryptoBitGo,
        material,
        currentPassphrase: CHANGED_PW,
        keycardPassphrase,
      });
      for (const slot of slots.filter((s) => s.endsWith('Multisig'))) {
        roots[slot]!.backupKeychain.encryptedPrv!.should.equal(material.roots[slot]!.backupKeychain.encryptedPrv);
      }
      const qr = await keycard(roots, keycardPassphrase);
      await assertRecovers(qr, f, slots, CREATION_PW);
      await decryptSafeKeycard({
        bitgo: cryptoBitGo,
        userKeyBox: reassemble(qr.user.data),
        backupKeyBox: reassemble(qr.backup!.data),
        bitgoKeyBox: reassemble(qr.bitgo!.data),
        password: CHANGED_PW,
      }).should.be.rejected();
    });
  }
});
