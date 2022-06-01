/**
 * @prettier
 */
import { BitGoBase } from '../bitgoBase';
import { CreateSettlementParams, GetOptions, ISettlement, ISettlements, Settlement, TradingAccount } from '../trading';

export class Settlements implements ISettlements {
  private bitgo: BitGoBase;
  private enterpriseId: string;
  private account?: TradingAccount;

  constructor(bitgo: BitGoBase, enterpriseId: string, account?: TradingAccount) {
    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;
    this.account = account;
  }

  /**
   * Retrieves all settlements for an enterprise
   */
  async list(): Promise<Settlement[]> {
    let url;
    if (this.account) {
      url = this.bitgo.microservicesUrl(
        `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.account.id}/settlements`
      );
    } else {
      url = this.bitgo.microservicesUrl(`/api/trade/v1/enterprise/${this.enterpriseId}/settlements`);
    }
    const response = (await this.bitgo.get(url).result()) as any;

    return response.settlements.map((settlement) => new Settlement(settlement, this.bitgo, this.enterpriseId));
  }

  /**
   * Retrieves a single settlement by its ID.
   * @param id ID of the settlement
   * @param accountId ID of the trading account that the affirmation belongs to
   */
  async get({ id, accountId }: GetOptions): Promise<ISettlement> {
    const account = accountId || (this.account && this.account.id);
    if (!account) {
      throw new Error('accountId must be provided in parameters for an enterprise context');
    }

    const url = this.bitgo.microservicesUrl(
      `/api/trade/v1/enterprise/${this.enterpriseId}/account/${account}/settlements/${id}`
    );
    const response = await this.bitgo.get(url).result();
    return new Settlement(response, this.bitgo, this.enterpriseId);
  }

  /**
   * Submits a new settlement for a set of trades.
   * NOTE: This function must be called as tradingAccount.settlements().create(), enterprise.settlements().create() is not a valid call.
   * @param params
   * @param params.requesterAccountId trading account ID that is creating this settlement
   * @param params.payload payload authorizing the movement of funds for the included trades
   * @param params.signature hex-encoded signature of the payload
   * @param params.trades list of trades to settle as part of this settlement
   */
  async create(params: CreateSettlementParams): Promise<Settlement> {
    if (!this.account) {
      throw new Error(
        'Must select a trading account before creating a settlement. Try tradingAccount.settlements().create()'
      );
    }

    // payload must be stringified before being passed to API
    const body = Object.assign({}, params as any);
    body.payload = JSON.stringify(body.payload);

    const url = this.bitgo.microservicesUrl(
      `/api/trade/v1/enterprise/${this.enterpriseId}/account/${this.account.id}/settlements`
    );
    const response = await this.bitgo.post(url).send(body).result();

    return new Settlement(response, this.bitgo, this.enterpriseId);
  }
}
