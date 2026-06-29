import * as sinon from 'sinon';
import 'should';
import assert from 'assert';
import { IWallet, MessageStandardType } from '@bitgo/sdk-core';
import { buildXdcKycMessage, signXdcKycMessage } from '../../src/lib/xdcKycMessage';

const ACCOUNT = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
const TIMESTAMP = '2024-01-15T12:00:00.000Z';
const SIGNATURE = '0xdeadbeef';

describe('buildXdcKycMessage', function () {
  it('should build the correct format string', function () {
    const result = buildXdcKycMessage({ account: ACCOUNT, timestamp: TIMESTAMP });
    result.should.equal(`[XDCmaster KYC ${TIMESTAMP}] Upload KYC for ${ACCOUNT}`);
  });

  it('should produce different strings for different timestamps', function () {
    const result1 = buildXdcKycMessage({ account: ACCOUNT, timestamp: '2024-01-15T12:00:00.000Z' });
    const result2 = buildXdcKycMessage({ account: ACCOUNT, timestamp: '2024-01-16T12:00:00.000Z' });
    result1.should.not.equal(result2);
  });
});

describe('signXdcKycMessage', function () {
  let wallet: sinon.SinonStubbedInstance<IWallet>;

  beforeEach(function () {
    wallet = {
      signMessage: sinon.stub(),
    } as unknown as sinon.SinonStubbedInstance<IWallet>;
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should call wallet.signMessage with correct messageRaw and messageStandardType', async function () {
    (wallet.signMessage as sinon.SinonStub).resolves({
      txHash: '',
      signature: SIGNATURE,
      messageRaw: '',
    });

    await signXdcKycMessage(wallet as unknown as IWallet, ACCOUNT, 'passphrase');

    sinon.assert.calledOnce(wallet.signMessage as sinon.SinonStub);
    const call = (wallet.signMessage as sinon.SinonStub).getCall(0);
    const params = call.args[0];
    params.walletPassphrase.should.equal('passphrase');
    params.message.messageStandardType.should.equal(MessageStandardType.EIP191);
    params.message.messageRaw.should.startWith(`[XDCmaster KYC `);
    params.message.messageRaw.should.containEql(`Upload KYC for ${ACCOUNT}`);
  });

  it('should return kycAccount, kycMessage, and kycSignature mapped correctly', async function () {
    (wallet.signMessage as sinon.SinonStub).resolves({
      txHash: '',
      signature: SIGNATURE,
      messageRaw: '',
    });

    const result = await signXdcKycMessage(wallet as unknown as IWallet, ACCOUNT, 'passphrase');

    result.kycAccount.should.equal(ACCOUNT);
    result.kycSignature.should.equal(SIGNATURE);
    result.kycMessage.should.startWith('[XDCmaster KYC ');
    result.kycMessage.should.containEql(`Upload KYC for ${ACCOUNT}`);
    // kycMessage must match the messageRaw passed to signMessage
    const passedMessageRaw = (wallet.signMessage as sinon.SinonStub).getCall(0).args[0].message.messageRaw;
    result.kycMessage.should.equal(passedMessageRaw);
  });

  it('should propagate error if wallet.signMessage throws', async function () {
    const signingError = new Error('TSS signing failed');
    (wallet.signMessage as sinon.SinonStub).rejects(signingError);

    await assert.rejects(
      () => signXdcKycMessage(wallet as unknown as IWallet, ACCOUNT, 'passphrase'),
      /TSS signing failed/
    );
  });
});
