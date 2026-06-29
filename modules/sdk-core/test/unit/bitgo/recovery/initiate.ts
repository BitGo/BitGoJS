import 'should';
import * as sinon from 'sinon';
import * as sjcl from '@bitgo/sjcl';
import {
  validateKey,
  validateKeyAsync,
  getBip32Keys,
  getBip32KeysAsync,
} from '../../../../src/bitgo/recovery/initiate';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';

// A deterministic xprv used across all tests.
const TEST_XPRV =
  'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k';
const TEST_XPUB =
  'xpub661MyMwAqRbcF9Nc7TbBo1rZAagiWEVPWKbDKThNG8zqjk76HAKLkaSbTn6dK2dQPfuD7xjicxCZVWvj67fP5nQ9W7QURmoMVAX8m6jZsGp';

/**
 * Encrypt plaintext with SJCL (same algorithm as BitGoAPI.encrypt).
 */
function sjclEncrypt(password: string, input: string): string {
  return sjcl.encrypt(password, input) as unknown as string;
}

function makeMockBitGo(decryptImpl: (params: { password?: string; input: string }) => string): BitGoBase {
  return {
    decrypt: sinon.stub().callsFake(decryptImpl),
    decryptAsync: sinon.stub().callsFake(async (params: { password?: string; input: string }) => decryptImpl(params)),
    encrypt: sinon.stub(),
    encryptAsync: sinon.stub(),
  } as unknown as BitGoBase;
}

describe('validateKey', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns a BIP32 node directly when key starts with xprv (bypasses decrypt)', () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    const node = validateKey(bitgo, {
      key: TEST_XPRV,
      source: 'user',
      passphrase: 'secret',
      isUnsignedSweep: false,
      isKrsRecovery: false,
    });
    node.toBase58().should.equal(TEST_XPRV);
    (bitgo.decrypt as sinon.SinonStub).callCount.should.equal(0);
  });

  it('calls decrypt and returns BIP32 node when key is encrypted (not xprv)', () => {
    const passphrase = 'hunter2';
    const encryptedKey = sjclEncrypt(passphrase, TEST_XPRV);
    const bitgo = makeMockBitGo(({ password, input }) => {
      if (input === encryptedKey && password === passphrase) return TEST_XPRV;
      throw new Error('unexpected decrypt call');
    });
    const node = validateKey(bitgo, {
      key: encryptedKey,
      source: 'user',
      passphrase,
      isUnsignedSweep: false,
      isKrsRecovery: false,
    });
    node.toBase58().should.equal(TEST_XPRV);
    (bitgo.decrypt as sinon.SinonStub).callCount.should.equal(1);
  });

  it('throws with friendly message when decrypt fails (wrong passphrase)', () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('sjcl: ccm: tag does not match');
    });
    (() =>
      validateKey(bitgo, {
        key: 'notAnXprv',
        source: 'user',
        passphrase: 'wrong',
        isUnsignedSweep: false,
        isKrsRecovery: false,
      })).should.throw('Failed to decrypt user key with passcode - try again!');
  });
});

