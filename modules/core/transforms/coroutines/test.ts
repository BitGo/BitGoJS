import 'should';
import { coroutine as co } from 'bluebird';

describe('Coroutines codemod:', function() {
  it('should convert no yield coroutines', async function() {
    (1 + 2).should.eql(3);
  });

  it('should convert simple yield coroutines', async function() {
    const msg = 'it works';
    const result = await Promise.resolve(msg);
    result.should.eql(msg);
  });

  it('should convert nested coroutines', async function() {
    const msg = 'nested';
    const res = async function() {
      return msg;
    };
    const r = await res();
    r.should.eql(msg);
  });

  it('should maintain generator names', async function namedGenerator() {
    (3 + 4).should.eql(7);
  });

  it('should convert called coroutines correctly', async function() {
    const msg = 'called coroutine';
    function calledCoroutineFunction() {
      return async function calledCoroutine() {
        return msg;
      }.call(this);
    }

    const res = await calledCoroutineFunction();
    res.should.eql(msg);
  });

  it('should convert called coroutines with arguments correctly', async function() {
    const argsCoroutine = async function coArgsCoroutine(arg0, arg1 = 1, arg2 = 'hello') {
      return `${arg0} + ${arg1} = ${arg2}`;
    };

    // @ts-ignore
    const res = await argsCoroutine('hello', 4, 'frazzle');
    res.should.eql('hello + 4 = frazzle');
  });

  describe('nested describe coroutine', async function() {
    it('should work for nested describe coroutines', async function() {
      await Promise.reject(new Error('uh oh')).should.be.rejected();
    });
  });
});
