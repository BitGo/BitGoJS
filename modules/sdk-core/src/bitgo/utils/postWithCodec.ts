import * as t from 'io-ts';
import { BitGoBase } from '../bitgoBase';
import { BitGoRequest } from '../../api';
import { SuperAgent, SuperAgentRequest } from 'superagent';

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
  O extends Record<string, unknown>,
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
  try {
    encodedBody = codec.encode(body);
  } catch (e) {
    console.error('error encoding request body for url', url, e);
  }
  const postRequest = agent.post(url);

  return postRequest.send(useEncodedBody && encodedBody ? encodedBody : body);
}
