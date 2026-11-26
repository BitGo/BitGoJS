import { AsyncWorkQueue } from './asyncWorkQueue';

/** Argon2id hashes allowed to run at once; further hashes wait (up to 500) in FIFO order. */
export const argon2Queue = new AsyncWorkQueue(16, 500);
