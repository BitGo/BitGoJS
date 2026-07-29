import { DOMAIN_PATTERN } from '../../src/constants';

describe('DOMAIN_PATTERN', () => {
  it('should match valid domains', () => {
    DOMAIN_PATTERN.test('example.com').should.be.true();
    DOMAIN_PATTERN.test('subdomain.example.com').should.be.true();
    DOMAIN_PATTERN.test('sub-domain.example.com').should.be.true();
    DOMAIN_PATTERN.test('example.co.uk').should.be.true();
  });

  it('should not match invalid domains', () => {
    DOMAIN_PATTERN.test('example').should.be.false();
    DOMAIN_PATTERN.test('example.').should.be.false();
    DOMAIN_PATTERN.test('.example.com').should.be.false();
    DOMAIN_PATTERN.test('sub_domain.example.com').should.be.false();
    DOMAIN_PATTERN.test('example.c').should.be.false();
    DOMAIN_PATTERN.test('example.com-').should.be.false();
    DOMAIN_PATTERN.test('-example.com').should.be.false();
  });
});
