import assert from 'assert';
import 'should';
import * as sinon from 'sinon';
import { bip32 } from '@bitgo/utxo-lib';
import { ed25519 } from '@noble/curves/ed25519';
import * as sjcl from '@bitgo/sjcl';
import { DklsDsg, DklsTypes, DklsUtils, DklsVrfUtils, MPSUtil, MpsDerive, MpsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { buildSafeMpcKeyEnvelopes } from '../../../../src/bitgo/utils/tss/keyShareEnvelope';
import { IncorrectPasswordError } from '../../../../src/bitgo/errors';
import {
  DecryptedSafeRoots,
  DecryptedSafeRootsWithExternal,
  buildSafeRecoverKeyParams,
  decryptSafeKeycard,
  deriveSafeWalletKeys,
} from '../../../../src/bitgo/safe/recovery';
import {
  algoMultisigAddress,
  decodeEd25519StrKeySecretSeed,
  encodeAlgoKey,
  encodeDerivableEd25519Pub,
  encodeEd25519ChainCode,
  signEd25519Extended,
  softDeriveChildPubEd25519AtPath,
} from '../../../../src';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';
import { getInitializedMpcInstance } from '../../../../src/bitgo/tss/eddsa/eddsa';
import { signEddsaMpcV2RecoveryTx } from '../../../../src/bitgo/utils/tss/eddsa/eddsaMPCv2';

// The ed25519 soft co-signer private halves asserted below are pinned cross-repo in the shared
// GV1 fixture (byte-identical to wallet-platform's copy).
import * as bip44Fixture from './fixtures/safeBip44Vectors.json';

const PASSWORD = 'safe-password';

function makeMockBitGo(decryptImpl: (params: { password: string; input: string }) => string): BitGoBase {
  return {
    decrypt: sinon.stub().callsFake(async (params: { password: string; input: string }) => decryptImpl(params)),
  } as unknown as BitGoBase;
}

/** A fake decrypt that only recognizes the user/backup tokens; any other input (e.g. a Box C public) throws. */
function makeDecryptMap(entries: Record<string, string>): (params: { password: string; input: string }) => string {
  return ({ password, input }) => {
    password.should.equal(PASSWORD);
    if (!(input in entries)) {
      throw new Error(`unexpected decrypt input: ${input}`);
    }
    return entries[input];
  };
}

function box(values: {
  secp256k1Multisig: string;
  ed25519Multisig: string | { prv: string; chainCode: string };
  ecdsaMpc: string;
  eddsaMpc: string;
}): string {
  return JSON.stringify(values);
}

describe('decryptSafeKeycard', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('decrypts onchain roots to strings and returns Box C verbatim', async () => {
    const userBox = box({
      secp256k1Multisig: 'enc-user-secp',
      ed25519Multisig: 'enc-user-ed25519',
      ecdsaMpc: 'enc-user-ecdsa',
      eddsaMpc: 'enc-user-eddsa',
    });
    const backupBox = box({
      secp256k1Multisig: 'enc-backup-secp',
      ed25519Multisig: { prv: 'enc-backup-ed25519', chainCode: 'C'.repeat(52) },
      ecdsaMpc: 'enc-backup-ecdsa',
      eddsaMpc: 'enc-backup-eddsa',
    });
    const bitgoBox = box({
      secp256k1Multisig: 'xpub-secp-bitgo',
      ed25519Multisig: 'pub-ed25519-bitgo',
      ecdsaMpc: 'common-ecdsa-bitgo',
      eddsaMpc: 'common-eddsa-bitgo',
    });

    const mpcUser = buildSafeMpcKeyEnvelopes(
      Buffer.from('user-signing'),
      Buffer.from('user-reduced'),
      Buffer.from('user-vrf')
    );
    const mpcBackup = buildSafeMpcKeyEnvelopes(
      Buffer.from('backup-signing'),
      Buffer.from('backup-reduced'),
      Buffer.from('backup-vrf')
    );

    const bitgo = makeMockBitGo(
      makeDecryptMap({
        'enc-user-secp': 'xprv-user',
        'enc-backup-secp': 'xprv-backup',
        'enc-user-ed25519': 'S-user-seed',
        'enc-backup-ed25519': 'S-backup-seed',
        'enc-user-ecdsa': mpcUser.reducedEnvelope.toString('base64'),
        'enc-backup-ecdsa': mpcBackup.reducedEnvelope.toString('base64'),
        'enc-user-eddsa': mpcUser.reducedEnvelope.toString('base64'),
        'enc-backup-eddsa': mpcBackup.reducedEnvelope.toString('base64'),
      })
    );

    const result = await decryptSafeKeycard({
      bitgo,
      userKeyBox: userBox,
      backupKeyBox: backupBox,
      bitgoKeyBox: bitgoBox,
      password: PASSWORD,
    });

    result.secp256k1Multisig.user.should.equal('xprv-user');
    result.secp256k1Multisig.backup.should.equal('xprv-backup');
    result.secp256k1Multisig.bitgo.should.equal('xpub-secp-bitgo');

    result.ed25519Multisig.user.should.equal('S-user-seed');
    const ed25519Backup = result.ed25519Multisig.backup as { prv: string; chainCode: string };
    ed25519Backup.prv.should.equal('S-backup-seed');
    ed25519Backup.chainCode.should.equal('C'.repeat(52));
    result.ed25519Multisig.bitgo.should.equal('pub-ed25519-bitgo');

    result.ecdsaMpc.user.signing.toString('hex').should.equal(Buffer.from('user-reduced').toString('hex'));
    result.ecdsaMpc.user.vrf.toString('hex').should.equal(Buffer.from('user-vrf').toString('hex'));
    result.ecdsaMpc.backup.signing.toString('hex').should.equal(Buffer.from('backup-reduced').toString('hex'));
    result.ecdsaMpc.backup.vrf.toString('hex').should.equal(Buffer.from('backup-vrf').toString('hex'));
    result.ecdsaMpc.bitgo.should.equal('common-ecdsa-bitgo');

    result.eddsaMpc.bitgo.should.equal('common-eddsa-bitgo');

    // 4 slots × (user + backup) = 8 decrypts; BitGo (Box C) is never decrypted.
    (bitgo.decrypt as sinon.SinonStub).callCount.should.equal(8);
  });

  it('decrypts the seed from an object-form ed25519Multisig backup entry', async () => {
    const userBox = box({
      secp256k1Multisig: 'enc-user-secp',
      ed25519Multisig: 'enc-user-ed25519',
      ecdsaMpc: 'enc-user-ecdsa',
      eddsaMpc: 'enc-user-eddsa',
    });
    const backupBox = JSON.stringify({
      secp256k1Multisig: 'enc-backup-secp',
      ed25519Multisig: { prv: 'enc-backup-ed25519', chainCode: 'A'.repeat(52) },
      ecdsaMpc: 'enc-backup-ecdsa',
      eddsaMpc: 'enc-backup-eddsa',
    });
    const bitgoBox = box({
      secp256k1Multisig: 'xpub-secp-bitgo',
      ed25519Multisig: 'pub-ed25519-bitgo',
      ecdsaMpc: 'common-ecdsa-bitgo',
      eddsaMpc: 'common-eddsa-bitgo',
    });

    const mpcUser = buildSafeMpcKeyEnvelopes(
      Buffer.from('user-signing'),
      Buffer.from('user-reduced'),
      Buffer.from('user-vrf')
    );
    const mpcBackup = buildSafeMpcKeyEnvelopes(
      Buffer.from('backup-signing'),
      Buffer.from('backup-reduced'),
      Buffer.from('backup-vrf')
    );

    const bitgo = makeMockBitGo(
      makeDecryptMap({
        'enc-user-secp': 'xprv-user',
        'enc-backup-secp': 'xprv-backup',
        'enc-user-ed25519': 'S-user-seed',
        'enc-backup-ed25519': 'S-backup-seed',
        'enc-user-ecdsa': mpcUser.reducedEnvelope.toString('base64'),
        'enc-backup-ecdsa': mpcBackup.reducedEnvelope.toString('base64'),
        'enc-user-eddsa': mpcUser.reducedEnvelope.toString('base64'),
        'enc-backup-eddsa': mpcBackup.reducedEnvelope.toString('base64'),
      })
    );

    const result = await decryptSafeKeycard({
      bitgo,
      userKeyBox: userBox,
      backupKeyBox: backupBox,
      bitgoKeyBox: bitgoBox,
      password: PASSWORD,
    });

    const ed25519Backup = result.ed25519Multisig.backup as { prv: string; chainCode: string };
    ed25519Backup.prv.should.equal('S-backup-seed');
    ed25519Backup.chainCode.should.equal('A'.repeat(52));
  });

  it('rejects an ed25519 chain-code entry in a non-backup slot (fail closed)', async () => {
    const userBox = JSON.stringify({
      secp256k1Multisig: { prv: 'enc-user-secp', chainCode: 'A'.repeat(52) },
      ed25519Multisig: 'enc-user-ed25519',
      ecdsaMpc: 'enc-user-ecdsa',
      eddsaMpc: 'enc-user-eddsa',
    });

    await decryptSafeKeycard({
      bitgo: makeMockBitGo(makeDecryptMap({})),
      userKeyBox: userBox,
      backupKeyBox: userBox,
      bitgoKeyBox: userBox,
      password: PASSWORD,
    }).should.be.rejectedWith(/unexpected ed25519 chain-code entry/);
  });

  it('throws IncorrectPasswordError when decryption fails (wrong password)', async () => {
    const userBox = box({
      secp256k1Multisig: 'enc-user-secp',
      ed25519Multisig: 'enc-user-ed25519',
      ecdsaMpc: 'enc-user-ecdsa',
      eddsaMpc: 'enc-user-eddsa',
    });
    const bitgo = makeMockBitGo(() => {
      throw new Error('argon2: tag does not match');
    });

    await decryptSafeKeycard({
      bitgo,
      userKeyBox: userBox,
      backupKeyBox: userBox,
      bitgoKeyBox: userBox,
      password: 'wrong-password',
    }).should.be.rejectedWith(IncorrectPasswordError);
  });
});

