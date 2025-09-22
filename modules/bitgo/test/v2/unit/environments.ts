import { TestBitGo } from '@bitgo-beta/sdk-test';
import { BitGo } from '../../../src/bitgo';
import { AliasEnvironments } from '@bitgo-beta/sdk-core';

describe('Environments', () => {
  it('should swap alias environments for supported environments', () => {
    const aliasEnvs = ['production', 'msProd', 'msTest', 'msDev'];
    for (const aliasEnv of aliasEnvs) {
      const bitgo = TestBitGo.decorate(BitGo, { env: aliasEnv } as any);
      bitgo.getEnv().should.eql(AliasEnvironments[aliasEnv]);
    }
  });
});
