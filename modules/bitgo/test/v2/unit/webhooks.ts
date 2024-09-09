import * as assert from 'assert';
import * as nock from 'nock';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src';
import { Webhooks } from '@bitgo/sdk-core';

describe('Webhooks', function () {
  const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
  let basecoin;
  let webhooks;

  before(function () {
    nock('https://bitgo.fakeurl')
      .post('/api/v2/tbtc/webhooks', {
        url: 'https://webhook.com',
        type: 'transfer',
        numConfirmations: 0,
      })
      .reply(200, { id: 'webhookId123', url: 'https://webhook.com', type: 'transfer' });

    nock('https://bitgo.fakeurl')
      .post('/api/v2/tbtc/webhooks/webhookId123/simulate', {
        webhookId: 'webhookId123',
        blockId: '1234',
      })
      .reply(200, {
        signature: 'signature123',
        notificationPayload: {
          type: 'transfer',
          coin: 'tbtc',
          walletId: 'walletId123',
          transferId: 'transferId123',
          blockId: 'blockId123',
        },
      });

    nock('https://bitgo.fakeurl')
      .post('/api/v2/tbtc/webhooks/webhookId123/verify', {
        signature: 'signature123',
        notificationPayload: {
          type: 'transfer',
          coin: 'tbtc',
          walletId: 'walletId123',
          transferId: 'transferId123',
          blockId: 'blockId123',
        },
      })
      .reply(200, { webhookId: 'webhookId123', isValid: true });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbtc');
    webhooks = new Webhooks(bitgo, basecoin);
  });

  after(function () {
    nock.cleanAll();
    nock.pendingMocks().length.should.equal(0);
  });

  describe('Verify Webhook Notification', function () {
    it('should verify a webhook notification', async function () {
      // first add a webhook
      const webhook = await webhooks.add({ url: 'https://webhook.com', type: 'transfer' });
      assert(webhook);

      // simulate to get notification
      const notification = await webhooks.simulate({ webhookId: webhook.id, blockId: '1234' });
      assert(notification);

      // verify the notification
      const verifyParams = {
        webhookId: webhook.id,
        signature: notification.signature,
        notificationPayload: notification.notificationPayload,
      };
      const verification = await webhooks.verifyWebhookNotification(verifyParams);
      assert(verification);
      assert(verification.isValid);
    });
  });
});
