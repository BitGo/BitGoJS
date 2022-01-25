import { URL } from 'url';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';

import { BaseHttpClient, HttpClient, Response } from '../src';

function stripApiTokens(uri: string): string {
  const url = new URL(uri, 'http://localhost');
  url.searchParams.delete('key');
  return url.pathname + url.searchParams;
}

export class CachingHttpClient implements HttpClient {
  constructor(private cacheDir: string, private client: HttpClient = new BaseHttpClient()) {}

  cachePath(p: string): string {
    p = stripApiTokens(p).replace(/[^a-z0-9]/gi, '_');
    const hash = crypto.createHash('sha256').update(p).digest().toString('hex').slice(0, 8);
    return path.join(this.cacheDir, `${p}.${hash}.json`);
  }

  async readCache<T>(path: string): Promise<Response<T> | undefined> {
    let data: string;
    try {
      data = await fs.readFile(this.cachePath(path), 'utf8');
    } catch (e) {
      if ((e as any).code === 'ENOENT') {
        return;
      }
      throw e;
    }

    return {
      map<V>(f: (body: T) => V) {
        return f(JSON.parse(data));
      },
    };
  }

  async writeCache<T>(path: string, data: T): Promise<void> {
    await fs.writeFile(this.cachePath(path), JSON.stringify(data, null, 2), 'utf8');
  }

  async get<T>(path: string): Promise<Response<T>> {
    const cached = await this.readCache<T>(path);
    if (cached) {
      return cached;
    }
    const resp = await this.client.get<T>(path);
    await this.writeCache(
      path,
      resp.map((v) => v)
    );
    return resp;
  }

  withBaseUrl(baseUrl: string): HttpClient {
    return new CachingHttpClient(this.cacheDir, this.client.withBaseUrl(baseUrl));
  }
}
