import 'should';

import { isBolt11Invoice } from '../../src/lightning';

describe('lightning', () => {
  describe('isBolt11Invoice', () => {
    it('should return true for a valid bolt11 invoice', () => {
      const invoice =
        'lnbc500n1p3zv5vkpp5x0thcaz8wep54clc2xt5895azjdzmthyskzzh9yslggy74qtvl6sdpdg3hkuct5d9hkugrxdaezqjn0dphk2fmnypkk2mtsdahkccqzpgxqyz5vqsp5v80q4vq4pwakq2l0hcqgtelgajsymv4ud4jdcrqtnzhvet55qlus9qyyssquqh2wl2m866qs5n72c5vg6wmqx9vzwhs5ypualq4mcu76h2tdkcq3jtjwtggfff7xwtdqxlnwqk8cxpzryjghrmmq3syraswp9vjr7cqry9l96';

      isBolt11Invoice(invoice).should.equal(true);
    });

    it('should return false for non-string values', () => {
      isBolt11Invoice(undefined).should.equal(false);
      isBolt11Invoice(null as any).should.equal(false);
      isBolt11Invoice(123 as any).should.equal(false);
      isBolt11Invoice({} as any).should.equal(false);
    });

    it('should return false for invalid invoice strings', () => {
      isBolt11Invoice('').should.equal(false);
      isBolt11Invoice('not-an-invoice').should.equal(false);
    });
  });
});
