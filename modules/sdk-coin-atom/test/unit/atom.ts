import should = require('should');

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Atom, Tatom } from '../../src/index';
import utils from '../../src/lib/utils';
import { address } from '../resources/atom';

describe('ATOM', function () {
  let bitgo: TestBitGoAPI;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('atom', Atom.createInstance);
    bitgo.safeRegister('tatom', Tatom.createInstance);
    bitgo.initializeTestVars();
  });

  it('should retun the right info', function () {
    const atom = bitgo.coin('atom');
    const tatom = bitgo.coin('tatom');

    atom.getChain().should.equal('atom');
    atom.getFamily().should.equal('atom');
    atom.getFullName().should.equal('Cosmos Hub ATOM');
    atom.getBaseFactor().should.equal(1e6);

    tatom.getChain().should.equal('tatom');
    tatom.getFamily().should.equal('atom');
    tatom.getFullName().should.equal('Testnet Cosmos Hub ATOM');
    tatom.getBaseFactor().should.equal(1e6);
  });

  describe('Address Validation', () => {
    it('should validate addresses correctly', () => {
      should.equal(utils.isValidAddress(address.address1), true);
      should.equal(utils.isValidAddress(address.address2), true);
      should.equal(utils.isValidAddress(address.address3), false);
      should.equal(utils.isValidAddress(address.address4), true);
      should.equal(utils.isValidAddress('dfjk35y'), false);
      should.equal(utils.isValidAddress(undefined as unknown as string), false);
      should.equal(utils.isValidAddress(''), false);
    });
  });
});
