import assert from 'assert';

import { AsyncWorkQueue } from '../../src/asyncWorkQueue';

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Lets pending promise continuations run so start counts are observable. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('AsyncWorkQueue', () => {
  it('runs at most `concurrency` jobs and starts waiters in FIFO order', async () => {
    const queue = new AsyncWorkQueue(2, 10);
    const gates = [0, 1, 2, 3].map(() => deferred());
    const started: number[] = [];
    const runs = gates.map((gate, i) =>
      queue.run(async () => {
        started.push(i);
        await gate.promise;
        return i;
      })
    );

    await flush();
    assert.deepStrictEqual(started, [0, 1]);

    gates[0].resolve();
    await flush();
    assert.deepStrictEqual(started, [0, 1, 2]);

    gates[1].resolve();
    await flush();
    assert.deepStrictEqual(started, [0, 1, 2, 3]);

    gates[2].resolve();
    gates[3].resolve();
    assert.deepStrictEqual(await Promise.all(runs), [0, 1, 2, 3]);
  });

  it('frees the slot when a job rejects or throws synchronously', async () => {
    const queue = new AsyncWorkQueue(1, 10);
    const boom = new Error('boom');

    await assert.rejects(
      queue.run(() => Promise.reject(boom)),
      boom
    );
    await assert.rejects(
      queue.run(() => {
        throw boom;
      }),
      boom
    );
    assert.strictEqual(await queue.run(async () => 'ok'), 'ok');
  });

  it('rejects immediately when the waiting list is full, without starting the job', async () => {
    const queue = new AsyncWorkQueue(1, 1);
    const gate = deferred();
    const running = queue.run(() => gate.promise);
    const waiting = queue.run(async () => 'waiter');

    let overflowStarted = false;
    await assert.rejects(
      queue.run(async () => {
        overflowStarted = true;
      }),
      { name: 'AsyncWorkQueueFullError', message: 'Async work queue is full' }
    );
    assert.strictEqual(overflowStarted, false);

    gate.resolve();
    await running;
    assert.strictEqual(await waiting, 'waiter');
  });

  it('accepts exactly maxWaiting waiters and frees a place when one starts', async () => {
    const queue = new AsyncWorkQueue(1, 500);
    const gate = deferred();
    const running = queue.run(() => gate.promise);
    const waiters = Array.from({ length: 500 }, (_, i) => queue.run(async () => i));

    await assert.rejects(
      queue.run(async () => -1),
      { name: 'AsyncWorkQueueFullError' }
    );

    gate.resolve();
    await running;
    assert.strictEqual(await queue.run(async () => 'replacement'), 'replacement');
    assert.deepStrictEqual(
      await Promise.all(waiters),
      Array.from({ length: 500 }, (_, i) => i)
    );
  });

  it('lowering keeps admitted jobs; raising starts waiters up to the new limit', async () => {
    const queue = new AsyncWorkQueue(2, 10);
    const gates = [0, 1, 2, 3].map(() => deferred());
    const started: number[] = [];
    const runs = gates.map((gate, i) =>
      queue.run(async () => {
        started.push(i);
        await gate.promise;
      })
    );

    await flush();
    assert.deepStrictEqual(started, [0, 1]);

    queue.setConcurrency(1);
    gates[0].resolve();
    await flush();
    assert.deepStrictEqual(started, [0, 1]);

    queue.setConcurrency(3);
    await flush();
    assert.deepStrictEqual(started, [0, 1, 2, 3]);

    gates.forEach((gate) => gate.resolve());
    await Promise.all(runs);
  });
});
