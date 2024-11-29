/**
 * @prettier
 */
import * as should from 'should';

import { randomBytes } from 'crypto';
import { decrypt, encrypt, bytesToWord } from '@bitgo/sdk-api';
import { getSeed } from '@bitgo/sdk-test';

describe('bytesToWord', () => {
  it('should fail if input is not a Uint8Array', () => {
    let inputArr: any = [0, 0, 0, 0];
    (() => bytesToWord(inputArr)).should.throw();

    inputArr = {};
    (() => bytesToWord(inputArr)).should.throw();

    inputArr = 'abc';
    (() => bytesToWord(inputArr)).should.throw();
  });

  it('should fail if input is not exactly 4 elements', () => {
    let inputArr = Uint8Array.of(0xff, 0xff, 0xff);
    (() => bytesToWord(inputArr)).should.throw();

    inputArr = Uint8Array.of(0xff, 0xff, 0xff, 0xff, 0xff);
    (() => bytesToWord(inputArr)).should.throw();
  });

  it('should convert to 0', () => {
    const inputArr = Uint8Array.of(0, 0, 0, 0);

    const res = bytesToWord(inputArr);
    res.should.equal(0);
  });

  it('should convert to 2 ^ 32 - 1', () => {
    const inputArr = Uint8Array.of(0xff, 0xff, 0xff, 0xff);

    const res = bytesToWord(inputArr);
    res.should.equal(Math.pow(2, 32) - 1);
  });

  it('should convert to 2 ^ 16', () => {
    const inputArr = Uint8Array.of(0x00, 0x01, 0x00, 0x00);

    const res = bytesToWord(inputArr);
    res.should.equal(Math.pow(2, 16));
  });

  it('should convert 1000 random numbers', () => {
    for (let i = 0; i < 1000; i++) {
      const inputArr = randomBytes(4);
      const resStr = bytesToWord(inputArr).toString(16);
      const arrStr = inputArr.toString('hex');
      parseInt(resStr, 16).should.equal(parseInt(arrStr, 16));
    }
  });
});

describe('encrypt, decrypt', function () {
  const passwords = Array.from({ length: 2 }).map((_, i) => `key/${i}`);
  const plaintexts = Array.from({ length: 2 }).map((_, i) => `plaintext/${i}`);

  it('matches fixture', function () {
    const ciphertext = encrypt(passwords[0], plaintexts[0], {
      salt: getSeed(`randomSalt`).slice(0, 8),
      iv: getSeed(`randomIV`).slice(0, 16),
    });
    ciphertext.should.eql(
      '{"iv":"BVDN1IpOeJ6E5kSV88MsHA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"aJjlH+mKW1E=","ct":"loJEsFuypKZMZ+igqCUmbwQfMw=="}'
    );
    JSON.parse(ciphertext).should.eql({
      adata: '',
      cipher: 'aes',
      ct: 'loJEsFuypKZMZ+igqCUmbwQfMw==',
      iter: 10000,
      iv: 'BVDN1IpOeJ6E5kSV88MsHA==',
      ks: 256,
      mode: 'ccm',
      salt: 'aJjlH+mKW1E=',
      ts: 64,
      v: 1,
    });
  });

  it('encrypts and decrypts', function () {
    passwords.forEach((password) => {
      plaintexts.forEach((plaintext) => {
        const ciphertext1 = encrypt(password, plaintext);
        const ciphertext2 = encrypt(password, plaintext);
        (ciphertext1 === ciphertext2).should.eql(false);

        [ciphertext1, ciphertext2].forEach((ct) => {
          passwords.forEach((otherPassword) => {
            if (password === otherPassword) {
              decrypt(otherPassword, ct).should.eql(plaintext);
            } else {
              should.throws(() => decrypt(otherPassword, ct), /ccm: tag doesn't match/);
            }
          });
        });
      });
    });
  });
});
