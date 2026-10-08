import 'should';
import * as sinon from 'sinon';
import { bip32 } from '@bitgo/utxo-lib';
import { DklsDsg, DklsTypes, DklsUtils, DklsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { buildSafeMpcKeyEnvelopes } from '../../../../src/bitgo/utils/tss/keyShareEnvelope';
import { IncorrectPasswordError } from '../../../../src/bitgo/errors';
import {
  DecryptedSafeRoots,
  buildSafeRecoverKeyParams,
  decryptSafeKeycard,
  deriveSafeWalletKeys,
} from '../../../../src/bitgo/safe/recovery';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';

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
  ed25519Multisig: string;
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
      ed25519Multisig: 'enc-backup-ed25519',
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
    result.ed25519Multisig.backup.should.equal('S-backup-seed');
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
    ed25519Multisig: { user: 'u', backup: 'b', bitgo: 'g' },
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

  it('rejects unsupported slots', async () => {
    await deriveSafeWalletKeys({ coin: 'btc', slot: 'eddsaMpc', account: 0, roots }).should.be.rejectedWith(
      /not supported yet/
    );
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
      keys,
      mode: 'signed',
    }).should.be.rejectedWith(/not supported yet/);
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
