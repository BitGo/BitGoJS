// Additional convenience assertions for should

const { Assertion } = require('should');

Assertion.add('calledOnceWith', function(...args) {
  this.params = { operator: 'to be called once with' };

  this.obj.should.have.been.calledOnce();
  this.obj.should.have.been.calledWith(...args);
});

