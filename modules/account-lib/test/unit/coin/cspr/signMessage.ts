import { randomBytes } from 'crypto';
import assert from 'assert';
import { KeyPair } from '../../../../src/coin/cspr/keyPair';
import { isValidMessageSignature, signMessage } from '../../../../src/coin/cspr/utils';
import * as testData from '../../../resources/cspr/cspr';

describe('Sign Message', () => {
  it('should be performed', async () => {
    const keyPair = new KeyPair();
    const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
    const { signature } = signMessage(keyPair, messageToSign);
    isValidMessageSignature(Buffer.from(signature).toString('hex'), messageToSign, keyPair.getKeys().pub).should.equals(
      true,
    );
  });

  it('should be performed using extended key', async () => {
    const keyPair = new KeyPair({ prv: testData.ACCOUNT_1.xPrivateKey });
    const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
    const { signature } = signMessage(keyPair, messageToSign);
    isValidMessageSignature(Buffer.from(signature).toString('hex'), messageToSign, keyPair.getKeys().pub).should.equals(
      true,
    );
  });

  it('should fail with missing private key', async () => {
    const keyPair = new KeyPair({ pub: testData.ACCOUNT_1.publicKey });
    const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
    assert.throws(
      () => signMessage(keyPair, messageToSign),
      (e) => e.message === testData.ERROR_MISSING_PRIVATE_KEY,
    );
  });

  it('should fail with missing private key using extended key', async () => {
    const keyPair = new KeyPair({ pub: testData.ACCOUNT_1.xPublicKey });
    const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
    assert.throws(
      () => signMessage(keyPair, messageToSign),
      (e) => e.message === testData.ERROR_MISSING_PRIVATE_KEY,
    );
  });
});
