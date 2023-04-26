import { SettlementAccountSettings } from '../types';

export interface ISettlementAccount {
  get(params: GetAccountSettingsRequest): Promise<GetAccountSettingsResponse>;
  update(params: UpdateAccountSettingsRequest): Promise<UpdateAccountSettingsResponse>;
}

export type GetAccountSettingsRequest = {
  accountId?: string;
};

export type GetAccountSettingsResponse = SettlementAccountSettings;

export type UpdateAccountSettingsRequest = { accountId?: string; affirmationExpirationTime: number };

export type UpdateAccountSettingsResponse = SettlementAccountSettings;
