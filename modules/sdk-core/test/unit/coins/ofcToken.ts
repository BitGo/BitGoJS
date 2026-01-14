import 'should';

import { OfcToken } from '../../../src/coins/ofcToken';

describe('OfcToken.checkRecipient', () => {
  const token = new OfcToken(
    {} as any,
    {
      coin: 'tofc',
      decimalPlaces: 2,
      name: 'Test OFC Token',
      backingCoin: 'ofc',
      isFiat: false,
      type: 'tofc',
    } as any
  );

  // Valid BOLT11 invoice (taken from BitGoJS fixtures / BOLTs examples)
  const bolt11 =
    'lntb20m1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygshp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfpp3x9et2e20v6pu37c5d9vax37wxq72un989qrsgqdj545axuxtnfemtpwkc45hx9d2ft7x04mt8q7y6t0k2dge9e7h8kpy9p34ytyslj3yu569aalz2xdk8xkd7ltxqld94u8h2esmsmacgpghe9k8';

  it('should allow bolt11 invoices with amount "invoice"', () => {
    (() => token.checkRecipient({ address: bolt11, amount: 'invoice' } as any)).should.not.throw();
  });

  it('should allow bolt11 invoices with non-zero bigint amount', () => {
    (() => token.checkRecipient({ address: bolt11, amount: 1n } as any)).should.not.throw();
  });

  it('should reject bolt11 invoices with non-bigint numeric/string amounts', () => {
    (() => token.checkRecipient({ address: bolt11, amount: '1' } as any)).should.throw();
    (() => token.checkRecipient({ address: bolt11, amount: 1 } as any)).should.throw();
  });

  it('should defer to super.checkRecipient for non-bolt11 addresses', () => {
    // BaseCoin.checkRecipient rejects zero amounts when valuelessTransferAllowed() is false (default for OfcToken).
    (() => token.checkRecipient({ address: 'bg-0123456789abcdef0123456789abcdef', amount: '0' } as any)).should.throw();
    (() =>
      token.checkRecipient({ address: 'bg-0123456789abcdef0123456789abcdef', amount: '1' } as any)).should.not.throw();
  });
});
