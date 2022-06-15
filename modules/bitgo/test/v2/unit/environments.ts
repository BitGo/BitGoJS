import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src/bitgo';
import { AliasEnvironments } from '@bitgo/sdk-core';

describe('Environments', () => {
  it('should swap alias environments for supported environments', () => {
    const aliasEnvs = ['production', 'msProd', 'msTest', 'msDev', 'msLatest'];
    for (const aliasEnv of aliasEnvs) {
      const bitgo = TestBitGo.decorate(BitGo, { env: aliasEnv } as any);
      bitgo.getEnv().should.eql(AliasEnvironments[aliasEnv]);
    }
  });
});
