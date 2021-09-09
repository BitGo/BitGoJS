/**
 * @prettier
 */
import 'should';
import * as path from 'path';
import { promises as fs } from 'fs';

export class FixtureDir {
  constructor(public root: string) {
    if ('after' in global) {
      global.after('check duplicate fixtures', () => this.checkDuplicateFixtures());
    }
  }

  private async checkDuplicateFixtures() {
    const files = await Promise.all(
      (await fs.readdir(this.root)).map(async (name) => [name, await fs.readFile(path.join(this.root, name), 'utf8')])
    );
    files.forEach(([name1, content1]) => {
      files.forEach(([name2, content2]) => {
        if (name1.localeCompare(name2) > 0 && content1 === content2) {
          console.warn(`fixtures ${name1} and ${name2} have same contents`);
        }
      });
    });
  }

  public async getFixture(name: string, defaultValue: string): Promise<string> {
    const p = path.join(this.root, name);
    try {
      return await fs.readFile(p, 'utf8');
    } catch (e) {
      if (e.code === 'ENOENT') {
        await fs.writeFile(p, defaultValue);
        throw new Error(`wrote default value to ${p}`);
      }
      throw e;
    }
  }

  public async getFixtureJSON<T>(name: string, defaultValue: T): Promise<T> {
    return JSON.parse(await this.getFixture(name, JSON.stringify(defaultValue, null, 2)));
  }

  public async shouldEqualJSONFixture<T>(actualValue: T, name: string): Promise<void> {
    ((await this.getFixtureJSON(name, actualValue)) as { should: should.Assertion }).should.eql(
      // we must round-trip the `actualValue` as a workaround for the fact that JSON cannot properly
      // serialize `undefined` values
      JSON.parse(JSON.stringify(actualValue))
    );
  }
}
