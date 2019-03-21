import 'should';

const { randomBytes } = require('crypto');
const { bytesToWord } = require('../../../src/v2/internal');

describe('Internal:', () => {
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
});
