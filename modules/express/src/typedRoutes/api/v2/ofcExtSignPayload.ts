import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { OfcSignPayloadBody, OfcSignPayloadResponse } from './ofcSignPayload';

/**
 * Sign an arbitrary payload using an OFC trading account key (External Signing Mode).
 *
 * This endpoint is used when BitGo Express is running in external signing mode,
 * where private keys are stored in an encrypted file on the filesystem rather than
 * being fetched from the BitGo API.
 *
 * The request and response structure is identical to the regular OFC sign payload endpoint,
 * but the implementation reads the encrypted private key from a local file specified by
 * the `signerFileSystemPath` configuration.
 *
 * **External Signing Mode Requirements**:
 * - `signerFileSystemPath` must be configured in Express config
 * - Encrypted private keys must be available in the file system
 * - Wallet passphrase must be provided via request body or environment variable
 *
 * **Flow**:
 * 1. Reads encrypted private key from filesystem
 * 2. Decrypts private key using wallet passphrase
 * 3. Signs the payload with the decrypted key
 * 4. Returns signed payload and hex-encoded signature
 *
 * @operationId express.v2.ofc.extSignPayload
 * @tag express
 */
export const PostOfcExtSignPayload = httpRoute({
  path: '/api/v2/ofc/signPayload',
  method: 'POST',
  request: httpRequest({
    body: OfcSignPayloadBody,
  }),
  response: OfcSignPayloadResponse,
});
