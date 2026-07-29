import assert from 'assert';
import { tryPromise } from '../../src';

/**
 * These tests are based on the Bluebird try.js tests:
 * https://github.com/petkaantonov/bluebird/blob/master/test/mocha/try.js
 *
 * They have been adapted to TypeScript and modified to assert tryPromise
 * perserves the same behavior as Bluebird.try.
 */

const error = new Error();
const thrower = function (): never {
  throw error;
};

describe('tryPromise', function () {
  it('should reject when the function throws', function () {
    let async = false;
    const ret = tryPromise(thrower).then(
      () => assert.fail('Should not fulfill'),
      (e: Error) => {
        assert(async);
        assert(e === error);
      }
    );
    async = true;
    return ret;
  });

  it('should reject when the function is not a function', function () {
    let async = false;
    const ret = tryPromise(null as any).then(
      () => assert.fail('Should not fulfill'),
      (e: Error) => {
        assert(async);
        assert(e instanceof TypeError);
      }
    );
    async = true;
    return ret;
  });

  it('should unwrap returned promise', function () {
    let resolve: (value: number) => void;
    const promise = new Promise<number>((r) => {
      resolve = r;
    });

    const ret = tryPromise(() => {
      return promise;
    }).then((v) => {
      assert.strictEqual(v, 3);
    });

    setTimeout(() => {
      resolve!(3);
    }, 1);

    return ret;
  });

  it('should unwrap returned thenable', function () {
    return tryPromise(() => {
      return {
        then: function (f: (value: number) => void) {
          f(3);
        },
      } as Promise<number>;
    }).then((v) => {
      assert.strictEqual(v, 3);
    });
  });
});
