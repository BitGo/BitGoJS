/**
 * @prettier
 */
import * as _ from 'lodash';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { Enterprise } from './enterprise';
import { GetEnterpriseOptions, IEnterprises } from './iEnterprises';

export class Enterprises implements IEnterprises {
  private readonly bitgo: BitGoBase;
  private readonly baseCoin: IBaseCoin;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * List all enterprises available to the current user
   * @param params unused
   */
  public async list(params: Record<string, never> = {}): Promise<Enterprise[]> {
    const response = (await this.bitgo.get(this.bitgo.url('/enterprise')).result()) as any;
    return response.enterprises.map((e) => {
      // instantiate a new object for each enterprise
      return new Enterprise(this.bitgo, this.baseCoin, e);
    });
  }

  /**
   * Fetch an enterprise from BitGo
   * @param params
   */
  public async get(params: GetEnterpriseOptions = {}): Promise<Enterprise> {
    const enterpriseId = params.id;
    if (_.isUndefined(enterpriseId)) {
      throw new Error('id must not be empty');
    }
    if (!_.isString(enterpriseId)) {
      throw new Error('id must be hexadecimal enterprise ID');
    }
    const enterpriseData = await this.bitgo.getEnterprise(enterpriseId);
    return new Enterprise(this.bitgo, this.baseCoin, enterpriseData);
  }

  /**
   * Create a new enterprise
   * @param params
   */
  // TODO: (CT-686) Flesh out params object with valid enterprise creation parameters
  public async create(params: any = {}): Promise<Enterprise> {
    const enterpriseData = (await this.bitgo.post(this.bitgo.url(`/enterprise`)).send(params).result()) as any;
    return new Enterprise(this.bitgo, this.baseCoin, enterpriseData);
  }
}
