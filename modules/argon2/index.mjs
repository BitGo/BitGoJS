// CJS/ESM interop: import the UMD bundle as a default and re-export named functions
import argon2 from './argon2.umd.min.js';
export const { argon2d, argon2i, argon2id, argon2Verify } = argon2;