const MPC_ROOT = { signing: Buffer.alloc(0), vrf: Buffer.alloc(0) };

function makeRoots(secp: { user: string; backup: string; bitgo: string }): DecryptedSafeRoots {
  return {
    secp256k1Multisig: secp,
    ed25519Multisig: { user: 'u', backup: { prv: 'b', chainCode: 'c' }, bitgo: 'g' },
    ecdsaMpc: { user: MPC_ROOT, backup: MPC_ROOT, bitgo: 'g' },
    eddsaMpc: { user: MPC_ROOT, backup: MPC_ROOT, bitgo: 'g' },
  };
}

describe('deriveSafeWalletKeys', () => {
  const userRoot = bip32.fromSeed(Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex'));
  const backupRoot = bip32.fromSeed(
    Buffer.from('1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100', 'hex')
  );
  const bitgoRoot = bip32
    .fromSeed(Buffer.from('2f2e2d2c2b2a292827262524232221201f1e1d1c1b1a19181716151413121110', 'hex'))
    .neutered();

  const roots = makeRoots({
    user: userRoot.toBase58(),
    backup: backupRoot.toBase58(),
    bitgo: bitgoRoot.toBase58(),
  });

  it('derives the BIP44 child triplet for slot 1', async () => {
    const result = await deriveSafeWalletKeys({ coin: 'btc', slot: 'secp256k1Multisig', account: 0, roots });
    if (result.slot !== 'secp256k1Multisig') {
      throw new Error('expected secp256k1Multisig slot');
    }

    result.path.should.equal("m/44'/0'/1'/0'");
    result.keys.user.prv.should.equal(userRoot.derivePath("m/44'/0'/1'/0'").toBase58());
    result.keys.user.pub.should.equal(userRoot.derivePath("m/44'/0'/1'/0'").neutered().toBase58());
    result.keys.backup.prv.should.equal(backupRoot.derivePath('m/44/0/1/0').toBase58());
    result.keys.bitgo.pub.should.equal(bitgoRoot.derivePath('m/44/0/1/0').toBase58());
  });

  it('varies the path with the account', async () => {
    const result = await deriveSafeWalletKeys({ coin: 'btc', slot: 'secp256k1Multisig', account: 2, roots });
    result.path.should.equal("m/44'/0'/1'/2'");
  });

  it('derives the ecdsaMpc child via the DKLs ceremony', async () => {
    const [userDkg, backupDkg] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup] = await DklsVrfUtils.generateVrfDKGKeyShares();

    const mpcRoots: DecryptedSafeRoots = {
      ...roots,
      ecdsaMpc: {
        user: { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() },
        backup: { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() },
        bitgo: 'g',
      },
    };

    const result = await deriveSafeWalletKeys({ coin: 'eth', slot: 'ecdsaMpc', account: 0, roots: mpcRoots });
    if (result.slot !== 'ecdsaMpc') {
      throw new Error('expected ecdsaMpc slot');
    }

    result.path.should.equal("m/44'/60'/3'/0'");
    result.keys.commonKeychain.should.be.a.String();
    result.keys.user.should.be.a.String();
    result.keys.backup.should.be.a.String();
  });

  it('derives and signs the eddsaMpc slot-4 BIP44 child', async function () {
    const [userDkg, backupDkg, bitgoDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const [vrfUser, vrfBackup, vrfBitgo] = await MpsVrfUtils.generateVrfDKGKeyShares();
    const mpcRoots: DecryptedSafeRoots = {
      ...roots,
      eddsaMpc: {
        user: { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() },
        backup: { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() },
        bitgo: bitgoDkg.getCommonKeychain(),
      },
    };

    const result = await deriveSafeWalletKeys({ coin: 'sol', slot: 'eddsaMpc', account: 0, roots: mpcRoots });
    if (result.slot !== 'eddsaMpc') {
      throw new Error('expected eddsaMpc slot');
    }
    result.path.should.equal("m/44'/501'/4'/0'");

    // Play mint's user↔BitGo role locally at the same BIP44 path; no dev-minted wallet is needed.
    const userMint = new MpsDerive.Derive(3, 2, 0, userDkg.getKeyShare(), vrfUser.getKeyShare(), result.path);
    const bitgoMint = new MpsDerive.Derive(3, 2, 2, bitgoDkg.getKeyShare(), vrfBitgo.getKeyShare(), result.path);
    const [userRound0, bitgoRound0] = await Promise.all([userMint.initDerive(), bitgoMint.initDerive()]);
    const [userRound1] = userMint.handleIncomingMessages([bitgoRound0]);
    const [bitgoRound1] = bitgoMint.handleIncomingMessages([userRound0]);
    if (!userRound1 || !bitgoRound1) {
      throw new Error('expected user and BitGo derive round-1 messages');
    }
    assert.deepStrictEqual(userMint.handleIncomingMessages([bitgoRound1]), []);
    assert.deepStrictEqual(bitgoMint.handleIncomingMessages([userRound1]), []);
    const mintedChildCommonKeychain = userMint.getCommonKeychain();
    assert.strictEqual(bitgoMint.getCommonKeychain(), mintedChildCommonKeychain);
    assert.strictEqual(result.keys.commonKeychain, mintedChildCommonKeychain);

    const walletPassphrase = 'safe-recovery-passphrase';
    const userKey = sjcl.encrypt(walletPassphrase, result.keys.user);
    const backupKey = sjcl.encrypt(walletPassphrase, result.keys.backup);
    const rootCommonKeychain = userDkg.getCommonKeychain();
    await assert.rejects(
      signEddsaMpcV2RecoveryTx({
        message: Buffer.from('wrong keychain must fail'),
        userKey,
        backupKey,
        walletPassphrase,
        bitgoKey: rootCommonKeychain,
        derivationPath: 'm/0',
      }),
      /commonKeyChain from keycard does not match bitgoKey/
    );

    const mpc = await getInitializedMpcInstance();
    for (const derivationPath of ['m/0', 'm/3']) {
      const message = Buffer.from(`Safe EdDSA recovery ${derivationPath}`);
      const signature = await signEddsaMpcV2RecoveryTx({
        message,
        userKey,
        backupKey,
        walletPassphrase,
        bitgoKey: result.keys.commonKeychain,
        derivationPath,
      });
      const derivedKeychain = mpc.deriveUnhardened(result.keys.commonKeychain, derivationPath);
      const publicKeyBytes = Buffer.from(derivedKeychain.slice(0, 64), 'hex');
      assert.strictEqual(
        ed25519.verify(new Uint8Array(signature), new Uint8Array(message), new Uint8Array(publicKeyBytes)),
        true
      );
    }
  });

  it('derives the ed25519Multisig triplet at the BIP44 path', async () => {
    const STRKEY_SEED = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';
    const backupChainCode = Buffer.alloc(32, 0xab);
    // Distinct BitGo root + chain code: if the BitGo composite were derived from the backup root, the
    // backup child and the BitGo child would be the same key and a slot swap would pass every golden.
    const bitgoSeed = Buffer.alloc(32, 0x22);
    const bitgoRootPub = Buffer.from(ed25519.getPublicKey(bitgoSeed));
    const bitgoChainCode = Buffer.alloc(32, 0xcd);
    const ed25519Roots: DecryptedSafeRoots = {
      ...roots,
      ed25519Multisig: {
        user: STRKEY_SEED,
        backup: { prv: STRKEY_SEED, chainCode: encodeEd25519ChainCode(backupChainCode) },
        bitgo: encodeDerivableEd25519Pub(bitgoRootPub, bitgoChainCode),
      },
    };

    const result = await deriveSafeWalletKeys({
      coin: 'algo',
      slot: 'ed25519Multisig',
      account: 0,
      roots: ed25519Roots,
    });
    if (result.slot !== 'ed25519Multisig') {
      throw new Error('expected ed25519Multisig slot');
    }

    result.path.should.equal("m/44'/283'/2'/0'");

    // user: hardened SLIP-0010 child, pinned to the leaf's golden vector
    result.keys.user.kind.should.equal('seed');
    result.keys.user.seed.should.equal('be69531ebbab851b69aa41bb9c905afed52d26ff4278e6418609d4d60570510c');
    result.keys.user.pub.should.equal(
      Buffer.from(ed25519.getPublicKey(Buffer.from(result.keys.user.seed, 'hex'))).toString('hex')
    );

    // backup: extended key whose public half equals the public soft-derive of root pub ‖ chain code
    const bitgoPub = (
      await softDeriveChildPubEd25519AtPath(ed25519Roots.ed25519Multisig.bitgo, 'm/44/283/2/0')
    ).toString('hex');
    result.keys.backup.kind.should.equal('extended');
    // Pin the private halves to the cross-repo GV1 golden vector for this path.
    const algoSoft = bip44Fixture.ed25519Soft.vectors.find((v) => v.path === 'm/44/283/2/0');
    if (algoSoft === undefined) {
      throw new Error('fixture is missing the m/44/283/2/0 soft co-signer vector');
    }
    result.keys.backup.kL.should.equal(algoSoft.childKLHex);
    result.keys.backup.kR.should.equal(algoSoft.childKRHex);
    // With distinct roots the three children are provably distinct, so a slot swap cannot sneak through.
    result.keys.user.pub.should.not.equal(result.keys.backup.pub);
    result.keys.backup.pub.should.not.equal(result.keys.bitgo.pub);
    result.keys.bitgo.pub.should.equal(bitgoPub);
  });

  it('rejects a non-integer account', async () => {
    await deriveSafeWalletKeys({ coin: 'btc', slot: 'secp256k1Multisig', account: 1.5, roots }).should.be.rejectedWith(
      /invalid account/
    );
  });
});

describe('buildSafeRecoverKeyParams', () => {
  afterEach(() => {
    sinon.restore();
  });

  const userRoot = bip32.fromSeed(Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex'));
  const backupRoot = bip32.fromSeed(
    Buffer.from('1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100', 'hex')
  );
  const bitgoRoot = bip32
    .fromSeed(Buffer.from('2f2e2d2c2b2a292827262524232221201f1e1d1c1b1a19181716151413121110', 'hex'))
    .neutered();

  const keys = {
    user: { prv: userRoot.toBase58(), pub: userRoot.neutered().toBase58() },
    backup: { prv: backupRoot.toBase58(), pub: backupRoot.neutered().toBase58() },
    bitgo: { pub: bitgoRoot.toBase58() },
  };

  it('signed mode re-encrypts child xprvs under a single ephemeral passphrase', async () => {
    const passphrases: string[] = [];
    const encrypt = sinon.stub().callsFake(async ({ input, password, encryptionVersion }) => {
      passphrases.push(password);
      encryptionVersion.should.equal(1);
      return `enc(${input})`;
    });
    const bitgo = { encrypt } as unknown as BitGoBase;

    const result = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'btc',
      slot: 'secp256k1Multisig',
      keys,
      mode: 'signed',
    });

    result.userKey.should.equal(`enc(${keys.user.prv})`);
    result.backupKey.should.equal(`enc(${keys.backup.prv})`);
    result.bitgoKey.should.equal(keys.bitgo.pub);
    (result.walletPassphrase as string).should.be.a.String();
    passphrases.should.have.length(2);
    passphrases[0].should.equal(passphrases[1]);
    passphrases[0].should.equal(result.walletPassphrase);
    encrypt.callCount.should.equal(2);
  });

  it('rejects non-private child keys in signed mode', async () => {
    const bitgo = { encrypt: sinon.stub() } as unknown as BitGoBase;
    await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'btc',
      slot: 'secp256k1Multisig',
      keys: { user: { prv: keys.user.pub, pub: keys.user.pub }, backup: keys.backup, bitgo: keys.bitgo },
      mode: 'signed',
    }).should.be.rejectedWith(/must be private xprvs/);
  });

  it('unsigned mode returns pubs and never encrypts', async () => {
    const encrypt = sinon.stub().callsFake(async () => {
      throw new Error('encrypt should not be called');
    });
    const bitgo = { encrypt } as unknown as BitGoBase;

    const result = await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'btc',
      slot: 'secp256k1Multisig',
      keys,
      mode: 'unsigned',
    });

    result.userKey.should.equal(keys.user.pub);
    result.backupKey.should.equal(keys.backup.pub);
    result.bitgoKey.should.equal(keys.bitgo.pub);
    result.should.not.have.property('walletPassphrase');
    encrypt.callCount.should.equal(0);
  });

  it('rejects unsupported slots', async () => {
    const bitgo = { encrypt: sinon.stub() } as unknown as BitGoBase;
    await buildSafeRecoverKeyParams({
      bitgo,
      coin: 'btc',
      slot: 'eddsaMpc',
      keys: { commonKeychain: 'ck', user: 'u', backup: 'b' },
      mode: 'signed',
    }).should.be.rejectedWith(/not supported yet/);
  });

  describe('ed25519Multisig', () => {
    // Golden vectors generated with algosdk: encodeAddress(Buffer.alloc(32, n)) and
    // multisigAddress({ version: 1, threshold: 2, addrs: [...] }) over the same pubs.
    const edKeys = {
      user: { kind: 'seed', seed: '11'.repeat(32), pub: '21'.repeat(32) },
      backup: { kind: 'extended', kL: '31'.repeat(32), kR: '41'.repeat(32), pub: '51'.repeat(32) },
      bitgo: { pub: '61'.repeat(32) },
    } as const;

    it('unsigned mode returns ALGO addresses and the multisig rootAddress, and never encrypts', async () => {
      const encrypt = sinon.stub().callsFake(async () => {
        throw new Error('encrypt should not be called');
      });
      const bitgo = { encrypt } as unknown as BitGoBase;

      const result = await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'algo',
        slot: 'ed25519Multisig',
        keys: edKeys,
        mode: 'unsigned',
      });
      if (result.slot !== 'ed25519Multisig' || result.mode !== 'unsigned') {
        throw new Error('expected unsigned ed25519Multisig key params');
      }

      result.userKey.should.equal('EEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQYNI53HM');
      result.backupKey.should.equal('KFIVCUKRKFIVCUKRKFIVCUKRKFIVCUKRKFIVCUKRKFIVCUKRKFI33B3AOY');
      result.bitgoKey.should.equal('MFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQWCYLBMFQS3KHEHM');
      assert(result.rootAddress);
      result.rootAddress.should.equal('LHWEIOU2UIPSKCZ3XMKQUKRYY3FM6XTZKBHDMIU737OQQEXQTYSGDFOHDM');
      result.userKey.should.match(/^[A-Z2-7]{58}$/);
      result.should.not.have.property('walletPassphrase');
      result.should.not.have.property('externalBackupSigner');
      encrypt.callCount.should.equal(0);
    });

    it('signed mode encrypts the 58-char seed and returns a lazy external backup signer', async () => {
      // Real derivation output, with a distinct BitGo root so the backup child and the BitGo child
      // are different keys — a slot swap between them must change the outputs.
      const STRKEY_SEED = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';
      const backupChainCode = Buffer.alloc(32, 0xab);
      const bitgoSeed = Buffer.alloc(32, 0x22);
      const bitgoRootPub = Buffer.from(ed25519.getPublicKey(bitgoSeed));
      const bitgoChainCode = Buffer.alloc(32, 0xcd);
      const ed25519Roots: DecryptedSafeRoots = {
        ...makeRoots({ user: 'x', backup: 'y', bitgo: 'z' }),
        ed25519Multisig: {
          user: STRKEY_SEED,
          backup: { prv: STRKEY_SEED, chainCode: encodeEd25519ChainCode(backupChainCode) },
          bitgo: encodeDerivableEd25519Pub(bitgoRootPub, bitgoChainCode),
        },
      };
      const derived = await deriveSafeWalletKeys({
        coin: 'algo',
        slot: 'ed25519Multisig',
        account: 0,
        roots: ed25519Roots,
      });
      if (derived.slot !== 'ed25519Multisig') {
        throw new Error('expected ed25519Multisig slot');
      }

      const passphrases: string[] = [];
      const encrypt = sinon.stub().callsFake(async ({ input, password, encryptionVersion }) => {
        passphrases.push(password);
        encryptionVersion.should.equal(1);
        return `enc(${input})`;
      });
      const bitgo = { encrypt } as unknown as BitGoBase;

      const result = await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'talgo',
        slot: 'ed25519Multisig',
        keys: derived.keys,
        mode: 'signed',
      });
      if (result.slot !== 'ed25519Multisig' || result.mode !== 'signed') {
        throw new Error('expected signed ed25519Multisig key params');
      }

      derived.keys.user.pub.should.not.equal(derived.keys.backup.pub);
      derived.keys.backup.pub.should.not.equal(derived.keys.bitgo.pub);

      // user seed re-encoded as the 58-char ALGO seed before encryption; no backupKey — the
      // seedless backup child only exists as the lazy signer.
      result.userKey.should.equal(`enc(${encodeAlgoKey(Buffer.from(derived.keys.user.seed, 'hex'))})`);
      result.should.not.have.property('backupKey');
      result.bitgoKey.should.equal(encodeAlgoKey(Buffer.from(derived.keys.bitgo.pub, 'hex')));
      result.bitgoKey.should.match(/^[A-Z2-7]{58}$/);
      // The wallet's on-chain address over the three distinct children, in wallet-creation order.
      assert(result.rootAddress);
      result.rootAddress.should.equal(
        algoMultisigAddress(1, 2, [
          Buffer.from(derived.keys.user.pub, 'hex'),
          Buffer.from(derived.keys.backup.pub, 'hex'),
          Buffer.from(derived.keys.bitgo.pub, 'hex'),
        ])
      );
      result.rootAddress.should.match(/^[A-Z2-7]{58}$/);
      result.walletPassphrase.should.be.a.String();
      passphrases.should.have.length(1);
      passphrases[0].should.equal(result.walletPassphrase);
      encrypt.callCount.should.equal(1);

      // the lazy signer signs with the real extended key halves and its pub matches the backup child
      result.externalBackupSigner.publicKey.should.equal(derived.keys.backup.pub);
      const message = Buffer.from('deadbeef', 'hex');
      const { signature } = await result.externalBackupSigner.sign(message);
      signature.should.match(/^[0-9a-f]{128}$/);
      ed25519
        .verify(
          new Uint8Array(Buffer.from(signature, 'hex')),
          new Uint8Array(message),
          new Uint8Array(Buffer.from(result.externalBackupSigner.publicKey, 'hex'))
        )
        .should.equal(true);
    });

    for (const coin of ['hbar', 'thbar']) {
      for (const mode of ['signed', 'unsigned'] as const) {
        it(`${coin} ${mode} mode encodes Hedera keys without overwriting the caller's rootAddress`, async () => {
          const encrypt = sinon.stub().callsFake(async ({ input }) => `enc(${input})`);
          const bitgo = { encrypt } as unknown as BitGoBase;

          const result = await buildSafeRecoverKeyParams({
            bitgo,
            coin,
            slot: 'ed25519Multisig',
            keys: edKeys,
            mode,
          });

          assert(!('rootAddress' in result));
          const rootAddress = '0.0.12345';
          assert.strictEqual({ rootAddress, ...result }.rootAddress, rootAddress);
          result.bitgoKey.should.equal('302a300506032b6570032100' + edKeys.bitgo.pub);

          if (result.mode === 'unsigned') {
            result.userKey.should.equal('302a300506032b6570032100' + edKeys.user.pub);
            result.backupKey.should.equal('302a300506032b6570032100' + edKeys.backup.pub);
            result.should.not.have.property('walletPassphrase');
            result.should.not.have.property('externalBackupSigner');
            sinon.assert.notCalled(encrypt);
          } else {
            const encodedSeed = '302e020100300506032b657004220420' + edKeys.user.seed;
            result.userKey.should.equal(`enc(${encodedSeed})`);
            result.should.not.have.property('backupKey');
            result.externalBackupSigner.publicKey.should.equal(edKeys.backup.pub);
            result.walletPassphrase.should.match(/^[0-9a-f]{64}$/);
            sinon.assert.calledOnce(encrypt);
            sinon.assert.calledWithExactly(encrypt, {
              input: encodedSeed,
              password: result.walletPassphrase,
              encryptionVersion: 1,
            });
          }
        });
      }
    }

    it('rejects slot-2 coins that have no registry entry yet', async () => {
      const bitgo = { encrypt: sinon.stub() } as unknown as BitGoBase;
      await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'xlm',
        slot: 'ed25519Multisig',
        keys: edKeys,
        mode: 'signed',
      }).should.be.rejectedWith(/coin 'xlm' ed25519Multisig is not supported yet/);
    });

    it('rejects ed25519 children with malformed public keys', async () => {
      const bitgo = { encrypt: sinon.stub() } as unknown as BitGoBase;
      await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'algo',
        slot: 'ed25519Multisig',
        keys: { ...edKeys, bitgo: { pub: '1234' } },
        mode: 'unsigned',
      }).should.be.rejectedWith(/ed25519 child public keys must be 32 bytes/);
    });
  });

  describe('ecdsaMpc', () => {
    const mpcKeys = { commonKeychain: 'ck', user: 'user-child-share', backup: 'backup-child-share' };

    it('signed mode re-encrypts the child reduced shares under a single ephemeral passphrase', async () => {
      const passphrases: string[] = [];
      const encrypt = sinon.stub().callsFake(async ({ input, password, encryptionVersion }) => {
        passphrases.push(password);
        encryptionVersion.should.equal(1);
        return `enc(${input})`;
      });
      const bitgo = { encrypt } as unknown as BitGoBase;

      const result = await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'icp',
        slot: 'ecdsaMpc',
        keys: mpcKeys,
        mode: 'signed',
      });

      if (result.slot !== 'ecdsaMpc' || result.mode !== 'signed') {
        throw new Error('expected signed ecdsaMpc key params');
      }
      result.userKey.should.equal('enc(user-child-share)');
      result.backupKey.should.equal('enc(backup-child-share)');
      result.bitgoKey.should.equal('ck');
      result.isTss.should.equal(true);
      result.broadcast.should.equal(false);
      result.walletPassphrase.should.be.a.String();
      passphrases.should.have.length(2);
      passphrases[0].should.equal(passphrases[1]);
      passphrases[0].should.equal(result.walletPassphrase);
      encrypt.callCount.should.equal(2);
    });

    it('unsigned mode returns the child common keychain and never encrypts', async () => {
      const encrypt = sinon.stub().callsFake(async () => {
        throw new Error('encrypt should not be called');
      });
      const bitgo = { encrypt } as unknown as BitGoBase;

      const result = await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'icp',
        slot: 'ecdsaMpc',
        keys: mpcKeys,
        mode: 'unsigned',
      });

      result.slot.should.equal('ecdsaMpc');
      result.mode.should.equal('unsigned');
      result.bitgoKey.should.equal('ck');
      result.isTss.should.equal(true);
      result.broadcast.should.equal(false);
      result.should.not.have.property('userKey');
      result.should.not.have.property('backupKey');
      result.should.not.have.property('walletPassphrase');
      encrypt.callCount.should.equal(0);
    });
  });
});

