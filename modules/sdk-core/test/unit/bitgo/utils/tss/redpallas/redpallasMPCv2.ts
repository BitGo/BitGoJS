import * as assert from 'assert';
import * as sinon from 'sinon';
import { BitGoBase, IBaseCoin, RedpallasUtils } from '../../../../../../src';

const { RedpallasMPCv2Utils } = RedpallasUtils;
type RedpallasMPCv2Utils = InstanceType<typeof RedpallasUtils.RedpallasMPCv2Utils>;

describe('RedpallasMPCv2Utils', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('sendKeyGenerationRound1 / sendKeyGenerationRound2 dispatch', function () {
    let utils: RedpallasMPCv2Utils;

    beforeEach(function () {
      const mockBitGo = {} as unknown as BitGoBase;
      const mockCoin = {} as unknown as IBaseCoin;
      utils = new RedpallasMPCv2Utils(mockBitGo, mockCoin);
    });

    it('sendKeyGenerationRound1BySender invokes the sender with the MPCv2-R1 round', async function () {
      const senderFn = sinon.stub().resolves({ sessionId: 's1', bitgoMsg1: { message: 'm', signature: 'sig' } });
      const payload = {
        userGpgPublicKey: 'user-pub',
        backupGpgPublicKey: 'backup-pub',
        userMsg1: { message: 'u1', signature: 'usig' },
        backupMsg1: { message: 'b1', signature: 'bsig' },
      };

      const result = await utils.sendKeyGenerationRound1BySender(senderFn as never, payload as never);

      assert.ok(senderFn.calledOnceWith('MPCv2-R1', payload));
      assert.strictEqual(result.sessionId, 's1');
    });

    it('sendKeyGenerationRound2BySender invokes the sender with the MPCv2-R2 round', async function () {
      const senderFn = sinon.stub().resolves({
        sessionId: 's1',
        commonPublicKeychain: 'a'.repeat(64),
        bitgoMsg2: { message: 'm', signature: 'sig' },
      });
      const payload = {
        sessionId: 's1',
        userMsg2: { message: 'u2', signature: 'usig' },
        backupMsg2: { message: 'b2', signature: 'bsig' },
      };

      const result = await utils.sendKeyGenerationRound2BySender(senderFn as never, payload as never);

      assert.ok(senderFn.calledOnceWith('MPCv2-R2', payload));
      assert.strictEqual(result.commonPublicKeychain, 'a'.repeat(64));
    });
  });
});
