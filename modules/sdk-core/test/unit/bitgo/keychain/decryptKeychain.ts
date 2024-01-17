import 'should';
import { decryptKeychainPrivateKey, OptionalKeychainEncryptedKey } from '../../../../src';
import { BitGoAPI } from '@bitgo/sdk-api';
describe('decryptKeychainPrivateKey', () => {
  const bitgo = new BitGoAPI();

  const prv1 = Math.random().toString();
  const password1 = Math.random().toString();

  const prv2 = Math.random().toString();
  const password2 = Math.random().toString();

  it('should decrypt encryptedPrv', () => {
    const keychain: OptionalKeychainEncryptedKey = {
      encryptedPrv: bitgo.encrypt({ input: prv1, password: password1 }),
    };
    decryptKeychainPrivateKey(bitgo, keychain, password1)!.should.equal(prv1);
  });

  it('should decrypt webauthnDevices encryptedPrv', () => {
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
          encryptedPrv: bitgo.encrypt({ input: prv2, password: password2 }),
        },
      ],
    };
    decryptKeychainPrivateKey(bitgo, keychain, password2)!.should.equal(prv2);
  });

  it('should try and decrypt all encryptedPrvs', () => {
    const keychain: OptionalKeychainEncryptedKey = {
      encryptedPrv: bitgo.encrypt({ input: prv1, password: password1 }),
      webauthnDevices: [
        {
          otpDeviceId: '123',
          authenticatorInfo: {
            credID: 'credID',
            fmt: 'packed',
            publicKey: 'some value',
          },
          prfSalt: '456',
          encryptedPrv: bitgo.encrypt({ input: prv2, password: password2 }),
        },
      ],
    };
    decryptKeychainPrivateKey(bitgo, keychain, password2)!.should.equal(prv2);
  });

  it('should return undefined if no encryptedPrv can be decrypted', () => {
    const keychain: OptionalKeychainEncryptedKey = {
      encryptedPrv: bitgo.encrypt({ input: prv1, password: password1 }),
      webauthnDevices: [
        {
          otpDeviceId: '123',
          authenticatorInfo: {
            credID: 'credID',
            fmt: 'packed',
            publicKey: 'some value',
          },
          prfSalt: '456',
          encryptedPrv: bitgo.encrypt({ input: prv2, password: password2 }),
        },
      ],
    };
    (decryptKeychainPrivateKey(bitgo, keychain, Math.random().toString()) === undefined).should.equal(true);
  });

  it('should return undefined if no encryptedPrv is present', () => {
    (decryptKeychainPrivateKey(bitgo, {}, 'password') === undefined).should.be.true();
  });
});
