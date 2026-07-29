import * as assert from 'assert';
import * as https from 'https';
import { EventEmitter } from 'events';
import 'should';
import { loadKeycardImage } from '../../src/upgradeWalletEncryption';

function makeIncomingMessage(statusCode: number, contentType?: string) {
  const emitter = new EventEmitter() as NodeJS.ReadableStream & { statusCode: number; headers: Record<string, string> };
  emitter.statusCode = statusCode;
  emitter.headers = contentType ? { 'content-type': contentType } : {};
  return emitter;
}

describe('loadKeycardImage', function () {
  it('returns an image object on a 200 response', async function () {
    const imageData = Buffer.from('PNG_DATA');

    const mockGet = (
      _url: string,
      callback: (res: NodeJS.ReadableStream & { statusCode: number; headers: Record<string, string> }) => void
    ) => {
      const res = makeIncomingMessage(200, 'image/png');
      callback(res);
      setImmediate(() => {
        res.emit('data', imageData);
        res.emit('end');
      });
      return new EventEmitter() as ReturnType<typeof https.get>;
    };

    const result = await loadKeycardImage('https://example.com/logo.png', mockGet as typeof https.get);
    assert.ok(result, 'should return an image object');
    assert.ok((result as unknown as { src: string }).src.startsWith('data:image/png;base64,'));
    assert.strictEqual((result as unknown as { width: number }).width, 303);
    assert.strictEqual((result as unknown as { height: number }).height, 40);
  });

  it('defaults content-type to image/png when the header is absent', async function () {
    const mockGet = (
      _url: string,
      callback: (res: NodeJS.ReadableStream & { statusCode: number; headers: Record<string, string> }) => void
    ) => {
      const res = makeIncomingMessage(200);
      callback(res);
      setImmediate(() => {
        res.emit('data', Buffer.from('data'));
        res.emit('end');
      });
      return new EventEmitter() as ReturnType<typeof https.get>;
    };

    const result = await loadKeycardImage('https://example.com/logo.png', mockGet as typeof https.get);
    assert.ok((result as unknown as { src: string }).src.startsWith('data:image/png;base64,'));
  });

  it('returns undefined on a non-200 HTTP status', async function () {
    const mockGet = (
      _url: string,
      callback: (res: NodeJS.ReadableStream & { statusCode: number; headers: Record<string, string> }) => void
    ) => {
      const res = makeIncomingMessage(404);
      callback(res);
      return new EventEmitter() as ReturnType<typeof https.get>;
    };

    const result = await loadKeycardImage('https://example.com/logo.png', mockGet as typeof https.get);
    assert.strictEqual(result, undefined);
  });

  it('returns undefined on a stream error', async function () {
    const mockGet = (
      _url: string,
      callback: (res: NodeJS.ReadableStream & { statusCode: number; headers: Record<string, string> }) => void
    ) => {
      const res = makeIncomingMessage(200);
      callback(res);
      setImmediate(() => res.emit('error', new Error('stream broke')));
      return new EventEmitter() as ReturnType<typeof https.get>;
    };

    const result = await loadKeycardImage('https://example.com/logo.png', mockGet as typeof https.get);
    assert.strictEqual(result, undefined);
  });

  it('returns undefined on a request-level error', async function () {
    const mockGet = (_url: string, _callback: unknown) => {
      const req = new EventEmitter();
      setImmediate(() => req.emit('error', new Error('ECONNREFUSED')));
      return req as ReturnType<typeof https.get>;
    };

    const result = await loadKeycardImage('https://example.com/logo.png', mockGet as typeof https.get);
    assert.strictEqual(result, undefined);
  });
});
