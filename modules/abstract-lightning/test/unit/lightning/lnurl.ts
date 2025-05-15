import * as sinon from 'sinon';
import should from 'should';
import nock from 'nock';
import * as crypto from 'crypto';

import * as lnurlProcessor from '../../../src/lightning/lnurl';
import { ParsedLightningInvoice } from '../../../src/codecs/api/lnurl';

describe('LNURL Functions', () => {
  afterEach(() => {
    sinon.restore();
    nock.cleanAll();
  });

  describe('encodeLnurl and decodeLnurl', () => {
    it('should encode a URL into an LNURL', () => {
      const url = 'https://service.com/api?q=3fc3645b439ce8e7';
      const encoded = lnurlProcessor.encodeLnurl(url);
      should(encoded).startWith('lnurl');
      should(lnurlProcessor.decodeLnurl(encoded)).equal(url);
    });

    it('should decode an LNURL with lightning prefix', () => {
      const url = 'https://service.com/api?q=3fc3645b439ce8e7';
      const encoded = lnurlProcessor.encodeLnurl(url);
      const withPrefix = `lightning:${encoded}`;
      should(lnurlProcessor.decodeLnurl(withPrefix)).equal(url);
    });

    it('should throw an error for invalid LNURL', () => {
      should(() => lnurlProcessor.decodeLnurl('notanlnurl')).throw('invalid lnurl');
      should(() => lnurlProcessor.decodeLnurl('bitcoin:address')).throw('invalid lnurl');
    });
  });

  describe('isValidLnurl', () => {
    it('should validate correct LNURLs', () => {
      const url = 'https://service.com/api?q=3fc3645b439ce8e7';
      const encoded = lnurlProcessor.encodeLnurl(url);
      should(lnurlProcessor.isValidLnurl(encoded)).be.true();
      should(lnurlProcessor.isValidLnurl(`lightning:${encoded}`)).be.true();
    });

    it('should invalidate incorrect LNURLs', () => {
      should(lnurlProcessor.isValidLnurl('notanlnurl')).be.false();
      should(lnurlProcessor.isValidLnurl('bitcoin:address')).be.false();
      should(lnurlProcessor.isValidLnurl(123 as any)).be.false();
    });
  });

  describe('parsePayMetadata', () => {
    it('should parse valid metadata with text description', () => {
      const metadata = JSON.stringify([
        ['text/plain', 'Pay to test service'],
        ['image/png;base64', 'iVBORw0KGgoA...'],
      ]);
      const result = lnurlProcessor.parsePayMetadata(metadata);
      should(result).have.property('description', 'Pay to test service');
    });

    it('should handle metadata without text', () => {
      const metadata = JSON.stringify([['image/png;base64', 'iVBORw0KGgoA...']]);
      const result = lnurlProcessor.parsePayMetadata(metadata);
      should(result).have.property('description', undefined);
    });

    it('should throw error for invalid metadata format', () => {
      should(() => lnurlProcessor.parsePayMetadata('not-json')).throw();
      should(() => lnurlProcessor.parsePayMetadata(JSON.stringify({ key: 'value' }))).throw('Metadata is not an array');
    });
  });

  describe('parseLightningInvoice', () => {
    it('should parse a valid lightning invoice', () => {
      // Mock bolt11.decode to avoid external dependencies
      const bolt11 = require('bolt11');
      const originalDecode = bolt11.decode;
      bolt11.decode = sinon.stub().returns({
        network: 'bitcoin',
        millisatoshis: '10000',
        payeeNodeKey: 'node123abcdef',
        tags: [
          { tagName: 'payment_hash', data: 'payhash123' },
          { tagName: 'purpose_commit_hash', data: 'description_hash456' },
        ],
      });

      try {
        const invoice = 'lnbc100n1pj9xpndpp5...';
        const result = lnurlProcessor.parseLightningInvoice(invoice);

        should(result).have.property('millisatoshis', BigInt(10000));
        should(result).have.property('paymentHash', 'payhash123');
        should(result).have.property('payeeNodeKey', 'node123abcdef');
        should(result).have.property('descriptionHash', 'description_hash456');
      } finally {
        bolt11.decode = originalDecode;
      }
    });

    it('should throw error for invalid invoice', () => {
      should(() => lnurlProcessor.parseLightningInvoice(123 as any)).throw('invoice is malformed');
    });

    it('should throw error for missing payment hash', () => {
      const bolt11 = require('bolt11');
      const originalDecode = bolt11.decode;
      bolt11.decode = sinon.stub().returns({
        network: 'bitcoin',
        millisatoshis: '10000',
        payeeNodeKey: 'node123abcdef',
        tags: [], // No payment hash tag
      });

      try {
        const invoice = 'lnbc100n1pj9xpndpp5...';
        should(() => lnurlProcessor.parseLightningInvoice(invoice)).throw('invoice payment hash is invalid');
      } finally {
        bolt11.decode = originalDecode;
      }
    });
  });

  describe('validateLnurlInvoice', () => {
    it('should validate matching invoice amount and metadata', () => {
      // Create a valid SHA-256 hash of '123'
      const metadataStr = '123';
      const hash = crypto.createHash('sha256').update(metadataStr).digest('hex');

      const invoice: ParsedLightningInvoice = {
        millisatoshis: BigInt(10000),
        paymentHash: 'hash123',
        payeeNodeKey: 'node123',
        descriptionHash: hash,
      };

      should(() => {
        lnurlProcessor.validateLnurlInvoice(invoice, BigInt(10000), metadataStr);
      }).not.throw();
    });

    it('should throw error for amount mismatch', () => {
      const invoice: ParsedLightningInvoice = {
        millisatoshis: BigInt(10000),
        paymentHash: 'hash123',
        payeeNodeKey: 'node123',
        descriptionHash: 'hash456',
      };

      should(() => {
        lnurlProcessor.validateLnurlInvoice(invoice, BigInt(20000), 'metadata');
      }).throw('amount of invoice does not match with given amount');
    });

    it('should throw error for description hash mismatch', () => {
      const invoice: ParsedLightningInvoice = {
        millisatoshis: BigInt(10000),
        paymentHash: 'hash123',
        payeeNodeKey: 'node123',
        descriptionHash: 'wrong-hash',
      };

      should(() => {
        lnurlProcessor.validateLnurlInvoice(invoice, BigInt(10000), 'metadata');
      }).throw('invoice h tag does not match with hash of metadata');
    });
  });

  describe('decodeLnurlPay', () => {
    it('should decode and fetch LNURL-pay data', async () => {
      // Create a valid LNURL
      const url = 'https://service.com/api?q=3fc3645b439ce8e7';
      const validLnurl = lnurlProcessor.encodeLnurl(url);

      // Mock validation
      sinon.stub(lnurlProcessor, 'isValidLnurl').returns(true);

      // Mock the decodeLnurl function
      sinon.stub(lnurlProcessor, 'decodeLnurl').returns(url);

      // Mock API response
      nock('https://service.com')
        .get('/api')
        .query({ q: '3fc3645b439ce8e7' })
        .reply(200, {
          tag: 'payRequest',
          callback: 'https://service.com/api/pay',
          maxSendable: '100000000',
          minSendable: '1000',
          metadata: JSON.stringify([['text/plain', 'Test payment']]),
        });

      const result = await lnurlProcessor.decodeLnurlPay(validLnurl);

      should(result).have.property('tag', 'payRequest');
      should(result).have.property('callback', 'https://service.com/api/pay');
      should(result).have.property('maxSendable', BigInt('100000000'));
      should(result).have.property('minSendable', BigInt('1000'));
      should(result).have.property('domain', 'service.com');
    });

    it('should handle error responses from LNURL server', async () => {
      // Create a valid LNURL
      const url = 'https://service.com/api?q=3fc3645b439ce8e7';
      const validLnurl = lnurlProcessor.encodeLnurl(url);

      // Mock validation and decoding
      sinon.stub(lnurlProcessor, 'isValidLnurl').returns(true);
      sinon.stub(lnurlProcessor, 'decodeLnurl').returns(url);

      // Mock API error response
      nock('https://service.com')
        .get('/api')
        .query({ q: '3fc3645b439ce8e7' })
        .reply(200, { status: 'ERROR', reason: 'Invalid request' });

      await should(lnurlProcessor.decodeLnurlPay(validLnurl)).be.rejectedWith('Invalid request');
    });

    it('should throw for invalid LNURL format', async () => {
      sinon.stub(lnurlProcessor, 'isValidLnurl').returns(false);
      await should(lnurlProcessor.decodeLnurlPay('notanlnurl')).be.rejectedWith('Invalid LNURL format');
    });
  });

  describe('fetchLnurlPayInvoice', () => {
    beforeEach(() => {
      sinon.restore();
      nock.cleanAll();
    });

    it('should fetch invoice from callback URL with amount', async () => {
      // 1. Mock the API response first
      nock('https://service.com').get('/api/pay').query({ amount: '10000' }).reply(200, {
        pr: 'lnbc100n1pj9xpndpp5...',
      });

      // 2. Calculate actual hash from metadata for validation to pass
      const metadata = JSON.stringify([['text/plain', 'Test payment']]);
      const metadataHash = crypto.createHash('sha256').update(metadata).digest('hex');

      // 3. Stub bolt11.decode BEFORE calling any functions
      const bolt11 = require('bolt11');
      const origDecode = bolt11.decode;
      bolt11.decode = sinon.stub().returns({
        network: 'bitcoin',
        millisatoshis: '10000',
        payeeNodeKey: 'node123',
        tags: [
          { tagName: 'payment_hash', data: 'hash123' },
          { tagName: 'purpose_commit_hash', data: metadataHash }, // Use actual hash that matches the metadata
        ],
      });

      const params = {
        callback: 'https://service.com/api/pay',
        millisatAmount: BigInt(10000),
        metadata,
      };

      try {
        const result = await lnurlProcessor.fetchLnurlPayInvoice(params);
        should(result).have.property('pr', 'lnbc100n1pj9xpndpp5...');
      } finally {
        bolt11.decode = origDecode;
      }
    });

    it('should include comment if provided', async () => {
      // Same pattern: mock API, stub bolt11.decode properly
      nock('https://service.com').get('/api/pay').query({ amount: '10000', comment: 'My payment comment' }).reply(200, {
        pr: 'lnbc100n1pj9xpndpp5...',
      });

      const metadata = JSON.stringify([['text/plain', 'Test payment']]);
      const metadataHash = crypto.createHash('sha256').update(metadata).digest('hex');

      // Stub bolt11.decode first
      const bolt11 = require('bolt11');
      const origDecode = bolt11.decode;
      bolt11.decode = sinon.stub().returns({
        network: 'bitcoin',
        millisatoshis: '10000',
        payeeNodeKey: 'node123',
        tags: [
          { tagName: 'payment_hash', data: 'hash123' },
          { tagName: 'purpose_commit_hash', data: metadataHash },
        ],
      });

      const params = {
        callback: 'https://service.com/api/pay',
        millisatAmount: BigInt(10000),
        metadata,
        comment: 'My payment comment',
      };

      try {
        const result = await lnurlProcessor.fetchLnurlPayInvoice(params);
        should(result).have.property('pr', 'lnbc100n1pj9xpndpp5...');
      } finally {
        bolt11.decode = origDecode;
      }
    });

    it('should handle URL with existing query parameters', async () => {
      nock('https://service.com').get('/api/pay').query({ token: 'xyz', amount: '10000' }).reply(200, {
        pr: 'lnbc100n1pj9xpndpp5...',
      });

      const metadata = JSON.stringify([['text/plain', 'Test payment']]);
      const metadataHash = crypto.createHash('sha256').update(metadata).digest('hex');

      const bolt11 = require('bolt11');
      const origDecode = bolt11.decode;
      bolt11.decode = sinon.stub().returns({
        network: 'bitcoin',
        millisatoshis: '10000',
        payeeNodeKey: 'node123',
        tags: [
          { tagName: 'payment_hash', data: 'hash123' },
          { tagName: 'purpose_commit_hash', data: metadataHash },
        ],
      });

      const params = {
        callback: 'https://service.com/api/pay?token=xyz',
        millisatAmount: BigInt(10000),
        metadata,
      };

      try {
        const result = await lnurlProcessor.fetchLnurlPayInvoice(params);
        should(result).have.property('pr', 'lnbc100n1pj9xpndpp5...');
      } finally {
        bolt11.decode = origDecode;
      }
    });
  });

  describe('processLnurlPayment', () => {
    beforeEach(() => {
      sinon.restore();
      nock.cleanAll();
    });

    it('should process a complete LNURL payment flow', async () => {
      const initialUrl = 'https://service.com/api?q=3fc3645b439ce8e7';
      const lnurl = lnurlProcessor.encodeLnurl(initialUrl);

      const metadata = JSON.stringify([['text/plain', 'Test payment']]);
      nock('https://service.com').get('/api').query({ q: '3fc3645b439ce8e7' }).reply(200, {
        tag: 'payRequest',
        callback: 'https://service.com/api/pay',
        maxSendable: '100000000',
        minSendable: '1000',
        metadata: metadata,
      });

      const metadataHash = crypto.createHash('sha256').update(metadata).digest('hex');
      nock('https://service.com')
        .get('/api/pay')
        .query((queryObj) => queryObj.amount === '10000')
        .reply(200, {
          pr: 'lnbc100n1pj9xpndpp5...',
          successAction: { tag: 'message', message: 'Thank you for your payment!' },
        });

      // 4. Stub bolt11.decode to return valid invoice data
      const bolt11 = require('bolt11');
      const originalDecode = bolt11.decode;
      bolt11.decode = sinon.stub().returns({
        network: 'bitcoin',
        millisatoshis: '10000',
        payeeNodeKey: 'node123abcdef',
        tags: [
          { tagName: 'payment_hash', data: 'payhash123' },
          { tagName: 'purpose_commit_hash', data: metadataHash },
        ],
      });

      try {
        // 5. Process the LNURL payment with 10 sats
        const result = await lnurlProcessor.processLnurlPayment(lnurl, BigInt(10), undefined);

        // 6. Verify the result
        should(result).have.property('invoice', 'lnbc100n1pj9xpndpp5...');
      } finally {
        bolt11.decode = originalDecode;
      }
    });

    it('should throw error if amount is out of range', async () => {
      // 1. Create a valid LNURL
      const initialUrl = 'https://service.com/api?q=3fc3645b439ce8e7';
      const lnurl = lnurlProcessor.encodeLnurl(initialUrl);

      // 2. Mock the first API call with restricted amount range
      nock('https://service.com')
        .get('/api')
        .query({ q: '3fc3645b439ce8e7' })
        .reply(200, {
          tag: 'payRequest',
          callback: 'https://service.com/api/pay',
          maxSendable: '50000000', // Max 50 sats
          minSendable: '10000000', // Min 10 sats
          metadata: JSON.stringify([['text/plain', 'Test payment']]),
        });

      // 3. Try to pay 5 sats (below minimum)
      await should(lnurlProcessor.processLnurlPayment(lnurl, BigInt(5), undefined)).be.rejectedWith(
        /Amount out of range/
      );

      // 4. Clear previous mocks and set up again for max test
      nock.cleanAll();
      nock('https://service.com')
        .get('/api')
        .query({ q: '3fc3645b439ce8e7' })
        .reply(200, {
          tag: 'payRequest',
          callback: 'https://service.com/api/pay',
          maxSendable: '50000000', // Max 50 sats
          minSendable: '10000000', // Min 10 sats
          metadata: JSON.stringify([['text/plain', 'Test payment']]),
        });

      // 5. Try to pay 100 sats (above maximum)
      await should(lnurlProcessor.processLnurlPayment(lnurl, BigInt(100), undefined)).be.rejectedWith(
        /Amount out of range/
      );
    });

    it('should reject negative or zero amount', async () => {
      const lnurl = lnurlProcessor.encodeLnurl('https://service.com/api?q=3fc3645b439ce8e7');

      should(lnurlProcessor.processLnurlPayment(lnurl, BigInt(0), undefined)).be.rejectedWith(
        'Amount must be a positive integer'
      );

      should(lnurlProcessor.processLnurlPayment(lnurl, BigInt(-5), undefined)).be.rejectedWith(
        'Amount must be a positive integer'
      );
    });
  });
});
