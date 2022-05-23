import * as _ from 'lodash';
import { randomBytes } from 'crypto';
import { IRequestTracer } from '../../api';

/**
 * Create a request tracer for tracing workflows which involve multiple round trips to the server
 */
export class RequestTracer implements IRequestTracer {
  private _seq = 0;
  private readonly _seed: Buffer;
  constructor() {
    this._seed = randomBytes(10);
  }

  inc() {
    this._seq++;
  }

  toString() {
    return `${this._seed.toString('hex')}-${_.padStart(this._seq.toString(16), 4, '0')}`;
  }
}
