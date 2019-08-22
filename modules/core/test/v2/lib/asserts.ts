// Additional convenience assertions for should

import { Assertion } from 'should';

declare module "should" {
  interface Assertion {
    calledOnce: () => void;
    calledOnceWith: (...args: any[]) => void;
  }
  class Assertion {
    static add: (name: string, handler: (args: any[]) => void) => void;
  }
}

Assertion.add('calledOnceWith', function(...args) {
  this.params = { operator: 'to be called once with' };

  this.obj.should.have.been.calledOnce();
  this.obj.should.have.been.calledWith(...args);
});
