import assert from 'assert';
import { isRight, isLeft } from 'fp-ts/Either';

import {
  GenerateLightningWalletOptionsCodec,
  GenerateGoAccountWalletOptionsCodec,
} from '../../../../src/bitgo/wallet/iWallets';

describe('wallet options codecs with encryptionVersion', () => {
  const lightningBase = {
    label: 'test',
    passphrase: 'pass',
    enterprise: 'ent',
    passcodeEncryptionCode: 'code',
    subType: 'lightningCustody' as const,
  };

  const goAccountBase = {
    label: 'test',
    passphrase: 'pass',
    enterprise: 'ent',
    passcodeEncryptionCode: 'code',
    type: 'trading' as const,
  };

  it('GenerateLightningWalletOptionsCodec accepts encryptionVersion: 2', () => {
    assert.ok(isRight(GenerateLightningWalletOptionsCodec.decode({ ...lightningBase, encryptionVersion: 2 })));
  });

  it('GenerateLightningWalletOptionsCodec rejects encryptionVersion: 3', () => {
    assert.ok(isLeft(GenerateLightningWalletOptionsCodec.decode({ ...lightningBase, encryptionVersion: 3 })));
  });

  it('GenerateLightningWalletOptionsCodec works without encryptionVersion', () => {
    assert.ok(isRight(GenerateLightningWalletOptionsCodec.decode(lightningBase)));
  });

  it('GenerateGoAccountWalletOptionsCodec accepts encryptionVersion: 2', () => {
    assert.ok(isRight(GenerateGoAccountWalletOptionsCodec.decode({ ...goAccountBase, encryptionVersion: 2 })));
  });

  it('GenerateGoAccountWalletOptionsCodec rejects encryptionVersion: 3', () => {
    assert.ok(isLeft(GenerateGoAccountWalletOptionsCodec.decode({ ...goAccountBase, encryptionVersion: 3 })));
  });

  it('GenerateGoAccountWalletOptionsCodec works without encryptionVersion', () => {
    assert.ok(isRight(GenerateGoAccountWalletOptionsCodec.decode(goAccountBase)));
  });

  it('GenerateGoAccountWalletOptionsCodec accepts password fields when user key signing is disabled', () => {
    assert.ok(
      isRight(
        GenerateGoAccountWalletOptionsCodec.decode({
          ...goAccountBase,
          userKeySigningRequired: false,
        })
      )
    );
  });

  it('GenerateGoAccountWalletOptionsCodec accepts omitted password fields when user key signing is disabled', () => {
    assert.ok(
      isRight(
        GenerateGoAccountWalletOptionsCodec.decode({
          label: 'test',
          enterprise: 'ent',
          type: 'trading',
          userKeySigningRequired: false,
        })
      )
    );
  });

  it('GenerateGoAccountWalletOptionsCodec rejects a single password field when user key signing is disabled', () => {
    assert.ok(
      isLeft(
        GenerateGoAccountWalletOptionsCodec.decode({
          label: 'test',
          passphrase: 'pass',
          enterprise: 'ent',
          type: 'trading',
          userKeySigningRequired: false,
        })
      )
    );
  });
});
