import * as assert from 'assert';
import { createHash } from 'crypto';
import * as http from 'http';
import nock from 'nock';
import * as superagent from 'superagent';
import { serializeRequestData } from '../../src';

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function startCapturingServer(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const rawBody = Buffer.concat(chunks);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ receivedBodySha256: sha256Hex(rawBody), receivedBytes: rawBody.length }));
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

describe('serializeRequestData integration (byte-level HMAC fidelity)', function () {
  // These tests make real HTTP requests to a local server, so allow loopback
  // connections (the rest of the suite disables net connect globally via nock).
  before(function () {
    nock.enableNetConnect('127.0.0.1');
  });
  after(function () {
    nock.disableNetConnect();
  });

  it('signs the exact multipart bytes for .field() + .attach() uploads (binary-safe)', async function () {
    const server = await startCapturingServer();
    const { port } = server.address() as { port: number };
    const baseUrl = `http://127.0.0.1:${port}`;

    // Real binary content: JPEG SOI + JFIF marker plus invalid UTF-8 bytes
    // (0x80, 0xff, 0xfe, 0xfd). toString('utf8') would corrupt these, so the
    // returned Buffer must match the bytes actually transmitted on the wire.
    const fakeImageBytes = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x80, 0xff, 0xfe, 0xfd,
    ]);

    try {
      const req = superagent
        .post(`${baseUrl}/document-upload`)
        .field('selectedIdClass', 'dl')
        .attach('frontPhoto', fakeImageBytes, { filename: 'id_front.jpg', contentType: 'image/jpeg' });

      // serializeRequestData runs after .field()/.attach() and before the request
      // is submitted (see requestPatch), so reading _formData here mirrors production.
      const signedSubject = serializeRequestData(req);

      const res = await req;
      const receivedSha256 = res.body.receivedBodySha256 as string;

      assert.ok(Buffer.isBuffer(signedSubject), 'expected serializeRequestData to return a Buffer for multipart');
      assert.strictEqual(sha256Hex(signedSubject as Buffer), receivedSha256);
    } finally {
      server.close();
    }
  });

  it('still round-trips JSON bodies sent via .send() (no regression)', async function () {
    const server = await startCapturingServer();
    const { port } = server.address() as { port: number };
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const req = superagent.post(`${baseUrl}/normal-call`).send({ foo: 'bar' });
      const signedSubject = serializeRequestData(req);

      const res = await req;
      const receivedSha256 = res.body.receivedBodySha256 as string;

      assert.strictEqual(typeof signedSubject, 'string');
      assert.strictEqual(sha256Hex(signedSubject as string), receivedSha256);
    } finally {
      server.close();
    }
  });
});
