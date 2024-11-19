import axios, { AxiosError } from 'axios';

function debug(...args: unknown[]): void {
  console.log(...args);
}

export class RpcError extends Error {
  constructor(public rpcError: { code: number; message: string }) {
    super(`RPC error: ${rpcError.message} (code=${rpcError.code})`);
  }

  static isRpcErrorWithCode(e: Error, code: number): boolean {
    return e instanceof RpcError && e.rpcError.code === code;
  }
}

export class RpcClient {
  id = 0;

  constructor(protected url: string) {}

  /**
   * Poor man's Bluebird.map(arr, f, { concurrency })
   * Processes promises in batches of 16
   *
   * @param arr
   * @param f
   * @param [concurrency=8]
   */
  static async parallelMap<S, T>(
    arr: S[],
    f: (S, i: number) => Promise<T>,
    { concurrency }: { concurrency: number } = { concurrency: 16 }
  ): Promise<T[]> {
    const rest: S[] = arr.splice(concurrency);
    const result = await Promise.all(arr.map((v, i) => f(v, i)));
    if (rest.length) {
      return [...result, ...(await this.parallelMap(rest, f))];
    }
    return result;
  }

  protected getUrl(): string {
    return this.url;
  }

  async exec<T>(method: string, ...params: unknown[]): Promise<T> {
    try {
      debug('>', this.getUrl(), method, params);
      const response = await axios.post(this.getUrl(), {
        jsonrpc: '1.0',
        method,
        params,
        id: `${this.id++}`,
      });
      if (method === 'generate' || method === 'generatetoaddress') {
        debug('<', '[...]');
      } else {
        debug('<', response.data.result);
      }
      return response.data.result;
    } catch (e) {
      if (e.isAxiosError && e.response) {
        e = e as AxiosError;
        debug('< ERROR', e.response.statusText, e.response.data);
        e = e as AxiosError;
        const { error = {} } = e.response.data;
        throw new RpcError(error);
      }

      throw e;
    }
  }
}
