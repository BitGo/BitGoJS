import { BitGo } from 'bitgo';
import { Config } from '../../src/config';

declare module 'express-serve-static-core' {
  export interface Request {
    isProxy: boolean;
    bitgo: BitGo;
    config: Config;
    /**
     * Raw body buffer captured before JSON parsing.
     * Used for v4 HMAC authentication to ensure the exact bytes
     * sent by the client are used for signature calculation.
     */
    rawBodyBuffer?: Buffer;
  }
}
