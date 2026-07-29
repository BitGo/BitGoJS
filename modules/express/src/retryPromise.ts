/**
 * Thrown in `retryPromise()`
 *
 * @prettier
 */

export class ErrorMaxRetriesExceededError extends Error {
  constructor(maxTries: number) {
    super(`giving up after reaching max retry limit of ${maxTries}`);
  }
}

/**
 * Retries a promise (like a request) if it returns with 'ECONNREFUSED'. Retries are delayed with an exponential backoff.
 * @param {Function} func - Promise to execute. When it throws an error, it is called and passed to onError
 * @param {Function} onError - Error handler. Called with error as argument.
 *                             If an error should not be retried, the handler should re-throw the passed error.
 * @param params
 * @param {Number}   params.retryLimit - the maximum number of retries to attempt before giving up.
 */
export async function retryPromise<T>(
  func: () => Promise<T>,
  onError: (err: Error, tryCount: number) => void = () => ({}),
  params: { retryLimit: number } = { retryLimit: 3 }
): Promise<T> {
  let tryCount = 0;

  while (tryCount < params.retryLimit) {
    tryCount += 1;
    try {
      return await func();
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        onError(err, tryCount);
      } else {
        throw new Error(err);
      }
    }

    // if we are going to make another attempt, delay first with exponential backoff
    if (tryCount < params.retryLimit) {
      const secondsToWait = 2 ** (tryCount - 1) + Math.random();
      await new Promise((res) => setTimeout(res, Math.round(secondsToWait * 1000)));
    }
  }

  throw new ErrorMaxRetriesExceededError(params.retryLimit);
}
