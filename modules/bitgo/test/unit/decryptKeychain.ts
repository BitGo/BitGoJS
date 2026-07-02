import 'should';
import { decryptKeychainPrivateKey, OptionalKeychainEncryptedKey } from '@bitgo/sdk-core';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('decryptKeychainPrivateKey', () => {
  const bitgo = new BitGoAPI();

  const prv1 = Math.random().toString();
  const password1 = Math.random().toString();

  const prv2 = Math.random().toString();
  const password2 = Math.random().toString();

  it('should decrypt encryptedPrv', async () => {
    const keychain: OptionalKeychainEncryptedKey = {
      encryptedPrv: await bitgo.encrypt({ input: prv1, password: password1 }),
    };
    const result = await decryptKeychainPrivateKey(bitgo, keychain, password1);
    result!.should.equal(prv1);
  });

  it('should decrypt webauthnDevices encryptedPrv', async () => {
    const keychain: OptionalKeychainEncryptedKey = {
      webauthnDevices: [
        {
          otpDeviceId: '123',
          authenticatorInfo: {
            credID: 'credID',
            fmt: 'packed',
            publicKey: 'some value',
          },
          prfSalt: '456',
          encryptedPrv: await bitgo.encrypt({ input: prv2, password: password2 }),
        },
      ],
    };
    const result = await decryptKeychainPrivateKey(bitgo, keychain, password2);
    result!.should.equal(prv2);
  });

  it('should try and decrypt all encryptedPrvs', async () => {
    const keychain: OptionalKeychainEncryptedKey = {
      encryptedPrv: await bitgo.encrypt({ input: prv1, password: password1 }),
      webauthnDevices: [
        {
          otpDeviceId: '123',
          authenticatorInfo: {
            credID: 'credID',
            fmt: 'packed',
            publicKey: 'some value',
          },
          prfSalt: '456',
          encryptedPrv: await bitgo.encrypt({ input: prv2, password: password2 }),
        },
      ],
    };
    const result = await decryptKeychainPrivateKey(bitgo, keychain, password2);
    result!.should.equal(prv2);
  });

  it('should return undefined if no encryptedPrv can be decrypted', async () => {
    const keychain: OptionalKeychainEncryptedKey = {
      encryptedPrv: await bitgo.encrypt({ input: prv1, password: password1 }),
      webauthnDevices: [
        {
          otpDeviceId: '123',
          authenticatorInfo: {
            credID: 'credID',
            fmt: 'packed',
            publicKey: 'some value',
          },
          prfSalt: '456',
          encryptedPrv: await bitgo.encrypt({ input: prv2, password: password2 }),
        },
      ],
    };
    const result = await decryptKeychainPrivateKey(bitgo, keychain, Math.random().toString());
    (result === undefined).should.equal(true);
  });

  it('should return undefined if no encryptedPrv is present', async () => {
    const result = await decryptKeychainPrivateKey(bitgo, {}, 'password');
    (result === undefined).should.be.true();
  });
});
