import * as superagent from 'superagent';

export interface BitGoRequest<ResultType = any> extends superagent.SuperAgentRequest {
  result: (optionalField?: string) => Promise<ResultType>;
}
