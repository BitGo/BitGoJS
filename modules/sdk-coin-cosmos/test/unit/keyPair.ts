import assert from 'assert';
import should from 'should';
import { fromBase64, toHex } from '@cosmjs/encoding';
import { coins } from '@bitgo-beta/statics';
import { KeyPair } from '../../src';
import { getAvailableTestCoins, getTestData } from '../testUtils';

describe('Cosmos KeyPair', function () {
  const availableCoins = getAvailableTestCoins();
  // TODO: COIN-5039 -  Running tests for each coin in parallel to improve test performance
  // Loop through each available coin and run tests
  availableCoins.forEach((coinName) => {
    describe(`${coinName} KeyPair`, function () {
      const testData = getTestData(coinName);
      const coin = coins.get(testData.testnetCoin);

      describe('should create a valid KeyPair', () => {
        it('from an empty value', () => {
          const keyPairObj = new KeyPair();
          const keys = keyPairObj.getKeys();
          should.exists(keys.prv);
          should.exists(keys.pub);
          should.equal(keys.prv?.length, 64);
          should.equal(keys.pub.length, 66);

          const extendedKeys = keyPairObj.getExtendedKeys();
          should.exists(extendedKeys.xprv);
          should.exists(extendedKeys.xpub);
        });

        it('from a private key', () => {
          const privateKey = testData.privateKey;
          const keyPairObj = new KeyPair({ prv: toHex(fromBase64(privateKey)) }, coin);
          const keys = keyPairObj.getKeys();
          should.exists(keys.prv);
          should.exists(keys.pub);
          should.equal(keys.prv, toHex(fromBase64(testData.privateKey)));
          should.equal(keys.pub, toHex(fromBase64(testData.pubKey)));
          should.equal(keyPairObj.getAddress(), testData.senderAddress);

          assert.throws(() => keyPairObj.getExtendedKeys());
        });
      });

      describe('should fail to create a KeyPair', () => {
        it('from an invalid privateKey', () => {
          assert.throws(
            () => new KeyPair({ prv: '' }, coin),
            (e: any) => e.message === 'Unsupported private key'
          );
        });

        it('from an invalid publicKey', () => {
          assert.throws(
            () => new KeyPair({ pub: '' }, coin),
            (e: any) => e.message.startsWith('Unsupported public key')
          );
        });

        it('from an undefined seed', () => {
          const undefinedBuffer = undefined as unknown as Buffer;
          assert.throws(
            () => new KeyPair({ seed: undefinedBuffer }, coin),
            (e: any) => e.message.startsWith('Invalid key pair options')
          );
        });

        it('from an undefined private key', () => {
          const undefinedStr: string = undefined as unknown as string;
          assert.throws(
            () => new KeyPair({ prv: undefinedStr }, coin),
            (e: any) => e.message.startsWith('Invalid key pair options')
          );
        });

        it('from an undefined public key', () => {
          const undefinedStr: string = undefined as unknown as string;
          assert.throws(
            () => new KeyPair({ pub: undefinedStr }, coin),
            (e: any) => e.message.startsWith('Invalid key pair options')
          );
        });
      });

      describe('get unique address ', () => {
        it('from a private key', () => {
          const keyPair = new KeyPair({ prv: toHex(fromBase64(testData.privateKey)) }, coin);
          should.equal(keyPair.getAddress(), testData.senderAddress);
        });
      });
    });
  });
});
