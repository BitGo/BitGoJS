import { TestBitGo } from '../../lib/test_bitgo';
import { AliasEnvironments } from '@bitgo/sdk-core';

describe('Environments', () => {
  it('should swap alias environments for supported environments', () => {
    const aliasEnvs = ['production', 'msProd', 'msTest', 'msDev', 'msLatest'];
    for (const aliasEnv of aliasEnvs) {
      const bitgo = new TestBitGo({ env: aliasEnv });
      bitgo.getEnv().should.eql(AliasEnvironments[aliasEnv]);
    }
  });
});
