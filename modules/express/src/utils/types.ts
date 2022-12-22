import * as express from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';

type RequestHandlerResponse = string | unknown | undefined;

export interface RequestHandler extends express.RequestHandler<ParamsDictionary, any, RequestHandlerResponse> {
  (req: express.Request, res: express.Response, next: express.NextFunction):
    | RequestHandlerResponse
    | Promise<RequestHandlerResponse>;
}