describe('Safe ecdsaMpc derive → sign (gate)', function () {
  it('derives a child, rebuilds 2-of-2 shares, and signs a message verified at m/0', async function () {
    const [userDkg, backupDkg] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup] = await DklsVrfUtils.generateVrfDKGKeyShares();

    const rootCommonKeychain = DklsTypes.getCommonKeychain(userDkg.getKeyShare());

    const { commonKeychain, userChild, backupChild } = await DklsVrfUtils.deriveSafeEcdsaMpcChild({
      userRoot: { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() },
      backupRoot: { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() },
      account: 0,
      coinType: 60,
      safeSlotOrdinal: 3,
    });

    // The derived child must never be the root (the "root envelope in the child position" footgun).
    commonKeychain.should.not.equal(rootCommonKeychain);

    // Rebuild 2-of-2 keyshares from the derived reduced CBOR, exactly as the signer's retrofit does.
    const toRetrofit = (b64: string): DklsTypes.RetrofitData => {
      const reduced = DklsTypes.getDecodedReducedKeyShare(Buffer.from(b64, 'base64'));
      return {
        xShare: {
          x: Buffer.from(reduced.prv).toString('hex'),
          y: Buffer.from(reduced.pub).toString('hex'),
          chaincode: Buffer.from(reduced.rootChainCode).toString('hex'),
        },
        xiList: reduced.xList.slice(0, 2),
      };
    };
    const [user2of2, backup2of2] = await DklsUtils.generate2of2KeyShares(
      toRetrofit(userChild),
      toRetrofit(backupChild)
    );

    const messageHash = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
    const userDsg = new DklsDsg.Dsg(user2of2.getKeyShare(), 0, 'm/0', messageHash);
    const backupDsg = new DklsDsg.Dsg(backup2of2.getKeyShare(), 1, 'm/0', messageHash);
    const signatureString = DklsUtils.verifyAndConvertDklsSignature(
      messageHash,
      (await DklsUtils.executeTillRound(5, userDsg, backupDsg)) as DklsTypes.DeserializedDklsSignature,
      commonKeychain,
      'm/0',
      undefined,
      false
    );

    // verifyAndConvertDklsSignature recovers the pubkey from the signature and checks it against
    // deriveUnhardened(childCK, 'm/0'); it throws on mismatch, so a returned string is proof.
    signatureString.should.be.a.String();
    signatureString.should.match(/^\d+:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
  });
});

