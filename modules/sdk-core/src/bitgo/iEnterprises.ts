import { IEnterprise } from './iEnterprise';

export interface GetEnterpriseOptions {
  id?: string;
}

export interface IEnterprises {
  list(params: Record<string, never>): Promise<IEnterprise[]>;
  get(params: GetEnterpriseOptions): Promise<IEnterprise>;
  create(params: any): Promise<IEnterprise>;
}
