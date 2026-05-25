/**
 * @prettier
 */
import { register } from '../../../src/utils';
import * as coinModules from '../../../src';
import { throws } from 'should';

describe('Utils Factory', () => {
  describe('should initialize base util methods for all coin supported', function () {
    const supportedCoinsExceptTestnet = Object.keys(coinModules).filter((k) => coinModules[k].Util);

    supportedCoinsExceptTestnet.forEach((coinName) => {
      it(`should initialize a ${coinName} keyPair map`, function () {
        const utils = register(coinName);
        (typeof utils.isValidAddress).should.eql('function');
        (typeof utils.isValidTransactionId).should.eql('function');
        (typeof utils.isValidPublicKey).should.eql('function');
        (typeof utils.isValidPrivateKey).should.eql('function');
        (typeof utils.isValidSignature).should.eql('function');
        (typeof utils.isValidBlockId).should.eql('function');
      });
    });
  });

  it('should raise error if coin not supported', () => {
    throws(() => register('fakeUnsupported'));
  });
});
