import { BitGo } from 'bitgo';
import { Config } from '../../src/config';

declare module 'express-serve-static-core' {
  export interface Request {
    isProxy: boolean;
    bitgo: BitGo;
    config: Config;
  }
}
