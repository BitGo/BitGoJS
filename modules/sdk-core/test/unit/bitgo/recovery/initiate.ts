import 'should';
import * as sinon from 'sinon';
import * as sjcl from '@bitgo/sjcl';
import { bip32 } from '@bitgo/utxo-lib';
import { deriveSafeSecp256k1MultisigTriplet } from '@bitgo/sdk-lib-safes';
import { validateKey, getBip32Keys } from '../../../../src/bitgo/recovery/initiate';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';

// A deterministic xprv used across all tests.
const TEST_XPRV =
  'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k';
const TEST_XPUB =
  'xpub661MyMwAqRbcF9Nc7TbBo1rZAagiWEVPWKbDKThNG8zqjk76HAKLkaSbTn6dK2dQPfuD7xjicxCZVWvj67fP5nQ9W7QURmoMVAX8m6jZsGp';
const SAFE_USER_ROOT_SEED = '000102030405060708090a0b0c0d0e0f';
const SAFE_BACKUP_ROOT_SEED = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const SAFE_BITGO_ROOT_SEED = '1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100';

/**
 * Encrypt plaintext with SJCL (legacy v1 envelope, matching `encryptionVersion: 1`).
 */
function sjclEncrypt(password: string, input: string): string {
  return sjcl.encrypt(password, input) as unknown as string;
}

function makeMockBitGo(decryptImpl: (params: { password?: string; input: string }) => string): BitGoBase {
  return {
    decrypt: sinon.stub().callsFake(async (params: { password?: string; input: string }) => decryptImpl(params)),
    encrypt: sinon.stub(),
  } as unknown as BitGoBase;
}

describe('validateKey', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns a BIP32 node directly when key starts with xprv (bypasses decrypt)', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    const node = await validateKey(bitgo, {
      key: TEST_XPRV,
      source: 'user',
      passphrase: 'secret',
      isUnsignedSweep: false,
      isKrsRecovery: false,
    });
    node.toBase58().should.equal(TEST_XPRV);
    (bitgo.decrypt as sinon.SinonStub).callCount.should.equal(0);
  });

  it('calls decrypt and returns BIP32 node when key is encrypted (not xprv)', async () => {
    const passphrase = 'hunter2';
    const encryptedKey = sjclEncrypt(passphrase, TEST_XPRV);
    const bitgo = makeMockBitGo(({ password, input }) => {
      if (input === encryptedKey && password === passphrase) return TEST_XPRV;
      throw new Error('unexpected decrypt call');
    });
    const node = await validateKey(bitgo, {
      key: encryptedKey,
      source: 'user',
      passphrase,
      isUnsignedSweep: false,
      isKrsRecovery: false,
    });
    node.toBase58().should.equal(TEST_XPRV);
    (bitgo.decrypt as sinon.SinonStub).callCount.should.equal(1);
  });

  it('rejects with friendly message when decrypt fails (wrong passphrase)', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('sjcl: ccm: tag does not match');
    });
    await validateKey(bitgo, {
      key: 'notAnXprv',
      source: 'user',
      passphrase: 'wrong',
      isUnsignedSweep: false,
      isKrsRecovery: false,
    }).should.be.rejectedWith('Failed to decrypt user key with passcode - try again!');
  });

  it('skips decrypt for unsigned sweep (isUnsignedSweep = true)', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    const node = await validateKey(bitgo, {
      key: TEST_XPUB,
      source: 'user',
      passphrase: 'secret',
      isUnsignedSweep: true,
      isKrsRecovery: false,
    });
    node.neutered().toBase58().should.equal(TEST_XPUB);
    (bitgo.decrypt as sinon.SinonStub).callCount.should.equal(0);
  });
});

describe('getBip32Keys', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns [userKey, backupKey] when both are provided as xprv', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    const keys = await getBip32Keys(
      bitgo,
      { userKey: TEST_XPRV, backupKey: TEST_XPRV, recoveryDestination: 'addr' },
      { requireBitGoXpub: false }
    );
    keys.should.have.length(2);
    keys[0].toBase58().should.equal(TEST_XPRV);
    keys[1].toBase58().should.equal(TEST_XPRV);
  });

  it('returns three keys when requireBitGoXpub is true and bitgoKey is valid', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    const keys = await getBip32Keys(
      bitgo,
      { userKey: TEST_XPRV, backupKey: TEST_XPRV, bitgoKey: TEST_XPUB, recoveryDestination: 'addr' },
      { requireBitGoXpub: true }
    );
    keys.should.have.length(3);
    keys[2].neutered().toBase58().should.equal(TEST_XPUB);
  });

  it('accepts a derived slot-1 triplet without decrypting user or backup keys', async () => {
    const userRoot = bip32.fromSeed(Buffer.from(SAFE_USER_ROOT_SEED, 'hex'));
    const backupRoot = bip32.fromSeed(Buffer.from(SAFE_BACKUP_ROOT_SEED, 'hex'));
    const bitgoRoot = bip32.fromSeed(Buffer.from(SAFE_BITGO_ROOT_SEED, 'hex'));
    const triplet = deriveSafeSecp256k1MultisigTriplet({
      userRootXprv: userRoot.toBase58(),
      backupRootXprv: backupRoot.toBase58(),
      bitgoRootXpub: bitgoRoot.neutered().toBase58(),
      index: 999,
    });
    const bitgo = makeMockBitGo(() => {
      throw new Error('derived raw keys must bypass decrypt');
    });

    const keys = await getBip32Keys(
      bitgo,
      {
        userKey: triplet.user.prv,
        backupKey: triplet.backup.prv,
        bitgoKey: triplet.bitgo.pub,
        recoveryDestination: 'addr',
      },
      { requireBitGoXpub: true }
    );

    keys[0].toBase58().should.equal(triplet.user.prv);
    keys[1].toBase58().should.equal(triplet.backup.prv);
    keys[2].neutered().toBase58().should.equal(triplet.bitgo.pub);
    (bitgo.decrypt as sinon.SinonStub).callCount.should.equal(0);
  });

  it('calls decrypt for encrypted user key', async () => {
    const passphrase = 'pass1';
    const encryptedUserKey = sjclEncrypt(passphrase, TEST_XPRV);
    const bitgo = makeMockBitGo(({ password, input }) => {
      if (input === encryptedUserKey && password === passphrase) return TEST_XPRV;
      throw new Error('unexpected decrypt call');
    });
    const keys = await getBip32Keys(
      bitgo,
      { userKey: encryptedUserKey, backupKey: TEST_XPRV, walletPassphrase: passphrase, recoveryDestination: 'addr' },
      { requireBitGoXpub: false }
    );
    keys.should.have.length(2);
    keys[0].toBase58().should.equal(TEST_XPRV);
    (bitgo.decrypt as sinon.SinonStub).callCount.should.equal(1);
  });

  it('rejects when requireBitGoXpub is true but bitgoKey is missing', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    await getBip32Keys(
      bitgo,
      { userKey: TEST_XPRV, backupKey: TEST_XPRV, recoveryDestination: 'addr' },
      { requireBitGoXpub: true }
    ).should.be.rejectedWith('BitGo xpub required but not provided');
  });
});
