import * as nock from 'nock';
import 'should';
import * as sinon from 'sinon';

import { BitGo } from '../../../src';

describe('Auth', () => {
  describe('Auth V3', () => {
    it('should set auth version to 3 when initializing a bitgo object with explicit auth version 3', () => {
      const bitgo = new BitGo({ authVersion: 3 });
      bitgo.getAuthVersion().should.eql(3);
    });

    it('should pass "3.0" as the bitgo-auth-version header when auth v3 is enabled', async () => {
      const url = 'https://bitgo.invalid';
      const bitgo = new BitGo({ authVersion: 3 });

      const scope = nock(url, {
        reqheaders: {
          'bitgo-auth-version': '3.0',
        },
      })
        .get('/')
        .reply(200);

      await bitgo.get(url).should.eventually.have.property('status', 200);
      scope.done();
    });

    it('should reject responses outside the response validity window', async () => {
      const url = 'https://bitgo.invalid';
      const bitgo = new BitGo({ authVersion: 3, accessToken: `v2x${'0'.repeat(64)}` });

      const verifyResponseStub = sinon.stub(bitgo, 'verifyResponse').returns({
        isValid: true,
        isInResponseValidityWindow: false,
        expectedHmac: '',
        signatureSubject: '',
        verificationTime: 0,
      });

      const scope = nock(url).get('/').reply(200);

      await bitgo
        .get(url)
        .should.be.rejectedWith(
          'server response outside response validity time window, possible man-in-the-middle-attack'
        );
      verifyResponseStub.restore();
      scope.done();
    });

    it('should accept responses within the response validity window', async () => {
      const url = 'https://bitgo.invalid';
      const bitgo = new BitGo({ authVersion: 3, accessToken: `v2x${'0'.repeat(64)}` });

      const verifyResponseStub = sinon.stub(bitgo, 'verifyResponse').returns({
        isValid: true,
        isInResponseValidityWindow: true,
        expectedHmac: '',
        signatureSubject: '',
        verificationTime: 0,
      });

      const scope = nock(url).get('/').reply(200);

      await bitgo.get(url).should.eventually.have.property('status', 200);
      verifyResponseStub.restore();
      scope.done();
    });

    it('should include the auth version in the hmac subject', async () => {
      const url = 'https://bitgo.invalid';
      const accessToken = `v2x${'0'.repeat(64)}`;
      const bitgo = new BitGo({ authVersion: 3, accessToken });

      const calculateHMACSpy = sinon.spy(bitgo, 'calculateHMAC');
      const verifyResponseStub = sinon.stub(bitgo, 'verifyResponse').returns({
        isValid: true,
        isInResponseValidityWindow: true,
        expectedHmac: '',
        signatureSubject: '',
        verificationTime: 0,
      });

      const scope = nock(url).get('/').reply(200);

      await bitgo.get(url).should.eventually.have.property('status', 200);
      calculateHMACSpy.firstCall.calledWith(accessToken, sinon.match('3.0')).should.be.true();
      calculateHMACSpy.restore();
      verifyResponseStub.restore();
      scope.done();
    });
  });

  describe('Auth V2', () => {
    it('should default to auth version 2 when initializing a bitgo object', () => {
      const bitgo = new BitGo();
      bitgo.getAuthVersion().should.eql(2);
    });

    it('should pass "2.0" as the bitgo-auth-version header when auth v2 is enabled', async () => {
      const url = 'https://bitgo.invalid';
      const bitgo = new BitGo();

      const scope = nock(url, {
        reqheaders: {
          'bitgo-auth-version': '2.0',
        },
      })
        .get('/')
        .reply(200);

      await bitgo.get(url).should.eventually.have.property('status', 200);
      scope.done();
    });
  });
});
