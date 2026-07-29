import assert from 'assert';

import { BIP32, message } from '@bitgo/wasm-utxo';

import { verifyKeySignature } from '../../src/verifyKey';

const KEY_ROLES = ['user', 'backup', 'bitgo'] as const;
type KeyRole = (typeof KEY_ROLES)[number];

function signKeySignature(signerPrivateKey: BIP32, pubToSign: string): string {
  assert(signerPrivateKey.privateKey, 'signer must have a private key');
  return Buffer.from(message.signMessage(pubToSign, signerPrivateKey.privateKey)).toString('hex');
}

function createMockCustomChangeKeySignatures(
  signerPrivateKey: BIP32,
  changeKeychains: { pub: string }[]
): Record<KeyRole, string> {
  return {
    user: signKeySignature(signerPrivateKey, changeKeychains[0].pub),
    backup: signKeySignature(signerPrivateKey, changeKeychains[1].pub),
    bitgo: signKeySignature(signerPrivateKey, changeKeychains[2].pub),
  };
}

describe('Custom Change Wallet Key Signatures', function () {
  const mainUserKey = BIP32.fromSeedSha256('main-user');
  const changeKeys = [
    BIP32.fromSeedSha256('change-user'),
    BIP32.fromSeedSha256('change-backup'),
    BIP32.fromSeedSha256('change-bitgo'),
  ];
  const changeKeychains = changeKeys.map((k) => ({ pub: k.neutered().toBase58() }));

  it('should accept signatures from the correct key', function () {
    const signatures = createMockCustomChangeKeySignatures(mainUserKey, changeKeychains);

    for (const role of KEY_ROLES) {
      const index = KEY_ROLES.indexOf(role);
      assert.ok(
        verifyKeySignature({
          userKeychain: { pub: mainUserKey.neutered().toBase58() },
          keychainToVerify: changeKeychains[index],
          keySignature: signatures[role],
        }),
        `failed to verify mock custom change ${role} key signature`
      );
    }
  });

  it('should reject signatures from a different key', function () {
    const wrongKey = BIP32.fromSeedSha256('wrong-key');
    const badSignatures = createMockCustomChangeKeySignatures(wrongKey, changeKeychains);

    for (const role of KEY_ROLES) {
      const index = KEY_ROLES.indexOf(role);
      assert.strictEqual(
        verifyKeySignature({
          userKeychain: { pub: mainUserKey.neutered().toBase58() },
          keychainToVerify: changeKeychains[index],
          keySignature: badSignatures[role],
        }),
        false,
        `should have rejected custom change ${role} key signature from wrong key`
      );
    }
  });
});
