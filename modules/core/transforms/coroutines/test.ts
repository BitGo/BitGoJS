import 'should';
import { coroutine as co } from 'bluebird';

describe('Coroutines codemod:', function() {
  it('should convert no yield coroutines', co(function *() {
    (1 + 2).should.eql(3);
  }));

  it('should convert simple yield coroutines', co(function *() {
    const msg = 'it works';
    const result = yield Promise.resolve(msg);
    result.should.eql(msg);
  }));

  it('should convert nested coroutines', co(function *() {
    const msg = 'nested';
    const res = co(function *() {
      return msg;
    });
    const r = yield res();
    r.should.eql(msg);
  }));

  it('should maintain generator names', co(function *namedGenerator() {
    (3 + 4).should.eql(7);
  }));

  it('should convert called coroutines correctly', co(function *() {
    const msg = 'called coroutine';
    function calledCoroutineFunction() {
      return co(function *calledCoroutine() {
        return msg;
      }).call(this);
    }

    const res = yield calledCoroutineFunction();
    res.should.eql(msg);
  }));

  it('should convert called coroutines with arguments correctly', co(function *() {
    const argsCoroutine = co(function *coArgsCoroutine(arg0, arg1 = 1, arg2 = 'hello') {
      return `${arg0} + ${arg1} = ${arg2}`;
    });

    // @ts-ignore
    const res = yield argsCoroutine('hello', 4, 'frazzle');
    res.should.eql('hello + 4 = frazzle');
  }));
});
