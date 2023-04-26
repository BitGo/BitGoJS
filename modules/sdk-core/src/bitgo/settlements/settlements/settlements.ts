import { BitGoBase } from '../../bitgoBase';
import { SettlementAccount } from '../account';
import { SettlementAffirmations } from '../affirmations';
import { SettlementTradingPartners } from '../trading-partners';
import {
  CreateSettlementRequest,
  CreateSettlementResponse,
  GetSettlementRequest,
  GetSettlementResponse,
  ListSettlementByAccountRequest,
  ListSettlementByAccountResponse,
  ListSettlementByEnterpriseRequest,
  ListSettlementByEnterpriseResponse,
  GetTradePayloadRequest,
  GetTradePayloadResponse,
  ISettlements,
} from './types';

export class Settlements implements ISettlements {
  private readonly _bitgo: BitGoBase;
  private readonly _accountId?: string;
  private readonly _enterpriseId: string;
  private readonly _url: string;
  public affirmations: SettlementAffirmations;
  public tradingPartners: SettlementTradingPartners;
  public account: SettlementAccount;

  constructor(bitgo: BitGoBase, enterpriseId: string, accountId?: string) {
    this._bitgo = bitgo;
    this._enterpriseId = enterpriseId;
    this._url = '/api/clearing/v1';
    this.affirmations = new SettlementAffirmations(bitgo, enterpriseId);
    this.tradingPartners = new SettlementTradingPartners(bitgo, enterpriseId);
    this.account = new SettlementAccount(bitgo, enterpriseId);

    if (accountId) {
      this._accountId = accountId;
    }
  }

  /**
   * Create a settlement.
   * @param {Object}   params
   * @param {string}   [params.accountId] Trading wallet id
   * @param {Object}   [params.signing] Payload and payload's signature. See TradingAccount.signPaylod
   * @param {string}   params.signing.payload Stringified API response from trade-payload. See SettlementTradePayload for shape reference
   * @param {string}   params.signing.signature Signed payload from the user's trading wallet
   * @param {Object[]} params.tradeList An array of a single trade representing the send/request between two trading wallets
   * @param {string}   params.tradeList[].externalId Unique UUID
   * @param {string}   params.tradeList[].baseAccountId Party's trading wallet id sending the request. Same wallet id
   * @param {string}   params.tradeList[].quoteAccountId Counterparty's wallet id
   * @param {string}   params.tradeList[].timestamp DateFromISOString
   * @param {('canceled'|'failed'|'pending'|'rejected'|'settled'|'expired')} params.tradeList[].status:
   * @param {string}   params.tradeList[].baseCurrency Blockchain name (e.g. btc, ltc | testnet - tbtc, tltc)
   * @param {number}   params.tradeList[].baseAmount Send amount in base units (e.g. satoshi)
   * @param {string}   params.tradeList[].quoteCurrency Blockchain name (e.g. btc, ltc | testnet - tbtc, tltc)
   * @param {number}   params.tradeList[].quoteAmount Counterparty's amount in base units (e.g. satoshi)
   * @param {Object}  [params.tradeList[].costBasis]
   * @param {string}  [params.tradeList[].costBasis.amount]
   * @param {string}  [params.tradeList[].costBasis.currency]
   * @returns {Promise<CreateSettlementResponse>}
   */
  public create({ accountId, ...params }: CreateSettlementRequest): Promise<CreateSettlementResponse> {
    return this._bitgo
      .post(`${this._url}/enterprise/${this._enterpriseId}/account/${accountId || this._accountId}/settlement`)
      .send(params)
      .result();
  }

  /**
   * Get a single settlement.
   * @param {Object} params
   * @param {string} [params.accountId] Trading wallet id
   * @param {string} settlementId UUID uniquely identifying the settlement
   * @returns {Promise<GetSettlementResponse>}
   */
  public get({ accountId, settlementId }: GetSettlementRequest): Promise<GetSettlementResponse> {
    return this._bitgo
      .get(
        `${this._url}/enterprise/${this._enterpriseId}/account/${
          accountId || this._accountId
        }/settlement/${settlementId}`
      )
      .result();
  }

  /**
   * Get a list of settlements by enterprise.
   * @param {Object} params
   * @param {string} [params.limit=25]
   * @param {string} [params.offset=0]
   * @param {('canceled'|'failed'|'pending'|'rejected'|'settled'|'expired')} [params.status]
   * @returns {Promise<ListSettlementByEnterpriseResponse>}
   */
  public list(params: ListSettlementByEnterpriseRequest): Promise<ListSettlementByEnterpriseResponse> {
    return this._bitgo.get(`${this._url}/enterprise/${this._enterpriseId}/settlements`).query(params).result();
  }

  /**
   * Get a list of settlements by an enterprise's account id.
   * @param {Object} params
   * @param {string} [params.accountId] Trading wallet id
   * @param {string} [params.limit=25]
   * @param {string} [params.offset=0]
   * @param {('canceled'|'failed'|'pending'|'rejected'|'settled'|'expired')} [params.status]
   * @returns {Promise<ListSettlementByAccountResponse>}
   */
  public listByAccount({
    accountId,
    ...params
  }: ListSettlementByAccountRequest): Promise<ListSettlementByAccountResponse> {
    return this._bitgo
      .get(`${this._url}/enterprise/${this._enterpriseId}/account/${accountId || this._accountId}/settlements`)
      .query(params)
      .result();
  }

  /**
   * Get a trade payload when creating a settlement
   * @param {Object}   params
   * @param {string}   [params.accountId] Trading wallet id
   * @param {string}   params.version '2.0.0'
   * @param {Object[]} params.amountsList Array of two objects mirroring each other for the party (sender) and counterparty (receiver) of a settlement. See example.
   * @param {string}   params.amountsList[].accountId
   * @param {string}   params.amountsList[].sendAmount
   * @param {string}   params.amountsList[].sendCurrency
   * @param {string}   params.amountsList[].receiveAmount
   * @param {string}   params.amountsList[].receiveCurrency
   * @example
   * const amountsList = [
   * {
   *   accountId: '<PARTY_WALLET_ID>', // Sender (party's trading wallet id)
   *   sendAmount: 100000, // satoshis
   *   sendCurrency: 'btc',
   *   receiveAmount: 10, // base unit
   *   receiveCurrency: 'usdt',
   * },
   * {
   *   accountId: '<COUNTERPARTY_WALLET_ID>', // Receiver (counterparty's trading wallet id)
   *   receiveAmount: 100000, // satoshis
   *   receiveCurrency: 'btc',
   *   sendAmount: 10, // base unit
   *   sendCurrency: 'usdt',
   * },
   * ]
   * @returns {Promise<GetTradePayloadResponse>
   */
  public getTradePayload({ accountId, ...params }: GetTradePayloadRequest): Promise<GetTradePayloadResponse> {
    return this._bitgo
      .post(`${this._url}/enterprise/${this._enterpriseId}/account/${accountId || this._accountId}/trade-payload`)
      .send(params)
      .result();
  }
}
