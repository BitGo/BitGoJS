import { TestBitGo } from '@bitgo/sdk-test';
import { Enterprise, Environments, SettlementTradingPartnerStatus, Wallet } from '@bitgo/sdk-core';
import * as nock from 'nock';
import * as should from 'should';
import { BitGo } from '../../../../src';
import fixtures from '../../fixtures/clearing/tradingPartner';

describe('Trading Partners', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let basecoin;
  let enterprise;
  let tradingAccount;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ofc');
    basecoin.keychains();

    enterprise = new Enterprise(bitgo, basecoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'Test Enterprise' });

    const walletData = {
      id: '5cf940969449412d00f53b4c55fc2139',
      coin: 'tofc',
      enterprise: enterprise.id,
      keys: [
        'keyid',
      ],
    };

    const wallet = new Wallet(bitgo, basecoin, walletData);
    tradingAccount = wallet.toTradingAccount();
  });

  it('should refer check trading partner by code', async function () {
    const scope = nock(microservicesUri)
      .post(`/api/clearing/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/trading-partner`)
      .reply(200, fixtures.addByCodeResponse);

    const addByCodeResponse = await tradingAccount.partners().add({
      referralCode: 'TEST',
    });

    addByCodeResponse.should.have.property('id');
    addByCodeResponse.should.have.property('primaryAccountId');
    addByCodeResponse.should.have.property('primaryEnterpriseName');
    addByCodeResponse.should.have.property('secondaryAccountId');
    addByCodeResponse.should.have.property('secondaryEnterpriseName');
    addByCodeResponse.status.should.eql(SettlementTradingPartnerStatus.ACCEPTED);

    scope.isDone().should.be.true();
  });

  it('should list all trading partners', async function () {
    const scope = nock(microservicesUri)
      .get(`/api/clearing/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/trading-partners`)
      .reply(200, fixtures.listTradingPartners);

    const partners = await tradingAccount.partners().list();

    should.exist(partners);
    partners.should.have.length(2);

    for (const partner of partners) {
      partner.should.have.property('id');
      partner.should.have.property('primaryAccountId');
      partner.should.have.property('primaryEnterpriseName');
      partner.should.have.property('secondaryAccountId');
      partner.should.have.property('secondaryEnterpriseName');
      partner.status.should.eql(SettlementTradingPartnerStatus.ACCEPTED);
    }

    scope.isDone().should.be.true();
  });

  it('should balance check trading partners', async function () {
    const scope = nock(microservicesUri)
      .get(`/api/clearing/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/trading-partners`)
      .reply(200, fixtures.listTradingPartners);

    const partners = await tradingAccount.partners().list();
    should.exist(partners);
    partners.should.have.length(2);

    const balanceCheck = await partners[0].checkBalance('ofctbtc', '24128');
    balanceCheck.should.be.true();

    scope.isDone().should.be.true();
  });
});
