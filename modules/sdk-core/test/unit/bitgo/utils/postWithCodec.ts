import assert from 'assert';
import * as t from 'io-ts';
import { agent, SuperAgentRequest } from 'superagent';

import { postWithCodec } from '../../../../src/bitgo/utils/postWithCodec';

describe('postWithCodec', function () {
  type Headers = Record<string, unknown>;
  function getRequest<A extends Record<string, unknown>, O extends Record<string, unknown>>(
    codec: t.Type<A, O>,
    body: A,
    { useEncodedBody = true } = {}
  ): {
    body: unknown;
    headers: Headers;
  } {
    const request = postWithCodec(agent(), 'http://example.com', codec, body, {
      useEncodedBody,
    }) as SuperAgentRequest & {
      /*
      Some private properties. A bit ugly, but the alternative is to make an actual request against
      a nock, and tease out the headers from there. Not pretty either.
      */
      _data: unknown;
      header: Headers;
    };
    return {
      headers: request.header,
      body: request._data,
    };
  }

  function assertRequestContains(
    request: {
      body: unknown;
      headers: Headers;
    },
    body: unknown,
    headers: Headers
  ) {
    assert.deepStrictEqual(request.body, body);
    for (const [key, value] of Object.entries(headers)) {
      assert.deepStrictEqual(request.headers[key], value, `header ${key} does not match`);
    }
  }

  const codec = t.exact(t.intersection([t.type({ foo: t.string }), t.partial({ bar: t.unknown })]));

  it('has expected values with value matching codec', function () {
    assertRequestContains(
      getRequest(codec, { foo: 'bar' }),
      { foo: 'bar' },
      {
        'io-ts-codec-encode-error': 'false',
        'io-ts-codec-decode-error': '',
        'io-ts-unknown-properties': '',
      }
    );

    assertRequestContains(
      getRequest(codec, { foo: 'bar', bar: null }),
      { foo: 'bar', bar: null },
      {
        'io-ts-codec-encode-error': 'false',
        'io-ts-codec-decode-error': '',
        'io-ts-unknown-properties': '',
      }
    );
  });

  it('has expected values with value not matching codec', function () {
    // invalid value
    assertRequestContains(
      getRequest(codec, { foo: null } as any),
      { foo: null },
      {
        'io-ts-codec-encode-error': 'false',
        'io-ts-codec-decode-error': '0.foo',
        'io-ts-unknown-properties': '',
      }
    );

    // non-exact value
    assertRequestContains(
      getRequest(codec, { foo: 'bar', boo: 1 } as any),
      { foo: 'bar' },
      {
        'io-ts-codec-encode-error': 'false',
        'io-ts-codec-decode-error': '',
        'io-ts-unknown-properties': 'boo',
      }
    );

    // non-exact value, useEncodedBody=false
    assertRequestContains(
      getRequest(codec, { foo: 'bar', boo: 1 } as any, { useEncodedBody: false }),
      { foo: 'bar', boo: 1 },
      {
        'io-ts-codec-encode-error': 'false',
        'io-ts-codec-decode-error': '',
        'io-ts-unknown-properties': 'boo',
      }
    );
  });
});
