import 'should';
import * as assert from 'assert';
import { decrypt, encrypt } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import { Keychain, KeychainsTriplet, KeyType } from '@bitgo/sdk-core';
import { generateSafeQrData } from '../../src/generateQrData';
import { splitKeys } from '../../src/utils';
import { QRBinaryMaxLength } from '../../src/drawKeycard';
import { parseKeycardFromLines, parseSafeKeycardBox } from '../../src/parseKeycard';
import { SafeRootKeyType, SAFE_ROOT_ORDER } from '../../src/types';

const passphrase = 'safe-keycard-round-trip';

// Courier chars per line when synthesizing the "Data:" block of a scanned PDF (see the parser
// round-trip test); any value works — it only exercises line reassembly in parseKeycardFromLines.
const SYNTHETIC_PDF_LINE_WIDTH = 64;

function makeKeychain(overrides: Partial<Keychain>): Keychain {
  return { id: 'id', type: 'independent', pub: 'pub', ...overrides };
}

/**
 * Plaintext byte-length of the private material each root actually stores, measured from the
 * real key generators:
 *  - multisig roots → a BIP32 xprv, 111 chars (`utxolib.bip32.fromSeed().toBase58()`)
 *  - ecdsaMpc       → base64 of the DKLS reduced key share, ~808 chars
 *                     (`DklsUtils.generateDKGKeyShares()[i].getReducedKeyShare()`)
 *  - eddsaMpc       → base64 of the EdDSA reduced key share, ~548 chars
 *                     (`MPSUtil.generateEdDsaDKGKeyShares()[i].getReducedKeyShare()`)
 * Using the real lengths keeps the round-trip and QR-split assertions representative.
 */
const ROOT_PLAINTEXT_LENGTHS: Record<SafeRootKeyType, number> = {
  secp256k1Multisig: 111,
  ecdsaMpc: 808,
  eddsaMpc: 548,
  ed25519Multisig: 111,
};

// Distinct, correctly-sized plaintext per (slot, role) — the prefix makes each value unique;
// padEnd brings it to the real length above.
function plaintextFor(slot: SafeRootKeyType, role: string): string {
  return `${slot}:${role}:`.padEnd(ROOT_PLAINTEXT_LENGTHS[slot], 'x');
}

async function buildRoots(): Promise<{
  roots: Record<SafeRootKeyType, KeychainsTriplet>;
  plaintexts: Record<SafeRootKeyType, { user: string; backup: string }>;
  bitgoPubs: Record<SafeRootKeyType, string>;
}> {
  const roots = {} as Record<SafeRootKeyType, KeychainsTriplet>;
  const plaintexts = {} as Record<SafeRootKeyType, { user: string; backup: string }>;
  const bitgoPubs = {} as Record<SafeRootKeyType, string>;

  for (const slot of SAFE_ROOT_ORDER) {
    const isMpc = slot === 'ecdsaMpc' || slot === 'eddsaMpc';
    const keyType: KeyType = isMpc ? 'tss' : 'independent';
    const userPrv = plaintextFor(slot, 'user');
    const backupPrv = plaintextFor(slot, 'backup');
    const bitgoPub = `${slot}-bitgo-pub`;

    plaintexts[slot] = { user: userPrv, backup: backupPrv };
    bitgoPubs[slot] = bitgoPub;

    // MPC roots carry the encrypted material in reducedEncryptedPrv; multisig in encryptedPrv.
    const encPrv = async (plain: string) => await encrypt(passphrase, plain);
    roots[slot] = {
      userKeychain: isMpc
        ? makeKeychain({ type: keyType, commonKeychain: bitgoPub, reducedEncryptedPrv: await encPrv(userPrv) })
        : makeKeychain({ type: keyType, encryptedPrv: await encPrv(userPrv) }),
      backupKeychain: isMpc
        ? makeKeychain({ type: keyType, commonKeychain: bitgoPub, reducedEncryptedPrv: await encPrv(backupPrv) })
        : makeKeychain({ type: keyType, encryptedPrv: await encPrv(backupPrv) }),
      bitgoKeychain: isMpc
        ? makeKeychain({ type: keyType, commonKeychain: bitgoPub })
        : makeKeychain({ type: keyType, pub: bitgoPub }),
    };
  }

  return { roots, plaintexts, bitgoPubs };
}

// Reassemble a payload from its QR fragments the same way a scanner would.
function reassemble(data: string): string {
  return splitKeys(data, QRBinaryMaxLength).join('');
}

