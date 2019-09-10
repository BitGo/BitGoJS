declare module 'express-serve-static-core' {
  export interface Request {
    isProxy: boolean;
  }
}
