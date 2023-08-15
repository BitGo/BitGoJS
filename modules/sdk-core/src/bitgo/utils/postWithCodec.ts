import * as t from 'io-ts';
import { BitGoBase } from '../bitgoBase';
import { BitGoRequest } from '../../api';
import { SuperAgent, SuperAgentRequest } from 'superagent';
import { isLeft } from 'fp-ts/Either';

/**
 * @param body
 * @param encodedBody
 * @returns a list of unknown properties that are present in the body but not the codec.
 */
function getUnknownProperties(body: Record<string, unknown>, encodedBody: Record<string, unknown>): string[] {
  const unknownProperties: string[] = [];
  if (body && encodedBody) {
    const bodyKeys = Object.keys(body);
    const encodedBodyKeys = Object.keys(encodedBody);
    const unknownKeys = bodyKeys.filter((key) => !encodedBodyKeys.includes(key));
    unknownProperties.push(...unknownKeys);
  }
  return unknownProperties;
}

function getDecodeErrorKeys<A extends Record<string, unknown>, O extends Record<string, unknown>>(
  codec: t.Type<A, O>,
  body: A
): string[] {
  function toKeyPath(context: t.Context): string {
    return context.flatMap((c) => (c.key ? [c.key] : [])).join('.');
  }
  const errors = codec.decode(body);
  if (isLeft(errors)) {
    return errors.left.map((error) => toKeyPath(error.context));
  }
  return [];
}

/**
 * Try to encode the body with the codec and send the request.
 * If the codec fails to encode the body, send the request with the body as is and set the 'codec-error' header to true.
 * Set the 'io-ts-unknown-properties' header to the list of unknown properties that are present in the body but not the codec.
 * @param bitgo
 * @param url
 * @param codec
 * @param body
 * @param [useEncodedBody=true] - when false, send the original body. Useful when writing new codecs.
 */
export function postWithCodec<
  TAgent extends BitGoBase | SuperAgent<any>,
  A extends Record<string, unknown>,
  O extends Record<string, unknown>
>(
  agent: TAgent,
  url: string,
  codec: t.Type<A, O>,
  body: A,
  {
    useEncodedBody = true,
  }: {
    useEncodedBody?: boolean;
  } = {}
): TAgent extends BitGoBase ? BitGoRequest : SuperAgentRequest {
  let encodedBody: O | undefined;
  let codecError;
  try {
    encodedBody = codec.encode(body);
    codecError = false;
  } catch (e) {
    console.error('error encoding request body for url', url, e);
    codecError = true;
  }
  return agent
    .post(url)
    .set('io-ts-codec-encode-error', codecError ? 'true' : 'false')
    .set('io-ts-codec-decode-error', getDecodeErrorKeys(codec, body).join(','))
    .set('io-ts-unknown-properties', encodedBody ? getUnknownProperties(body, encodedBody).join(',') : 'NA')
    .send(useEncodedBody && encodedBody ? encodedBody : body);
}
