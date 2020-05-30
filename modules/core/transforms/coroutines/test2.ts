import 'should';
import { coroutine as co } from 'bluebird';

describe('Coroutines codemod:', function() {
  describe('nested describe coroutine', co(function *() {
    it('should work for nested describe coroutines', co(function *() {
      yield Promise.reject(new Error('uh oh')).should.be.rejected();
    }));
  }));
});