describe('validateKeyAsync', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns a BIP32 node directly when key starts with xprv (bypasses decryptAsync)', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    const node = await validateKeyAsync(bitgo, {
      key: TEST_XPRV,
      source: 'user',
      passphrase: 'secret',
      isUnsignedSweep: false,
      isKrsRecovery: false,
    });
    node.toBase58().should.equal(TEST_XPRV);
    (bitgo.decryptAsync as sinon.SinonStub).callCount.should.equal(0);
  });

  it('calls decryptAsync and returns BIP32 node when key is encrypted (not xprv)', async () => {
    const passphrase = 'hunter2';
    const encryptedKey = sjclEncrypt(passphrase, TEST_XPRV);
    const bitgo = makeMockBitGo(({ password, input }) => {
      if (input === encryptedKey && password === passphrase) return TEST_XPRV;
      throw new Error('unexpected decrypt call');
    });
    const node = await validateKeyAsync(bitgo, {
      key: encryptedKey,
      source: 'user',
      passphrase,
      isUnsignedSweep: false,
      isKrsRecovery: false,
    });
    node.toBase58().should.equal(TEST_XPRV);
    (bitgo.decryptAsync as sinon.SinonStub).callCount.should.equal(1);
  });

  it('rejects with friendly message when decryptAsync fails (wrong passphrase)', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('sjcl: ccm: tag does not match');
    });
    await validateKeyAsync(bitgo, {
      key: 'notAnXprv',
      source: 'user',
      passphrase: 'wrong',
      isUnsignedSweep: false,
      isKrsRecovery: false,
    }).should.be.rejectedWith('Failed to decrypt user key with passcode - try again!');
  });

  it('skips decryptAsync for unsigned sweep (isUnsignedSweep = true)', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    const node = await validateKeyAsync(bitgo, {
      key: TEST_XPUB,
      source: 'user',
      passphrase: 'secret',
      isUnsignedSweep: true,
      isKrsRecovery: false,
    });
    node.neutered().toBase58().should.equal(TEST_XPUB);
    (bitgo.decryptAsync as sinon.SinonStub).callCount.should.equal(0);
  });
});

describe('getBip32Keys', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns [userKey, backupKey] when both are provided as xprv', () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    const keys = getBip32Keys(
      bitgo,
      { userKey: TEST_XPRV, backupKey: TEST_XPRV, recoveryDestination: 'addr' },
      { requireBitGoXpub: false }
    );
    keys.should.have.length(2);
    keys[0].toBase58().should.equal(TEST_XPRV);
    keys[1].toBase58().should.equal(TEST_XPRV);
  });

  it('throws when requireBitGoXpub is true but bitgoKey is missing', () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    (() =>
      getBip32Keys(
        bitgo,
        { userKey: TEST_XPRV, backupKey: TEST_XPRV, recoveryDestination: 'addr' },
        { requireBitGoXpub: true }
      )).should.throw('BitGo xpub required but not provided');
  });
});

describe('getBip32KeysAsync', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns [userKey, backupKey] when both are provided as xprv', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    const keys = await getBip32KeysAsync(
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
    const keys = await getBip32KeysAsync(
      bitgo,
      { userKey: TEST_XPRV, backupKey: TEST_XPRV, bitgoKey: TEST_XPUB, recoveryDestination: 'addr' },
      { requireBitGoXpub: true }
    );
    keys.should.have.length(3);
    keys[2].neutered().toBase58().should.equal(TEST_XPUB);
  });

  it('calls decryptAsync for encrypted user key', async () => {
    const passphrase = 'pass1';
    const encryptedUserKey = sjclEncrypt(passphrase, TEST_XPRV);
    const bitgo = makeMockBitGo(({ password, input }) => {
      if (input === encryptedUserKey && password === passphrase) return TEST_XPRV;
      throw new Error('unexpected decrypt call');
    });
    const keys = await getBip32KeysAsync(
      bitgo,
      { userKey: encryptedUserKey, backupKey: TEST_XPRV, walletPassphrase: passphrase, recoveryDestination: 'addr' },
      { requireBitGoXpub: false }
    );
    keys.should.have.length(2);
    keys[0].toBase58().should.equal(TEST_XPRV);
    (bitgo.decryptAsync as sinon.SinonStub).callCount.should.equal(1);
  });

  it('rejects when requireBitGoXpub is true but bitgoKey is missing', async () => {
    const bitgo = makeMockBitGo(() => {
      throw new Error('should not be called');
    });
    await getBip32KeysAsync(
      bitgo,
      { userKey: TEST_XPRV, backupKey: TEST_XPRV, recoveryDestination: 'addr' },
      { requireBitGoXpub: true }
    ).should.be.rejectedWith('BitGo xpub required but not provided');
  });
});
