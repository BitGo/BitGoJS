// Additional convenience assertions for should

import { Assertion } from 'should';

Assertion.add('calledOnceWith', function (...args) {
  // @ts-expect-error - no implicit this
  this.params = { operator: 'to be called once with' };

  // @ts-expect-error - no implicit this
  this.obj.should.have.been.calledOnce();
  // @ts-expect-error - no implicit this
  this.obj.should.have.been.calledWith(...args);
});
