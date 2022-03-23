/**
 * @prettier
 */
import 'should';
import * as bip32 from 'bip32';
import * as crypto from 'crypto';
import * as utxolib from '@bitgo/utxo-lib';

import { getSharedSecret } from '../src/ecdh';

describe('ECDH sharing secret', () => {
  function getKey(seed: string) {
    return bip32.fromSeed(crypto.createHash('sha256').update(seed).digest());
  }

  it('should calculate a new ECDH sharing secret correctly', () => {
    for (let i = 0; i < 256; i++) {
      const eckey1 = getKey(`${i}.a`);
      const eckey2 = getKey(`${i}.b`);

      [eckey1, utxolib.bitgo.keyutil.privateKeyBufferToECPair(eckey1.privateKey)].forEach((privateKey) => {
        const sharingKey1 = getSharedSecret(privateKey, eckey2).toString('hex');
        const sharingKey2 = getSharedSecret(eckey2, eckey1).toString('hex');
        sharingKey1.should.equal(sharingKey2);

        switch (i) {
          case 0:
            sharingKey1.should.eql('465ffe5745325998b83fb39631347148e24d4f21b3f3b54739c264d5c42db4b8');
            break;
          case 1:
            sharingKey1.should.eql('61ff44fc1af8061a433a314b7b8be8ae352c10f62aac5887047dbaa5643b818d');
            break;
        }
      });
    }
  });
});
