/**
 * Smoke test: ensures index.d.ts matches the actual JS exports.
 * This file is compiled by tsconfig but never executed.
 */
import { argon2id, argon2i, argon2d, argon2Verify } from '..';

// Verify function signatures exist and return Promises
const _hexPromise: Promise<string> = argon2id({
  password: 'test',
  salt: 'saltsalt',
  iterations: 1,
  parallelism: 1,
  memorySize: 256,
  hashLength: 32,
});

const _binPromise: Promise<Uint8Array> = argon2id({
  password: 'test',
  salt: 'saltsalt',
  iterations: 1,
  parallelism: 1,
  memorySize: 256,
  hashLength: 32,
  outputType: 'binary',
});

const _i: Promise<string> = argon2i({
  password: 'test',
  salt: 'saltsalt',
  iterations: 1,
  parallelism: 1,
  memorySize: 256,
  hashLength: 32,
});

const _d: Promise<string> = argon2d({
  password: 'test',
  salt: 'saltsalt',
  iterations: 1,
  parallelism: 1,
  memorySize: 256,
  hashLength: 32,
});

const _verify: Promise<boolean> = argon2Verify({
  password: 'test',
  hash: '$argon2id$v=19$m=256,t=1,p=1$...',
});
