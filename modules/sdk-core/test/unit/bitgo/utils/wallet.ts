import 'should';
import * as bs58 from 'bs58';
import { generateRandomPassword } from '../../../../src/bitgo/utils/wallet';

describe('generateRandomPassword', () => {
  it('returns a decodable base58 string of numWords * 4 bytes', () => {
    for (const numWords of [1, 5, 10, 32]) {
      const pwd = generateRandomPassword(numWords);
      const decoded = bs58.decode(pwd);
      decoded.length.should.equal(numWords * 4);
    }
  });

  it('produces distinct outputs on repeated calls', () => {
    const samples = new Set<string>();
    for (let i = 0; i < 100; i++) {
      samples.add(generateRandomPassword(5));
    }
    samples.size.should.equal(100);
  });
});