describe('external backup roots (BYOK)', () => {
  afterEach(() => {
    sinon.restore();
  });

  const userRoot = bip32.fromSeed(Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex'));
  const bitgoRoot = bip32.fromSeed(Buffer.alloc(32, 0x2f)).neutered();
  // An HSM or hardware wallet exports an account-level key, never a master: depth 3 here.
  const externalPrvRoot = bip32.fromSeed(Buffer.alloc(32, 0x09)).derivePath("m/44'/0'/0'");
  const externalPubRoot = externalPrvRoot.neutered();

  describe('decryptSafeKeycard', () => {
    const userBox = box({
      secp256k1Multisig: 'enc-user-secp',
      ed25519Multisig: 'enc-user-ed25519',
      ecdsaMpc: 'enc-user-ecdsa',
      eddsaMpc: 'enc-user-eddsa',
    });
    const bitgoBox = box({
      secp256k1Multisig: 'xpub-secp-bitgo',
      ed25519Multisig: 'pub-ed25519-bitgo',
      ecdsaMpc: 'common-ecdsa-bitgo',
      eddsaMpc: 'common-eddsa-bitgo',
    });
    const mpc = buildSafeMpcKeyEnvelopes(Buffer.from('signing'), Buffer.from('reduced'), Buffer.from('vrf'));
    const decryptEntries = {
      'enc-user-secp': 'xprv-user',
      'enc-user-ed25519': 'S-user-seed',
      'enc-user-ecdsa': mpc.reducedEnvelope.toString('base64'),
      'enc-user-eddsa': mpc.reducedEnvelope.toString('base64'),
      'enc-backup-ecdsa': mpc.reducedEnvelope.toString('base64'),
      'enc-backup-eddsa': mpc.reducedEnvelope.toString('base64'),
    };

    // box() is typed to the local entries only; an external box is plain JSON on the wire.
    const externalBackupBox = JSON.stringify({
      secp256k1Multisig: { kind: 'external', pub: 'xpub-external' },
      ed25519Multisig: { kind: 'external', pub: 'COMPOSITE', provider: 'dai' },
      ecdsaMpc: 'enc-backup-ecdsa',
      eddsaMpc: 'enc-backup-eddsa',
    });

    it('returns external backup roots without trying to decrypt them', async () => {
      const bitgo = makeMockBitGo(makeDecryptMap(decryptEntries));

      const result = await decryptSafeKeycard({
        bitgo,
        userKeyBox: userBox,
        backupKeyBox: externalBackupBox,
        bitgoKeyBox: bitgoBox,
        password: PASSWORD,
      });

      result.secp256k1Multisig.user.should.equal('xprv-user');
      result.secp256k1Multisig.backup.should.deepEqual({ external: true, pub: 'xpub-external' });
      result.ed25519Multisig.backup.should.deepEqual({ external: true, pub: 'COMPOSITE', provider: 'dai' });
      const decrypted = (bitgo.decrypt as sinon.SinonStub).getCalls().map((call) => call.args[0].input);
      decrypted.should.not.containEql('xpub-external');
      decrypted.should.not.containEql('COMPOSITE');
    });

    it('rejects an external entry in the user box, where a bare string is required', async () => {
      const bitgo = makeMockBitGo(makeDecryptMap(decryptEntries));
      const externalUserBox = JSON.stringify({
        secp256k1Multisig: { kind: 'external', pub: 'xpub-external' },
        ed25519Multisig: 'enc-user-ed25519',
        ecdsaMpc: 'enc-user-ecdsa',
        eddsaMpc: 'enc-user-eddsa',
      });

      await decryptSafeKeycard({
        bitgo,
        userKeyBox: externalUserBox,
        backupKeyBox: externalBackupBox,
        bitgoKeyBox: bitgoBox,
        password: PASSWORD,
      }).should.be.rejectedWith(/unexpected external backup entry where a bare string was required/);
    });
  });

  describe('deriveSafeWalletKeys secp256k1Multisig', () => {
    const roots: DecryptedSafeRootsWithExternal = {
      ...makeRoots({
        user: userRoot.toBase58(),
        backup: 'unused',
        bitgo: bitgoRoot.toBase58(),
      }),
      secp256k1Multisig: {
        user: userRoot.toBase58(),
        backup: { external: true, pub: externalPubRoot.toBase58() },
        bitgo: bitgoRoot.toBase58(),
      },
    };
    // account 0 on btc: m/44'/0'/1'/0' for the user, m/44/0/1/0 for the co-signers
    const expectedBackupChild = externalPubRoot.derive(44).derive(0).derive(1).derive(0);

    it('derives the backup child pub level by level from a non-master xpub', async () => {
      const result = await deriveSafeWalletKeys({ coin: 'btc', slot: 'secp256k1Multisig', account: 0, roots });
      if (result.slot !== 'secp256k1Multisig') {
        throw new Error('expected secp256k1Multisig slot');
      }

      externalPubRoot.depth.should.equal(3);
      result.keys.backup.pub.should.equal(expectedBackupChild.toBase58());
      (result.keys.backup.prv === undefined).should.be.true();
    });

    it('adds the backup child prv when the caller supplies their backup root xprv', async () => {
      const result = await deriveSafeWalletKeys({
        coin: 'btc',
        slot: 'secp256k1Multisig',
        account: 0,
        roots,
        externalBackupRootPrv: externalPrvRoot.toBase58(),
      });
      if (result.slot !== 'secp256k1Multisig') {
        throw new Error('expected secp256k1Multisig slot');
      }

      result.keys.backup.pub.should.equal(expectedBackupChild.toBase58());
      bip32
        .fromBase58(result.keys.backup.prv as string)
        .neutered()
        .toBase58()
        .should.equal(result.keys.backup.pub);
    });

    it('rejects a backup root xprv that does not belong to the external root', async () => {
      await deriveSafeWalletKeys({
        coin: 'btc',
        slot: 'secp256k1Multisig',
        account: 0,
        roots,
        externalBackupRootPrv: bip32.fromSeed(Buffer.alloc(32, 0x08)).derivePath("m/44'/0'/0'").toBase58(),
      }).should.be.rejectedWith(/does not match the external backup root pub/);
    });

    it('rejects externalBackupRootPrv when the backup root is local', async () => {
      const localRoots = makeRoots({
        user: userRoot.toBase58(),
        backup: bip32.fromSeed(Buffer.alloc(32, 0x07)).toBase58(),
        bitgo: bitgoRoot.toBase58(),
      });
      await deriveSafeWalletKeys({
        coin: 'btc',
        slot: 'secp256k1Multisig',
        account: 0,
        roots: localRoots,
        externalBackupRootPrv: externalPrvRoot.toBase58(),
      }).should.be.rejectedWith(/backup root is not external/);
    });

    it('rejects externalBackupRootPrv for any other slot', async () => {
      await deriveSafeWalletKeys({
        coin: 'algo',
        slot: 'ed25519Multisig',
        account: 0,
        roots,
        externalBackupRootPrv: externalPrvRoot.toBase58(),
      }).should.be.rejectedWith(/only applies to the secp256k1Multisig slot/);
    });
  });

  describe('buildSafeRecoverKeyParams secp256k1Multisig', () => {
    const roots: DecryptedSafeRootsWithExternal = {
      ...makeRoots({ user: 'x', backup: 'y', bitgo: 'z' }),
      secp256k1Multisig: {
        user: userRoot.toBase58(),
        backup: { external: true, pub: externalPubRoot.toBase58() },
        bitgo: bitgoRoot.toBase58(),
      },
    };

    async function derive(externalBackupRootPrv?: string) {
      const derived = await deriveSafeWalletKeys({
        coin: 'btc',
        slot: 'secp256k1Multisig',
        account: 0,
        roots,
        externalBackupRootPrv,
      });
      if (derived.slot !== 'secp256k1Multisig') {
        throw new Error('expected secp256k1Multisig slot');
      }
      return derived;
    }

    it('unsigned mode needs no backup private key', async () => {
      const derived = await derive();
      const bitgo = { encrypt: sinon.stub() } as unknown as BitGoBase;

      const result = await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'btc',
        slot: 'secp256k1Multisig',
        keys: derived.keys,
        mode: 'unsigned',
      });

      result.should.deepEqual({
        slot: 'secp256k1Multisig',
        userKey: derived.keys.user.pub,
        backupKey: derived.keys.backup.pub,
        bitgoKey: derived.keys.bitgo.pub,
      });
      (bitgo.encrypt as sinon.SinonStub).callCount.should.equal(0);
    });

    it('signed mode re-encrypts the supplied external backup child prv', async () => {
      const derived = await derive(externalPrvRoot.toBase58());
      const encrypt = sinon.stub().callsFake(async ({ input }) => `enc(${input})`);
      const bitgo = { encrypt } as unknown as BitGoBase;

      const result = await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'btc',
        slot: 'secp256k1Multisig',
        keys: derived.keys,
        mode: 'signed',
      });
      if (result.slot !== 'secp256k1Multisig') {
        throw new Error('expected secp256k1Multisig params');
      }

      result.backupKey.should.equal(`enc(${derived.keys.backup.prv})`);
      result.userKey.should.equal(`enc(${derived.keys.user.prv})`);
    });

    it('signed mode without the backup root xprv fails closed', async () => {
      const derived = await derive();
      const bitgo = { encrypt: sinon.stub() } as unknown as BitGoBase;

      await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'btc',
        slot: 'secp256k1Multisig',
        keys: derived.keys,
        mode: 'signed',
      }).should.be.rejectedWith(/needs the backup private key.*externalBackupRootPrv/);
    });
  });

  describe('ed25519Multisig', () => {
    const STRKEY_SEED = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';
    const backupChainCode = Buffer.alloc(32, 0xab);
    // The BYOK holder's root pub is the ed25519 public key of its seed; the chain code rides on the keycard.
    const backupComposite = encodeDerivableEd25519Pub(
      Buffer.from(ed25519.getPublicKey(decodeEd25519StrKeySecretSeed(STRKEY_SEED))),
      backupChainCode
    );
    const bitgoComposite = encodeDerivableEd25519Pub(
      Buffer.from(ed25519.getPublicKey(Buffer.alloc(32, 0x22))),
      Buffer.alloc(32, 0xcd)
    );
    const localRoots: DecryptedSafeRootsWithExternal = {
      ...makeRoots({ user: 'x', backup: 'y', bitgo: 'z' }),
      ed25519Multisig: {
        user: STRKEY_SEED,
        backup: { prv: STRKEY_SEED, chainCode: encodeEd25519ChainCode(backupChainCode) },
        bitgo: bitgoComposite,
      },
    };
    const externalRoots: DecryptedSafeRootsWithExternal = {
      ...localRoots,
      ed25519Multisig: {
        user: STRKEY_SEED,
        backup: { external: true, pub: backupComposite },
        bitgo: bitgoComposite,
      },
    };

    async function derive(roots: DecryptedSafeRootsWithExternal) {
      const derived = await deriveSafeWalletKeys({ coin: 'algo', slot: 'ed25519Multisig', account: 0, roots });
      if (derived.slot !== 'ed25519Multisig') {
        throw new Error('expected ed25519Multisig slot');
      }
      return derived;
    }

    it('derives the external backup child pub, equal to the local derivation of the same root', async () => {
      const local = await derive(localRoots);
      const external = await derive(externalRoots);

      external.keys.backup.kind.should.equal('external');
      external.keys.backup.pub.should.equal(local.keys.backup.pub);
      external.keys.backup.pub.should.equal(
        (await softDeriveChildPubEd25519AtPath(backupComposite, 'm/44/283/2/0')).toString('hex')
      );
      external.keys.user.pub.should.equal(local.keys.user.pub);
      external.keys.bitgo.pub.should.equal(local.keys.bitgo.pub);
    });

    it('unsigned mode returns the encoded backup child without a signer', async () => {
      const external = await derive(externalRoots);
      const bitgo = { encrypt: sinon.stub() } as unknown as BitGoBase;

      const result = await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'algo',
        slot: 'ed25519Multisig',
        keys: external.keys,
        mode: 'unsigned',
      });
      if (result.slot !== 'ed25519Multisig' || result.mode !== 'unsigned') {
        throw new Error('expected unsigned ed25519Multisig params');
      }

      result.backupKey.should.equal(encodeAlgoKey(Buffer.from(external.keys.backup.pub, 'hex')));
    });

    it('signed mode uses the holder-supplied signer for the external backup child', async () => {
      const local = await derive(localRoots);
      const external = await derive(externalRoots);
      if (local.keys.backup.kind !== 'extended') {
        throw new Error('expected an extended backup child');
      }
      const { kL, kR } = local.keys.backup;
      // The holder's own signer, standing in for an HSM that supports BIP32-Ed25519 soft derivation.
      const holderSigner = {
        publicKey: external.keys.backup.pub,
        sign: async (message: Uint8Array) => ({
          signature: (
            await signEd25519Extended(Buffer.from(message), Buffer.from(kL, 'hex'), Buffer.from(kR, 'hex'))
          ).toString('hex'),
        }),
      };
      const bitgo = { encrypt: sinon.stub().resolves('enc') } as unknown as BitGoBase;

      const result = await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'algo',
        slot: 'ed25519Multisig',
        keys: external.keys,
        mode: 'signed',
        externalBackupSigner: holderSigner,
      });
      if (result.slot !== 'ed25519Multisig' || result.mode !== 'signed') {
        throw new Error('expected signed ed25519Multisig params');
      }

      result.externalBackupSigner.should.equal(holderSigner);
    });

    it('signed mode fails closed without a signer, with a mismatched signer, or with a signer on a local root', async () => {
      const local = await derive(localRoots);
      const external = await derive(externalRoots);
      const bitgo = { encrypt: sinon.stub().resolves('enc') } as unknown as BitGoBase;
      const signer = (publicKey: string) => ({ publicKey, sign: async () => ({ signature: '00'.repeat(64) }) });

      await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'algo',
        slot: 'ed25519Multisig',
        keys: external.keys,
        mode: 'signed',
      }).should.be.rejectedWith(/needs externalBackupSigner/);

      await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'algo',
        slot: 'ed25519Multisig',
        keys: external.keys,
        mode: 'signed',
        externalBackupSigner: signer('11'.repeat(32)),
      }).should.be.rejectedWith(/does not match the backup child pub/);

      await buildSafeRecoverKeyParams({
        bitgo,
        coin: 'algo',
        slot: 'ed25519Multisig',
        keys: local.keys,
        mode: 'signed',
        externalBackupSigner: signer(local.keys.backup.pub),
      }).should.be.rejectedWith(/only applies to an external backup root/);
    });
  });
});
