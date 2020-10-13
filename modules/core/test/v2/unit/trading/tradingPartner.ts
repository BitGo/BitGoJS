import { coroutine as co } from 'bluebird';
import * as nock from 'nock';
import * as should from 'should';

import fixtures from '../../fixtures/trading/tradingPartner';
import { TradingPartnerStatus, TradingPartnerType } from '../../../../src/v2/trading/tradingPartner';
import { TradingReferralRequesterSide } from '../../../../src/v2/trading/tradingPartners';

import { Enterprise } from '../../../../src/v2/enterprise';
import { Wallet } from '../../../../src/v2/wallet';
import { TestBitGo } from '../../../lib/test_bitgo';
import { Environments } from '../../../../src/common';

describe('Trading Partners', function() {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let basecoin;
  let enterprise;
  let tradingAccount;

  before(co(function *() {
    bitgo = new TestBitGo({ env: 'mock', microservicesUri });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ofc');
    basecoin.keychains();

    enterprise = new Enterprise(bitgo, basecoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'Test Enterprise' });

    const walletData = {
      id: '5cf940969449412d00f53b4c55fc2139',
      coin: 'tofc',
      enterprise: enterprise.id,
      keys: [
        'keyid'
      ]
    };

    const wallet = new Wallet(bitgo, basecoin, walletData);
    tradingAccount = wallet.toTradingAccount();
  }));

  it('should refer check trading partner by code', co(function *() {
    const scope = nock(microservicesUri)
      .post(`/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/tradingpartners`)
      .reply(200, fixtures.addByCodeResponse);

    const addByCodeResponse = yield tradingAccount.partners().addByCode({referralCode: 'TEST', type: TradingPartnerType.AGENCY, requesterSide: TradingReferralRequesterSide.PRIMARY});

    addByCodeResponse.should.have.property('id');
    addByCodeResponse.should.have.property('primaryAccountId');
    addByCodeResponse.should.have.property('primaryEnterpriseName');
    addByCodeResponse.should.have.property('secondaryAccountId');
    addByCodeResponse.should.have.property('secondaryEnterpriseName');
    addByCodeResponse.should.have.property('requesterAccountId', tradingAccount.id);
    addByCodeResponse.status.should.eql(TradingPartnerStatus.PENDING);
    addByCodeResponse.type.should.eql(TradingPartnerType.AGENCY);

    scope.isDone().should.be.true();
  }));

  it('should list all trading partners', co(function *() {
    const scope = nock(microservicesUri)
      .get(`/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/tradingpartners`)
      .reply(200, fixtures.listTradingPartners);

    const partners = yield tradingAccount.partners().list();

    should.exist(partners);
    partners.should.have.length(2);

    for (const partner of partners) {
      partner.should.have.property('id');
      partner.should.have.property('primaryAccountId');
      partner.should.have.property('primaryEnterpriseName');
      partner.should.have.property('secondaryAccountId');
      partner.should.have.property('secondaryEnterpriseName');
      partner.should.have.property('requesterAccountId');
      partner.status.should.eql(TradingPartnerStatus.ACCEPTED);
      [TradingPartnerType.DIRECT,TradingPartnerType.AGENCY].includes(partner.type);
    }

    scope.isDone().should.be.true();
  }));

  it('should balance check trading partners', co(function *() {
    const scope = nock(microservicesUri)
      .get(`/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/tradingpartners`)
      .reply(200, fixtures.listTradingPartners)
      .get(`/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/tradingpartners/${fixtures.listTradingPartners.tradingPartners[0].secondaryAccountId}/balance`)
      .query(fixtures.balanceCheckTrueRequest)
      .reply(200, { check: true });

    const partners = yield tradingAccount.partners().list();
    should.exist(partners);
    partners.should.have.length(2);

    const balanceCheck = yield partners[0].checkBalance('ofctbtc', '24128');
    balanceCheck.should.be.true();

    scope.isDone().should.be.true();
  }));
});
