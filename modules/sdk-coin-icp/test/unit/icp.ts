import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Icp, Ticp } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('Icp', function () {
  before(function () {
    bitgo.safeRegister('icp', Icp.createInstance);
    bitgo.safeRegister('ticp', Ticp.createInstance);
    bitgo.initializeTestVars();
  });

  it('should return the right info', function () {
    const icp = bitgo.coin('icp');
    const ticp = bitgo.coin('ticp');

    icp.getChain().should.equal('icp');
    icp.getFamily().should.equal('icp');
    icp.getFullName().should.equal('Internet Computer');
    icp.getBaseFactor().should.equal(1e8);
    icp.supportsTss().should.equal(true);

    ticp.getChain().should.equal('ticp');
    ticp.getFamily().should.equal('ticp');
    ticp.getFullName().should.equal('Testnet Internet Computer');
    ticp.getBaseFactor().should.equal(1e8);
    icp.supportsTss().should.equal(true);
  });
});
