import * as nock from 'nock';
import 'should';

nock.disableNetConnect();
xdescribe('Ethlike', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo.initializeTestVars();
    // basecoin = bitgo.coin('tethlike');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  xit('isValidAddress should be correct', function () {
    // Add valid addresses for testing
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
    basecoin.isValidAddress('').should.be.True();
  });
});
