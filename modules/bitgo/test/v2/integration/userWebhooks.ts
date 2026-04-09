//
// Tests for user webhooks
//

import 'should';

import { TestBitGo } from '../../lib/test_bitgo';

describe('V2 User Webhooks:', function () {
  let bitgo;
  let basecoin;
  let webhookId;
  const blockId = '000000000000076966de153d5c776cf8f630222a1c3025bea8543f158cc507d6';
  const url = 'http://test.com/user-webhook-v2';
  const type = 'block';

  before(async function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbtc');
    basecoin.webhooks();

    await bitgo.authenticateTestUser(bitgo.testUserOTP());
  });

  describe('Create', function () {
    it('should fail to create a new webhook with missing params', async function () {
      try {
        await basecoin.webhooks().add({ url });
      } catch (e) {
        e.message.should.equal('Missing parameter: type');
      }
      try {
        await basecoin.webhooks().add({ type });
      } catch (e) {
        e.message.should.equal('Missing parameter: url');
      }
    });

    it('should create a new webhook', async function () {
      const newWebhook = await basecoin.webhooks().add({ url, type });
      newWebhook.should.have.property('id');
      newWebhook.should.have.property('coin');
      newWebhook.should.have.property('type');
      newWebhook.should.have.property('url');
      newWebhook.should.have.property('state');
      newWebhook.coin.should.equal('tbtc');
      newWebhook.type.should.equal(type);
      newWebhook.url.should.equal(url);
      newWebhook.state.should.equal('active');
    });
  });

  describe('List', function () {
    it('should fetch list of user webhooks', async function () {
      const userWebhooks = await basecoin.webhooks().list();
      userWebhooks.webhooks.length.should.greaterThan(0);
      webhookId = userWebhooks.webhooks[0].id;
    });
  });

  describe('Simulate', function () {
    it('should fail to simulate a block webhook with missing params', async function () {
      try {
        await basecoin.webhooks().simulate({ webhookId });
      } catch (e) {
        e.message.should.equal('Missing parameter: blockId');
      }
      try {
        await basecoin.webhooks().simulate({ blockId });
      } catch (e) {
        e.message.should.equal('Missing parameter: webhookId');
      }
    });

    it('should simulate a block webhook', async function () {
      const res = await basecoin.webhooks().simulate({ webhookId, blockId });
      res.should.have.property('webhookNotifications');
      res.webhookNotifications.length.should.greaterThan(0);
    });
  });

  describe('List notifications', function () {
    it('should fetch list of webhook notifications', async function () {
      const res = await basecoin.webhooks().listNotifications();
      res.should.have.property('webhookNotifications');
      res.webhookNotifications.length.should.greaterThan(0);
    });
  });

  describe('Remove', function () {
    it('should fail to remove a webhook with missing params', async function () {
      try {
        await basecoin.webhooks().remove({ url });
      } catch (e) {
        e.message.should.equal('Missing parameter: type');
      }
      try {
        await basecoin.webhooks().remove({ type });
      } catch (e) {
        e.message.should.equal('Missing parameter: url');
      }
    });

    it('should remove a user webhook', async function () {
      const res = await basecoin.webhooks().remove({ url, type });
      res.should.have.property('removed');
      res.removed.should.equal(1);
    });
  });
});
