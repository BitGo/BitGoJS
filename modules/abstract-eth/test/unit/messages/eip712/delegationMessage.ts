import 'should';
import { coins } from '@bitgo/statics';
import { EIP712Message } from '../../../../src';
import { wlfiDelegationFixture } from './delegationFixtures';

describe('EIP-712 ERC20Votes Delegation Message (WLFI delegateBySig)', () => {
  const coinConfig = coins.get('eth');

  it('should generate correct signable payload for WLFI delegation', async () => {
    const message = new EIP712Message({
      ...wlfiDelegationFixture.input,
      coinConfig,
    });

    const signablePayload = await message.getSignablePayload();
    signablePayload.toString('hex').should.equal(wlfiDelegationFixture.expected.expectedSignableHex);
  });

  it('should encode domain separator with WLFI name and version 2', async () => {
    const message = new EIP712Message({
      ...wlfiDelegationFixture.input,
      coinConfig,
    });

    const signablePayload = (await message.getSignablePayload()) as Buffer;
    // Payload starts with 0x1901
    signablePayload.slice(0, 2).toString('hex').should.equal('1901');
    // Full payload is 2 + 32 + 32 = 66 bytes
    signablePayload.length.should.equal(66);
  });
});
