import * as superagent from 'superagent';

export interface BitGoRequest<ResultType = any> extends superagent.SuperAgentRequest {
  result: (optionalField?: string) => Promise<ResultType>;
}

export interface DecryptOptions {
  input: string;
  password?: string;
}

export interface EncryptOptions {
  input: string;
  password?: string;
}

export interface GetSharingKeyOptions {
  email: string;
}

export interface IRequestTracer {
  inc(): void;
  toString(): string;
}
