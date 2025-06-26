import 'should';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));

describe('Dependency Policy', () => {
  it('should not have any run time dependencies', () => {
    pkg.should.not.have.property('dependencies');
  });
});
