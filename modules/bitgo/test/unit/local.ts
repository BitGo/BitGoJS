//
// Tests that don't require an internet connection.
//
// Copyright 2018, BitGo, Inc.  All Rights Reserved.
//

import 'should';
import * as BitGoJS from '../../src';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../src/bitgo';

describe('Constructor', function () {
  it('arguments', function () {
    (() => {
      new BitGoJS.BitGo('invalid' as any);
    }).should.throw(/Must pass in parameters dictionary/);
    (() => {
      new BitGoJS.BitGo({ useProduction: 'invalid' } as any);
    }).should.throw(/invalid argument/);
    (() => {
      new BitGoJS.BitGo({ clientId: 'invalid' });
    }).should.throw(/invalid argument/);
    (() => {
      new BitGoJS.BitGo({ clientSecret: 'invalid' });
    }).should.throw(/invalid argument/);
    (() => {
      new BitGoJS.BitGo({ env: 'invalid' } as any);
    }).should.throw(/invalid environment/);
    (() => {
      new BitGoJS.BitGo({ env: 'testnet', useProduction: true } as any);
    }).should.throw(/cannot use useProduction/);
  });

  it('methods', function () {
    const bitgo = TestBitGo.decorate(BitGo);
    bitgo.initializeTestVars();
    bitgo.should.have.property('version');
    bitgo.should.have.property('market');
    bitgo.should.have.property('authenticate');
    bitgo.should.have.property('logout');
    bitgo.should.have.property('me');
    bitgo.should.have.property('encrypt');
    bitgo.should.have.property('decrypt');
    bitgo.should.have.property('_validate');
  });

  describe('cookiesPropagationEnabled argument', function () {
    it('fail to instantiate with invalid combinations of arguments', function() {
      (() => {
        new BitGoJS.BitGo({ env: 'testnet', cookiesPropagationEnabled: true } as any);
      }).should.throw(/Cookies are only allowed when custom URIs are in use/);
      (() => {
        new BitGoJS.BitGo({ env: 'custom', customRootURI: 'https://app.bitgo.com', cookiesPropagationEnabled: true } as any);
      }).should.throw(/Cookies are only allowed when custom URIs are in use/);
    });

    it('cookiesPropagationEnabled is enabled explicitly', function() {
      const bitgo = new BitGoJS.BitGo({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        cookiesPropagationEnabled: true,
      });

      bitgo.should.have.property('cookiesPropagationEnabled');
      bitgo.cookiesPropagationEnabled.should.equal(true);
    });

    it('cookiesPropagationEnabled is disabled explicitly', function() {
      const bitgo = new BitGoJS.BitGo({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        cookiesPropagationEnabled: false,
      });

      bitgo.should.have.property('cookiesPropagationEnabled');
      bitgo.cookiesPropagationEnabled.should.equal(false);
    });

    it('cookiesPropagationEnabled is disabled by default', function() {
      const bitgo = new BitGoJS.BitGo({
        env: 'custom',
        customRootURI: 'https://app.example.local',
      });

      bitgo.should.have.property('cookiesPropagationEnabled');
      bitgo.cookiesPropagationEnabled.should.equal(false);
    });
  });

});

describe('BitGo environment', function () {
  let originalBitGoEnv;

  before(function () {
    // Save environment variable state, so that we can restore it after tests run.
    originalBitGoEnv = process.env.BITGO_ENV;
  });

  it('should set environment', function () {
    // Default to test when no env specified.
    let bitgo = new BitGoJS.BitGo();
    bitgo.env.should.equal('test');

    // env passed as param.
    bitgo = new BitGoJS.BitGo({ env: 'prod' });
    bitgo.env.should.equal('prod');

    // env passed as environment variable.
    process.env.BITGO_ENV = 'prod';
    bitgo = new BitGoJS.BitGo();
    bitgo.env.should.equal('prod');

    // Param overrides environment variable.
    bitgo = new BitGoJS.BitGo({ env: 'test' });
    bitgo.env.should.equal('test');

    delete process.env.BITGO_ENV;

    // useProduction param
    bitgo = new BitGoJS.BitGo({ useProduction: true });
    bitgo.env.should.equal('prod');
  });

  after(function () {
    if (originalBitGoEnv) {
      process.env.BITGO_ENV = originalBitGoEnv;
    } else {
      delete process.env.BITGO_ENV;
    }
  });
});
