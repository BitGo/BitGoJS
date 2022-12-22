import { BitGo } from 'bitgo';
import { Config } from './config';

declare module 'express-serve-static-core' {
  export interface Request {
    bitgo: BitGo;
    config: Config;
  }
}
