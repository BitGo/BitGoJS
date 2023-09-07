import 'should';

import { TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';

import { Ltc, Tltc } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Litecoin:', function () {
  const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  bitgo.initializeTestVars();
  bitgo.safeRegister('ltc', Ltc.createInstance);
  bitgo.safeRegister('tltc', Tltc.createInstance);

  const ltc = bitgo.coin('ltc') as Ltc;
  const tltc = bitgo.coin('tltc') as Tltc;

  describe('should validate addresses', () => {
    it('should validate base58 addresses', () => {
      // known valid main and testnet base58 address are valid
      ltc.isValidAddress('MH6J1PzpsAfapZek7QGHv2mheUxnP8Kdek').should.be.true();
      tltc.isValidAddress('QWC1miKKHFikbwg2iyt8KZBGsTSEBKr21i').should.be.true();
      // malformed base58 addresses are invalid
      ltc.isValidAddress('MH6J1PzpsAfapZek7QGHv2mheUxnP8Kder').should.be.false();
      tltc.isValidAddress('QWC1miKKHFikbwg2iyt8KZBGsTSEBKr21l').should.be.false();
    });
    it('should validate bech32 addresses', () => {
      // all lower case is valid
      ltc.isValidAddress('ltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3wspfryg7').should.be.true();
      tltc.isValidAddress('tltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3ws2x86ht').should.be.true();
      // all upper case is valid
      ltc.isValidAddress('LTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WSPFRYG7').should.be.false();
      tltc.isValidAddress('TLTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WS2X86HT').should.be.false();
      // mixed case is invalid
      ltc.isValidAddress('LTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WSPFRYg7').should.be.false();
      tltc.isValidAddress('TLTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WS2X86Ht').should.be.false();
      // malformed addresses are invalid
      ltc.isValidAddress('ltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3wspfryg9').should.be.false();
      tltc.isValidAddress('tltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3ws2x86hl').should.be.false();
    });
  });
});
