/**
 * Runs async jobs with at most `concurrency` in flight. Jobs beyond that wait in a FIFO
 * list of at most `maxWaiting` entries; further calls reject immediately.
 */
export class AsyncWorkQueue {
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private concurrency: number, private readonly maxWaiting: number) {}

  async run<T>(job: () => Promise<T>): Promise<T> {
    // Fast path: a slot is free. drain() always fills free slots from the waiter list first,
    // so a free slot implies no waiter is queued behind it.
    if (this.active < this.concurrency) {
      this.active++;
    } else {
      if (this.waiters.length >= this.maxWaiting) {
        throw Object.assign(new Error('Async work queue is full'), { name: 'AsyncWorkQueueFullError' });
      }
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }

    try {
      return await job();
    } finally {
      this.active--;
      this.drain();
    }
  }

  setConcurrency(value: number): void {
    if (value === this.concurrency) {
      return;
    }
    this.concurrency = value;
    this.drain();
  }

  private drain(): void {
    while (this.active < this.concurrency) {
      const next = this.waiters.shift();
      if (!next) {
        return;
      }
      // The resumed job takes its slot here, so a new arrival cannot overtake it.
      this.active++;
      next();
    }
  }
}
