export interface AddOptions {
  url: string;
  type: 'block' | 'wallet_confirmation';
  label?: string;
  numConfirmations?: number;
}

export interface RemoveOptions {
  url: string;
  type: 'block' | 'wallet_confirmation';
}

export interface ListNotificationsOptions {
  prevId?: string;
  limit?: number;
}

export interface SimulateOptions {
  webhookId: string;
  blockId: string;
}

export interface IWebhooks {
  list(): Promise<any>;
  add(params: AddOptions): Promise<any>;
  remove(params: RemoveOptions): Promise<any>;
  listNotifications(params: ListNotificationsOptions): Promise<any>;
  simulate(params: SimulateOptions): Promise<any>;
}