describe('generateSafeQrData', function () {
  // Argon2id encryption of several root payloads is CPU-heavy.
  this.timeout(30000);

  it('produces the existing 4-box QrData shape, each box a JSON object of the 4 roots', async function () {
    const { roots } = await buildRoots();
    const qrData = await generateSafeQrData({ coin: coins.get('btc'), roots });

    qrData.user.title.should.equal('A: User Key');
    qrData.backup?.title.should.equal('B: Backup Key');
    qrData.bitgo?.title.should.equal('C: BitGo Key');

    // Each box parses via parseSafeKeycardBox into the four root slots, in order.
    for (const box of [qrData.user, qrData.backup, qrData.bitgo]) {
      assert.ok(box);
      Object.keys(parseSafeKeycardBox(box.data)).should.deepEqual([...SAFE_ROOT_ORDER]);
    }
  });

  it('round-trips: reassemble box -> JSON.parse -> decrypt all 4 user + backup roots', async function () {
    const { roots, plaintexts, bitgoPubs } = await buildRoots();
    const qrData = await generateSafeQrData({ coin: coins.get('btc'), roots });
    assert.ok(qrData.backup && qrData.bitgo);

    const userBox = parseSafeKeycardBox(reassemble(qrData.user.data));
    const backupBox = parseSafeKeycardBox(reassemble(qrData.backup.data));
    const bitgoBox = parseSafeKeycardBox(reassemble(qrData.bitgo.data));

    for (const slot of SAFE_ROOT_ORDER) {
      (await decrypt(passphrase, userBox[slot])).should.equal(plaintexts[slot].user);
      (await decrypt(passphrase, backupBox[slot])).should.equal(plaintexts[slot].backup);
      bitgoBox[slot].should.equal(bitgoPubs[slot]);
    }
  });

  it('uses reducedEncryptedPrv for MPC roots and encryptedPrv for multisig roots', async function () {
    const { roots } = await buildRoots();
    const qrData = await generateSafeQrData({ coin: coins.get('btc'), roots });
    const userBox = parseSafeKeycardBox(qrData.user.data);

    // The reduced (MPC) value must equal the keychain's reducedEncryptedPrv; multisig the encryptedPrv.
    userBox['ecdsaMpc'].should.equal(roots.ecdsaMpc.userKeychain.reducedEncryptedPrv);
    userBox['eddsaMpc'].should.equal(roots.eddsaMpc.userKeychain.reducedEncryptedPrv);
    userBox['secp256k1Multisig'].should.equal(roots.secp256k1Multisig.userKeychain.encryptedPrv);
    userBox['ed25519Multisig'].should.equal(roots.ed25519Multisig.userKeychain.encryptedPrv);
  });

  it('includes box D with safe wording when passphrase + passcodeEncryptionCode are provided', async function () {
    const { roots } = await buildRoots();
    const qrData = await generateSafeQrData({
      coin: coins.get('btc'),
      roots,
      passphrase: 'safe-pw',
      passcodeEncryptionCode: '123456',
    });
    assert.ok(qrData.passcode);
    qrData.passcode.title.should.equal('D: Encrypted Safe Password');
    qrData.passcode.description.should.equal(
      'This is the safe password, encrypted client-side with a key held by BitGo.'
    );
    (await decrypt('123456', qrData.passcode.data)).should.equal('safe-pw');
  });

  it('throws when a user root is missing private key material', async function () {
    const { roots } = await buildRoots();
    roots.eddsaMpc.userKeychain = makeKeychain({ type: 'tss' });
    await assert.rejects(() => generateSafeQrData({ coin: coins.get('btc'), roots }), /missing encrypted private key/);
  });

  it('throws a clear error when an entire root triplet is missing', async function () {
    const { roots } = await buildRoots();
    delete (roots as Partial<Record<SafeRootKeyType, KeychainsTriplet>>).ecdsaMpc;
    await assert.rejects(() => generateSafeQrData({ coin: coins.get('btc'), roots }), /missing the ecdsaMpc root/);
  });

  it('recovers all 4 roots through the existing PDF-line parser + JSON.parse', async function () {
    const { roots, plaintexts } = await buildRoots();
    const qrData = await generateSafeQrData({ coin: coins.get('btc'), roots });
    assert.ok(qrData.backup && qrData.bitgo);

    // Synthesize the text lines a PDF scan of a wallet-format keycard produces.
    const lines: string[] = [];
    const boxes: Array<[string, string, string]> = [
      ['A', 'User Key', qrData.user.data],
      ['B', 'Backup Key', qrData.backup.data],
      ['C', 'BitGo Key', qrData.bitgo.data],
    ];
    for (const [section, title, data] of boxes) {
      lines.push(`${section}: ${title}`);
      lines.push('Data:');
      for (let i = 0; i < data.length; i += SYNTHETIC_PDF_LINE_WIDTH) {
        lines.push(data.slice(i, i + SYNTHETIC_PDF_LINE_WIDTH));
      }
    }
    lines.push('BitGo KeyCard FAQ');

    const entries = parseKeycardFromLines(lines);
    const userEntry = entries.find((e) => e.label.startsWith('A'));
    assert.ok(userEntry);
    const userBox = parseSafeKeycardBox(userEntry.value);
    for (const slot of SAFE_ROOT_ORDER) {
      (await decrypt(passphrase, userBox[slot])).should.equal(plaintexts[slot].user);
    }
  });

  it('parseSafeKeycardBox rejects malformed / incomplete box data', function () {
    assert.throws(() => parseSafeKeycardBox('not json'), /parseSafeKeycardBox/); // invalid JSON
    assert.throws(() => parseSafeKeycardBox('"a string"'), /parseSafeKeycardBox/); // not an object
    assert.throws(() => parseSafeKeycardBox('{"secp256k1Multisig":"x"}'), /parseSafeKeycardBox/); // missing roots
    // A well-formed box with all four roots decodes successfully.
    const ok = parseSafeKeycardBox('{"secp256k1Multisig":"a","ecdsaMpc":"b","eddsaMpc":"c","ed25519Multisig":"d"}');
    ok.ecdsaMpc.should.equal('b');
  });
});
