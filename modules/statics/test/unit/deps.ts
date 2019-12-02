import 'should';
import * as pkg from '../../package.json';

describe('Dependency Policy', () => {
  it('should not have any run time dependencies', () => {
    pkg.should.not.have.property('dependencies');
  });
});
