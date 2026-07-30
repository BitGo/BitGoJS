/**
 * @prettier
 */
import * as assert from 'assert';
import { retryPromise } from '../../src/retryPromise';

describe('retryPromise', function () {
  it('rethrows the original non-ECONNREFUSED error without wrapping', async function () {
    const original = Object.assign(new Error('Internal Server Error'), { status: 500 });
    await assert.rejects(
      () =>
        retryPromise(
          async () => {
            throw original;
          },
          () => undefined,
          { retryLimit: 1 }
        ),
      (err: Error) => err === original
    );
  });
});
